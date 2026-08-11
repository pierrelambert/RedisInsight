# E5.R1 desktop test inventory report

Date: 2026-08-10  
Status: implemented; browser verification has recorded residuals  
Role: Implementor / Test Engineer  
Requested route: `gpt-5.4` medium  
Actual route: `gpt-5.6-terra` low (cheapest sufficient available runtime)  
Commit/stage/push/ref changes: none.

## Scope and change

The active Vector Visualizer Playwright inventory is now desktop-only in the
three owned specifications. The former `390x844` cases and artifact names were
replaced by minimum Electron desktop (`960x680`) cases. Existing ready, empty,
failure, cancellation, ACL, UMAP, selection, and browser-signal coverage was
preserved. No drawers, overlays, mobile behavior, configuration, baselines, or
product source were added or changed.

The E5 native-host assertions were also narrowed to their explicit semantic
landmarks where the rendered fixture intentionally exposes duplicated accessible
content, avoiding Playwright strict-mode ambiguity without weakening coverage.

## Inventory and verification

| Gate                                                                 | Result                                                                                                                                                                                |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Playwright `--list` for E2.T3, E3.T1, E5.T1                          | PASS; active test names list the minimum desktop case and no mobile case                                                                                                              |
| Active Vector Visualizer forbidden-term scan                         | PASS; no `390x844`, `390x844`, `mobile`, `drawer`, or `overlay` match                                                                                                                 |
| Focused Prettier check                                               | PASS                                                                                                                                                                                  |
| Nested E2E TypeScript (`yarn --cwd tests/e2e-playwright type-check`) | PASS                                                                                                                                                                                  |
| Nested E2E ESLint                                                    | PASS with one pre-existing warning in `pages/vector-search/VectorSearchPage.ts`                                                                                                       |
| E2.T3 browser suite                                                  | PASS: 3/3                                                                                                                                                                             |
| E3.T1 browser suite                                                  | PASS: 3/3                                                                                                                                                                             |
| E5.T1 browser suite                                                  | Unproven in this report: the final retry did not return a completion record before worker handoff; prior retries exposed strict-locator defects that were repaired in this owned spec |
| Full nested E2E Prettier gate                                        | FAIL, pre-existing formatting findings in `e2-t2` files plus the owned files before this repair; focused owned check passes                                                           |
| `git diff --check`                                                   | PASS                                                                                                                                                                                  |

The fixture Vite builds issued only the existing chunk-size advisory. Initial
browser execution was sandbox-blocked from binding loopback and launching
Chromium; reruns with the required local browser permission produced the results
above.

## Boundaries

No files were staged, committed, pushed, or otherwise published. Existing dirty
and untracked work was preserved. The remaining E5 product-fidelity and real
route findings are outside E5.R1 ownership.

## Coordinator closure

After the native visual integration settled, the E5 native-host assertions were
updated from the removed hidden accessibility list and legacy tab names to the
persistent Results inspector plus Atlas/Neighbors/Selection seams. Fresh
Playwright then passed all 3/3 desktop cases. The active Vector Visualizer E2E
inventory contains no mobile viewport, drawer, or overlay acceptance.
