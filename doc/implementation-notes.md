# Implementation notes — Riemann Sum Builder

Developer-facing architecture notes for `riemann-sum-builder`.

## Architecture

Screens: src/build/, src/convergence/

- Models own state and `step` / `reset`; views observe Properties and never integrate physics.
- Colors live in `src/RiemannSumBuilderColors.ts`; strings in `src/i18n/` via `StringManager`.
- Preferences shell: `src/preferences/` (empty until sim-specific prefs are added).

## Notes

*Record design decisions, performance constraints, and known limitations here.*
