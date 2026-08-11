# E4.T1 Repair Independent Review — desktop minimum-window closure

STATUS: DONE

SPEC_COMPLIANCE: APPROVED

CODE_QUALITY: APPROVED_WITH_BOUNDARIES

VISUAL_FIDELITY: APPROVED_WITH_BOUNDARIES

VERDICT: APPROVED

CONFIDENCE: High

## Scope and routing

ROLE: Fresh independent Reviewer / Auditor

REQUESTED_MODEL: `gpt-5.6-terra`

REQUESTED_REASONING: high

ACTUAL_MODEL: `gpt-5.6-terra`

ACTUAL_REASONING: high

INHERITED_FROM_COORDINATOR: no

ROUTING: A fresh high-reasoning review was appropriate because the preceding
failure was a spatial and keyboard-accessibility defect at the product's
minimum Electron window. The review used source inspection, focused Jest,
independent Playwright, and a separate local Chromium geometry/scrollport
inspection. Raw local commands were the fallback when the sandbox disallowed a
loopback listener.

OWNERSHIP: This reviewer wrote only this report. No source, tests, specs, plan
controls, tracker, ledger, decisions, baseline, staged content, commit, ref, or
remote state was changed.

## Corrected desktop contract

The current user correction is authoritative: RedisInsight is an Electron
desktop application, not a mobile surface. `redisinsight/desktop/config.json`
sets `mainWindow.minWidth` to `960` and `mainWindow.minHeight` to `680`.
The normative visual contract and REQ-VV-014 therefore require the three
desktop regions to remain visible and keyboard-accessible at that window;
mobile drawers, overlays, and mobile navigation are explicitly excluded.

The current native/E1 scope has no mobile implementation or 390x844 acceptance
case. The one remaining `handleDrawerDidClose` string is an unrelated existing
Vector Set fixture callback in `e2-t2-fixture/mocks/vectorSetChildren.mock.tsx`;
it is not E4-owned UI or an E1 acceptance path. No `toHaveScreenshot` or
`data-approved-baseline` usage remains in the native/E1 scope. Existing
untracked image artifacts were preserved and are not approved baselines.

## Closure of the previous P1 findings

### All three desktop regions are contained at 960x680

`VectorVisualizerWorkspace.styles.ts:3-20` uses the accepted
token-derived desktop grid: approximately 216px Controls,
`minmax(0, 1fr)` visualization, and approximately 296px Results. The invalid
compact 152px/216px side-track override is gone. Both side regions are bounded
flex grid children with `min-block-size: 0`, and the workspace clips no
overflowing child because every region now fits its own grid track.

A fresh Chromium inspection of the local E1 configuration at `960x680` after
sampling measured the following CSS-pixel bounds:

| Landmark      | Bounds                                                   | Scroll proof                       |
| ------------- | -------------------------------------------------------- | ---------------------------------- |
| Workspace     | x=12, y=146.781, 936x493.625, right=948, bottom=640.406  | scrollWidth=936, scrollHeight=494  |
| Controls      | x=12, y=146.781, 216x493.625, right=228, bottom=640.406  | clientHeight=494, scrollHeight=709 |
| Visualization | x=228, y=146.781, 424x493.625, right=652, bottom=640.406 | wider than either side pane        |
| Results       | x=652, y=146.781, 296x493.625, right=948, bottom=640.406 | clientWidth=scrollWidth=295        |

Thus every landmark is fully inside the workspace and the viewport; Results has
no horizontal clipping, and the canvas remains wider than both persistent side
panes. The document has no horizontal or vertical overflow.

### Controls is a usable bounded scrollport

`VectorVisualizerControls.styles.ts:5-14` makes the real Controls landmark a
flex child with `min-block-size: 0` and `overflow: auto`, while
`ControlsRegion` is bounded in `VectorVisualizerWorkspace.styles.ts:28-34`.
The live minimum-window measurement found a 215px internal scroll range.
After scrolling to its lower extent, the Sample budget spinbutton was focused
at x=35, y=435.141, right=206, bottom=469.141; it was still fully inside the
workspace and was the active element. This proves the formerly clipped lower
control is reachable and visibly focusable rather than merely present in the
DOM.

The E1 REQ-VV-014 test now independently asserts full workspace containment,
no Results horizontal overflow, nonzero Controls scroll range, focused
lower-control containment, center priority, no document overflow,
reduced-motion behavior, and keyboard ArrowRight tab activation
(`e1-t1.product-ui.playwright.spec.ts:245-310`).

## Preserved behavior and visual review

- The fresh E1 desktop test remains green at 1100x768 and 960x680, while
  REQ-VV-012 retains the 1440x900 one-row geometry and REQ-VV-013 retains the
  linked Atlas, Neighbors, and Selection mode flow.
- A fresh dark Atlas plus loading-state pass is green. Canvas state slots retain
  truthful loading, empty, unsupported, ACL-unavailable, cancelled, and
  recoverable-error behavior in the same workspace; no stale Atlas is exposed
  in a non-ready state.
- The non-baseline `/tmp/e4-t1-960x680-rereview.png` was manually reviewed.
  At the supported desktop minimum it shows a compact three-pane operator
  workspace, readable compact two-column inspector, visible focusable sample
  control after scroll, and a still-primary center visualization. It was not
  copied to the repository or approved as a baseline.
- The local browser had no page errors or failed requests. Its only warnings
  were Chromium WebGL GPU ReadPixels performance warnings, not application
  console errors or failed network signals.

## Fresh verification

| Check                                                                                   | Result                                                                                                                                                                                            |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Focused native/package Jest: Page, Workspace, Controls, Canvas, Results, SelectionTable | Exit 0: 6 suites, 49 tests passed.                                                                                                                                                                |
| E1 Playwright `--list`                                                                  | Exit 0: 8 tests: seven fixture cases and one environment-gated real route; no mobile viewport case.                                                                                               |
| E1 Playwright `--grep 'REQ-VV-014'`                                                     | Exit 0: 1 passed (8.9s). The first sandboxed run correctly failed only because loopback `127.0.0.1:4196` is disallowed there; the approved local retry ran the fixture.                           |
| E1 Playwright `--grep 'dark-theme\|loading state'`                                      | Exit 0: 2 passed (7.7s), including browser-console/network observer gates.                                                                                                                        |
| Separate local Chromium 960x680 inspection                                              | All three regions contained; controls scroll/focus, Results width, document overflow, console and failed-request metrics recorded above. Browser closed and its exact port-4197 listener stopped. |
| Scoped native ESLint and Prettier                                                       | Exit 0.                                                                                                                                                                                           |
| E2E ESLint, Prettier, and nested E2E `tsc --noEmit`                                     | Exit 0.                                                                                                                                                                                           |
| Owned native TypeScript diagnostic query                                                | No diagnostics matched Page/Workspace/Controls/Results paths. This is scoped evidence, not an aggregate UI type-check claim.                                                                      |
| No-mobile/no-baseline scan                                                              | No mobile acceptance or implementation, `toHaveScreenshot`, or `data-approved-baseline` match in owned native/E1 scope; only the unrelated fixture callback noted above.                          |
| `git diff --check`; staged-index check                                                  | Exit 0; index is empty.                                                                                                                                                                           |
| Listener check                                                                          | No process remained listening on ports 4196 or 4197.                                                                                                                                              |

## Findings

P0: None.

P1: None.

P2: None.

## Residual boundaries

- This is a strong fixture-level desktop proof, not the final real RedisInsight
  route, Electron-window, live Redis, or deployment proof. Those boundaries
  remain E5 work.
- No screenshot baseline has been created, updated, or approved; E5 still owns
  deliberate reference comparisons and baseline approval.
- The aggregate UI TypeScript gate remains the previously recorded
  environment/baseline non-pass; focused component, E2E TypeScript, and
  path-specific diagnostic evidence do not supersede it.
- Vite emits an existing chunk-size advisory during fixture builds. It is not a
  browser error or failed request and was not changed in this scope.

The two previous P1 desktop-minimum defects are closed with fresh source,
automated, numeric, keyboard, and manual visual evidence. E4.T2 may proceed
serially under its capability-reduced Workbench contract.
