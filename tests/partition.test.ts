import { describe, expect, it } from "vitest";
import { integral, methods, RiemannSumBuilderModel, sum, uniform } from "../src/common/model/RiemannSumBuilderModel.js";

describe("Riemann sums", () => {
  it("uses the chosen sample rule on the same intervals", () => {
    expect(methods.map((method) => sum("square", method, uniform(2)))).toEqual([1, 5, 2.5, 3]);
    expect(sum("line", "midpoint", [0, 0.6, 1.5, 2])).toBeCloseTo(0);
    expect(sum("line", "trapezoid", [0, 0.6, 1.5, 2])).toBeCloseTo(0);
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
      const error = (n: number) => Math.abs(sum("square", method, uniform(n)) - integral.square);
      expect(error(128)).toBeLessThan(error(64));
    }
  });
});
