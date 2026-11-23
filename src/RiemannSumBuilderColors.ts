/**
 * RiemannSumBuilderColors.ts
 *
 * Defines all dynamic colors for the simulation using ProfileColorProperty.
 *
 * Each color has two profiles:
 *   - "default"   — used in standard (dark) mode
 *   - "projector" — used when the user enables Projector Mode in Preferences
 *
 * SceneryStack switches profiles automatically; no manual toggling is needed.
 *
 * ── Usage ─────────────────────────────────────────────────────────────────────
 * Import RiemannSumBuilderColors and pass properties directly to Node's fillProperty or
 * strokeProperty options:
 *
 *   import RiemannSumBuilderColors from "../../RiemannSumBuilderColors.js";
 *
 *   new Rectangle( 0, 0, 100, 50, {
 *     fillProperty: RiemannSumBuilderColors.backgroundColorProperty,
 *   });
 *
 * ── How to add a color ────────────────────────────────────────────────────────
 * Add a new ProfileColorProperty entry to the RiemannSumBuilderColors object below.
 * Always provide both "default" and "projector" values.
 */
import { ProfileColorProperty } from "scenerystack/scenery";
import RiemannSumBuilderNamespace from "./RiemannSumBuilderNamespace.js";

const RiemannSumBuilderColors = {
  secondaryColorProperty: new ProfileColorProperty(RiemannSumBuilderNamespace, "secondary", {
    default: "#fdbb74",
    projector: "#9a3412",
  }),
  tertiaryColorProperty: new ProfileColorProperty(RiemannSumBuilderNamespace, "tertiary", {
    default: "#9ee5ba",
    projector: "#166534",
  }),
  quaternaryColorProperty: new ProfileColorProperty(RiemannSumBuilderNamespace, "quaternary", {
    default: "#d7adfa",
    projector: "#6b21a8",
  }),
  positiveFillColorProperty: new ProfileColorProperty(RiemannSumBuilderNamespace, "positiveFill", {
    default: "#204859",
    projector: "#c8e3ee",
  }),
  negativeFillColorProperty: new ProfileColorProperty(RiemannSumBuilderNamespace, "negativeFill", {
    default: "#594152",
    projector: "#f4d4df",
  }),
  /**
   * Background color for the simulation screen.
   * Deep navy in default mode; white in projector mode.
   */
  backgroundColorProperty: new ProfileColorProperty(RiemannSumBuilderNamespace, "background", {
    default: "#1a1a2e",
    projector: "#ffffff",
  }),

  /**
   * Primary accent color for highlights, selected items, and key UI elements.
   * Sky blue in default mode; dark navy in projector mode.
   */
  accentColorProperty: new ProfileColorProperty(RiemannSumBuilderNamespace, "accent", {
    default: "#4fc3f7",
    projector: "#1a1a2e",
  }),

  /**
   * Background fill for control panels and dialogs.
   * Deep blue in default mode; light gray in projector mode.
   */
  panelBackgroundColorProperty: new ProfileColorProperty(RiemannSumBuilderNamespace, "panelBackground", {
    default: "#16213e",
    projector: "#f5f5f5",
  }),

  /**
   * Border/stroke color for control panels and dialogs.
   * Teal-navy in default mode; medium gray in projector mode.
   */
  panelBorderColorProperty: new ProfileColorProperty(RiemannSumBuilderNamespace, "panelBorder", {
    default: "#0f3460",
    projector: "#999999",
  }),

  /**
   * Text color for labels, readouts, and general UI text.
   * Near-white in default mode; near-black in projector mode.
   */
  textColorProperty: new ProfileColorProperty(RiemannSumBuilderNamespace, "text", {
    default: "#e0e0e0",
    projector: "#1a1a1a",
  }),

  // ── Light control surfaces ───────────────────────────────────────────────────
  // White chrome (combo boxes, flat push buttons, editable input fields) stays light
  // in both profiles; its text stays dark. Same values in default and projector mode,
  // but defined here so every color lives in one themeable place.

  /** Fill of light control surfaces: combo-box button/list, editable input fields. */
  controlSurfaceColorProperty: new ProfileColorProperty(RiemannSumBuilderNamespace, "controlSurface", {
    default: "#ffffff",
    projector: "#ffffff",
  }),

  /** Fill of a disabled control surface (grayed-out editable input field). */
  controlSurfaceDisabledColorProperty: new ProfileColorProperty(RiemannSumBuilderNamespace, "controlSurfaceDisabled", {
    default: "#cccccc",
    projector: "#cccccc",
  }),

  /** Text on light control surfaces: combo items, flat-button labels, field values, preferences. */
  controlSurfaceTextColorProperty: new ProfileColorProperty(RiemannSumBuilderNamespace, "controlSurfaceText", {
    default: "#1a1a1a",
    projector: "#1a1a1a",
  }),
};

export default RiemannSumBuilderColors;
