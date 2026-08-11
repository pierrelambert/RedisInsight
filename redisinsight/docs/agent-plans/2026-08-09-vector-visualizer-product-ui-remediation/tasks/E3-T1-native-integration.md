# E3.T1 — Integrate the native three-pane workspace

Role: Integrator  
Route: `gpt-5.6-terra`, high reasoning  
Fallback: `gpt-5.6-sol` high after coordinator approval  
Execution: Agent tool, exclusive native-page ownership  
Commit: prohibited

Begin with: `Use $agent-delegation-routing if available to confirm role, model/reasoning, ownership, command shape, and fallback before starting.` Read the visual/product/technical specs, E1 report, all E2 reports, current native orchestration, and existing focused tests.

## Ownership

Own `redisinsight/ui/src/pages/vector-visualizer/VectorVisualizerPage.tsx`, its spec, new `components/VectorVisualizerWorkspace/**`, and the smallest necessary existing Atlas/QueryLab/Selection presentation files. Do not edit adapters, contracts, native execution/orchestration modules, backend, feature flags, routes, Workbench `main.tsx`, E2E acceptance files, specs, plans, or screenshot baselines.

## Work

1. Wire E2 components to the existing state/orchestration without changing Redis semantics.
2. Implement one viewport-filling desktop grid with stable workspace/control/visualization/results landmarks.
3. Preserve header, truth banner, source actions, progress/cancel, evidence, privacy, and all non-ready states.
4. Present Atlas, Neighbors, and Selection as connected center modes; preserve compatible source/filter/color/selection context.
5. Keep the linked result inspector persistent and context-sensitive on desktop.
6. Remove the vertical component-showcase composition from the primary flow; retain Health, Compare/Tune, and Advanced as subordinate workflows without deleting capability access.
7. Make E1 desktop geometry, overflow, mode, console, and network assertions green. Do not update screenshots.

## Verification

Run focused native/page/package Jest, scoped lint/Prettier, owned-path TypeScript classification, plugin tests if package files changed, E1 focused desktop Playwright, and `git diff --check`. Aggregate failures must be classified, never claimed green if not.

Write `E3-T1-report.md` with exact commands/exits, before/after screenshots, owned files, semantics preserved, residual responsive gaps, and blockers.
