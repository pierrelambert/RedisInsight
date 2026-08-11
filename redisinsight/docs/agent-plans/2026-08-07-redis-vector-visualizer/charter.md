# Charter: Redis Vector Visualizer

Plan ID: 2026-08-07-redis-vector-visualizer  
Date: 2026-08-07  
Coordinator: Codex coordinator  
Repo: /Users/pierre/Documents/Work/RedisInsight  
Execution branch: codex/redis-vector-visualizer at /private/tmp/redisinsight-vector-visualizer from fetched origin/main  
Execution: started  
Autonomy after start: autonomous  
Commit policy: not allowed

## Goal

Deliver the audited Redis Vector Visualizer specified in docs/specs/2026-08-07-redis-vector-visualizer-\*.md: shared capability-aware visualization core, native Search index and Vector Set entry points, internal Workbench plugin, Query Lab, Explore, Health, Compare & Tune, Advanced capability gating, and complete verification evidence.

## Non-goals

- Do not modify or incorporate the existing dirty geodata feature-branch work.
- Do not write Redis data, tune indexes automatically, schedule background scans, or claim exact global geometry.
- Do not add dependencies, edit CI/build policy, commit, push, or change the default branch without the separately required authority.
- Do not make unavailable Search/Vector Set capabilities appear equivalent.

## Source of truth

| Source                                                                 | Why it is authoritative                                    |
| ---------------------------------------------------------------------- | ---------------------------------------------------------- |
| docs/specs/2026-08-07-redis-vector-visualizer-product-spec.md          | User-visible behavior and product acceptance               |
| docs/specs/2026-08-07-redis-vector-visualizer-technical-spec.md        | Architecture and contracts                                 |
| docs/specs/2026-08-07-redis-vector-visualizer-change-delta.md          | Requirement IDs and handoff delta                          |
| docs/specs/2026-08-09-redis-vector-visualizer-visual-contract.md       | Normative composition, hierarchy, density, and interaction |
| docs/specs/2026-08-09-redis-vector-visualizer-visual-fidelity-delta.md | Superseding product-visual acceptance delta                |
| docs/research/2026-08-07-vector-visualization-research.md              | Primary-source research and trust limits                   |
| canonical RedisInsight origin/main                                     | Current repository implementation truth                    |

## Success criteria

- Every REQ-VV-\* requirement is implemented or explicitly dispositioned by an approved scope decision.
- Focused/unit/integration tests, plugin build checks, light/dark Playwright flows, scale fixtures, privacy review, and final repository gates have current-session evidence.
- All task rows are audited, and the independent Auditor verdict is APPROVED.
- Existing Search, Profile/Explain, Vector Set, and geodata behavior remains passing.

## Active residual

None for the audited technical/capability scope. E6.VERIFY and E6.AUDIT remain authoritative for that scope. A 2026-08-09 re-verification found that the brainstormed product composition was absent from the durable acceptance contract; product-visual acceptance is therefore not established and is transferred to `../2026-08-09-vector-visualizer-product-ui-remediation/`. Aggregate TypeScript, the shared Geodata build, the API clean-process gate, Windows/static-copy runtime, and live Redis/Electron/deployment proof remain explicit non-passes or unproven boundaries. No commit, push, rebase, or deployment is authorized.

## Must not drift

- “Collection” maps to Search index; native scope is Vector Set; shared term is vector data source.
- Atlas is sampled/projection evidence; Neighbors preserves anchor score/distance; Selection is linked and virtualized.
- Query/profile facts are response-backed; no fake funnel or HNSW traversal.
- Raw embeddings are memory-only and excluded from logs, telemetry, clipboard, and default exports.
- RedisInsight themes are light/dark; technical values use code typography.

## Resume ritual

- Re-read this charter.
- Re-read 00-index.md and tracker.md.
- Re-read the latest Auditor/verifier evidence.
- Re-read the newest user request.
- Re-read components.md and decisions.md before architecture/product changes.
- Restate the active residual before acting.
