# Delegation plan: Redis Vector Visualizer

## Control

- Repo: /Users/pierre/Documents/Work/RedisInsight
- Current working tree: feature/5921/geodata-workbench-plugin, dirty and forbidden for implementation
- Synchronized baseline: local main = origin/main = 0b53c6c2fac260ab2d1b439ee23ea6554d9ce8f4 on 2026-08-07
- Execution workspace: /private/tmp/redisinsight-vector-visualizer on codex/redis-vector-visualizer from fetched canonical main
- Plan directory: redisinsight/docs/agent-plans/2026-08-07-redis-vector-visualizer/
- Source of truth: the three specs in redisinsight/docs/specs/ plus charter.md
- Local terminology sources: components.md and cited repository source
- Goal: implement all non-deferred REQ-VV requirements with evidence and independent audit
- Non-goals: charter.md
- Execution: started on 2026-08-07
- Autonomy: autonomous
- Commit policy: not allowed
- Plan lifecycle state: promoted (re-promoted after bounded merge hardening, fresh verification, and independent E6 audit)
- Completed dependency waves: E1 through E5; E5.VERIFY7 is READY and the fresh independent E5.AUDIT5 verdict is APPROVED with 40/40 non-deferred scenarios passing
- Work shape: epics
- Packet mode: no; tasks share foundational contracts and integration order, so packet isolation would add coordination overhead
- Max parallel after E1: 2 implementation workers with disjoint ownership plus later independent Auditor
- Integration owner: E6 is verified and independently audited APPROVED with 0 P0/P1; no further local implementation work is active
- Open decisions: none before implementation; new dependencies, public APIs/backend modules, CI/build policy, security, architecture, or scope changes remain gates if discovered

## Known local changes

Do not modify, stash, stage, copy, or include:

- redisinsight/ui/src/packages/geodata/src/App.spec.tsx
- redisinsight/ui/src/packages/geodata/src/utils/rqeGeoParser.spec.ts
- redisinsight/ui/src/packages/geodata/src/utils/rqeGeoParser.ts
- repository-root .agents/
- redisinsight/.superpowers/
- unrelated pre-existing files under redisinsight/docs/

The plan/spec files created for this feature are in scope; the research note is read-only source evidence.

## Persistence

- Files: this anchored plan directory, tracker.md, and spec files
- Memory backend: agent_memory MCP
- Namespace: repo-redisinsight
- User ID: pierre
- Memory records: plan pointer, source-of-truth paths, baseline, execution controls, durable product decisions
- Memory write: confirmed status ok on 2026-08-07
- Tracker fallback: tracker.md is authoritative whenever memory and files disagree
- Anchor files: charter.md, 00-index.md, components.md, decisions.md
- Worker prompts: each epic file plus coordinator-prompt.md

## Required skill stack

Whole plan:

- rtk-cli: token-efficient git, diff, test, typecheck, build, and log evidence
- caveman: compact worker/audit reports without changing identifiers or command output
- agent-delegation-routing: explicit provider/model/reasoning/ownership and fallback
- agent-memory-coordination: status/ownership/prompt persistence
- agent-plan-lifecycle: anchored status, resume, promotion, and archive
- agent-spec-writing: requirement interpretation and compliance
- agent-capability-ledger: required before follow-up/readiness planning; not required to create a separate initial ledger because this is a new delivery and REQ-VV rows are the initial capability baseline
- redis-insight-plugin: manifest, activation, phased iframe proof, matching, build, and Workbench validation
- redis-product-ui: RedisInsight light/dark product UI, tables, inspector, charts, state coverage
- redis-vector-search and redis-search: Redis vector schema/query/profile correctness
- playwright-test or playwright-cli-agent: browser and visual evidence
- test-driven-development: red/green focused implementation
- verification-before-completion and requesting-code-review: final gates
- branches and using-git-worktrees: clean branch/worktree isolation
- feature-flags: feature exposure and rollback
- repository .ai/skills/redis-ui-components/: component API source before frontend edits

## Routing and model budget

The current Codex subagent tool exposes gpt-5.6-terra and gpt-5.6-sol. No scoped Claude bridge or local Qwen execution tool was discovered in this planning session. Therefore:

- multi-file implementation/UI workers: Codex provider, gpt-5.6-terra, medium by default and high only for worker/layout integration;
- mechanical tests/docs may run directly in the coordinator or gpt-5.6-terra low/medium; do not inherit a senior model;
- final independent architecture/privacy/performance Auditor: fresh Codex provider, gpt-5.6-sol, high;
- if a future runtime exposes cheaper gpt-5.4/gpt-5.5/local Qwen, agent-delegation-routing must down-route bounded tests/docs/mechanical work.

Provider, model, and reasoning are independent fields in every task. Actual values remain unknown until dispatch and must be recorded in tracker/memory.

## Token economy

- RTK usage: all noisy shell commands; raw fallback only if RTK cannot preserve required evidence
- Caveman: lite in prompts/plans, full rigid worker report, ultra status rows
- References: workers read only charter, index, components/decisions when relevant, assigned epic, affected spec sections, and owned source files
- Context forbidden: raw embeddings, secrets, private logs, full unrelated diffs, generated bundles, and entire chat history
- Worker output: rigid report plus concise changed-files, commands, pass/fail, evidence paths, blockers
- Evidence: paths and command summaries, not pasted raw logs
- Cleanup: archive superseded planning evidence after audited promotion; keep specs and final audit

## Dependency waves

1. E1 Foundation and capability proof.
2. E2 Query Lab and native/plugin entry points; E3 Explore and Health may start in parallel after E1 contracts are stable.
3. E4 Compare & Tune and Advanced after manifest/health primitives exist.
4. E5 integration, Playwright, performance/privacy gates, independent audit, and documentation cleanup.

No later wave starts while a required dependency is merely “mostly done.” It must have current verification evidence and status done.

## Epic map

| Epic | Objective                                                                        | Owned area                                                                 | Depends on | Parallel                      |
| ---- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ---------- | ----------------------------- |
| E1   | Prove host/source capabilities and build shared foundation/internal plugin shell | shared core, plugin package/registry, focused API only if proven necessary | none       | first                         |
| E2   | Deliver Query Lab and three entry points                                         | Query Lab, Workbench adapter, Search/Vector Set entry actions              | E1         | with E3 after contract freeze |
| E3   | Deliver Atlas, Selection, metadata matrix, and Health                            | worker, renderer, sampling, Explore/Health UI                              | E1         | with E2                       |
| E4   | Deliver manifests, drift, Pareto, and honest Advanced evidence                   | Compare & Tune, topology/profile capability gates                          | E2/E3      | serial after primitives       |
| E5   | Integrate, verify, audit, and clean documentation                                | shared integration files, tests/evidence/docs                              | E1–E4      | final                         |

## Blocker policy

- Bounded code/test/integration issue: fix directly inside ownership or dispatch a narrow repair task.
- Dependency addition, architecture/public-contract/security/scope/access decision: record evidence in decisions.md and request the exact decision.
- Missing optional capability: implement explicit unavailable state if the spec allows it; do not block unrelated workflows.
- Required environment unavailable: record blocked-for-environment with attempted commands and preserve all reproducible evidence.

## Tracking and completion

- Task states: planning, running, blocked, failed, done, audited.
- Plan states: planned, running, verified, audited, promoted, archived, blocked, failed, superseded.
- done requires task verification evidence.
- audited requires a fresh Auditor verdict.
- Update agent_memory and tracker.md on every transition; tracker wins on backend mismatch.
- Final completion requires every non-deferred requirement mapped to evidence, E5.AUDIT APPROVED, and no unresolved P0/P1 finding.

## Final report contract

Return:

- status by task;
- blockers and dispositions;
- files changed;
- exact verification commands/results and artifact paths;
- audit verdict/findings/residual risks;
- memory namespace/write state;
- commits: none unless commit policy is explicitly changed;
- push/default branch: never without explicit authority.
