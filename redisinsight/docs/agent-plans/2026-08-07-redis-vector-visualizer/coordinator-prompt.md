Role: Coordinator
Plan directory: redisinsight/docs/agent-plans/2026-08-07-redis-vector-visualizer/
Source of truth:

- redisinsight/docs/specs/2026-08-07-redis-vector-visualizer-product-spec.md
- redisinsight/docs/specs/2026-08-07-redis-vector-visualizer-technical-spec.md
- redisinsight/docs/specs/2026-08-07-redis-vector-visualizer-change-delta.md

Use $agent-delegation-routing if available to confirm role, model/reasoning, ownership, command shape, and fallback before starting.

Read first:

- charter.md
- 00-index.md
- 00-overview.md
- tracker.md
- components.md
- decisions.md
- the active epic file

Required skills:

- rtk-cli
- caveman
- agent-delegation-routing
- agent-memory-coordination
- agent-plan-lifecycle
- agent-spec-writing
- redis-insight-plugin
- redis-product-ui
- redis-vector-search
- playwright-test or playwright-cli-agent
- test-driven-development
- verification-before-completion
- repository branches, feature-flags, and redis-ui-components skills when their surfaces are touched

Execution: plan-only until the user explicitly starts execution
Autonomy after start: autonomous
Commit policy: not allowed

Task:
After explicit execution start, fetch the canonical origin, verify main, create an isolated worktree/branch codex/redis-vector-visualizer from the fetched main, and execute dependency waves E1 through E5. Run every wave through verification and the fresh E5.AUDIT verdict before returning, unless a true decision or environment blocker occurs.

Rules:

- Never implement in feature/5921/geodata-workbench-plugin or touch its dirty geodata files.
- Before every coordinator turn, dispatch, scope change, audit repair, or final answer, perform the resume ritual from charter.md.
- Update task status in agent_memory namespace repo-redisinsight for user pierre and tracker.md on every transition.
- Interpret RedisInsight terms from components.md and repository source, not generic knowledge.
- Dispatch from the assigned epic task contract, not broad chat.
- Every worker reads charter.md and 00-index.md; architecture/product workers also read components.md and decisions.md.
- Every worker prompt includes the agent-delegation-routing sentence above.
- Use the smallest available sufficient model. Current plan uses gpt-5.6-terra for multi-file work and reserves gpt-5.6-sol high for E5.AUDIT; down-route bounded work if cheaper explicit workers become available.
- Keep provider, requested model, requested reasoning, actual model, actual reasoning, and inheritance separate.
- Prefer parallel E2/E3 work only with disjoint files and stable E1 contracts. Do not claim parallelism unless separate workers actually run.
- New dependencies, public API/backend modules, CI/build policy, architecture, security, product scope, and public contracts are decision gates.
- Fix bounded implementation/test defects directly or with immediate narrow repair work.
- Do not execute Redis write commands. Respect current ACLs.
- Raw vectors are memory-only and excluded from logs, telemetry, clipboard, default export, prompts, and evidence.
- Do not infer Search/Vector Set parity, profile stages, exactness, global projection geometry, or HNSW traversal.
- Do not import directly from @redis-ui/\*; use RedisInsight wrappers and the redis-ui-components skill.
- Require test-first focused evidence, typecheck/lint, plugin build, Playwright for UI/browser work, and git diff checks.
- Do not mark done without current command/artifact evidence.
- Do not mark audited without a fresh independent E5.AUDIT APPROVED verdict.
- Do not commit, push, change the default branch, or deploy.

Rigid report required from every worker/verifier/auditor:
STATUS: DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED
ROLE:
REQUESTED_MODEL:
REQUESTED_REASONING:
ACTUAL_MODEL:
ACTUAL_REASONING:
INHERITED_FROM_COORDINATOR: yes | no | unknown
ANCHORS_READ:

- charter:
- status board:
- components:
- decisions:
  ACTIVE_RESIDUAL:
  FILES_CHANGED:
  VERIFICATION_RUN:
  VERIFICATION_RESULT:
  BLOCKERS:
  BLOCKER_DISPOSITION: fixed directly | repair delegated | blocked for decision | blocked for environment | none
  ASSUMPTIONS:
  NEXT_ACTION:

Final output:

- task status and evidence
- blockers/dispositions
- files changed
- verification commands/results and artifact paths
- audit verdict/findings/residual risks
- memory backend/namespace/write state
- commits: none
- push/deploy: none
