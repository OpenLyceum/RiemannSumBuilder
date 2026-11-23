/**
 * main.ts
 *
 * Entry point for the simulation. Initializes SceneryStack, creates the
 * screens, and starts the main event loop.
 *
 * !! CRITICAL IMPORT ORDER !!
 * brand.js MUST be the first import. Each module imports the next, so the import nesting is
 *
 *   main → brand → splash → assert → init
 *
 * and therefore the actual EXECUTION order (deepest import runs first) is the reverse:
 *
 *   init → assert → splash → brand → main
 *
 * SceneryStack requires this exact load order. Never reorder these imports.
 */

// brand.js MUST be first; importing it runs the whole chain (init→assert→splash→brand) before main.
import "./brand.js";

import { onReadyToLaunch, PreferencesModel, Sim } from "scenerystack/sim";
import { Tandem } from "scenerystack/tandem";
import { BuildScreen } from "./build/BuildScreen.js";
import { ConvergenceScreen } from "./convergence/ConvergenceScreen.js";
import { StringManager } from "./i18n/StringManager.js";
import { RiemannSumBuilderPreferencesModel } from "./preferences/RiemannSumBuilderPreferencesModel.js";
import { RiemannSumBuilderPreferencesNode } from "./preferences/RiemannSumBuilderPreferencesNode.js";
import RiemannSumBuilderColors from "./RiemannSumBuilderColors.js";

onReadyToLaunch(() => {
  const stringManager = StringManager.getInstance();

  // Simulation-specific preferences; initial values come from riemannSumBuilderQueryParameters.
  const simPreferences = new RiemannSumBuilderPreferencesModel(Tandem.ROOT.createTandem("preferences"));

  const screens = [
    new BuildScreen({
      name: stringManager.getScreenNames().buildStringProperty,
      tandem: Tandem.ROOT.createTandem("buildScreen"),
      backgroundColorProperty: RiemannSumBuilderColors.backgroundColorProperty,
    }),
    new ConvergenceScreen({
      name: stringManager.getScreenNames().convergenceStringProperty,
      tandem: Tandem.ROOT.createTandem("convergenceScreen"),
      backgroundColorProperty: RiemannSumBuilderColors.backgroundColorProperty,
    }),
  ];

  const sim = new Sim(stringManager.getTitleStringProperty(), screens, {
    preferencesModel: new PreferencesModel({
      visualOptions: {
        // Adds a "Projector Mode" toggle in Preferences → Visual
        supportsProjectorMode: true,
        // Enables keyboard-navigation highlight outlines
        supportsInteractiveHighlights: true,
      },
      simulationOptions: {
        customPreferences: [
          {
            createContent: (tandem: Tandem) => new RiemannSumBuilderPreferencesNode(simPreferences, tandem),
          },
        ],
      },
      localizationOptions: {
        // Adds a language picker in Preferences → Language
        supportsDynamicLocale: true,
      },
    }),

    // Optional: fill in credits shown in Help → About
    credits: {
      leadDesign: "",
      softwareDevelopment: "",
      team: "",
      qualityAssurance: "",
    },
  });

  sim.start();
});
