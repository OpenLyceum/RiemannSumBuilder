import { NumberProperty, Property } from "scenerystack/axon";
import { dotRandom, Range, roundSymmetric, toFixed } from "scenerystack/dot";
import type { TModel } from "scenerystack/joist";

export const functions = ["square", "line", "arch", "custom"] as const;
export type Integrand = (typeof functions)[number];
export const methods = ["left", "right", "midpoint", "trapezoid"] as const;
export type Method = (typeof methods)[number];

const integrals = { square: 8 / 3, line: 0, arch: 4 / 3 };
const minimumWidth = 0.01;
export const maximumPower = 7;

/** The custom integrand passes through these points, one above each x in knotXs. */
export const knotXs = [0, 0.5, 1, 1.5, 2] as const;
const knotRange = new Range(-1.2, 4.3);
const knotSpacing = 0.5;
const knotStep = 0.05;

/**
 * Second derivatives of the natural cubic spline through equally spaced
 * knots (zero at both ends), from the tridiagonal continuity equations.
 */
function curvatures(knots: readonly number[]): number[] {
  const n = knots.length;
  const y = (i: number) => knots[i] ?? 0;
  const diagonal: number[] = [];
  const rhs: number[] = [];
  for (let i = 1; i < n - 1; i++) {
    const r = (6 / knotSpacing ** 2) * (y(i - 1) - 2 * y(i) + y(i + 1));
    const previous = i > 1 ? 1 / (diagonal[i - 2] ?? 4) : 0;
    diagonal.push(4 - previous);
    rhs.push(r - previous * (rhs[i - 2] ?? 0));
  }
  const m = new Array<number>(n).fill(0);
  for (let i = n - 2; i >= 1; i--) {
    m[i] = ((rhs[i - 1] ?? 0) - (m[i + 1] ?? 0)) / (diagonal[i - 1] ?? 4);
  }
  return m;
}

export function spline(knots: readonly number[]): (x: number) => number {
  const m = curvatures(knots);
  return (x) => {
    const i = Math.max(0, Math.min(knots.length - 2, Math.floor(x / knotSpacing)));
    const t = x / knotSpacing - i;
    const u = 1 - t;
    const a = knots[i] ?? 0;
    const b = knots[i + 1] ?? 0;
    return u * a + t * b + (knotSpacing ** 2 / 6) * ((u ** 3 - u) * (m[i] ?? 0) + (t ** 3 - t) * (m[i + 1] ?? 0));
  };
}

/** Exact integral of the natural spline over [0, 2], interval by interval. */
function splineIntegral(knots: readonly number[]): number {
  const m = curvatures(knots);
  let total = 0;
  for (let i = 0; i < knots.length - 1; i++) {
    total +=
      (knotSpacing * ((knots[i] ?? 0) + (knots[i + 1] ?? 0))) / 2 -
      (knotSpacing ** 3 / 24) * ((m[i] ?? 0) + (m[i + 1] ?? 0));
  }
  return total;
}

export function evaluate(name: Exclude<Integrand, "custom">, x: number): number {
  if (name === "square") {
    return x * x;
  }
  if (name === "line") {
    return x - 1;
  }
  return x * (2 - x);
}

export function uniform(count: number): number[] {
  return Array.from({ length: count + 1 }, (_, i) => (2 * i) / count);
}

export function sample(method: Method, a: number, b: number): number {
  if (method === "left") {
    return a;
  }
  if (method === "right") {
    return b;
  }
  return (a + b) / 2;
}

export function sum(f: (x: number) => number, method: Method, edges: readonly number[]): number {
  return edges.slice(1).reduce((total, b, i) => {
    const a = edges[i] ?? 0;
    const height = method === "trapezoid" ? (f(a) + f(b)) / 2 : f(sample(method, a, b));
    return total + (b - a) * height;
  }, 0);
}

/** Convergence challenge: the fewest subintervals (a power of 2) that bring one rule's error under a tolerance. */
export type Challenge = {
  readonly integrand: Exclude<Integrand, "custom">;
  readonly method: Method;
  readonly tolerance: number;
};
export type Verdict = "correct" | "tooFew" | "tooMany";
const tolerances = [0.1, 0.01, 0.001] as const;

/** The smallest refinement power whose error is under the tolerance, or null if none up to the maximum. */
export function neededPower({ integrand, method, tolerance }: Challenge): number | null {
  const f = (x: number) => evaluate(integrand, x);
  for (let power = 0; power <= maximumPower; power++) {
    if (Math.abs(sum(f, method, uniform(2 ** power)) - integrals[integrand]) < tolerance) {
      return power;
    }
  }
  return null;
}

export class RiemannSumBuilderModel implements TModel {
  public readonly integrand = new Property<Integrand>("square");
  public readonly method = new Property<Method>("left");
  public readonly edges = new Property<readonly number[]>(uniform(4));
  public readonly selected = new NumberProperty(0);
  public readonly power = new NumberProperty(0);
  public readonly knots = new Property<readonly number[]>([1, 2.5, 0.5, -0.5, 2]);
  public readonly challenge = new Property<Challenge | null>(null);
  public readonly verdict = new Property<Verdict | null>(null);

  public readonly mode: "build" | "convergence";

  public constructor(mode: "build" | "convergence") {
    this.mode = mode;
    // A new answer or a different function ends the old verdict; a different function ends the challenge.
    this.power.lazyLink(() => {
      this.verdict.value = null;
    });
    this.integrand.lazyLink((integrand) => {
      if (this.challenge.value && integrand !== this.challenge.value.integrand) {
        this.challenge.value = null;
      }
      this.verdict.value = null;
    });
  }

  /** Picks a function, rule, and tolerance that needs at least 4 subintervals and no more than the maximum. */
  public newChallenge(): void {
    const names = functions.filter((name): name is Challenge["integrand"] => name !== "custom");
    let challenge: Challenge;
    let needed: number | null;
    do {
      challenge = {
        integrand: dotRandom.sample(names),
        method: dotRandom.sample([...methods]),
        tolerance: dotRandom.sample([...tolerances]),
      };
      needed = neededPower(challenge);
    } while (needed === null || needed < 2);
    this.challenge.value = null;
    this.integrand.value = challenge.integrand;
    this.power.value = 0;
    this.challenge.value = challenge;
    this.verdict.value = null;
  }

  public checkChallenge(): void {
    const challenge = this.challenge.value;
    const needed = challenge && neededPower(challenge);
    if (needed === null || needed === undefined) {
      return;
    }
    const power = this.power.value;
    this.verdict.value = power === needed ? "correct" : power < needed ? "tooFew" : "tooMany";
  }

  /** The integrand as a function, including the student's own curve. */
  public get f(): (x: number) => number {
    const name = this.integrand.value;
    return name === "custom" ? spline(this.knots.value) : (x) => evaluate(name, x);
  }

  public get exact(): number {
    const name = this.integrand.value;
    return name === "custom" ? splineIntegral(this.knots.value) : integrals[name];
  }

  public moveKnot(index: number, y: number): void {
    const value = knotRange.constrainValue(Number(toFixed(roundSymmetric(y / knotStep) * knotStep, 2)));
    if (value !== this.knots.value[index]) {
      this.knots.value = this.knots.value.map((knot, i) => (i === index ? value : knot));
    }
  }

  public get partition(): readonly number[] {
    return this.mode === "build" ? this.edges.value : uniform(2 ** this.power.value);
  }

  public split(): void {
    const edges = this.edges.value;
    const i = this.selected.value;
    if ((edges[i + 1] ?? 2) - (edges[i] ?? 0) < 2 * minimumWidth) {
      return;
    }
    const next = [...edges];
    next.splice(i + 1, 0, ((edges[i] ?? 0) + (edges[i + 1] ?? 2)) / 2);
    this.edges.value = next;
  }

  public merge(): void {
    const next = [...this.edges.value];
    if (next.length === 2) {
      return;
    }
    const border = Math.min(this.selected.value + 1, next.length - 2);
    this.selected.value = border - 1;
    next.splice(border, 1);
    this.edges.value = next;
  }

  public borderRange(border: number): Range | null {
    const edges = this.edges.value;
    if (border < 1 || border >= edges.length - 1) {
      return null;
    }
    const low = (edges[border - 1] ?? 0) + minimumWidth;
    const high = (edges[border + 1] ?? 2) - minimumWidth;
    // When both adjoining intervals have minimum width, roundoff may put high just below low.
    return new Range(low, Math.max(low, high));
  }

  public moveBorder(border: number, x: number): void {
    const range = this.borderRange(border);
    if (!range) {
      return;
    }
    const value = range.constrainValue(x);
    if (value === this.edges.value[border]) {
      return;
    }
    const next = [...this.edges.value];
    next[border] = value;
    this.edges.value = next;
  }

  public select(index: number): void {
    this.selected.value = Math.max(0, Math.min(this.edges.value.length - 2, index));
  }

  public reset(): void {
    this.selected.reset();
    this.edges.reset();
    this.integrand.reset();
    this.method.reset();
    this.power.reset();
    this.knots.reset();
    this.challenge.reset();
    this.verdict.reset();
  }

  public dispose(): void {
    this.integrand.dispose();
    this.method.dispose();
    this.edges.dispose();
    this.selected.dispose();
    this.power.dispose();
    this.knots.dispose();
    this.challenge.dispose();
    this.verdict.dispose();
  }
}
