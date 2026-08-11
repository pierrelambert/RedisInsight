# E5.R10 — Native workspace cleanup plan

Date: 2026-08-10  
Execution: start-now  
Autonomy: autonomous  
Commit policy: prohibited

## Source of truth

- Newest user review: mode tabs must sit under `Sample vectors`; debug `<details>` blocks must not appear in the chart flow; Search filter must be reachable; Query Lab must not look blank; selected document details/actions must be useful.
- Visual contract: `redisinsight/docs/specs/2026-08-09-redis-vector-visualizer-visual-contract.md`
- Active tracker and ledger in this plan directory.

## Non-goals

- No commit, push, PR, deployment, dependency, CI, backend/public API, Electron packaging, or screenshot baseline update.
- No mobile layout.
- No native Query Lab parity expansion beyond explicit guidance.

## Routing

The native page is the shared integration hotspot, so implementation runs directly in the coordinator. A fresh verifier is delegated after implementation.

| Packet        | Status | Owner                    | Allowed files                                                                                     | Verification                                       |
| ------------- | ------ | ------------------------ | ------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| E5.R10.INT    | done   | coordinator / Integrator | native page, native orchestration, Canvas/Results/SelectionInspector components and focused specs | focused Jest, scoped lint/format, owned tsc filter |
| E5.R10.VERIFY | done   | fresh verifier           | report only                                                                                       | READY; no P0/P1/P2                                 |

## Acceptance

- `Atlas / Neighbors / Selection` tabs render under the top action row, not inside the chart body.
- Atlas chart flow no longer exposes raw provenance/accessibility ID dumps or metadata debug forms.
- Search-index Filter is editable, chips are visible, and the filter is applied on the next explicit sample; dirty filter state asks for resample.
- Vector Set Filter remains disabled with a source-specific reason.
- Query Lab additional workflow has an explicit empty guidance state.
- Selected document detail lives in the right inspector with metadata/evidence and useful actions.

## Implementation proof

- Native mode tabs render in `vector-visualizer-mode-header`, directly under the top action row; the Canvas receives `showModeChrome={false}` to avoid duplicate in-chart tabs.
- Native Atlas suppresses the raw `Atlas evidence and accessible point selection` `<details>` block via `showEvidenceDetails={false}` while keeping the package default for non-native/plugin consumers.
- Search Filter is editable for Search-index sources, displays a chip, records dirty state when changed after sampling, and `orchestrateNativeSample` carries the filter into the sampled `FT.SEARCH` plan. Vector Set Filter remains disabled with a source-specific reason.
- Query Lab now renders explicit guidance before sample/selection/query instead of a blank additional workflow.
- Right inspector now exposes selected metadata plus `Run neighbors`, `Copy ID`, and `Export row` actions.
- Focused native Jest: `VectorVisualizerPage`, `nativeOrchestration`, `VectorVisualizerCanvas`, `VectorVisualizerResults` passed 4 suites / 53 tests.
- Focused package Jest: `Atlas`, `SelectionInspector`, `HealthExplorers` passed 3 suites / 18 tests.
- Vector Search menu hook Jest passed 1 suite / 22 tests, including `Vector Visualizer` label and icon.
- Scoped ESLint passed on all E5.R10 touched source/spec files.
- `npm run type-check --prefix redisinsight/ui` remains an aggregate non-pass due the known baseline boundary: elevated run reported `Remaining errors: 0`, then failed because `.tscheck.rec.json` is outdated. Baseline regeneration is outside scope.
