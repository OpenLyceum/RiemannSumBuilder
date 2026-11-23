/**
 * RiemannSumBuilderPreferencesNode.ts
 *
 * Custom preferences UI shown in Preferences → Simulation. Add controls here
 * when the sim gains sim-specific preferences. The empty shell still wraps content
 * in RiemannSumBuilderPanel so the shared panel toolkit stays reachable.
 */
import { VBox } from "scenerystack/scenery";
import type { Tandem } from "scenerystack/tandem";
import { RiemannSumBuilderPanel } from "../common/RiemannSumBuilderPanel.js";
import RiemannSumBuilderNamespace from "../RiemannSumBuilderNamespace.js";
import type { RiemannSumBuilderPreferencesModel } from "./RiemannSumBuilderPreferencesModel.js";

export class RiemannSumBuilderPreferencesNode extends VBox {
  public constructor(_preferencesModel: RiemannSumBuilderPreferencesModel, _tandem?: Tandem) {
    // Pattern for a preference control (skill: scenerystack-preferences). The dialog is
    // always white, so use the controlSurface colors, not textColorProperty.
    //
    //   const prefStrings = StringManager.getInstance().getPreferences();
    //   const showGridCheckbox = new Checkbox(
    //     preferencesModel.showGridProperty,
    //     new Text(prefStrings.showGridStringProperty, {
    //       font: new PhetFont(14),
    //       fill: RiemannSumBuilderColors.controlSurfaceTextColorProperty,
    //     }),
    //     {
    //       // Shared slider / NumberControl / checkbox bundles live in RiemannSumBuilderControlOptions.ts:
    //       // copy the template's src/common/*ControlOptions.ts and apply the RiemannSumBuilder prefix.
    //       checkboxColor: RiemannSumBuilderColors.controlSurfaceTextColorProperty,
    //       checkboxColorBackground: RiemannSumBuilderColors.controlSurfaceColorProperty,
    //       ...(tandem && { tandem: tandem.createTandem("showGridCheckbox") }),
    //     },
    //   );
    //
    // Add showGridCheckbox to the content children below.
    const content = new VBox({
      align: "left",
      spacing: 12,
      children: [],
    });
    // Transparent / borderless so the Preferences dialog stays visually empty.
    const panel = new RiemannSumBuilderPanel(content, {
      fill: "transparent",
      stroke: null,
      xMargin: 0,
      yMargin: 0,
    });
    super({
      align: "left",
      spacing: 12,
      children: [panel],
    });
  }
}

RiemannSumBuilderNamespace.register("RiemannSumBuilderPreferencesNode", RiemannSumBuilderPreferencesNode);
