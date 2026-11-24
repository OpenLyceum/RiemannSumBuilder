import { DerivedProperty, type NumberProperty, type ReadOnlyProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { Bounds2, Dimension2, Range, Vector2 } from "scenerystack/dot";
import { localeProperty } from "scenerystack/joist";
import { Shape } from "scenerystack/kite";
import { Circle, DragListener, HBox, Line, Node, Path, Rectangle, Text, VBox } from "scenerystack/scenery";
import { ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenSummaryContent, ScreenView } from "scenerystack/sim";
import { HSlider, RectangularPushButton } from "scenerystack/sun";
import Colors from "../RiemannSumBuilderColors.js";
import { SCREEN_VIEW_MARGIN } from "../RiemannSumBuilderConstants.js";
import {
  FLAT_PANEL_PUSH_BUTTON_OPTIONS,
  FLAT_RESET_ALL_BUTTON_OPTIONS,
  LIGHT_SURFACE_TEXT_FILL,
} from "./RiemannSumBuilderButtonOptions.js";
import { RiemannSumBuilderPanel } from "./RiemannSumBuilderPanel.js";

type StringSource = string | ReadOnlyProperty<string>;
type Paint = Rectangle["fill"];
type Domain = readonly [number, number, number, number];
const layout = { inset: 32, gap: 24, plotWidth: 610, plotHeight: 360, panelWidth: 320, top: 107 };

export function computed(properties: readonly TReadOnlyProperty<unknown>[], calculate: () => string) {
  return DerivedProperty.deriveAny([localeProperty, ...properties], calculate);
}

export function format(value: number, digits = 2): string {
  return new Intl.NumberFormat(localeProperty.value, { maximumFractionDigits: digits }).format(value);
}

export function text(value: StringSource, size = 16, width = 298, bold = false): Text {
  return new Text(value, {
    font: `${bold ? "bold " : ""}${size}px sans-serif`,
    maxWidth: width,
    fill: Colors.textColorProperty,
  });
}

export function button(label: ReadOnlyProperty<string>, action: () => void): RectangularPushButton {
  return new RectangularPushButton({
    ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
    content: new Text(label, { font: "bold 14px sans-serif", fill: LIGHT_SURFACE_TEXT_FILL, maxWidth: 270 }),
    accessibleName: label,
    listener: action,
    xMargin: 10,
    yMargin: 8,
  });
}

export function row(...children: Node[]): HBox {
  return new HBox({ children, spacing: 7, align: "center" });
}

export function column(...children: Node[]): VBox {
  return new VBox({ children, spacing: 7, align: "left" });
}

export function slider(
  label: ReadOnlyProperty<string>,
  value: NumberProperty,
  min: number,
  max: number,
  digits = 2,
  display = (x: number) => x,
  step?: number,
  enabledRangeProperty?: TReadOnlyProperty<Range>,
): VBox {
  const caption = computed([label, value], () => `${label.value}  ${format(display(value.value), digits)}`);
  const control = new HSlider(value, new Range(min, max), {
    accessibleName: label,
    ...(enabledRangeProperty ? { enabledRangeProperty } : {}),
    pdomCreateAriaValueText: (current) => format(display(current ?? value.value), digits),
    trackSize: new Dimension2(245, 4),
    thumbSize: new Dimension2(14, 21),
    thumbFill: Colors.accentColorProperty,
    thumbTouchAreaXDilation: 7,
    thumbTouchAreaYDilation: 7,
    ...(step
      ? {
          constrainValue: (x: number) => {
            const enabledRange = enabledRangeProperty?.value;
            if (enabledRange && (x === enabledRange.min || x === enabledRange.max)) {
              return x;
            }
            const snapped = Math.round(x / step) * step;
            return enabledRange ? enabledRange.constrainValue(snapped) : snapped;
          },
          keyboardStep: step,
        }
      : {}),
  });
  return column(text(caption, 15, 285, true), control);
}

class Plot extends Node {
  public readonly layers = new Node();
  // Handles persist across redraws; `clear()` only empties `layers`.
  private readonly handles = new Node();
  private readonly axes = new Node();
  private domain: Domain = [-1, 1, -1, 1];
  public readonly widthInPixels = layout.plotWidth;
  public readonly heightInPixels = layout.plotHeight;

  public constructor() {
    super();
    const { plotWidth, plotHeight } = layout;
    this.addChild(
      new Rectangle(0, 0, plotWidth, plotHeight, {
        fill: Colors.panelBackgroundColorProperty,
        stroke: Colors.panelBorderColorProperty,
        cornerRadius: 8,
        lineWidth: 1,
      }),
    );
    this.addChild(this.axes);
    this.addChild(this.layers);
    this.addChild(this.handles);
    this.layers.clipArea = Shape.rect(1, 1, plotWidth - 2, plotHeight - 2);
  }

  public setDomain(
    domain: Domain,
    xAxis: StringSource,
    yAxis: StringSource,
    xTicks?: number[],
    yTicks?: number[],
  ): void {
    this.domain = domain;
    this.clear(this.axes);
    const [xmin, xmax, ymin, ymax] = domain;
    const horizontal = this.plotY(Math.min(ymax, Math.max(ymin, 0)));
    const vertical = this.plotX(Math.min(xmax, Math.max(xmin, 0)));
    const inset = 6;
    for (const value of xTicks ?? [xmin, (xmin + xmax) / 2, xmax]) {
      const x = this.plotX(value);
      this.axes.addChild(new Line(x, 0, x, layout.plotHeight, { stroke: Colors.panelBorderColorProperty }));
      const tick = text(format(value, 3), 11, 62);
      tick.centerX = Math.max(tick.width / 2 + inset, Math.min(layout.plotWidth - tick.width / 2 - inset, x));
      tick.bottom = layout.plotHeight - inset;
      this.axes.addChild(tick);
    }
    for (const value of yTicks ?? [ymin, (ymin + ymax) / 2, ymax]) {
      const y = this.plotY(value);
      this.axes.addChild(new Line(0, y, layout.plotWidth, y, { stroke: Colors.panelBorderColorProperty }));
      const tick = text(format(value, 2), 11, 62);
      tick.left = inset;
      tick.centerY = Math.max(12, Math.min(layout.plotHeight - 26, y));
      this.axes.addChild(tick);
    }
    this.axes.addChild(
      new Line(inset, horizontal, layout.plotWidth - inset, horizontal, {
        stroke: Colors.textColorProperty,
        lineWidth: 1,
      }),
    );
    this.axes.addChild(
      new Line(vertical, inset, vertical, layout.plotHeight - inset, {
        stroke: Colors.textColorProperty,
        lineWidth: 1,
      }),
    );
    const xLabel = text(xAxis, 13, 125, true);
    xLabel.right = layout.plotWidth - 12;
    xLabel.bottom = layout.plotHeight - 24;
    const yLabel = text(yAxis, 13, 140, true);
    yLabel.left = 36;
    yLabel.top = 9;
    this.axes.addChild(xLabel);
    this.axes.addChild(yLabel);
  }

  public clear(node = this.layers): void {
    for (const child of node.children.slice()) {
      node.removeChild(child);
      child.dispose();
    }
  }

  public plotX(value: number): number {
    const [min, max] = this.domain;
    return ((value - min) / (max - min)) * layout.plotWidth;
  }

  public plotY(value: number): number {
    const [, , min, max] = this.domain;
    return ((max - value) / (max - min)) * layout.plotHeight;
  }

  public modelX(viewX: number): number {
    const [min, max] = this.domain;
    return min + ((max - min) * viewX) / layout.plotWidth;
  }

  public modelY(viewY: number): number {
    const [, , min, max] = this.domain;
    return max - ((max - min) * viewY) / layout.plotHeight;
  }

  /**
   * Adds a visible grab handle above the redrawn layers. The caller positions it with
   * `PlotHandle.place()` in plot pixels and receives the pointer's plot-pixel position
   * (offset so the handle does not jump to the finger) while it is dragged.
   */
  public handle(options: HandleOptions): PlotHandle {
    const handle = new PlotHandle(this, options);
    this.handles.addChild(handle);
    return handle;
  }

  public removeHandle(handle: PlotHandle): void {
    this.handles.removeChild(handle);
    handle.dispose();
  }

  public line(
    points: ReadonlyArray<readonly [number, number]>,
    stroke: Paint = Colors.accentColorProperty,
    width = 2,
    lineDash?: number[],
  ): void {
    if (points.length === 0) {
      return;
    }
    const shape = new Shape();
    points.forEach(([x, y], i) => {
      if (i === 0) {
        shape.moveTo(this.plotX(x), this.plotY(y));
      } else {
        shape.lineTo(this.plotX(x), this.plotY(y));
      }
    });
    this.layers.addChild(
      new Path(shape, { stroke, lineWidth: width, ...(lineDash ? { lineDash } : {}), pickable: false }),
    );
  }

  public region(points: ReadonlyArray<readonly [number, number]>, fill: Paint, stroke: Paint = null): void {
    const shape = new Shape();
    points.forEach(([x, y], i) => {
      if (i === 0) {
        shape.moveTo(this.plotX(x), this.plotY(y));
      } else {
        shape.lineTo(this.plotX(x), this.plotY(y));
      }
    });
    shape.close();
    this.layers.addChild(new Path(shape, { fill, stroke, lineWidth: 1, pickable: false }));
  }

  public point(x: number, y: number, stroke: Paint, open = false, radius = 5): void {
    this.layers.addChild(
      new Circle(radius, {
        x: this.plotX(x),
        y: this.plotY(y),
        fill: open ? Colors.panelBackgroundColorProperty : stroke,
        stroke,
        lineWidth: 2,
        pickable: false,
      }),
    );
  }

  public onDrag(callback: (x: number, y: number, start: boolean) => void): void {
    const input = new Rectangle(0, 0, layout.plotWidth, layout.plotHeight, {
      fill: "transparent",
      cursor: "ew-resize",
    });
    input.mouseArea = new Bounds2(0, 0, layout.plotWidth, layout.plotHeight);
    const update = (point: Parameters<Node["globalToLocalPoint"]>[0], start: boolean) => {
      const local = this.globalToLocalPoint(point);
      const [, , min, max] = this.domain;
      callback(this.modelX(local.x), max - ((max - min) * local.y) / layout.plotHeight, start);
    };
    input.addInputListener(
      new DragListener({
        start: (event) => update(event.pointer.point, true),
        drag: (event) => update(event.pointer.point, false),
      }),
    );
    this.insertChild(this.indexOfChild(this.handles), input);
  }
}

type HandleOptions = {
  fill?: Paint;
  radius?: number;
  cursor?: string;
  start?: () => void;
  drag: (x: number, y: number) => void;
};

/**
 * Pointer-only grab handle. Every quantity a handle moves also has an HSlider in the control
 * panel, which owns the keyboard path; a RichDragListener here would bind the arrows twice.
 */
class PlotHandle extends Node {
  private readonly listener: DragListener;

  public constructor(plot: Plot, options: HandleOptions) {
    const radius = options.radius ?? 8;
    const halo = new Circle(radius + 7, { fill: options.fill ?? Colors.accentColorProperty, opacity: 0.25 });
    super({
      cursor: options.cursor ?? "pointer",
      children: [
        halo,
        new Circle(radius, {
          fill: options.fill ?? Colors.accentColorProperty,
          stroke: Colors.panelBackgroundColorProperty,
          lineWidth: 2,
        }),
      ],
    });
    this.mouseArea = Shape.circle(0, 0, radius + 6);
    this.touchArea = Shape.circle(0, 0, radius + 16);
    let offset = Vector2.ZERO;
    const local = (point: Vector2) => plot.globalToLocalPoint(point);
    this.listener = new DragListener({
      start: (event) => {
        offset = this.translation.minus(local(event.pointer.point));
        options.start?.();
      },
      drag: (event) => {
        const point = local(event.pointer.point).plus(offset);
        options.drag(
          Math.max(0, Math.min(layout.plotWidth, point.x)),
          Math.max(0, Math.min(layout.plotHeight, point.y)),
        );
      },
    });
    this.listener.isHighlightedProperty.link((highlighted) => {
      halo.opacity = highlighted ? 0.45 : 0.25;
    });
    this.addInputListener(this.listener);
  }

  /** Moves the handle to plot pixels and hides it when the point falls off the plot. */
  public place(x: number, y: number): void {
    const inside = x >= -1 && x <= layout.plotWidth + 1 && y >= -1 && y <= layout.plotHeight + 1;
    this.visible = inside && Number.isFinite(x) && Number.isFinite(y);
    if (this.visible) {
      this.setTranslation(x, y);
    }
  }

  public override dispose(): void {
    this.removeInputListener(this.listener);
    this.listener.dispose();
    super.dispose();
  }
}

type LessonOptions = {
  title: ReadOnlyProperty<string>;
  playDescription: ReadOnlyProperty<string>;
  hint: ReadOnlyProperty<string>;
  details: ReadOnlyProperty<string>;
  controlDescription: ReadOnlyProperty<string>;
};

export class LessonView extends ScreenView {
  public readonly plot = new Plot();

  public constructor(options: LessonOptions) {
    super({
      screenSummaryContent: new ScreenSummaryContent({
        playAreaContent: options.playDescription,
        controlAreaContent: options.controlDescription,
        currentDetailsContent: options.details,
        interactionHintContent: options.hint,
      }),
    });
    const title = text(options.title, 34, 920, true);
    title.left = layout.inset;
    title.top = 24;
    const hint = text(options.hint, 17, 950);
    hint.left = layout.inset;
    hint.top = 70;
    this.plot.left = layout.inset;
    this.plot.top = layout.top;
    this.addChild(title);
    this.addChild(hint);
    this.addChild(this.plot);
  }

  protected finish(controls: Node, notes: Node, reset: () => void): void {
    const panelContent = new Node({
      children: [new Rectangle(0, 0, layout.panelWidth, 430, { pickable: false }), controls],
    });
    controls.left = 15;
    controls.top = 15;
    const sidebar = new RiemannSumBuilderPanel(panelContent, {
      xMargin: 0,
      yMargin: 0,
      left: layout.inset + layout.plotWidth + layout.gap,
      top: layout.top,
    });
    notes.left = layout.inset;
    notes.top = layout.top + layout.plotHeight + 14;
    const resetButton = new ResetAllButton({
      ...FLAT_RESET_ALL_BUTTON_OPTIONS,
      listener: reset,
      right: this.layoutBounds.maxX - SCREEN_VIEW_MARGIN,
      bottom: this.layoutBounds.maxY - 20,
    });
    this.addChild(sidebar);
    this.addChild(notes);
    this.addChild(resetButton);
    this.addChild(new Node({ pdomOrder: [controls, resetButton] }));
  }
}
