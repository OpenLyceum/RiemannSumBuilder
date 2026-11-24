import { describe, expect, it } from "vitest";
import {
  evaluate,
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
    expect(methods.map((method) => sum(square, method, uniform(2)))).toEqual([1, 5, 2.5, 3]);
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
    for (const method of methods) {
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
