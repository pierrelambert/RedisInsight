# E5.R9 — Product Interaction Remediation

Date: 2026-08-10  
Execution: start-now  
Autonomy: autonomous within packet contracts  
Commit policy: prohibited

## Active residual

The live RedisInsight route still exposes product-quality gaps after E5.R8:

- the Vector Search row submenu can render a large blank/icon area instead of a compact `Vector Visualizer` action;
- changing `Color by` after sampling must recolor the current Atlas immediately and must not imply that `Sample vectors` has to run again;
- cluster labels must be configurable instead of hard-limited to 12 categories;
- Neighbors must display user-facing cosine similarity as `1 - cosine distance` while preserving raw distance/provenance;
- Health must be readable as severity-colored metric tiles instead of an X-ray text list;
- Selection must expose useful selected-set actions.

## Source of truth

- User screenshots and request on 2026-08-10.
- `redisinsight/docs/specs/2026-08-09-redis-vector-visualizer-visual-contract.md`.
- Existing native implementation under `redisinsight/ui/src/pages/vector-visualizer/`.
- Existing plugin components under `redisinsight/ui/src/packages/vector-visualizer/src/`.

## Non-goals

- No backend/public API changes.
- No new Redis commands beyond the existing bounded read-only sample/query flows.
- No PCA/t-SNE or sample sizes above 20,000.
- No mobile-specific behavior; RedisInsight desktop minimum remains 960x680.
- No dependency, CI, lockfile, branch-ref, commit, push, PR, deployment, or screenshot-baseline changes.

## Packet index

| Packet       | Status   | Depends On  | Owner              | Allowed Files                                                                                  | Forbidden Files                                                                                                | Verify                                                                         |
| ------------ | -------- | ----------- | ------------------ | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| E5.R9.S0     | done     | none        | coordinator direct | `ActionsCell.tsx`, `ActionsCell.spec.tsx`, existing vector-search action tests/locales         | backend, visualizer page                                                                                       | focused ActionsCell/ListContent/useListContent Jest; lint/prettier             |
| E5.R9.C1     | planning | none        | UI Implementor     | `VectorVisualizerControls/**` only                                                             | `VectorVisualizerPage.tsx`, `HealthExplorers/**`, `VectorVisualizerNeighbors/**`, `VectorVisualizerResults/**` | focused Controls Jest; scoped lint/prettier                                    |
| E5.R9.N1     | planning | none        | UI Implementor     | `VectorVisualizerNeighbors/**` only                                                            | `VectorVisualizerPage.tsx`, controls, results, health                                                          | focused Neighbors Jest; scoped lint/prettier                                   |
| E5.R9.H1     | planning | none        | UI Implementor     | `redisinsight/ui/src/packages/vector-visualizer/src/health/HealthExplorers/**` only            | native page, controls, results, neighbors                                                                      | focused HealthExplorers Jest; package scoped lint/prettier                     |
| E5.R9.R1     | planning | none        | UI Implementor     | `VectorVisualizerResults/**`, `SelectionInspector/**`, `SelectionTable/**` only                | `VectorVisualizerPage.tsx`, controls, neighbors, health                                                        | focused Results/Selection Jest; scoped lint/prettier                           |
| E5.R9.INT    | blocked  | C1,N1,H1,R1 | Integrator         | `VectorVisualizerPage.tsx`, `VectorVisualizerPage.spec.tsx`, E5 product-ui fixtures/specs only | backend/public API, CI/build/deps, Workbench plugin source unless needed by tests                              | native Jest, product UI Playwright/live route, scoped lint/prettier/type-query |
| E5.R9.VERIFY | blocked  | INT         | Fresh verifier     | report only                                                                                    | source files                                                                                                   | independent checks, current screenshot/live route verdict                      |

## Packet contracts

Every worker prompt must begin:

> Use $agent-delegation-routing if available to confirm role, model/reasoning, ownership, command shape, and fallback before starting.

Worker output contract:

```text
STATUS: DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED
ROLE:
REQUESTED_MODEL:
REQUESTED_REASONING:
ACTUAL_MODEL: unknown if not exposed
ACTUAL_REASONING: unknown if not exposed
FILES_CHANGED:
VERIFICATION_RUN:
VERIFICATION_RESULT:
BLOCKERS:
BLOCKER_DISPOSITION:
ASSUMPTIONS:
NEXT_ACTION:
Commit allowed: no
```

## Routing

- C1, N1, H1, R1: Codex implementor, cheapest available explicit model if dispatch supports it; otherwise inherited model is rejected only if a lower-cost CLI worker is available. Reasoning: medium. These are bounded component repairs with focused tests.
- INT: Codex integrator, high reasoning. Shared native page state crosses controls, chart, results, and browser evidence.
- VERIFY: fresh-context verifier/auditor, high reasoning. Read-only except report.

## Acceptance

- The row submenu contains `Vector Visualizer` with a bounded small icon and no large blank menu body.
- Color field changes immediately recolor the existing sampled Atlas without running sample again.
- Cluster-label visibility/limit is user-configurable and no longer fixed to 12 categories.
- Neighbors cosine rings/tooltips/table labels present similarity values such as `0.84` for raw distance `0.16`, while details retain raw distance.
- Health renders scan-readable severity tiles with sensible semantic colors and keeps formulas/details available.
- Selection mode exposes selected-set actions: copy IDs, export visible selected rows, run neighbors from selected item, and clear selection.
- Tracker and capability ledger reflect E5.R9 status before any renewed audit claim.
