# E2.T1 — Build persistent controls

Role: UI Designer  
Route: `gpt-5.6-terra`, high reasoning  
Fallback: `gpt-5.6-sol` high after coordinator approval  
Execution: Agent tool  
Commit: prohibited

Begin with: `Use $agent-delegation-routing if available to confirm role, model/reasoning, ownership, command shape, and fallback before starting.` Read repository frontend rules, Redis UI component guidance, `$redis-product-ui`, the visual contract, and reference assets.

## Ownership

Create only `redisinsight/ui/src/pages/vector-visualizer/components/VectorVisualizerControls/**` and `E2-T1-report.md`. Do not edit `VectorVisualizerPage.tsx`, package views, tests outside the new directory, specs, or tracker.

## Work

Create a typed presentational controls region with stable `vector-visualizer-controls` landmark and RedisInsight-native components for source/vector field, filter/chips, color-by, UMAP disclosure, sample budget, cluster/outlier toggles, and sample/freshness summary. Props express supported/disabled/loading state and callbacks; no Redis execution or duplicate orchestration. Include compact desktop density and keyboard labels. Mobile panel APIs are out of scope. Use theme tokens and layout primitives; no direct `@redis-ui/*`, `!important`, fixed sleep, or new dependency.

## Verification

Component tests cover ready, disabled-with-reason, loading, callback, keyboard, and both-theme semantics. Run focused Jest, scoped lint, Prettier, owned-path type diagnostic check, and `git diff --check`.

Report exact files/commands/exits and any prop contract E3 must reconcile.
