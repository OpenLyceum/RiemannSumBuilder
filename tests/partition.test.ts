import { describe, expect, it } from "vitest";
import {
  absoluteIntegral,
  evaluate,
  library,
  methods,
  neededPower,
  RiemannSumBuilderModel,
  spline,
  sum,
  uniform,
} from "../src/common/model/RiemannSumBuilderModel.js";

const square = (x: number) => evaluate("square", x);
const line = (x: number) => evaluate("line", x);

describe("Riemann sums", () => {
  it("uses the chosen sample rule on the same intervals", () => {
    const expected = [1, 5, 2.5, 3, 8 / 3, 5, 1];
    for (const [i, method] of methods.entries()) {
      expect(sum(square, method, uniform(2))).toBeCloseTo(expected[i] ?? 0, 12);
    }
    expect(sum(line, "midpoint", [0, 0.6, 1.5, 2])).toBeCloseTo(0);
    expect(sum(line, "trapezoid", [0, 0.6, 1.5, 2])).toBeCloseTo(0);
  });

  it("preserves coverage and border order through edits", () => {
    const model = new RiemannSumBuilderModel("build");
    model.select(3);
    model.split();
    model.moveBorder(4, 10);
    expect(model.partition).toEqual([0, 0.5, 1, 1.5, 1.99, 2]);
    model.merge();
    expect(model.partition).toEqual(uniform(4));
    model.dispose();
  });

  it("reduces the error for each method when refining the square preset", () => {
    // Simpson's rule is already exact for x², so only the lower-order rules can improve.
    for (const method of methods.filter((name) => name !== "simpson")) {
      const error = (n: number) => Math.abs(sum(square, method, uniform(n)) - 8 / 3);
      expect(error(128)).toBeLessThan(error(64));
    }
  });

  it("passes the custom spline through its knots and integrates it exactly", () => {
    const model = new RiemannSumBuilderModel("build");
    model.integrand.value = "custom";
    model.moveKnot(2, 3.02);
    expect(model.knots.value[2]).toBeCloseTo(3);
    const f = model.f;
    for (const [i, x] of [0, 0.5, 1, 1.5, 2].entries()) {
      expect(f(x)).toBeCloseTo(model.knots.value[i] ?? 0, 10);
    }
    // A fine midpoint sum approaches the closed-form spline integral.
    expect(sum(f, "midpoint", uniform(4096))).toBeCloseTo(model.exact, 6);
    model.moveKnot(0, 99);
    expect(model.knots.value[0]).toBeCloseTo(4.3);
    model.dispose();
  });

  it("reproduces a straight line exactly", () => {
    const f = spline([0, 1, 2, 3, 4]);
    expect(f(0.3)).toBeCloseTo(0.6, 12);
    expect(f(1.75)).toBeCloseTo(3.5, 12);
  });

  it("judges the convergence challenge against the fewest subintervals", () => {
    // Left sums of x² on [0, 2] err by about 4/n, so even 128 subintervals miss 0.01;
    // the midpoint rule errs by 2/(3n²) and first gets under 0.01 at n = 16.
    expect(neededPower({ integrand: "square", method: "left", tolerance: 0.01 })).toBe(null);
    expect(neededPower({ integrand: "square", method: "midpoint", tolerance: 0.01 })).toBe(4);
    const model = new RiemannSumBuilderModel("convergence");
    for (let i = 0; i < 20; i++) {
      model.newChallenge();
      const challenge = model.challenge.value;
      const needed = challenge ? neededPower(challenge) : null;
      expect(needed).not.toBeNull();
      expect(needed ?? 0).toBeGreaterThanOrEqual(2);
      model.power.value = (needed ?? 0) - 1;
      model.checkChallenge();
      expect(model.verdict.value).toBe("tooFew");
      model.power.value = needed ?? 0;
      model.checkChallenge();
      expect(model.verdict.value).toBe("correct");
    }
    model.integrand.value = model.integrand.value === "square" ? "arch" : "square";
    expect(model.challenge.value).toBeNull();
    model.dispose();
  });
});

describe("function library and bounds", () => {
  it("pairs every function with a matching antiderivative", () => {
    for (const entry of Object.values(library)) {
      const [a, b] = entry.bounds;
      // √x has an infinite slope at 0, which slows every rule down; the rest agree to 1e-7.
      const digits = entry.id === "root" ? 3 : 7;
      expect(sum(entry.f, "simpson", uniform(256, a, b))).toBeCloseTo(entry.F(b) - entry.F(a), digits);
    }
  });

  it("is exact for cubics with Simpson's rule on any partition", () => {
    const cubic = library.cubic;
    expect(sum(cubic.f, "simpson", [-1, -0.3, 0.4, 2])).toBeCloseTo(cubic.F(2) - cubic.F(-1), 12);
  });

  it("brackets the integral between the lower and upper sums", () => {
    const { f, F } = library.sine;
    const edges = uniform(8, 0, Math.PI);
    const exact = F(Math.PI) - F(0);
    expect(sum(f, "lower", edges)).toBeLessThan(exact);
    expect(sum(f, "upper", edges)).toBeGreaterThan(exact);
  });

  it("integrates |f| across sign changes", () => {
    const { f, F } = library.line;
    expect(absoluteIntegral(f, F, 0, 2)).toBeCloseTo(1, 12);
    const cubic = library.cubic;
    // x³ − 3x on [−1, 2]: |∫₋₁^√3| + |∫_√3^2| = 5/4 + 9/4 + 1/4 + ... computed from F.
    const root = Math.sqrt(3);
    const expected =
      Math.abs(cubic.F(0) - cubic.F(-1)) + Math.abs(cubic.F(root) - cubic.F(0)) + Math.abs(cubic.F(2) - cubic.F(root));
    expect(absoluteIntegral(cubic.f, cubic.F, -1, 2)).toBeCloseTo(expected, 10);
  });

  it("stretches the partition when a bound moves and resets it with a new function", () => {
    const model = new RiemannSumBuilderModel("build");
    model.moveBound(1, 3);
    expect(model.interval.value).toEqual([0, 2.5]);
    expect(model.partition).toEqual([0, 0.625, 1.25, 1.875, 2.5]);
    model.moveBound(0, 2.45);
    expect(model.interval.value).toEqual([2.3, 2.5]);
    model.setUniform(8);
    expect(model.partition).toHaveLength(9);
    model.integrand.value = "reciprocal";
    expect(model.interval.value).toEqual([1, 4]);
    expect(model.partition).toEqual(uniform(8, 1, 4));
    expect(model.exact).toBeCloseTo(Math.log(4), 12);
    model.absolute.value = true;
    model.integrand.value = "line";
    expect(model.exact).toBeCloseTo(1, 10);
    model.reset();
    expect(model.partition).toEqual(uniform(4));
    model.dispose();
  });

  it("integrates the custom spline from its antiderivative on any bounds", () => {
    const model = new RiemannSumBuilderModel("build");
    model.integrand.value = "custom";
    expect(sum(model.f, "simpson", uniform(512))).toBeCloseTo(model.exact, 8);
    model.dispose();
  });
});
