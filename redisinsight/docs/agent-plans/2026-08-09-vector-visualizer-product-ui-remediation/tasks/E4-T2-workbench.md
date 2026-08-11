# E4.T2 — Refine the Workbench plugin hierarchy

Role: UI Designer  
Route: `gpt-5.6-terra`, high reasoning  
Fallback: `gpt-5.6-sol` high after coordinator approval  
Execution: Agent tool  
Commit: prohibited

Begin with: `Use $agent-delegation-routing if available to confirm role, model/reasoning, ownership, command shape, and fallback before starting.` Read `$redis-insight-plugin`, `$redis-product-ui`, frontend/testing rules, visual contract, current plugin contract, and E4.T1 report.

## Ownership

Own `redisinsight/ui/src/packages/vector-visualizer/src/main.tsx`, `query-lab/QueryLab/**`, their focused tests/fixtures, and `E4-T2-report.md`. Do not edit native page/components, contracts/adapters, manifests/build config, feature flags, specs, tracker, or screenshot baselines.

## Work

Apply the same compact hierarchy to capability-appropriate Query Lab content: dominant evidence view, connected result inspection, clear provenance/status, responsive iframe behavior, and coherent error/empty states. Preserve activation, SDK, privacy, selection, and read-only behavior. Do not add native Atlas, sampling, or unsupported controls.

## Verification

Package Jest, plugin Vite build, focused Workbench Playwright at supported desktop sizes, light/dark, console/network, scoped lint/type/format, and `git diff --check`.

Report exact evidence and the intentional native/plugin differences.
