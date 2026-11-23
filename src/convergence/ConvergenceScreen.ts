/**
 * ConvergenceScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createConvergenceIcon() in src/common/RiemannSumBuilderScreenIcons.ts
 * (see doc/multi-screen.md).
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createConvergenceIcon } from "../common/RiemannSumBuilderScreenIcons.js";
import RiemannSumBuilderColors from "../RiemannSumBuilderColors.js";
import { ConvergenceModel } from "./model/ConvergenceModel.js";
import { ConvergenceKeyboardHelpContent } from "./view/ConvergenceKeyboardHelpContent.js";
import { ConvergenceScreenView } from "./view/ConvergenceScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type ConvergenceScreenOptions = ScreenOptions & { tandem: Tandem };

export class ConvergenceScreen extends Screen<ConvergenceModel, ConvergenceScreenView> {
  public constructor(options: ConvergenceScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new ConvergenceModel(),
      // View factory — receives the model instance
      (model) => new ConvergenceScreenView(model),
      optionize<ConvergenceScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: RiemannSumBuilderColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new ConvergenceKeyboardHelpContent(),
          homeScreenIcon: createConvergenceIcon(),
          navigationBarIcon: createConvergenceIcon(),
        },
        options,
      ),
    );
  }
}
