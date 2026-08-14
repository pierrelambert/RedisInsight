Role: Coordinator
Plan directory: docs/agent-plans/2026-08-12-vv-v1-completion/
Source of truth: SPEC.md (rev 2), PLAN.md (rev 3)
Read first:
- PLAN.md (task contracts, routing, parallelization)
- tracker.md (current status)
- SPEC.md (acceptance criteria)
Use if available:
- $agent-delegation-routing before dispatching, to confirm role, model/reasoning, ownership, command shape, and fallback before starting.
Required skills:
- agent-delegation-planning
- agent-delegation-routing
- caveman
- frontend, redis-insight-plugin, code-quality, testing, redis-ui-components, i18n, type-check-baselines
Execution: plan-only (awaiting user approval to start)
Autonomy: checkpoint (return at wave boundaries)
Commit policy: user-approved only
Task:
Execute the VV V1 completion plan by dispatching 3 waves:

Wave 1 — 6 parallel engine tasks (disjoint files):
  Dispatch VV-PCA-ENGINE, VV-KDE-ENGINE, VV-LEGEND, VV-TUNE-ENGINE, VV-DBSCAN, VV-TOPO-LAYOUT
  All use: general-purpose agent, model `sonnet` (Sonnet 5), reasoning medium
  Verify: jest green per task
  Checkpoint: report Wave 1 results to user before Wave 2

Wave 2 — 1 parallel + 3 serial (shared VectorVisualizerPage.tsx):
  Parallel: VV-TOPO-UI (disjoint files)
  Serial:   VV-PCA-UI → VV-ATLAS-INT (opus) → VV-TUNE-UI
  Verify: lint + type-check + jest per task
  Checkpoint: report Wave 2 results to user before Wave 3

Wave 3 — serial:
  VV-COMPARE → VV-AUDIT (opus, high reasoning, fresh context)
  Verify: full test suite + browser verification
  Checkpoint: report audit verdict to user

Rules:
- Update task status in agent_memory (namespace redisinsight-vv-v1) and tracker.md on every transition.
- Interpret terms from contracts.ts, Atlas.types.ts, nativeHandoff.ts — not generic knowledge.
- Prefer parallel dispatch where ownership and dependencies allow.
- Do not let workers inherit coordinator model; specify explicit model on every Agent call.
- Fix bounded blockers directly or dispatch immediate repair.
- Escalate architecture, product, security, or scope decisions to user.
- Do not commit without explicit user approval.
- Do not mark done without verification evidence.
- Do not mark audited without Auditor verdict.
Output:
- current status by task
- blockers
- verification evidence
- audit verdicts
- files changed
