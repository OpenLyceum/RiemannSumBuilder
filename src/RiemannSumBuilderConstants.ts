/**
 * RiemannSumBuilderConstants.ts
 *
 * Central repository for every named numeric constant used across the
 * simulation. Bare numbers that carry semantic meaning (sizes, margins,
 * physics defaults, ranges) belong here rather than inline in model or view
 * code, so they are named, documented, and changed in one place.
 *
 * Conventions
 * ───────────
 *  - Model / math values note their unit in a comment on each value.
 *  - Layout / chrome values are in screen pixels.
 *  - Colour strings live in RiemannSumBuilderColors.ts, not here.
 *  - Computed expressions (e.g. `2 * Math.PI`) may stay inline.
 *
 * LAYOUT matches the other Calculus I sims (Limit Explorer, Mean Value
 * Theorem, Related Rates) — keep those copies in sync.
 */

import { Range } from "scenerystack/dot";
import RiemannSumBuilderNamespace from "./RiemannSumBuilderNamespace.js";

// ── Layout / chrome (screen pixels) ───────────────────────────────────────────

/** Margin between the screen edge and edge-anchored controls (e.g. Reset All). */
export const SCREEN_VIEW_MARGIN = 20;

/**
 * Corner radius shared by control panels and dialogs.
 * @public
 */
export const PANEL_CORNER_RADIUS = 6;

/**
 * Shared lesson scaffold: plot left, panel right, notes under the plot.
 * Keys stay camelCase to match LessonView usage across the Calculus I fleet.
 */
export const LAYOUT = {
  inset: 32,
  gap: 24,
  plotWidth: 610,
  plotHeight: 360,
  panelWidth: 320,
  panelHeight: 430,
  top: 107,
  notesGap: 14,
};

// ── Model / math ──────────────────────────────────────────────────────────────

/** Narrowest allowed subinterval width. */
export const MINIMUM_WIDTH = 0.01;

/** Bounds stay at least this far apart. */
export const MINIMUM_INTERVAL = 0.2;

/** Dragged bounds snap to multiples of this. */
export const BOUND_STEP = 0.05;

/** Convergence screen: largest 2^k power shown. */
export const maximumPower = 7;

/** Build screen: largest partition count n. */
export const maximumCount = 64;

/** Custom integrand knot x-coordinates. */
export const knotXs = [0, 0.5, 1, 1.5, 2] as const;

/** Vertical range for custom-integrand knot handles. */
export const knotRange = new Range(-1.2, 4.3);

/** Spacing between custom knots in x. */
export const KNOT_SPACING = 0.5;

/** Custom knot y values snap to multiples of this. */
export const KNOT_STEP = 0.05;

/** “Fewest subintervals” challenge absolute-error targets. */
export const CHALLENGE_TOLERANCES = [0.1, 0.01, 0.001] as const;

RiemannSumBuilderNamespace.register("RiemannSumBuilderConstants", {
  SCREEN_VIEW_MARGIN,
  PANEL_CORNER_RADIUS,
  LAYOUT,
  MINIMUM_WIDTH,
  MINIMUM_INTERVAL,
  BOUND_STEP,
  maximumPower,
  maximumCount,
  knotXs,
  knotRange,
  KNOT_SPACING,
  KNOT_STEP,
  CHALLENGE_TOLERANCES,
});
