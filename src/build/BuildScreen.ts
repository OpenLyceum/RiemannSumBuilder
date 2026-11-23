/**
 * BuildScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createBuildIcon() in src/common/RiemannSumBuilderScreenIcons.ts
 * (see doc/multi-screen.md).
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createBuildIcon } from "../common/RiemannSumBuilderScreenIcons.js";
import RiemannSumBuilderColors from "../RiemannSumBuilderColors.js";
import { BuildModel } from "./model/BuildModel.js";
import { BuildKeyboardHelpContent } from "./view/BuildKeyboardHelpContent.js";
import { BuildScreenView } from "./view/BuildScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type BuildScreenOptions = ScreenOptions & { tandem: Tandem };

export class BuildScreen extends Screen<BuildModel, BuildScreenView> {
  public constructor(options: BuildScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new BuildModel(),
      // View factory — receives the model instance
      (model) => new BuildScreenView(model),
      optionize<BuildScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: RiemannSumBuilderColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new BuildKeyboardHelpContent(),
          homeScreenIcon: createBuildIcon(),
          navigationBarIcon: createBuildIcon(),
        },
        options,
      ),
    );
  }
}
