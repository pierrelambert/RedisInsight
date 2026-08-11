# E4.T1 — Desktop-window, theme, state, and accessibility closure

Role: UI Designer  
Route: `gpt-5.6-terra`, high reasoning  
Fallback: `gpt-5.6-sol` high after coordinator approval  
Execution: Agent tool  
Commit: prohibited

Begin with: `Use $agent-delegation-routing if available to confirm role, model/reasoning, ownership, command shape, and fallback before starting.` Read `$redis-product-ui`, `$playwright-test`, frontend/testing rules, visual contract, and E3 report.

## Ownership

Own native workspace component styles/tests, `VectorVisualizerPage.tsx` only for supported desktop-window/state wiring, and E1 product-UI tests only to complete minimum-window/theme/state assertions. Do not edit domain/adapters/backend/feature flags/routes/Workbench or approve screenshots.

## Work

Implement progressive desktop compaction through RedisInsight's configured `960x680` minimum Electron window; keep controls, canvas, and results visible and keyboard-accessible; preserve the canvas as primary; provide light/dark parity, reduced motion, and coherent loading/empty/unsupported/ACL/cancel/error states. Do not add mobile drawers, overlays, or mobile-specific navigation.

## Verification

Focused component/native Jest; Playwright at `1440x900`, an intermediate desktop width, and `960x680`; keyboard, light/dark, console/network, scoped lint/type/format, and `git diff --check` checks.

Write `E4-T1-report.md` with exact evidence and remaining Workbench-only gaps.
