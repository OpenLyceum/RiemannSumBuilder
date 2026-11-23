import { Shape } from "scenerystack/kite";
import { Circle, Node, Path, Rectangle } from "scenerystack/scenery";
import { ScreenIcon } from "scenerystack/sim";
import Colors from "../RiemannSumBuilderColors.js";

function makeIcon(outline: string, points: readonly (readonly [number, number])[] = []): ScreenIcon {
  const background = new Rectangle(0, 0, 548, 373, { fill: Colors.backgroundColorProperty });
  const line = new Path(new Shape(outline), {
    stroke: Colors.accentColorProperty,
    lineWidth: 18,
    lineCap: "round",
    lineJoin: "round",
  });
  const markers = points.map(([x, y]) => new Circle(12, { x, y, fill: Colors.secondaryColorProperty }));
  return new ScreenIcon(new Node({ children: [background, line, ...markers] }), {
    maxIconWidthProportion: 1,
    maxIconHeightProportion: 1,
    fill: Colors.backgroundColorProperty,
  });
}

export function createBuildIcon(): ScreenIcon {
  return makeIcon(
    "M 83 291 L 83 261 L 164 261 L 164 291 M 164 291 L 164 216 L 249 216 L 249 291 M 249 291 L 249 154 L 341 154 L 341 291 M 341 291 L 341 84 L 431 84 L 431 291",
  );
}

export function createConvergenceIcon(): ScreenIcon {
  return makeIcon("M 90 82 L 172 164 L 250 211 L 326 253 L 438 271 M 91 161 L 176 212 L 254 248 L 332 266 L 438 280", [
    [90, 82],
    [172, 164],
    [250, 211],
    [326, 253],
    [438, 271],
  ]);
}
