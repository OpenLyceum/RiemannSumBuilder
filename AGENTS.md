# AGENTS.md — Riemann Sum Builder

Sim-specific context for AI assistants. General SceneryStack guidance: [OpenLyceum/.github/AGENTS.md](https://github.com/OpenLyceum/.github/blob/main/AGENTS.md).

## Project

Riemann Sum Builder (`riemann-sum-builder`) is a SceneryStack simulation scaffolded from SceneryStackTemplate.

## Key files

| File | Purpose |
|---|---|
| `src/RiemannSumBuilderColors.ts` | All `ProfileColorProperty` instances |
| `src/RiemannSumBuilderConstants.ts` | Named numeric constants |
| `src/RiemannSumBuilderNamespace.ts` | Namespace for color property names |
| `src/i18n/StringManager.ts` | Singleton localized string accessor |
| `src/common/RiemannSumBuilderPanel.ts` | Pre-themed `Panel` wrapper |
| `src/common/RiemannSumBuilderButtonOptions.ts` | Flat button / combo-box option bundles |
| `src/build/BuildScreen.ts` | Screen wrapper |
| `src/build/model/BuildModel.ts` | Simulation state and logic |
| `src/build/view/BuildScreenView.ts` | Visual nodes, layout, a11y wiring |
| `src/convergence/ConvergenceScreen.ts` | Screen wrapper |
| `src/convergence/model/ConvergenceModel.ts` | Simulation state and logic |
| `src/convergence/view/ConvergenceScreenView.ts` | Visual nodes, layout, a11y wiring |

## Compliance carve-outs

- `memory-leak:PlotHandle` — file-private drag handle inside the plot/lesson view; not exported for `describeDisposalLeaks`.

## Testing

See the shared Vitest setup (`vitest.config.ts`, `tests/setup.ts`) and `tests/memory-leak.test.ts` for disposal coverage. Add sim-specific unit tests under `tests/` as physics and UI logic land.

## Accessibility

Follow [Baton/ACCESSIBILITY.md](https://github.com/OpenLyceum/Baton/blob/main/ACCESSIBILITY.md): PDOM names, per-screen `*ScreenSummaryContent`, and keyboard-help content. Document any intentional deviations under Compliance carve-outs.
