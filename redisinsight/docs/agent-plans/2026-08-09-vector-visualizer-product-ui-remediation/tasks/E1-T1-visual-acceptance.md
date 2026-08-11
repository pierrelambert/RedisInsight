# E1.T1 — Encode the visual acceptance harness

Role: Implementor / Test Engineer  
Route: `gpt-5.6-terra`, medium reasoning  
Fallback: same model high, then coordinator decision  
Execution: Agent tool  
Commit: prohibited

Begin with: `Use $agent-delegation-routing if available to confirm role, model/reasoning, ownership, command shape, and fallback before starting.` Read the repository testing conventions and `$playwright-test`.

## Ownership

Create and own only `tests/e2e-playwright/tests/vector-visualizer/product-ui/**`. You may read all Vector Visualizer source, specs, prior tests, and reference assets. Do not edit production code, existing tests, specs, plans, build config, or global Playwright config.

## Work

1. Add a focused config and real-route suite for the native route.
2. Add stable helper assertions for `controls`, `visualization`, and `results-inspector` landmarks.
3. At `1440x900`, assert one-row ordering, 200–280 px controls, 280–360 px results, center at least 55% of workspace, and no page-level ready-state vertical overflow.
4. Add flows for Atlas, Neighbors, and Selection with context/selection linkage.
5. Add `960x680` minimum-Electron-window checks that all three regions remain visible and keyboard-accessible, the canvas stays primary, and the page does not overflow.
6. Add light/dark and representative loading/empty/error coverage.
7. Declare screenshot assertions and baseline names, but do not approve baselines from the current layout. Use reference assets for human comparison, not as pixel snapshots of a different shell.
8. Capture console and unexpected-network failures.

The present implementation should fail only the new product-fidelity assertions. Harness startup, route navigation, and fixture setup must be valid.

## Verification

- Playwright list/config parse succeeds.
- Focused harness runs and the report classifies expected contract failures separately from harness defects.
- E2E TypeScript and scoped Prettier/ESLint pass.
- `git diff --check` passes for owned files.

## Report

Write `E1-T1-report.md` in this plan directory: status, files, exact commands/exits, expected red assertions, harness blockers, and proof boundaries. Do not edit tracker.
