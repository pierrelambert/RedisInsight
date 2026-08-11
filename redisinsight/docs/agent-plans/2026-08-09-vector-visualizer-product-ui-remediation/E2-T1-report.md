# E2.T1 — Persistent controls report

## Status

`DONE`

## Routing

- Role: UI Designer
- Requested model: `gpt-5.6-terra`
- Requested reasoning effort: high
- Actual model: unavailable to this worker runtime
- Actual reasoning effort: unavailable to this worker runtime
- Inherited from coordinator: unknown
- Routing reason: file-disjoint, multi-file RedisInsight product-control implementation with accessibility, responsive composition, and typed integration boundaries.
- Fallback: `gpt-5.6-sol` high only after coordinator approval; not used.

## Files created

- `ui/src/pages/vector-visualizer/components/VectorVisualizerControls/VectorVisualizerControls.tsx`
- `ui/src/pages/vector-visualizer/components/VectorVisualizerControls/VectorVisualizerControls.styles.ts`
- `ui/src/pages/vector-visualizer/components/VectorVisualizerControls/VectorVisualizerControls.types.ts`
- `ui/src/pages/vector-visualizer/components/VectorVisualizerControls/VectorVisualizerControls.spec.tsx`
- `ui/src/pages/vector-visualizer/components/VectorVisualizerControls/index.ts`

## Delivered contract

- Stable desktop `aside` landmark: `data-testid="vector-visualizer-controls"` and accessible label `Vector visualizer controls`.
- Typed, presentational source/vector field, optional filter and removable chips, optional color-by field, UMAP-only projection disclosure, bounded numeric sample budget, optional cluster/outlier visibility controls, and sample/freshness summary.
- Disabled controls render their supplied useful reason. Loading is surfaced by a polite status message and native Redis UI loading states.
- Mobile composition is explicit: `VectorVisualizerControlsPanelTrigger` controls a caller-owned panel id; `VectorVisualizerControlsPanelBody` supplies the same control body to the caller-owned drawer/overlay.
- Internal RedisInsight wrappers and semantic theme tokens are used. The component does not execute Redis commands, sample, orchestrate, or expose PCA, t-SNE, or a budget beyond its typed bounds.

## 2026-08-10 review repair

- Enabled `source`, `filter`, `colorBy`, `sampleBudget`, and visibility controls now require their change callback in the TypeScript contract. The corresponding disabled branch accepts a useful `disabledReason` without requiring a fake no-op callback.
- Runtime protection independently derives the effective disabled state from callback availability, so an untyped or otherwise malformed integration cannot present an inert enabled select, input, budget, switch, or active-filter removal chip. An explicit unavailable reason wins; otherwise the control explains that its response-backed action is not connected.
- `filter.syntaxHelp` is an explicit `{ content: ReactNode }` contract. It can render text, an internal link, or a tooltip representation only when E3 has truthful source-specific help; current unsupported filtering remains disabled or omitted.
- The controls spec imports no `@redis-ui/*` package. Both-theme evidence uses the existing internal plugin `ThemeProvider` and `PluginsThemeContext`, asserting that the controls' semantic background and border tokens resolve differently in the existing light and dark RedisInsight themes.
- Callback evidence now exercises the real wrapped source/color selects, filter input and chip removal, NumericInput budget, and both SwitchInput visibility shapes. The absent-callback case verifies every corresponding DOM control is disabled and explained.

## E3 reconciliation required

- An enabled control must now supply its matching response-backed callback. To expose an unsupported control, pass `disabled: true` and its truthful reason; runtime protection also disables malformed callback-absent input without fabricating support.
- Pass the existing `sampleBudget` state with min `500`, max `20_000`, and the existing explicit sample callback. Do not create sampling work inside this component.
- Render UMAP with the existing seed `42`; do not add alternative projections.
- Existing native sampling is unfiltered (and Vector Set filtering is not applicable). Either omit `filter` or pass it disabled with the response-backed reason; do not wire an apparent filter capability. Provide `syntaxHelp` only for an actually supported, source-specific filter grammar.
- `colorBy` accepts bounded discovered metadata options. The current free-form metadata-field value is not an evidence-backed option inventory, so E3 must omit this control until it has real options or explicitly reconcile that domain contract.
- Existing cluster and outlier outputs are not generic Atlas visibility toggles. E3 must omit them or pass disabled reasons unless it wires them to already-delivered, response-backed behavior.
- Map returned sample/source counts, method, freshness, seed, and measured/unknown quality to `summary` only after the existing orchestration has them.
- Use the exported mobile trigger/body with the E3/E4 drawer focus-return implementation; this task intentionally does not own drawers or native-page layout.

## Verification

| Command                                                                                                                                                                      | Exit | Result                                                                                                                     |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | -------------------------------------------------------------------------------------------------------------------------- |
| `rtk proxy npx prettier --check redisinsight/ui/src/pages/vector-visualizer/components/VectorVisualizerControls --log-level warn`                                            | 0    | passed                                                                                                                     |
| `rtk proxy npx eslint <five owned TS/TSX files>`                                                                                                                             | 0    | passed after removing one unused import                                                                                    |
| `rtk proxy node node_modules/.bin/jest redisinsight/ui/src/pages/vector-visualizer/components/VectorVisualizerControls/VectorVisualizerControls.spec.tsx -c jest.config.cjs` | 0    | 6 passed: ready, disabled reason, loading, callback, keyboard/mobile, dark-theme render                                    |
| raw `npx tsc -p redisinsight/ui/tsconfig.json --noEmit --pretty false` filtered to `VectorVisualizerControls`                                                                | 0    | no owned-path diagnostics; raw fallback used because the RTK proxy did not preserve a usable TypeScript exit/result stream |
| `git diff --no-index --check /dev/null <each owned file>`                                                                                                                    | 0    | passed for all five component files and this report                                                                        |

### Review-repair verification

| Command                                                                                                                                                                      | Exit | Result                                                                                                                                                            |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rtk proxy node node_modules/.bin/jest redisinsight/ui/src/pages/vector-visualizer/components/VectorVisualizerControls/VectorVisualizerControls.spec.tsx -c jest.config.cjs` | 0    | 9 passed: landmark/syntax help, disabled reason, loading, all callback shapes, absent-callback protection, mobile keyboard, both-theme semantics                  |
| `rtk proxy npx eslint <the five owned controls files>`                                                                                                                       | 0    | passed                                                                                                                                                            |
| `rtk proxy npx prettier --check redisinsight/ui/src/pages/vector-visualizer/components/VectorVisualizerControls --log-level warn`                                            | 0    | passed                                                                                                                                                            |
| `rtk proxy npx tsc -p redisinsight/ui/tsconfig.json --noEmit --pretty false`                                                                                                 | 0    | no diagnostics emitted                                                                                                                                            |
| `rtk proxy npm run type-check --prefix redisinsight/ui`                                                                                                                      | 0    | baseline comparator passed; the initial sandboxed attempt was blocked by `tsx` local IPC `EPERM`, and the exact command passed with approved local IPC permission |
| `git diff --no-index --check /dev/null <each owned component file>`                                                                                                          | 1    | expected no-index difference status; no whitespace-error output                                                                                                   |

The aggregate package TypeScript/build gate remains unclaimed. The review-repair baseline comparator and raw UI TypeScript diagnostic both completed without an owned-path diagnostic.

The aggregate package TypeScript/build gate was not claimed; this task ran only the owned-path diagnostic check.

## Boundaries and blockers

- No blocker.
- No staging, commit, push, ref change, dependency change, screenshot baseline update, shared-memory write, or plan-control-file edit.
- Existing dirty paths outside this ownership directory were preserved.

## NEXT_ACTION

E3.T1 should review this API alongside E2.T2/E2.T3, connect only already-delivered native state, and own the three-pane layout and responsive drawer integration.
