# E5.R5 Neighbors Composition Report

Date: 2026-08-10
Status: DONE — independent re-audit pending

## Reopened finding

The user's live RedisInsight screenshot showed that native `Neighbors` rendered the complete Workbench Query Lab inside the center pane. That produced a large nested retrieval debugger, a second returned-results table, and a second inspector while the native right pane already provided the persistent nearest-results surface. This contradicted the preserved Neighbors reference and the three-pane visual contract.

## Repair

- Replaced the native Query Lab embedding with a focused `VectorVisualizerNeighbors` component.
- Kept the selected query item at the center, response-normalized metric rings, an explicit angle-is-layout-only statement, response score tooltips, and shared selection callbacks.
- Put the radial geometry in a centered square field so every ring remains inside the plotting surface at desktop sizes.
- Kept `VectorVisualizerResults` as the single persistent nearest-results table and inspector.
- Preserved the full Workbench Query Lab as an optional `Additional evidence workflows` surface instead of deleting or weakening it.
- Strengthened unit and browser acceptance to fail if `Retrieval debugger` or `Returned results` reappears in the native center mode.

The first independent E5.R5 audit then found one linked-selection defect: Redis returns the query item as a self result, and the radial view drew that item both at the center and as an offset point. A test-first repair now excludes the anchor ID from radial neighbors while retaining the self row in the response-backed table. The unique centered anchor is an accessible selectable control and reflects the shared selected state.

## Fresh evidence

| Gate                                              | Result                      |
| ------------------------------------------------- | --------------------------- |
| Native Vector Visualizer Jest                     | PASS — 13 suites, 84 tests  |
| New focused Neighbors and page Jest               | PASS — 2 suites, 13 tests   |
| Plugin package Jest                               | PASS — 25 suites, 178 tests |
| Native-host Playwright                            | PASS — 3/3                  |
| Product UI fixture plus live RedisInsight route   | PASS — 9/9                  |
| Focused final geometry plus live route Playwright | PASS — 2/2                  |
| Post-audit anchor-dedup native-host Playwright    | PASS — 3/3                  |
| Post-audit anchor-dedup fixture/live Playwright   | PASS — 2/2                  |
| Changed native ESLint                             | PASS                        |
| Changed E2E ESLint and TypeScript                 | PASS                        |

The refreshed real-route capture is `/tmp/e5-r5-neighbors-real-route-1440x900.png`. It shows one compact Neighbors header, one contained radial plot, the single right-side nearest-results inspector, no nested Query Lab chrome, no duplicate table, and no duplicate inspector.

## Boundaries

- Semantic point colors remain response-backed. The live `vv:knowledge` nearest results currently resolve to the same selected `category`, so the ten neighbor points legitimately share one category color; the implementation does not fabricate category differences to imitate the reference dataset.
- No screenshot baseline is approved.
- The working tree remains unstaged and uncommitted.
- The prior independent audit predates this correction. A fresh independent re-audit remains required before promotion.
