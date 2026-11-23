import { NumberProperty, Property } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import type { TModel } from "scenerystack/joist";

export const functions = ["square", "line", "arch"] as const;
export type Integrand = (typeof functions)[number];
export const methods = ["left", "right", "midpoint", "trapezoid"] as const;
export type Method = (typeof methods)[number];

export const integral: Record<Integrand, number> = { square: 8 / 3, line: 0, arch: 4 / 3 };
const minimumWidth = 0.01;
export const maximumPower = 7;

export function evaluate(name: Integrand, x: number): number {
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

export function sum(name: Integrand, method: Method, edges: readonly number[]): number {
  return edges.slice(1).reduce((total, b, i) => {
    const a = edges[i] ?? 0;
    const height =
      method === "trapezoid" ? (evaluate(name, a) + evaluate(name, b)) / 2 : evaluate(name, sample(method, a, b));
    return total + (b - a) * height;
  }, 0);
}

export class RiemannSumBuilderModel implements TModel {
  public readonly integrand = new Property<Integrand>("square");
  public readonly method = new Property<Method>("left");
  public readonly edges = new Property<readonly number[]>(uniform(4));
  public readonly selected = new NumberProperty(0);
  public readonly power = new NumberProperty(0);

  public readonly mode: "build" | "convergence";

  public constructor(mode: "build" | "convergence") {
    this.mode = mode;
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
  }

  public dispose(): void {
    this.integrand.dispose();
    this.method.dispose();
    this.edges.dispose();
    this.selected.dispose();
    this.power.dispose();
  }
}
