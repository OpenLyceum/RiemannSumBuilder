import { Multilink, NumberProperty } from "scenerystack/axon";
import { localeProperty } from "scenerystack/joist";
import { StringManager } from "../i18n/StringManager.js";
import Colors from "../RiemannSumBuilderColors.js";
import { button, column, computed, format, LessonView, row, slider, text } from "./LessonView.js";
import {
  evaluate,
  functions,
  integral,
  maximumPower,
  methods,
  type RiemannSumBuilderModel,
  sample,
  sum,
  uniform,
} from "./model/RiemannSumBuilderModel.js";

const fractions = { square: "8/3", line: "0", arch: "4/3" };
const formulas = { square: "f(x) = x²", line: "f(x) = x − 1", arch: "f(x) = 2x − x²" };
const methodColors = [
  Colors.accentColorProperty,
  Colors.secondaryColorProperty,
  Colors.tertiaryColorProperty,
  Colors.quaternaryColorProperty,
];
const dashes = [[], [10, 4], [4, 3], [2, 4]];

export class RiemannSumBuilderView extends LessonView {
  public constructor(model: RiemannSumBuilderModel) {
    const manager = StringManager.getInstance();
    const names = manager.getScreenNames();
    const strings = manager.getLessonStrings();
    const build = model.mode === "build";
    const summary = (build ? manager.getBuildA11yStrings() : manager.getConvergenceA11yStrings()).screenSummary;
    const dependencies = [model.integrand, model.method, model.edges, model.selected, model.power] as const;
    const formula = computed([model.integrand], () => formulas[model.integrand.value]);
    const count = computed(
      [...dependencies],
      () => `${strings.countStringProperty.value}  ${model.partition.length - 1}`,
    );
    const selected = computed([...dependencies], () => {
      const i = model.selected.value;
      return `${strings.selectionStringProperty.value}  ${i + 1}  [${format(model.edges.value[i] ?? 0)}, ${format(model.edges.value[i + 1] ?? 2)}]`;
    });
    const exact = computed(
      [model.integrand],
      () => `${strings.exactStringProperty.value}  ${fractions[model.integrand.value]}`,
    );
    const comparison = (comparisonMethod: (typeof methods)[number]) => {
      const value = sum(model.integrand.value, comparisonMethod, model.partition);
      const error = Math.abs(value - integral[model.integrand.value]);
      const prefix = strings[`${comparisonMethod}StringProperty`].value;
      return build
        ? `${prefix}  ${format(value, 6)}`
        : `${prefix}  ${format(value, 6)}   ·   ${strings.errorStringProperty.value} ${format(error, 6)}`;
    };
    super({
      title: build ? names.buildStringProperty : names.convergenceStringProperty,
      hint: summary.interactionHintStringProperty,
      playDescription: summary.playAreaStringProperty,
      controlDescription: summary.controlAreaStringProperty,
      details: computed(
        dependencies,
        () =>
          `${formula.value}. ${count.value}. ${build ? selected.value : exact.value}. ${methods.map(comparison).join(". ")}`,
      ),
    });

    const border = new NumberProperty(model.edges.value[1] ?? 2);
    let syncing = false;
    const borderIndex = () => Math.min(model.selected.value + 1, model.edges.value.length - 2);
    const borderSlider = slider(strings.borderStringProperty, border, 0, 2, 2, undefined, 0.01);
    const split = button(strings.splitStringProperty, () => model.split());
    const merge = button(strings.mergeStringProperty, () => model.merge());
    const prev = button(strings.previousStringProperty, () => model.select(model.selected.value - 1));
    const next = button(strings.nextStringProperty, () => model.select(model.selected.value + 1));
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
    if (build) {
      Multilink.multilink([model.edges, model.selected], (edges, i) => {
        syncing = true;
        border.value = edges[borderIndex()] ?? 0;
        syncing = false;
        merge.enabled = edges.length > 2;
        prev.enabled = i > 0;
        next.enabled = i < edges.length - 2;
        split.enabled = (edges[i + 1] ?? 2) - (edges[i] ?? 0) >= 0.02;
        borderSlider.visible = merge.enabled;
      });
      border.lazyLink((x) => {
        if (!syncing) {
          model.moveBorder(borderIndex(), x);
        }
      });
      let draggedBorder = 0;
      this.plot.onDrag((x, _y, start) => {
        if (start) {
          draggedBorder = model.edges.value.findIndex(
            (edge, i) => i > 0 && i < model.edges.value.length - 1 && Math.abs(edge - x) < 0.035,
          );
          const interval = model.edges.value.findIndex((edge) => edge > x) - 1;
          model.select(
            draggedBorder > 0 ? draggedBorder - 1 : interval < 0 && x > 0 ? model.edges.value.length - 2 : interval,
          );
        } else if (draggedBorder > 0) {
          model.moveBorder(draggedBorder, x);
        }
      });
    }

    const method = computed([model.method], () => strings[`${model.method.value}StringProperty`].value);
    const estimates = methods.map((name, index) => {
      const line = text(
        computed([...dependencies], () => comparison(name)),
        15,
      );
      line.fill = methodColors[index] ?? Colors.accentColorProperty;
      return line;
    });
    this.finish(
      column(
        text(formula, 19, 286, true),
        button(strings.changeFunctionStringProperty, () => {
          model.integrand.value =
            functions[(functions.indexOf(model.integrand.value) + 1) % functions.length] ?? "square";
        }),
        text(count, 16, 286, true),
        ...(build
          ? [
              row(
                text(method, 16, 116),
                button(strings.changeMethodStringProperty, () => {
                  model.method.value = methods[(methods.indexOf(model.method.value) + 1) % methods.length] ?? "left";
                }),
              ),
              text(selected, 15),
              row(prev, next),
              row(split, merge),
              borderSlider,
            ]
          : [row(halve, double)]),
        text(exact, 16, 286, true),
        ...estimates,
      ),
      column(text(build ? strings.signedStringProperty : strings.errorNoteStringProperty, 16, 610)),
      () => model.reset(),
    );

    Multilink.multilink([localeProperty, ...dependencies], () => {
      if (build) {
        this.drawPartition(model);
      } else {
        this.drawConvergence(model);
      }
    });
  }

  private drawPartition(model: RiemannSumBuilderModel): void {
    const plot = this.plot;
    const edges = model.partition;
    const name = model.integrand.value;
    const method = model.method.value;
    plot.setDomain([-0.13, 2.13, -1.35, 4.5], "x", "f(x)", [0, 0.5, 1, 1.5, 2], [-1, 0, 1, 2, 3, 4]);
    plot.clear();
    edges.slice(1).forEach((b, i) => {
      const a = edges[i] ?? 0;
      const x = sample(method, a, b);
      const y = evaluate(name, x);
      const left = method === "trapezoid" ? evaluate(name, a) : y;
      const right = method === "trapezoid" ? evaluate(name, b) : y;
      const stroke = i === model.selected.value ? Colors.secondaryColorProperty : Colors.accentColorProperty;
      const fill = (height: number) =>
        height < 0 ? Colors.negativeFillColorProperty : Colors.positiveFillColorProperty;
      if (left * right < 0) {
        const zero = a + ((b - a) * left) / (left - right);
        plot.region(
          [
            [a, 0],
            [a, left],
            [zero, 0],
          ],
          fill(left),
          stroke,
        );
        plot.region(
          [
            [zero, 0],
            [b, right],
            [b, 0],
          ],
          fill(right),
          stroke,
        );
      } else {
        plot.region(
          [
            [a, 0],
            [a, left],
            [b, right],
            [b, 0],
          ],
          fill(left + right),
          stroke,
        );
      }
      if (method === "trapezoid") {
        plot.point(a, left, stroke, false, 3);
        plot.point(b, right, stroke, false, 3);
      } else {
        plot.point(x, y, stroke, false, 3);
      }
      if (i > 0) {
        plot.line(
          [
            [a, -0.13],
            [a, 0.13],
          ],
          stroke,
          3,
        );
        plot.point(a, 0, stroke, true, 3);
      }
    });
    plot.line(
      Array.from({ length: 201 }, (_, i) => [i / 100, evaluate(name, i / 100)]),
      Colors.textColorProperty,
      2,
    );
  }

  private drawConvergence(model: RiemannSumBuilderModel): void {
    const plot = this.plot;
    const strings = StringManager.getInstance().getLessonStrings();
    const name = model.integrand.value;
    const error = (method: (typeof methods)[number], refinement: number) =>
      Math.abs(sum(name, method, uniform(2 ** refinement)) - integral[name]);
    plot.setDomain(
      [0, maximumPower, -0.15, Math.max(1, ...methods.map((method) => error(method, 0))) * 1.15],
      strings.countStringProperty,
      strings.errorStringProperty,
      [],
    );
    plot.clear();
    for (let i = 0; i <= maximumPower; i++) {
      const label = text(format(2 ** i), 11, 45);
      label.centerX = Math.max(12, Math.min(plot.widthInPixels - 12, plot.plotX(i)));
      label.bottom = plot.heightInPixels - 5;
      plot.layers.addChild(label);
    }
    const power = model.power.value;
    plot.line(
      [
        [power, 0],
        [power, Math.max(1, ...methods.map((method) => error(method, 0))) * 1.1],
      ],
      Colors.textColorProperty,
      1,
      [4, 4],
    );
    methods.forEach((method, index) => {
      plot.line(
        Array.from({ length: maximumPower + 1 }, (_, i) => [i, error(method, i)]),
        methodColors[index] ?? Colors.accentColorProperty,
        2,
        dashes[index],
      );
      plot.point(
        power,
        error(method, power),
        methodColors[index] ?? Colors.accentColorProperty,
        index % 2 === 0,
        3 + (3 - index),
      );
    });
  }
}
