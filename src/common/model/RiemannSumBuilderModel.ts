import { BooleanProperty, NumberProperty, Property } from "scenerystack/axon";
import { dotRandom, Range, roundSymmetric, toFixed } from "scenerystack/dot";
import type { TModel } from "scenerystack/joist";

export const functions = ["square", "line", "arch", "sine", "exp", "reciprocal", "root", "cubic", "custom"] as const;
export type Integrand = (typeof functions)[number];
/** Every rule offered on the Build screen. */
export const methods = ["left", "right", "midpoint", "trapezoid", "simpson", "upper", "lower"] as const;
export type Method = (typeof methods)[number];
/** The rules compared on the Convergence screen (upper and lower sums are bounds, not estimates). */
export const convergenceMethods = ["left", "right", "midpoint", "trapezoid", "simpson"] as const;
type ConvergenceMethod = (typeof convergenceMethods)[number];

/**
 * One integrand: its formula (RichText markup), the function and an antiderivative, the
 * interval it starts on, and the window the bounds a and b may be dragged within.
 */
export type FunctionEntry = {
  readonly id: Exclude<Integrand, "custom">;
  readonly label: string;
  readonly name: string;
  readonly f: (x: number) => number;
  readonly F: (x: number) => number;
  readonly bounds: readonly [number, number];
  readonly view: readonly [number, number];
};

export const library: Readonly<Record<Exclude<Integrand, "custom">, FunctionEntry>> = {
  square: {
    id: "square",
    label: "x<sup>2</sup>",
    name: "x squared",
    f: (x) => x * x,
    F: (x) => x ** 3 / 3,
    bounds: [0, 2],
    view: [-0.5, 2.5],
  },
  line: {
    id: "line",
    label: "x − 1",
    name: "x minus 1",
    f: (x) => x - 1,
    F: (x) => x ** 2 / 2 - x,
    bounds: [0, 2],
    view: [-0.5, 2.5],
  },
  arch: {
    id: "arch",
    label: "2x − x<sup>2</sup>",
    name: "2 x minus x squared",
    f: (x) => x * (2 - x),
    F: (x) => x ** 2 - x ** 3 / 3,
    bounds: [0, 2],
    view: [-0.5, 2.5],
  },
  sine: {
    id: "sine",
    label: "sin x",
    name: "sine x",
    f: Math.sin,
    F: (x) => -Math.cos(x),
    bounds: [0, Math.PI],
    view: [-0.5, 6.5],
  },
  exp: {
    id: "exp",
    label: "e<sup>x</sup>",
    name: "e to the x",
    f: Math.exp,
    F: Math.exp,
    bounds: [0, 2],
    view: [-1, 2.5],
  },
  reciprocal: {
    id: "reciprocal",
    label: "1/x",
    name: "1 over x",
    f: (x) => 1 / x,
    F: Math.log,
    bounds: [1, 4],
    view: [0.25, 4.5],
  },
  root: {
    id: "root",
    label: "√x",
    name: "square root of x",
    f: Math.sqrt,
    F: (x) => (2 / 3) * x ** 1.5,
    bounds: [0, 4],
    view: [0, 4.5],
  },
  cubic: {
    id: "cubic",
    label: "x<sup>3</sup> − 3x",
    name: "x cubed minus 3 x",
    f: (x) => x ** 3 - 3 * x,
    F: (x) => x ** 4 / 4 - 1.5 * x ** 2,
    bounds: [-1, 2],
    view: [-2.2, 2.4],
  },
};

const minimumWidth = 0.01;
/** The bounds stay at least this far apart. */
const minimumInterval = 0.2;
/** Dragged bounds snap to multiples of this. */
const boundStep = 0.05;
export const maximumPower = 7;
export const maximumCount = 64;

/** The custom integrand passes through these points, one above each x in knotXs. */
export const knotXs = [0, 0.5, 1, 1.5, 2] as const;
const customBounds = [0, 2] as const;
export const knotRange = new Range(-1.2, 4.3);
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

/** @internal Directly tested numerical helper. */
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

/** Exact antiderivative of the natural spline, zero at x = 0, integrated piece by piece. */
function splineAntiderivative(knots: readonly number[]): (x: number) => number {
  const m = curvatures(knots);
  const h = knotSpacing;
  // ∫₀ᵗ of one cubic piece, in the piece's local coordinate t ∈ [0, 1].
  const partial = (i: number, t: number) => {
    const a = knots[i] ?? 0;
    const b = knots[i + 1] ?? 0;
    const s = 1 - t;
    const uPart = -0.25 - s ** 4 / 4 + s ** 2 / 2;
    const tPart = t ** 4 / 4 - t ** 2 / 2;
    return (
      h * (a * (t - t ** 2 / 2) + (b * t ** 2) / 2 + (h ** 2 / 6) * ((m[i] ?? 0) * uPart + (m[i + 1] ?? 0) * tPart))
    );
  };
  return (x) => {
    const clamped = Math.max(0, Math.min(h * (knots.length - 1), x));
    const i = Math.max(0, Math.min(knots.length - 2, Math.floor(clamped / h)));
    let total = 0;
    for (let j = 0; j < i; j++) {
      total += partial(j, 1);
    }
    return total + partial(i, clamped / h - i);
  };
}

/** @internal Directly tested numerical helper. */
export function evaluate(name: Exclude<Integrand, "custom">, x: number): number {
  return library[name].f(x);
}

export function uniform(count: number, a = 0, b = 2): number[] {
  return Array.from({ length: count + 1 }, (_, i) => (i === count ? b : a + ((b - a) * i) / count));
}

/** Where on [a, b] f is largest (upper) or smallest (lower), from a fine scan that includes the ends. */
function extreme(f: (x: number) => number, a: number, b: number, upper: boolean): number {
  let best = a;
  let bestValue = f(a);
  const steps = 32;
  for (let i = 1; i <= steps; i++) {
    const x = a + ((b - a) * i) / steps;
    const value = f(x);
    if (upper ? value > bestValue : value < bestValue) {
      best = x;
      bestValue = value;
    }
  }
  return best;
}

/** The sample point a rule uses on [a, b]; trapezoid and Simpson use the endpoints (and midpoint) instead. */
export function sample(method: Method, a: number, b: number, f?: (x: number) => number): number {
  if (method === "left") {
    return a;
  }
  if (method === "right") {
    return b;
  }
  if ((method === "upper" || method === "lower") && f) {
    return extreme(f, a, b, method === "upper");
  }
  return (a + b) / 2;
}

/** The area a rule assigns to one subinterval. */
function piece(f: (x: number) => number, method: Method, a: number, b: number): number {
  if (method === "trapezoid") {
    return ((b - a) * (f(a) + f(b))) / 2;
  }
  if (method === "simpson") {
    return ((b - a) * (f(a) + 4 * f((a + b) / 2) + f(b))) / 6;
  }
  return (b - a) * f(sample(method, a, b, f));
}

export function sum(f: (x: number) => number, method: Method, edges: readonly number[]): number {
  return edges.slice(1).reduce((total, b, i) => total + piece(f, method, edges[i] ?? 0, b), 0);
}

/**
 * ∫ₐᵇ |f| from an antiderivative: split [a, b] where f changes sign and add the
 * magnitude of each piece.
 * @internal Directly tested numerical helper.
 */
export function absoluteIntegral(f: (x: number) => number, F: (x: number) => number, a: number, b: number): number {
  const points = [a];
  const steps = 512;
  let previousX = a;
  let previous = f(a);
  for (let i = 1; i <= steps; i++) {
    const x = a + ((b - a) * i) / steps;
    const value = f(x);
    if (value === 0 && i < steps) {
      // A sample landed on a root: split there and carry on from the next sign.
      points.push(x);
    } else if (previous * value < 0) {
      let low = previousX;
      let high = x;
      for (let k = 0; k < 60; k++) {
        const middle = (low + high) / 2;
        if (f(low) * f(middle) <= 0) {
          high = middle;
        } else {
          low = middle;
        }
      }
      points.push((low + high) / 2);
    }
    if (value !== 0) {
      previousX = x;
      previous = value;
    }
  }
  points.push(b);
  return points.slice(1).reduce((total, x, i) => total + Math.abs(F(x) - F(points[i] ?? a)), 0);
}

/** Convergence challenge: the fewest subintervals (a power of 2) that bring one rule's error under a tolerance. */
export type Challenge = {
  readonly integrand: Exclude<Integrand, "custom">;
  readonly method: ConvergenceMethod;
  readonly tolerance: number;
};
export type Verdict = "correct" | "tooFew" | "tooMany";
const tolerances = [0.1, 0.01, 0.001] as const;

/** The smallest refinement power whose error is under the tolerance, or null if none up to the maximum. */
/** @internal Directly tested numerical helper. */
export function neededPower({ integrand, method, tolerance }: Challenge): number | null {
  const { f, F, bounds } = library[integrand];
  const [a, b] = bounds;
  const exact = F(b) - F(a);
  for (let power = 0; power <= maximumPower; power++) {
    if (Math.abs(sum(f, method, uniform(2 ** power, a, b)) - exact) < tolerance) {
      return power;
    }
  }
  return null;
}

export class RiemannSumBuilderModel implements TModel {
  public readonly integrand: Property<Integrand>;
  public readonly method = new Property<Method>("left");
  /** The bounds [a, b] of the integral. */
  public readonly interval = new Property<readonly [number, number]>([0, 2]);
  public readonly edges = new Property<readonly number[]>(uniform(4));
  public readonly selected = new NumberProperty(0);
  /** Integrate |f| instead of f: total area rather than signed area. */
  public readonly absolute = new BooleanProperty(false);
  public readonly power = new NumberProperty(0);
  public readonly knots = new Property<readonly number[]>([1, 2.5, 0.5, -0.5, 2]);
  public readonly challenge = new Property<Challenge | null>(null);
  public readonly verdict = new Property<Verdict | null>(null);

  public readonly mode: "build" | "convergence";

  public constructor(mode: "build" | "convergence") {
    this.mode = mode;
    // Simpson's rule is exact for x², so Convergence opens on eˣ, where all five rules still err.
    this.integrand = new Property<Integrand>(mode === "build" ? "square" : "exp");
    // A new answer or a different function ends the old verdict; a different function ends the challenge.
    this.power.lazyLink(() => {
      this.verdict.value = null;
    });
    this.integrand.lazyLink((integrand) => {
      if (this.challenge.value && integrand !== this.challenge.value.integrand) {
        this.challenge.value = null;
      }
      this.verdict.value = null;
      const [a, b] = this.defaultBounds;
      this.interval.value = [a, b];
      this.edges.value = uniform(this.edges.value.length - 1, a, b);
      this.selected.value = Math.min(this.selected.value, this.edges.value.length - 2);
    });
  }

  /** The library entry for a named integrand, or null for the student's own curve. */
  public get entry(): FunctionEntry | null {
    const name = this.integrand.value;
    return name === "custom" ? null : library[name];
  }

  /** The interval a function starts on, which Reset and a function change restore. */
  public get defaultBounds(): readonly [number, number] {
    return this.entry?.bounds ?? customBounds;
  }

  /** The window that a and b may move within; the custom curve's bounds are fixed. */
  public get view(): readonly [number, number] {
    return this.entry?.view ?? customBounds;
  }

  /** Picks a function, rule, and tolerance that needs at least 4 subintervals and no more than the maximum. */
  public newChallenge(): void {
    const names = functions.filter((name): name is Challenge["integrand"] => name !== "custom");
    let challenge: Challenge;
    let needed: number | null;
    do {
      challenge = {
        integrand: dotRandom.sample(names),
        method: dotRandom.sample([...convergenceMethods]),
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

  /** The signed integrand, including the student's own curve. */
  public get signedF(): (x: number) => number {
    const entry = this.entry;
    return entry ? entry.f : spline(this.knots.value);
  }

  /** The integrand being summed: f, or |f| when total area is on. */
  public get f(): (x: number) => number {
    const f = this.signedF;
    return this.absolute.value ? (x) => Math.abs(f(x)) : f;
  }

  private get antiderivative(): (x: number) => number {
    return this.entry?.F ?? splineAntiderivative(this.knots.value);
  }

  public get exact(): number {
    const [a, b] = this.interval.value;
    const F = this.antiderivative;
    return this.absolute.value ? absoluteIntegral(this.signedF, F, a, b) : F(b) - F(a);
  }

  public moveKnot(index: number, y: number): void {
    const value = knotRange.constrainValue(Number(toFixed(roundSymmetric(y / knotStep) * knotStep, 2)));
    if (value !== this.knots.value[index]) {
      this.knots.value = this.knots.value.map((knot, i) => (i === index ? value : knot));
    }
  }

  /**
   * Moves bound a (side 0) or b (side 1), snapped to the grid and kept inside the view and
   * at least `minimumInterval` from the other bound. The partition stretches with it.
   */
  public moveBound(side: 0 | 1, x: number): void {
    if (!this.entry) {
      return;
    }
    const [low, high] = this.view;
    const [a, b] = this.interval.value;
    const snapped = Number(toFixed(roundSymmetric(x / boundStep) * boundStep, 2));
    const next: [number, number] =
      side === 0
        ? [Math.max(low, Math.min(b - minimumInterval, snapped)), b]
        : [a, Math.min(high, Math.max(a + minimumInterval, snapped))];
    if (next[0] === a && next[1] === b) {
      return;
    }
    const scale = (next[1] - next[0]) / (b - a);
    this.interval.value = next;
    this.edges.value = this.edges.value.map((edge, i, all) =>
      i === 0 ? next[0] : i === all.length - 1 ? next[1] : next[0] + (edge - a) * scale,
    );
  }

  /** Replaces the partition with `count` equal subintervals. */
  public setUniform(count: number): void {
    const n = Math.max(1, Math.min(maximumCount, roundSymmetric(count)));
    const [a, b] = this.interval.value;
    if (this.isUniform && this.edges.value.length - 1 === n) {
      return;
    }
    this.edges.value = uniform(n, a, b);
    this.selected.value = Math.min(this.selected.value, n - 1);
  }

  /** True when every subinterval has the same width. */
  public get isUniform(): boolean {
    const edges = this.edges.value;
    const width = ((edges[edges.length - 1] ?? 0) - (edges[0] ?? 0)) / (edges.length - 1);
    return edges.slice(1).every((b, i) => Math.abs(b - (edges[i] ?? 0) - width) < 1e-9);
  }

  public get partition(): readonly number[] {
    if (this.mode === "build") {
      return this.edges.value;
    }
    const [a, b] = this.interval.value;
    return uniform(2 ** this.power.value, a, b);
  }

  public split(): void {
    const edges = this.edges.value;
    const end = this.interval.value[1];
    const i = this.selected.value;
    if ((edges[i + 1] ?? end) - (edges[i] ?? 0) < 2 * minimumWidth) {
      return;
    }
    const next = [...edges];
    next.splice(i + 1, 0, ((edges[i] ?? 0) + (edges[i + 1] ?? end)) / 2);
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

  /** True when the selected subinterval is wide enough to split. */
  public get canSplit(): boolean {
    const edges = this.edges.value;
    const i = this.selected.value;
    return (edges[i + 1] ?? 0) - (edges[i] ?? 0) >= 2 * minimumWidth;
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
    this.integrand.reset();
    this.interval.reset();
    this.edges.reset();
    this.method.reset();
    this.absolute.reset();
    this.power.reset();
    this.knots.reset();
    this.challenge.reset();
    this.verdict.reset();
  }

  public dispose(): void {
    this.integrand.dispose();
    this.method.dispose();
    this.interval.dispose();
    this.edges.dispose();
    this.selected.dispose();
    this.absolute.dispose();
    this.power.dispose();
    this.knots.dispose();
    this.challenge.dispose();
    this.verdict.dispose();
  }
}
