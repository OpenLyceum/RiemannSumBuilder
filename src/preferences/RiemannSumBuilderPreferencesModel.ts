/**
 * RiemannSumBuilderPreferencesModel.ts
 *
 * Model for the simulation-specific preferences shown in Preferences →
 * Simulation. Keep this empty shell until the sim needs real preferences; the
 * optional tandem keeps main.ts wiring uniform.
 */
import type { Tandem } from "scenerystack/tandem";
import RiemannSumBuilderNamespace from "../RiemannSumBuilderNamespace.js";
import "./riemannSumBuilderQueryParameters.js";

export class RiemannSumBuilderPreferencesModel {
  // Pattern for a preference (skill: scenerystack-preferences). Every preference is
  // one chain: query parameter → Property here → label in every strings_*.json →
  // control in RiemannSumBuilderPreferencesNode → reset() below.
  //
  //   import { BooleanProperty } from "scenerystack/axon";
  //   import riemannSumBuilderQueryParameters from "./riemannSumBuilderQueryParameters.js"; // replaces the bare import
  //
  //   public readonly showGridProperty: BooleanProperty;
  //
  //   // in the constructor (rename _tandem → tandem):
  //   this.showGridProperty = new BooleanProperty(
  //     riemannSumBuilderQueryParameters.showGrid,
  //     tandem ? { tandem: tandem.createTandem("showGridProperty") } : undefined,
  //   );
  //
  //   // in reset():
  //   this.showGridProperty.reset();

  public constructor(_tandem?: Tandem) {
    // Attach preference Properties under this tandem when added.
  }

  public reset(): void {
    // No sim-specific preferences yet.
  }
}

RiemannSumBuilderNamespace.register("RiemannSumBuilderPreferencesModel", RiemannSumBuilderPreferencesModel);
