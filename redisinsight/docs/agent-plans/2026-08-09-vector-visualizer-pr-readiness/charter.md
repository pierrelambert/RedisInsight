# Vector Visualizer PR readiness charter

Date: 2026-08-09
Repository: `/private/tmp/redisinsight-vector-visualizer`
Branch: `codex/redis-vector-visualizer`
Execution: start-now
Autonomy: autonomous within explicit task contracts
Commit policy: prohibited

## Objective

Prepare the existing Redis Vector Visualizer delivery for a pull request without widening product behavior, modifying the protected Geodata checkout, committing, pushing, or claiming broader proof than current evidence supports.

This charter is a bounded code-quality/readiness delta. It does not establish fidelity to the brainstorming product mockups; that acceptance is governed by `../2026-08-09-vector-visualizer-product-ui-remediation/`.

## Source of truth

1. The user's 2026-08-09 coordinator prompt for PR readiness.
2. The existing anchored implementation plan at `redisinsight/docs/agent-plans/2026-08-07-redis-vector-visualizer/`.
3. The product, technical, and change-delta specs under `redisinsight/docs/specs/`.
4. Current repository state and fresh command evidence.

The user supplied the remaining T2, T4, T5, T6, T7, T8, and T9 contracts on 2026-08-09. Execution order is Round 1 (T4/T5/T6), Round 2 (T2/T7/T8), then fresh-context audit T9. T1 and T3 remain audited context.

## Boundaries

- Preserve the dirty `feature/5921/geodata-workbench-plugin` checkout; all work occurs in the isolated worktree above.
- No commit, push, fetch, rebase, deployment, Redis command, or Redis write.
- No product, architecture, public API, backend, privacy, or telemetry expansion.
- Raw vectors remain memory-only and excluded from persistence, logs, telemetry, clipboard, URLs, prompts, and evidence.
- The aggregate TypeScript and shared Geodata build non-passes from E6 remain explicit unless fresh evidence changes them.
- Worker ownership is disjoint. The coordinator owns this plan, tracker, ledger, integration review, and audit dispatch.

## Required skills and economy

- Coordinator: `agent-capability-ledger`, `agent-delegation-planning`, `agent-delegation-routing`, `agent-memory-coordination`, `dispatching-parallel-agents`, and `verification-before-completion`.
- Workers: repository `.ai` conventions and `$agent-delegation-routing` when available.
- Use RTK for noisy non-interactive commands, concise report files, and the smallest available explicit Codex route.
- Requested implementation models are `gpt-5.4` and `gpt-5.5`. The active runtime exposes only `gpt-5.6-terra` and `gpt-5.6-sol`; use `gpt-5.6-terra` at each task's requested reasoning level as the cheapest available non-inherited implementation route. T9 uses `gpt-5.6-sol` high as explicitly requested.

## Completion and audit

A task becomes `done` only after coordinator inspection and fresh verification. The executed readiness delta becomes `audited` only after a fresh-context Auditor independently reviews the exact changes and evidence. The aggregate type-check baseline remains a known non-pass. Completion requires no new diagnostics from task-owned files, focused tests, and T9's fresh independent verdict; it does not require repairing the 1,312 pre-existing diagnostics. T9's APPROVED verdict remains authoritative for T1–T8 only and must not be cited as product-visual approval.
