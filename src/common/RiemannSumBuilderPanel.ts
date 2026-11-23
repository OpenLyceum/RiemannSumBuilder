/**
 * RiemannSumBuilderPanel.ts
 *
 * A pre-themed Panel that automatically uses RiemannSumBuilderColors for background and
 * border. Use this for all control panels and info boxes in the sim so that
 * default / projector mode switching is handled automatically.
 *
 * ── Basic usage ───────────────────────────────────────────────────────────────
 *
 *   import { RiemannSumBuilderPanel } from "../../common/RiemannSumBuilderPanel.js";
 *   import { VBox, Text } from "scenerystack/scenery";
 *
 *   const content = new VBox({
 *     children: [ new Text("label"), slider ],
 *     spacing: 8,
 *   });
 *   const panel = new RiemannSumBuilderPanel(content);
 *
 * ── Overriding defaults ───────────────────────────────────────────────────────
 *
 *   // Wider margins, sharper corners, custom stroke
 *   const panel = new RiemannSumBuilderPanel(content, { xMargin: 20, cornerRadius: 0 });
 *
 *   // Transparent background (decorative border only)
 *   const panel = new RiemannSumBuilderPanel(content, { fill: "transparent" });
 */

import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { Node } from "scenerystack/scenery";
import { Panel, type PanelOptions } from "scenerystack/sun";
import RiemannSumBuilderColors from "../RiemannSumBuilderColors.js";
import { PANEL_CORNER_RADIUS } from "../RiemannSumBuilderConstants.js";

/** @public */
export type RiemannSumBuilderPanelOptions = PanelOptions;

/** Pre-themed Panel wrapper for control panels and info boxes. @public */
export class RiemannSumBuilderPanel extends Panel {
  public constructor(content: Node, providedOptions?: RiemannSumBuilderPanelOptions) {
    const options = optionize<RiemannSumBuilderPanelOptions, EmptySelfOptions, PanelOptions>()(
      {
        fill: RiemannSumBuilderColors.panelBackgroundColorProperty,
        stroke: RiemannSumBuilderColors.panelBorderColorProperty,
        cornerRadius: PANEL_CORNER_RADIUS,
        xMargin: 12,
        yMargin: 10,
      },
      providedOptions,
    );
    super(content, options);
  }
}
