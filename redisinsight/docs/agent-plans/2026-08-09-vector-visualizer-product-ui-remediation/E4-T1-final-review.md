# E4.T1 Final Independent Review — desktop-window, theme, state, and accessibility closure

STATUS: DONE_WITH_FINDINGS

SPEC_COMPLIANCE: NOT APPROVED

CODE_QUALITY: APPROVED_WITH_BOUNDARIES

VISUAL_FIDELITY: NOT APPROVED

VERDICT: NOT APPROVED

CONFIDENCE: High

## Scope and routing

ROLE: Fresh independent Reviewer / Auditor

REQUESTED_MODEL: `gpt-5.6-terra`

REQUESTED_REASONING: high

ACTUAL_MODEL: `gpt-5.6-terra`

ACTUAL_REASONING: high

INHERITED_FROM_COORDINATOR: no

ROUTING: A fresh high-reasoning desktop UX review is warranted because this is
the final gate before Workbench refinement and the correctness condition is
spatial/interactive, not just typed source. Read-only source inspection plus
focused Jest and local Playwright browser checks were used; raw local commands
were the fallback when the sandbox prevented a fixture listener.

OWNERSHIP: This reviewer wrote only this report. No source, tests, trackers,
ledger, decisions, baselines, staged content, commits, refs, or remote state
were changed.

## Corrected contract

The current user correction is authoritative: RedisInsight is an Electron
desktop app, not a mobile surface. `redisinsight/desktop/config.json` declares
`minWidth: 960` and `minHeight: 680`. The current visual contract and change
delta correctly require all three desktop regions to remain visible and
keyboard-accessible at that minimum, explicitly excluding mobile drawers,
overlays, and mobile navigation.

The native page and E1 product-ui harness contain no mobile-specific drawer or
overlay implementation and no 390x844 acceptance. One unrelated existing
Vector Set fixture mock still contains the generic callback name
`handleDrawerDidClose`; it is neither E4-owned mobile UI nor an E1 acceptance
path. Existing untracked historical 390px image artifacts were preserved and
were not used as evidence or baselines.

## Fresh evidence

| Check                                                                                                                                                                                                                                  | Result                                                                                                                                                                                                                                  |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `node node_modules/.bin/jest --runTestsByPath ...VectorVisualizerPage.spec.tsx ...Workspace.spec.tsx ...Controls.spec.tsx ...Canvas.spec.tsx ...Results.spec.tsx ...SelectionTable.spec.tsx -c jest.config.cjs --runInBand --no-cache` | Exit 0: 6 suites, 49 tests passed. The Canvas unit suite covers empty, unsupported, ACL-unavailable, cancelled, and recoverable-error state slots without exposing Atlas content.                                                       |
| `tests/e2e-playwright/node_modules/.bin/playwright test --config ...e1-t1.product-ui.playwright.config.ts --list`                                                                                                                      | Exit 0: 8 tests listed: seven local fixture cases plus one environment-gated real-route case. No mobile viewport case is listed.                                                                                                        |
| Same Playwright command, `--grep 'REQ-VV-014'`                                                                                                                                                                                         | Exit 0: one test passed in 8.8s. It checked 1100x768 and 960x680, but its assertions are insufficient as described in P1.                                                                                                               |
| Same Playwright command, `--grep 'dark-theme                                                                                                                                                                                           | loading state'`                                                                                                                                                                                                                         | Exit 0: two tests passed in 9.0s. The test observer asserts zero page errors, unexpected outbound requests, failed requests, and same-origin 4xx/5xx responses. |
| Manual local fixture review, `1440x900` after sampling                                                                                                                                                                                 | Current non-baseline screenshot and accessibility snapshot show the three-pane Atlas, controls, persistent inspector, truthful projection copy, and no console messages or network failures. Screenshot was not approved as a baseline. |
| Manual local fixture review, `960x680` after sampling                                                                                                                                                                                  | Failed the corrected acceptance contract: current bounds/overflow are recorded in P1. `document.documentElement` itself has no overflow only because the workspace clips child content.                                                 |
| Scoped native ESLint and Prettier                                                                                                                                                                                                      | Exit 0 for the E4 native page/workspace/controls/canvas/results source and tests.                                                                                                                                                       |
| E2E ESLint, Prettier, and nested E2E TypeScript (`tests/e2e-playwright/node_modules/.bin/tsc --noEmit`)                                                                                                                                | Exit 0. The root TypeScript 4.9 binary is not the E2E project's compiler and fails parsing the newer Faker declarations; it is not meaningful E2E type evidence.                                                                        |
| Direct-import, no-mobile, no-baseline source scans                                                                                                                                                                                     | No direct `@redis-ui/*` imports, no `toHaveScreenshot`, no `data-approved-baseline`, no E4/E1 mobile drawer/overlay or 390x844 contract.                                                                                                |
| `git diff --check`; staged-index check                                                                                                                                                                                                 | Exit 0; index is empty.                                                                                                                                                                                                                 |

The temporary review browser was closed and the exact local Vite listener on
`127.0.0.1:4198` was stopped after inspection.

## Findings

### P1 — Results inspector is clipped at the configured 960px desktop minimum

At `960x680`, the current workspace has a 936px content width. Its compact
results grid track is 216px (`VectorVisualizerWorkspace.styles.ts:22-32`), but
the inspector has a 280px minimum inline size
(`VectorVisualizerResults.styles.ts:5-11`). `ResultsRegion` hides overflow
(`VectorVisualizerWorkspace.styles.ts:55-60`). Fresh browser geometry was:

- results region: x=732, width=216, right=948, `scrollWidth=280`;
- results inspector: x=732, width=280, right=1012;
- workspace: x=12, width=936, right=948.

Therefore the inspector's final 64px is rendered outside the workspace and
clipped. The 960px screenshot visibly truncates the result table rather than
presenting a complete persistent inspector. This violates REQ-VV-014 and the
visual contract's requirement that all three regions remain visible and
keyboard-accessible at the configured Electron minimum.

The green E1 test does not prove this requirement: it uses `toBeVisible()` and
only compares widths (`e1-t1.product-ui.playwright.spec.ts:249-259`). It must
assert that each landmark's full bounding box is within the viewport/workspace
and that no region is horizontally clipped at 960px.

### P1 — Controls content is clipped rather than made scrollable within the visible 960px pane

At the same minimum viewport, the controls grid region is x=12, width=152,
height=494, ending at y=640, but the controls element is 812px tall and ends
at y=959. `ControlsRegion` hides overflow
(`VectorVisualizerWorkspace.styles.ts:41-46`), so the `overflow: auto` on the
child controls element (`VectorVisualizerControls.styles.ts:5-8`) cannot create
a usable scrollport: its `clientHeight` equals its full 812px content height,
while its parent clips the lower 318px. Optional lower control groups can
therefore be visually and keyboard inaccessible. This is the same REQ-VV-014
failure, independently affecting the persistent control region.

The repair should give each compact side region a bounded height and its own
scrollport (or otherwise deliberately compact the control content), remove the
inspector min-width/track contradiction, and add geometry plus keyboard-focus
assertions that detect both clipped edges and clipped focused controls at
960x680.

P0: None.

P2: None.

## Preserved E3 behavior

The source continues to preserve the accepted E3 linked-mode seams: inactive
canvas panels are hidden, Neighbors uses response-backed rows after its query,
the compact inspector uses the two-column SelectionTable variant, and the
desktop 1440px fixture visibly retains the three-pane hierarchy. This review
does not identify a regression in those bounded behaviors.

## Residual boundaries

- No screenshot baseline was created, updated, or approved. Current fixture
  screenshots are rendering evidence only.
- The full RedisInsight route, real Electron window, live Redis source, and
  deployment are still environment-gated and remain E5 evidence, not proof
  from this review.
- The repository's aggregate UI TypeScript gate remains the recorded
  environment/baseline non-pass; scoped E2E TypeScript and native focused tests
  are green but do not supersede it.
- Do not start E4.T2 until the two P1 minimum-desktop clipping defects receive
  a bounded repair and a new fresh E4.T1 review returns zero P0/P1.
