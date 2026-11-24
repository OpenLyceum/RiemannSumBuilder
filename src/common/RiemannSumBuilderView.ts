import { Multilink, NumberProperty, Property } from "scenerystack/axon";
import { Range, roundSymmetric } from "scenerystack/dot";
import { localeProperty } from "scenerystack/joist";
import { StringUtils } from "scenerystack/phetcommon";
import { HBox, type Node, VBox } from "scenerystack/scenery";
import { StringManager } from "../i18n/StringManager.js";
import Colors from "../RiemannSumBuilderColors.js";
import {
  button,
  type Choice,
  checkbox,
  column,
  comboBox,
  computed,
  format,
  LessonView,
  niceTicks,
  radioButtons,
  richText,
  row,
  slider,
  text,
} from "./LessonView.js";
import {
  convergenceMethods,
  functions,
  type Integrand,
  knotRange,
  knotXs,
  library,
  type Method,
  maximumCount,
  maximumPower,
  methods,
  type RiemannSumBuilderModel,
  sample,
  sum,
  uniform,
} from "./model/RiemannSumBuilderModel.js";

// Each arrow-key press moves a curve point by this much (Shift: a quarter of it).
const KNOT_KEY_STEP = 0.2;
// Each arrow-key press moves a bound by this much (Shift: the snapping step).
const BOUND_KEY_STEP = 0.25;
const BOUND_FINE_STEP = 0.05;
// Border slider step, as a fraction of [a, b] (0.01 in x on the default [0, 2]).
const BORDER_FRACTION_STEP = 0.005;
// Errors below this are roundoff; the log-scale plot floors them here.
const ERROR_FLOOR = 1e-15;
const methodColors: Record<Method, typeof Colors.accentColorProperty> = {
  left: Colors.accentColorProperty,
  right: Colors.secondaryColorProperty,
  midpoint: Colors.tertiaryColorProperty,
  trapezoid: Colors.quaternaryColorProperty,
  simpson: Colors.textColorProperty,
  upper: Colors.secondaryColorProperty,
  lower: Colors.tertiaryColorProperty,
};
const dashes: Record<Method, number[]> = {
  left: [],
  right: [10, 4],
  midpoint: [4, 3],
  trapezoid: [2, 4],
  simpson: [12, 3, 2, 3],
  upper: [],
  lower: [],
};
type Handle = ReturnType<LessonView["plot"]["handle"]>;
type Point = readonly [number, number];

/** Formula markup for an integrand, as shown in the function list and readouts. */
function formulaOf(name: Integrand, custom: string): string {
  return name === "custom" ? custom : `f(x) = ${library[name].label}`;
}

export class RiemannSumBuilderView extends LessonView {
  public constructor(model: RiemannSumBuilderModel) {
    const manager = StringManager.getInstance();
    const names = manager.getScreenNames();
    const strings = manager.getLessonStrings();
    const build = model.mode === "build";
    const summary = (build ? manager.getBuildA11yStrings() : manager.getConvergenceA11yStrings()).screenSummary;
    const dependencies = [
      model.integrand,
      model.method,
      model.interval,
      model.edges,
      model.selected,
      model.absolute,
      model.power,
      model.knots,
    ] as const;
    const ruleName = (method: Method) => strings[`${method}StringProperty`].value;
    const formula = computed([model.integrand, strings.customFunctionStringProperty], () =>
      formulaOf(model.integrand.value, strings.customFunctionStringProperty.value),
    );
    const count = computed(
      [...dependencies],
      () => `${strings.countStringProperty.value}  n = ${model.partition.length - 1}`,
    );
    const bounds = computed([...dependencies, strings.boundsStringProperty], () => {
      const [a, b] = model.interval.value;
      return `${strings.boundsStringProperty.value}  [a, b] = [${format(a, 3)}, ${format(b, 3)}]`;
    });
    const selected = computed([...dependencies], () => {
      const i = model.selected.value;
      return `${strings.selectionStringProperty.value}  ${i + 1}  [${format(model.edges.value[i] ?? 0)}, ${format(model.edges.value[i + 1] ?? 2)}]`;
    });
    const exact = computed([...dependencies], () => {
      const label = model.absolute.value ? strings.exactTotalStringProperty : strings.exactStringProperty;
      return `${label.value}  ${format(model.exact, 6)}`;
    });
    const estimate = (method: Method) => sum(model.f, method, model.partition);
    const comparison = (method: Method) => {
      const value = estimate(method);
      if (build) {
        return `${ruleName(method)}  ${format(value, 5)}`;
      }
      // Observed order: how many times smaller the error got when n doubled, as a power of 2.
      const error = Math.abs(value - model.exact);
      const power = model.power.value;
      let order = "";
      if (power > 0) {
        const [a, b] = model.interval.value;
        const coarse = Math.abs(sum(model.f, method, uniform(2 ** (power - 1), a, b)) - model.exact);
        if (error > 1e-12 && coarse > 1e-12) {
          order = `  ·  ${strings.orderStringProperty.value} ${format(Math.log2(coarse / error), 1)}`;
        }
      }
      return `${ruleName(method)}  ${format(value, 6)}  ·  ${strings.errorStringProperty.value} ${format(error, 6)}${order}`;
    };
    const shownMethods: readonly Method[] = build ? methods : convergenceMethods;
    super({
      title: build ? names.buildStringProperty : names.convergenceStringProperty,
      hint: summary.interactionHintStringProperty,
      playDescription: summary.playAreaStringProperty,
      controlDescription: summary.controlAreaStringProperty,
      details: computed(
        [...dependencies, formula],
        () =>
          `${formula.value.replace(/<[^>]+>/g, "")}. ${bounds.value}. ${count.value}. ${build ? selected.value : exact.value}. ${shownMethods.map(comparison).join(". ")}`,
      ),
    });

    const functionChoices: Choice<Integrand>[] = functions
      .filter((name) => build || name !== "custom")
      .map((name) => ({
        value: name,
        label: name === "custom" ? strings.customFunctionStringProperty : formulaOf(name, ""),
        name: name === "custom" ? strings.customFunctionStringProperty : `f(x) = ${library[name].name}`,
      }));
    const functionBox = comboBox(
      model.integrand,
      functionChoices,
      this.listParent,
      strings.functionStringProperty,
      290,
    );

    const controls: Node[] = [functionBox, text(bounds, 15, 290)];
    let notes: Node[];
    if (build) {
      const ruleBar = radioButtons(
        model.method,
        methods.map((method) => ({ value: method, label: strings[`${method}StringProperty`] })),
        strings.ruleStringProperty,
        { size: 13, width: 70 },
      );
      const countProperty = new NumberProperty(4);
      const borderProperty = new NumberProperty(0.25);
      const borderRangeProperty = new Property(new Range(0, 1), {
        valueComparisonStrategy: "equalsFunction",
      });
      let syncing = false;
      // Set while a slider drives the partition, so the sync below does not write it back mid-notification.
      let countDriving = false;
      let borderDriving = false;
      const borderIndex = () => Math.min(model.selected.value + 1, model.edges.value.length - 2);
      // The border slider runs over [0, 1] as a fraction of [a, b], so one slider serves every
      // function and bound; its caption and spoken value show the border's x.
      const toX = (u: number) => {
        const [a, b] = model.interval.value;
        return a + u * (b - a);
      };
      const toFraction = (x: number) => {
        const [a, b] = model.interval.value;
        return (x - a) / (b - a);
      };
      const borderSlider = slider(
        strings.borderStringProperty,
        borderProperty,
        0,
        1,
        2,
        toX,
        BORDER_FRACTION_STEP,
        borderRangeProperty,
      );
      const countSlider = slider(strings.countStringProperty, countProperty, 1, maximumCount, 0, undefined, 1);
      const split = button(strings.splitStringProperty, () => model.split());
      const merge = button(strings.mergeStringProperty, () => model.merge());
      const prev = button(strings.previousStringProperty, () => model.select(model.selected.value - 1));
      const next = button(strings.nextStringProperty, () => model.select(model.selected.value + 1));
      Multilink.multilink([model.edges, model.selected], (edges, i) => {
        syncing = true;
        const index = borderIndex();
        const range = model.borderRange(index);
        borderRangeProperty.value = range ? new Range(toFraction(range.min), toFraction(range.max)) : new Range(0, 1);
        if (!borderDriving) {
          borderProperty.value = Math.max(0, Math.min(1, toFraction(edges[index] ?? 0)));
        }
        // Leave the count alone while it is the one driving this change: writing it back
        // from inside its own listener would re-enter it.
        if (!countDriving) {
          countProperty.value = Math.min(maximumCount, edges.length - 1);
        }
        syncing = false;
        merge.enabled = edges.length > 2;
        prev.enabled = i > 0;
        next.enabled = i < edges.length - 2;
        split.enabled = model.canSplit && edges.length - 1 < maximumCount;
        borderSlider.visible = merge.enabled;
      });
      borderProperty.lazyLink((x) => {
        if (!syncing) {
          borderDriving = true;
          model.moveBorder(borderIndex(), toX(x));
          borderDriving = false;
        }
      });
      countProperty.lazyLink((n) => {
        if (!syncing) {
          countDriving = true;
          model.setUniform(n);
          countDriving = false;
        }
      });
      let draggedBorder = 0;
      this.plot.onDrag((x, _y, start) => {
        if (start) {
          draggedBorder = model.edges.value.findIndex(
            (edge, i) => i > 0 && i < model.edges.value.length - 1 && Math.abs(edge - x) < 0.012 * this.xSpan,
          );
          const interval = model.edges.value.findIndex((edge) => edge > x) - 1;
          model.select(
            draggedBorder > 0
              ? draggedBorder - 1
              : interval < 0 && x > (model.edges.value[0] ?? 0)
                ? model.edges.value.length - 2
                : interval,
          );
        } else if (draggedBorder > 0) {
          model.moveBorder(draggedBorder, x);
        }
      });
      const current = computed([...dependencies], () => {
        const value = estimate(model.method.value);
        return `${ruleName(model.method.value)}  ${format(value, 6)}   ·   ${strings.errorStringProperty.value} ${format(Math.abs(value - model.exact), 6)}`;
      });
      const currentLine = text(current, 15, 290, true);
      model.method.link((method) => {
        currentLine.fill = methodColors[method];
      });
      controls.push(
        countSlider,
        checkbox(model.absolute, strings.totalAreaStringProperty, 270),
        text(selected, 15),
        row(prev, next, split, merge),
        borderSlider,
        text(exact, 16, 290, true),
        currentLine,
      );
      const pieces = computed([...dependencies, strings.piecesStringProperty], () => {
        const f = model.f;
        const edges = model.partition;
        const method = model.method.value;
        const terms = edges.slice(1).map((b, i) => sum(f, method, [edges[i] ?? 0, b]));
        const shown =
          terms.length <= 5
            ? terms.map((term) => format(term, 3))
            : [...terms.slice(0, 3).map((term) => format(term, 3)), "…", format(terms[terms.length - 1] ?? 0, 3)];
        return `${StringUtils.fillIn(strings.piecesStringProperty.value, { count: terms.length })}:  ${shown.join(" + ").replace(/\+ -/g, "− ")}  =  ${format(
          terms.reduce((a, b) => a + b, 0),
          5,
        )}`;
      });
      const estimates = methods.map((method) => {
        const line = text(
          computed([...dependencies], () => comparison(method)),
          13,
          148,
        );
        line.fill = methodColors[method];
        return line;
      });
      notes = [
        ruleBar,
        text(pieces, 14, this.notesWidth),
        new HBox({
          spacing: 6,
          align: "top",
          children: [0, 1, 2, 3].map(
            (i) => new VBox({ spacing: 3, align: "left", children: estimates.filter((_, j) => j % 4 === i) }),
          ),
        }),
      ];
    } else {
      const double = button(strings.doubleStringProperty, () => {
        model.power.value = Math.min(maximumPower, model.power.value + 1);
      });
      const halve = button(strings.halveStringProperty, () => {
        model.power.value = Math.max(0, model.power.value - 1);
      });
      model.power.link((power) => {
        double.enabled = power < maximumPower;
        halve.enabled = power > 0;
      });
      const estimates = convergenceMethods.map((method) => {
        const line = text(
          computed([...dependencies], () => comparison(method)),
          13,
          290,
        );
        line.fill = methodColors[method];
        return line;
      });
      controls.push(
        row(halve, double),
        text(count, 16, 286, true),
        ...this.challengeControls(model),
        text(exact, 16, 290, true),
        ...estimates,
      );
      notes = [richText(strings.errorNoteStringProperty, 15, this.notesWidth, false, true)];
    }

    this.finish(column(...controls), column(...notes), () => model.reset());

    if (build) {
      this.boundHandles = ([0, 1] as const).map((side) =>
        this.plot.handle({
          fill: Colors.quaternaryColorProperty,
          cursor: "ew-resize",
          drag: (x) => model.moveBound(side, this.plot.modelX(x)),
          readout: () => `${side === 0 ? "a" : "b"} = ${format(model.interval.value[side], 3)}`,
          keyboard: {
            name: side === 0 ? strings.boundAStringProperty : strings.boundBStringProperty,
            direction: "leftRight",
            step: (dx) =>
              model.moveBound(
                side,
                model.interval.value[side] + Math.sign(dx) * (Math.abs(dx) < 1 ? BOUND_FINE_STEP : BOUND_KEY_STEP),
              ),
          },
        }),
      );
      this.knotHandles = knotXs.map((x, index) =>
        this.plot.handle({
          fill: Colors.tertiaryColorProperty,
          cursor: "ns-resize",
          drag: (_x, y) => model.moveKnot(index, this.plot.modelY(y)),
          readout: () => `f(${format(x)}) = ${format(model.knots.value[index] ?? 0)}`,
          keyboard: {
            name: computed(
              [strings.curvePointStringProperty],
              () => `${strings.curvePointStringProperty.value} ${format(x)}`,
            ),
            direction: "upDown",
            step: (_dx, dy) => model.moveKnot(index, (model.knots.value[index] ?? 0) + dy * KNOT_KEY_STEP),
          },
        }),
      );
    } else {
      // The grip glides with the pointer while the dashed line marks the
      // count it will snap to on release.
      const setPower = (x: number) => {
        this.powerDragX = x;
        const power = Math.max(0, Math.min(maximumPower, roundSymmetric(this.plot.modelX(x))));
        if (power === model.power.value) {
          this.drawConvergence(model);
        } else {
          model.power.value = power;
        }
      };
      this.plot.onDrag((x) => {
        model.power.value = Math.max(0, Math.min(maximumPower, roundSymmetric(x)));
      });
      this.powerHandle = this.plot.handle({
        cursor: "ew-resize",
        drag: setPower,
        end: () => {
          this.powerDragX = null;
          this.drawConvergence(model);
        },
        readout: () => `n = ${format(2 ** model.power.value)}`,
      });
    }

    Multilink.multilink([localeProperty, ...dependencies], () => {
      if (build) {
        this.drawPartition(model);
      } else {
        this.drawConvergence(model);
      }
    });
  }

  /** Convergence challenge: a prompt, a check button, and the verdict. */
  private challengeControls(model: RiemannSumBuilderModel): Node[] {
    const strings = StringManager.getInstance().getLessonStrings();
    const check = button(strings.checkStringProperty, () => model.checkChallenge());
    model.challenge.link((challenge) => {
      check.enabled = challenge !== null;
    });
    const prompt = computed([model.challenge, strings.challengePromptStringProperty], () => {
      const challenge = model.challenge.value;
      return challenge
        ? StringUtils.fillIn(strings.challengePromptStringProperty.value, {
            method: strings[`${challenge.method}StringProperty`].value,
            tolerance: format(challenge.tolerance, 3),
          })
        : "";
    });
    const verdict = computed([model.verdict], () =>
      model.verdict.value ? strings[`${model.verdict.value}StringProperty`].value : "",
    );
    return [
      row(
        button(strings.newChallengeStringProperty, () => model.newChallenge()),
        check,
      ),
      text(prompt, 14),
      text(verdict, 15, 298, true),
    ];
  }

  // Pointer-only grips. The border slider and the double/halve buttons own the keyboard path.
  private readonly borderHandles: Handle[] = [];
  private readonly powerHandle: Handle | null = null;
  private powerDragX: number | null = null;
  // The custom curve's points and the bounds have no slider, so these grips also take the keyboard.
  private readonly knotHandles: Handle[] = [];
  private readonly boundHandles: Handle[] = [];
  // Width of the visible x-range, for pointer hit tolerances.
  private xSpan = 2;

  /** Keeps one grip per interior border, placed on the x-axis, and grows or shrinks the pool. */
  private placeBorderHandles(model: RiemannSumBuilderModel): void {
    const plot = this.plot;
    const edges = model.edges.value;
    while (this.borderHandles.length < edges.length - 2) {
      const border = this.borderHandles.length + 1;
      this.borderHandles.push(
        plot.handle({
          radius: 6,
          cursor: "ew-resize",
          start: () => model.select(border - 1),
          drag: (x) => model.moveBorder(border, plot.modelX(x)),
          readout: () => `x = ${format(model.edges.value[border] ?? 0)}`,
        }),
      );
    }
    while (this.borderHandles.length > edges.length - 2) {
      const handle = this.borderHandles.pop();
      if (handle) {
        plot.removeHandle(handle);
      }
    }
    // Grips crowd each other on fine partitions; only show them while they stay grabbable.
    const roomy = edges.length - 1 <= 16;
    this.borderHandles.forEach((handle, i) => {
      handle.place(plot.plotX(edges[i + 1] ?? 0), plot.plotY(0));
      handle.visible = handle.visible && roomy;
    });
  }

  /** Fills the region between a sampled top edge and the axis, split where it crosses zero. */
  private fillPiece(tops: readonly Point[], stroke: typeof Colors.accentColorProperty): void {
    const plot = this.plot;
    let polygon: Point[] = [];
    let sign = 0;
    const flush = (endX: number) => {
      if (polygon.length > 0) {
        const first = polygon[0] ?? [endX, 0];
        plot.region(
          [[first[0], 0], ...polygon, [endX, 0]],
          sign < 0 ? Colors.negativeFillColorProperty : Colors.positiveFillColorProperty,
          stroke,
        );
      }
      polygon = [];
    };
    tops.forEach(([x, y], i) => {
      const s = Math.sign(y);
      const previous = tops[i - 1];
      if (previous && s !== 0 && sign !== 0 && s !== sign) {
        const [px, py] = previous;
        const zero = px + ((x - px) * py) / (py - y);
        polygon.push([zero, 0]);
        flush(zero);
        polygon.push([zero, 0]);
      }
      if (s !== 0) {
        sign = s;
      }
      polygon.push([x, y]);
    });
    flush(tops[tops.length - 1]?.[0] ?? 0);
  }

  private drawPartition(model: RiemannSumBuilderModel): void {
    const plot = this.plot;
    const edges = model.partition;
    const f = model.f;
    const method = model.method.value;
    const custom = model.integrand.value === "custom";
    const [low, high] = model.view;
    const pad = (high - low) * 0.04;
    const samples = Array.from({ length: 241 }, (_, i): Point => {
      const x = low + ((high - low) * i) / 240;
      return [x, f(x)];
    });
    let [ymin, ymax] = custom
      ? [knotRange.min - 0.15, knotRange.max + 0.2]
      : samples.reduce(([lo, hi], [, y]) => [Math.min(lo, y), Math.max(hi, y)], [0, 0]);
    if (!custom) {
      const span = Math.max(0.5, ymax - ymin);
      ymin -= span * 0.1;
      ymax += span * 0.1;
    }
    this.xSpan = high - low + 2 * pad;
    plot.setDomain([low - pad, high + pad, ymin, ymax], "x", model.absolute.value ? "|f(x)|" : "f(x)");
    plot.clear();
    const [a, b] = model.interval.value;
    edges.slice(1).forEach((right, i) => {
      const left = edges[i] ?? 0;
      const stroke = i === model.selected.value ? Colors.secondaryColorProperty : methodColors[method];
      const steps = 12;
      let tops: Point[];
      if (method === "trapezoid") {
        tops = [
          [left, f(left)],
          [right, f(right)],
        ];
        plot.point(left, f(left), stroke, false, 3);
        plot.point(right, f(right), stroke, false, 3);
      } else if (method === "simpson") {
        const middle = (left + right) / 2;
        const [fa, fm, fb] = [f(left), f(middle), f(right)];
        // The parabola through the two ends and the midpoint, in Lagrange form.
        tops = Array.from({ length: steps + 1 }, (_, k): Point => {
          const t = k / steps;
          const value = fa * (1 - t) * (1 - 2 * t) + 4 * fm * t * (1 - t) + fb * t * (2 * t - 1);
          return [left + (right - left) * t, value];
        });
        plot.point(left, fa, stroke, false, 3);
        plot.point(middle, fm, stroke, false, 3);
        plot.point(right, fb, stroke, false, 3);
      } else {
        const x = sample(method, left, right, f);
        const y = f(x);
        tops = [
          [left, y],
          [right, y],
        ];
        plot.point(x, y, stroke, false, 3);
      }
      this.fillPiece(tops, stroke);
      if (i > 0) {
        plot.point(left, 0, stroke, true, 2.5);
      }
    });
    for (const bound of [a, b]) {
      plot.line(
        [
          [bound, ymin],
          [bound, ymax],
        ],
        Colors.quaternaryColorProperty,
        1.5,
        [6, 4],
      );
    }
    plot.line(samples, Colors.textColorProperty, 2);
    this.placeBorderHandles(model);
    this.boundHandles.forEach((handle, side) => {
      handle.place(plot.plotX(model.interval.value[side as 0 | 1]), plot.plotY(0));
      handle.visible = handle.visible && !custom;
    });
    this.knotHandles.forEach((handle, i) => {
      handle.place(plot.plotX(knotXs[i] ?? 0), plot.plotY(model.knots.value[i] ?? 0));
      handle.visible = handle.visible && custom;
    });
  }

  private drawConvergence(model: RiemannSumBuilderModel): void {
    const plot = this.plot;
    const strings = StringManager.getInstance().getLessonStrings();
    const f = model.f;
    const exact = model.exact;
    const [a, b] = model.interval.value;
    // log₁₀ of each rule's error at n = 2^k, floored at roundoff.
    const logError = (method: Method, k: number) =>
      Math.log10(Math.max(ERROR_FLOOR, Math.abs(sum(f, method, uniform(2 ** k, a, b)) - exact)));
    const curves = convergenceMethods.map((method) =>
      Array.from({ length: maximumPower + 1 }, (_, k): Point => [k, logError(method, k)]),
    );
    // Errors at the roundoff floor (a rule that is exact for this f) fall below the plot.
    const values = curves
      .flat()
      .map(([, y]) => y)
      .filter((y) => y > Math.log10(ERROR_FLOOR) + 1);
    if (values.length === 0) {
      values.push(0);
    }
    const ymin = Math.floor(Math.min(...values)) - 0.4;
    const ymax = Math.ceil(Math.max(...values)) + 0.6;
    const yTicks = niceTicks(ymin, ymax, 6).filter((value) => Number.isInteger(value));
    plot.setDomain(
      [-0.3, maximumPower + 0.3, ymin, ymax],
      strings.countStringProperty,
      strings.errorStringProperty,
      Array.from({ length: maximumPower + 1 }, (_, k) => k),
      yTicks,
      { x: (k) => format(2 ** k), y: (k) => `10<sup>${format(k, 0)}</sup>`, axes: false },
    );
    plot.clear();
    const power = model.power.value;
    const top = ymax - (ymax - ymin) * 0.03;
    // The grip caps the dashed cursor line, clear of the error markers and tick labels.
    this.powerHandle?.place(this.powerDragX ?? plot.plotX(power), plot.plotY(top));
    plot.line(
      [
        [power, ymin],
        [power, top],
      ],
      Colors.textColorProperty,
      1,
      [4, 4],
    );
    convergenceMethods.forEach((method, index) => {
      const curve = curves[index] ?? [];
      plot.line(curve, methodColors[method], 2, dashes[method]);
      const [x, y] = curve[power] ?? [power, ymin];
      plot.point(x, y, methodColors[method], index % 2 === 0, 3 + (4 - index) * 0.8);
    });
  }
}
