# AGENTS.md — Riemann Sum Builder

Sim-specific context for AI assistants. General SceneryStack guidance: [OpenLyceum/.github/AGENTS.md](https://github.com/OpenLyceum/.github/blob/main/AGENTS.md).

## Project

Riemann Sum Builder (`riemann-sum-builder`) teaches definite integrals as limits of sums.

- **Build:** pick an integrand from the function list, drag the bounds a and b, and choose a rule from the rule bar. The rules are Left, Right, Midpoint, Trapezoid, Simpson, and Upper/Lower (Darboux) sums. Set n equal subintervals with the slider, or split, merge and move single borders. "Total area" sums |f| instead of f. The custom curve is a natural cubic spline whose five knots are dragged on the graph.
- **Convergence:** log–log error against n = 2^k for the five estimate rules, the observed order log₂(e_{n/2}/e_n), and a "fewest subintervals" challenge. It opens on eˣ, because Simpson's rule is exact for x².

## Key files

| File | Purpose |
|---|---|
| `src/common/model/RiemannSumBuilderModel.ts` | Function `library` (formula markup, f, antiderivative F, default bounds, drag window), the rules (`sum`, `sample`), `absoluteIntegral`, spline and its antiderivative, partition editing, bounds, challenge |
| `src/common/RiemannSumBuilderView.ts` | Both screens: control panel, rule bar, sums readout, partition and log–log drawing, plot handles |
| `src/common/LessonView.ts` | **Canonical Calculus I scaffold.** It is shared file-for-file with LimitExplorer, MeanValueTheorem and RelatedRates, with only the sim prefix changed. It holds the plot, `PlotHandle`, the control factories (`comboBox`, `radioButtons`, `checkbox`, `slider`, `richText`), `niceTicks` and the layout. Edit it here and copy it to the other three sims. |
| `src/i18n/strings_*.json` | en/fr/es strings; formula markup stays in the library because it is notation, not prose |
| `tests/partition.test.ts` | Rule values, antiderivatives against Simpson, Darboux bracketing, \|f\| integration, bounds and partition edits, challenge |
| `tests/browser/build-border.spec.ts` | Keyboard path of the border slider, which runs over [0, 1] as a fraction of [a, b] |

## Compliance carve-outs

- `memory-leak:PlotHandle` — file-private drag handle inside the plot/lesson view; not exported for `describeDisposalLeaks`.

## Testing

See the shared Vitest setup (`vitest.config.ts`, `tests/setup.ts`) and `tests/memory-leak.test.ts` for disposal coverage. Add sim-specific unit tests under `tests/` as physics and UI logic land.

## Accessibility

Follow [Baton/ACCESSIBILITY.md](https://github.com/OpenLyceum/Baton/blob/main/ACCESSIBILITY.md): PDOM names, per-screen `*ScreenSummaryContent`, and keyboard-help content. Document any intentional deviations under Compliance carve-outs.
