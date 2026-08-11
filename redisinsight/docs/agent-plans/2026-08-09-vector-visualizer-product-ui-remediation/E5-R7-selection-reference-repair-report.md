# E5.R7 — Selection reference repair report

Date: 2026-08-10

Status: locally verified; fresh independent visual audit pending

Commit/stage/push: prohibited and not performed

## Trigger and root cause

The user's live review showed that the accepted Selection state did not match the
preserved normative `selection-reference.png`. The page only mounted a second
Atlas instance with a different title and one selected row. Although
`AtlasRenderer` could calculate a Shift-drag selection, it did not expose or draw
the selected rectangle, Selection did not make ordinary drag the primary gesture,
and the persistent result inspector continued to show the complete sample.

The previous E5 visual decisions are therefore historical evidence, not current
promotion evidence for Selection.

## Implemented correction

- Selection reuses the complete response-backed, metadata-coloured UMAP context.
- Ordinary pointer drag is region selection in Selection mode; Atlas retains its
  existing pan interaction and Shift-drag selection.
- The renderer emits normalized selection geometry and the Atlas surface draws a
  persistent, theme-semantic translucent rectangle.
- The Selection header reports the number of points selected from the displayed
  sample, selected points keep their non-colour ring state, and Clear selection
  removes the region.
- The persistent right inspector is filtered to the selected records and remains
  linked to the focused record. No score is invented for sampled rows.
- The rectangle is normalized, so it remains aligned with the plot at 1440x900 and
  RedisInsight's supported 960x680 desktop minimum.

No adapter, backend, public contract, dependency, build configuration, Workbench
surface, mobile behavior, PCA/t-SNE option, or sample-range expansion was added.

## Test-first evidence

RED was observed before production edits:

- focused Atlas/renderer Jest: 2 suites failed because the renderer had no region
  interaction mode or selection-box callback;
- focused product-UI Playwright: failed because the Selection canvas contract did
  not exist.

GREEN evidence after the repair:

| Gate                                                     | Result                                                                                                              |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Focused Atlas + renderer Jest                            | 2 suites, 13 tests passed                                                                                           |
| Native Vector Visualizer Jest                            | 13 suites, 84 tests passed                                                                                          |
| Full Vector Visualizer package Jest                      | 25 suites, 180 tests passed                                                                                         |
| Full product-UI Playwright with the live route enabled   | 9 passed                                                                                                            |
| Real RedisInsight Browser → Vector Set → Selection route | 1 passed                                                                                                            |
| Native-host Playwright                                   | 3 passed                                                                                                            |
| Scoped UI ESLint                                         | passed                                                                                                              |
| Scoped E2E ESLint                                        | passed                                                                                                              |
| UI and E2E Prettier                                      | passed                                                                                                              |
| E2E TypeScript                                           | passed                                                                                                              |
| Baseline-aware aggregate UI TypeScript                   | non-pass: 1,324 existing/baseline diagnostics; no diagnostic in the E5.R7-owned Atlas, renderer, page, or E2E paths |

The initial aggregate run found one owned styled-component `role` typing defect in
the new overlay. It was repaired and the exact rerun reduced the aggregate count
from 1,325 to 1,324 with no E5.R7-owned diagnostic.

## Browser and visual evidence

- Deterministic 1440x900: `/tmp/e5-r7-selection-reference-repair-1440x900.png`
- Deterministic 960x680: `/tmp/e5-r7-selection-reference-repair-960x680.png`
- Real RedisInsight route at 1440x900:
  `/tmp/e5-r7-selection-real-route-1440x900.png`

The deterministic fixture selects 24 of 96 coloured points. The real Vector Set
route selects 36 of 81 coloured elements. Both retain the three-pane desktop
workspace, a dominant central plot, the persistent region rectangle, and a
selected-only right inspector. Browser observers report no owned console error,
page error, failed request, same-origin HTTP error, or unexpected outbound request.

The screenshots are temporary comparison evidence. No screenshot baseline was
created or approved.

## Residual boundary

This coordinator verification is not an independent audit. E5.REAUDIT3 remains
pending and must compare the current Selection route directly with
`selection-reference.png` before the plan can regain an audited promotion claim.
