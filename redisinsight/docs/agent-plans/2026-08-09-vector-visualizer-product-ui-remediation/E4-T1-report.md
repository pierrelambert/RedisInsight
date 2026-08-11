# E4.T1 — desktop responsive/theme/state closure report

## Scope correction

The original E4 task described a 390x844 mobile drawer contract. During
execution, the product constraint was corrected: RedisInsight desktop declares
`minWidth: 960` and `minHeight: 680` in `redisinsight/desktop/config.json`.
There is no mobile-screen target for this desktop product surface.

Accordingly, the temporary E4 mobile drawer/overlay implementation and its
focus/ID logic were removed. This report makes no mobile claim. The updated
E1 fixture gate proves the supported desktop minimum instead.

## Delivered changes

- Preserved the accepted E3 token-derived desktop three-pane grid through the
  supported 960px minimum. The fixed side tracks keep the complete Controls
  and Results regions visible while leaving the center primary. Reduced-motion
  explicitly keeps workspace scrolling non-animated.
- Removed dead mobile-only Controls panel trigger/body APIs, exports, styles,
  and tests after `rg` confirmed no non-mobile consumer.
- Removed the Results `mobilePanel` prop, close action, test seam, and test
  after the same consumer check.
- Removed the now-stale `ResultsInspectorMobilePanel` type re-export from the
  Results barrel; it no longer names a deleted mobile-only type.
- Kept the narrowly transferred Canvas state taxonomy and optional `stateSlot`:
  loading, empty, unsupported, ACL-unavailable, cancelled, and recoverable
  error reserve the primary canvas region instead of exposing stale Atlas
  content. The page supplies the truthful native status copy to that slot.
- Replaced the obsolete 390x844 E1 check with a green desktop-responsive
  contract at 1100x768 and 960x680: all three regions visible, center wider
  than each side region, no ready-page document overflow, and ArrowRight tab
  keyboard navigation/focus.
- Retained dark-theme and loading/empty/error browser checks. No screenshot
  baseline was created, updated, or approved.

## TDD evidence

| Phase | Command                                                                                                                                                                             | Result                                                                                                                                                                                                      |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RED   | `tests/e2e-playwright/node_modules/.bin/playwright test --config tests/e2e-playwright/tests/vector-visualizer/product-ui/e1-t1.product-ui.playwright.config.ts --grep 'REQ-VV-014'` | Exit 1: the superseded 390x844 drawer assertion failed after the drawer code was removed.                                                                                                                   |
| GREEN | same command after replacing REQ-VV-014 with desktop gates                                                                                                                          | Exit 0: 1 passed (8.8s), at 1100x768 and 960x680. The 960px assertion confirms the center is wider than both side regions; reduced motion has an observable computed transition duration of at most 0.001s. |

The local preview listener created by Playwright exited with each test run; no
listener or browser session is left running.

## Verification

| Command                                                                                                                                                                                                                                | Result                                                                                                                                                                                                                                                                                                                                                                                                                             |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `node node_modules/.bin/jest --runTestsByPath ...VectorVisualizerPage.spec.tsx ...Workspace.spec.tsx ...Controls.spec.tsx ...Canvas.spec.tsx ...Results.spec.tsx ...SelectionTable.spec.tsx -c jest.config.cjs --runInBand --no-cache` | Exit 0: 6 suites, 49 tests.                                                                                                                                                                                                                                                                                                                                                                                                        |
| `tests/e2e-playwright/node_modules/.bin/playwright test --config tests/e2e-playwright/tests/vector-visualizer/product-ui/e1-t1.product-ui.playwright.config.ts --grep 'REQ-VV-012\|REQ-VV-013\|REQ-VV-014\|REQ-VV-015'`                | Exit 0: 7 passed (13.8s): 1440x900 desktop geometry/modes, 1100x768 and 960x680 desktop reachability, dark theme, reduced motion, keyboard tabs, and loading/empty/error. The dedicated final REQ-VV-014 rerun passed in 8.8s with the 960px center-primary and computed reduced-motion assertions. The fixture observer asserted no page errors, unexpected outbound requests, failed requests, or same-origin 4xx/5xx responses. |
| `./node_modules/.bin/eslint --no-ignore tests/vector-visualizer/product-ui/e1-t1.product-ui.playwright.spec.ts && ./node_modules/.bin/prettier --check ... && ./node_modules/.bin/tsc --noEmit` from `tests/e2e-playwright`            | Exit 0.                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `npx eslint ...owned native files... --no-ignore`                                                                                                                                                                                      | Exit 0.                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `npx prettier --check ...owned native files...`                                                                                                                                                                                        | Exit 0.                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `node node_modules/.bin/tsc --project redisinsight/ui/tsconfig.json --listFilesOnly \| rg '/pages/vector-visualizer/components/VectorVisualizerResults/index\\.ts$'`                                                                   | Exit 0: the Results barrel is included in the configured UI TypeScript program.                                                                                                                                                                                                                                                                                                                                                    |
| `node node_modules/.bin/tsc --noEmit --pretty false --project redisinsight/ui/tsconfig.json 2>&1 \| rg '.../VectorVisualizerResults/(index\|VectorVisualizerResults\|VectorVisualizerResults\\.types)\\.ts'`                           | No location-matched Results barrel/component diagnostic output. This is a scoped diagnostic query, not aggregate type-check success.                                                                                                                                                                                                                                                                                               |
| `git diff --check`                                                                                                                                                                                                                     | Exit 0.                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `npm run type-check --prefix redisinsight/ui`                                                                                                                                                                                          | Sandboxed attempt blocked by the known `tsx` IPC `listen EPERM` boundary. Elevated retry emitted no diagnostics in the available transport, but no terminal comparator result was exposed; aggregate UI type-check success is not claimed.                                                                                                                                                                                         |

## Boundaries and residual risk

- No real RedisInsight route, Electron window, live Redis source, or deployment
  environment was supplied for this task. The fixture is a bounded local proof;
  real-route/Electron/live-Redis proof remains E5 work.
- The aggregate UI type-check remains an explicit environment/baseline boundary,
  not a green gate for this task.
- The Vite fixture build printed a chunk-size advisory; it did not appear as a
  browser console/page/network failure and was not changed in this scope.
- Existing untracked local Playwright artifacts were preserved. None is an
  approved visual baseline.

## Post-review minimum-desktop clipping repair

The fresh E4 review found two P1 defects at the supported 960x680 desktop
minimum: the compact workspace override created 152px/216px side tracks while
the Results inspector required 280px, and the full-height Controls content was
clipped by its overflow-hidden grid region.

The repair removes that compact-track override, retaining the accepted
token-derived desktop tracks (approximately 216px controls and 296px results)
at 960px and 1100px. The Controls region is a bounded flex region and the
Controls root consumes that available block size with `min-block-size: 0` and
its existing internal `overflow: auto` scrollport. No mobile behavior,
positioning exception, public contract, or state semantics changed.

### Red/green acceptance evidence

| Phase | Command                                                                                                                                                        | Result                                                                                                                                                                                                                                                                                                                                                          |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RED   | `tests/e2e-playwright/node_modules/.bin/playwright test --config tests/vector-visualizer/product-ui/e1-t1.product-ui.playwright.config.ts --grep 'REQ-VV-014'` | Exit 1 before the style repair. The new containment assertion found the Controls bottom at `958.875px`, beyond the workspace bottom at `640.40625px`; it detects the reviewer-reported clipped-control defect. The same test now also guards Results containment and `scrollWidth <= clientWidth`.                                                              |
| GREEN | same direct package-local command after the repair                                                                                                             | Exit 0: 1 passed (8.7s). At 960x680 every landmark is contained in the workspace, Results has no horizontal overflow, Controls has a nonzero internal scroll range, the lower Sample budget control can be scrolled then focused visibly, the center remains wider than both side panes, the document does not overflow, and reduced-motion remains observable. |

### Repair verification

| Command                                                   | Result                                                                                                                                                                     |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Focused Workspace/Controls/Results Jest                   | Exit 0: 3 suites, 20 tests passed.                                                                                                                                         |
| Full local E1 fixture (`REQ-VV-012` through `REQ-VV-015`) | Exit 0: 7 passed (13.4s), retaining 1440x900 desktop geometry/modes, dark theme, truthful loading/empty/error states, keyboard tabs, and clean console/page/network gates. |
| E1 `REQ-VV-014` final bounded retry                       | Exit 0: 1 passed (8.7s).                                                                                                                                                   |
| Scoped native ESLint and Prettier                         | Exit 0.                                                                                                                                                                    |
| E2E ESLint, Prettier, and nested E2E TypeScript           | Exit 0.                                                                                                                                                                    |
| Owned native TypeScript diagnostic query                  | No location-matched Workspace/Controls/Results diagnostic output; this is not an aggregate UI type-check claim.                                                            |
| `git diff --check`; staged index                          | Exit 0; the index is empty.                                                                                                                                                |
| No-mobile/no-baseline scan                                | Zero matches in owned native components and the E1 spec.                                                                                                                   |

Current non-baseline 960x680 screenshot evidence was captured at
`/tmp/e4-t1-960x680-current.png` after sampling. It was manually reviewed only;
it is not a screenshot baseline and was not added to the repository. The
isolated preview listener on port 4197 was stopped after capture; the earlier
test-owned port-4196 orphan was also stopped before the single final retry.

Fresh independent E4 review is requested for the repaired minimum-desktop
geometry and scrollport behavior.
