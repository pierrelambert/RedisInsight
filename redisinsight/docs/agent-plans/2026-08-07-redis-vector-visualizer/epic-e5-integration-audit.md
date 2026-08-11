# Epic E5: Integration, verification, audit, and cleanup

## Objective

Integrate all epics, run proportionate and full gates, independently challenge product/technical/privacy/performance claims, repair bounded findings, and promote durable documentation.

- Source of truth: every non-deferred REQ-VV requirement
- Required skills: rtk-cli, caveman, agent-delegation-routing, redis-insight-plugin, redis-product-ui, playwright-test, verification-before-completion, requesting-code-review, agent-spec-writing, agent-plan-lifecycle
- Owned areas: shared integration files, focused/full tests, Playwright fixtures/artifacts, documentation/evidence
- Forbidden: geodata dirty files; dependency/CI/public-contract changes without authority; commit/push
- Dependencies: E1–E4 done with evidence
- Parallelizable: read-only verification commands may run concurrently if they do not contend for the same dev server; integration and audit are serial
- Acceptance: requirement matrix complete; clean tests/build/browser/privacy evidence; fresh Auditor APPROVED; documentation matches shipped behavior

## Task E5.T1: Integrate ownership boundaries and close bounded defects

- Objective: merge shared interfaces/views/hosts, resolve conflicts through the integration owner, and produce one coherent feature behind the flag.
- Worker role: Integrator
- Preferred provider: Codex
- Fallback: direct coordinator
- Requested model: gpt-5.6-terra
- Requested reasoning: high
- Actual model: unknown until execution
- Actual reasoning: unknown until execution
- Inherited from coordinator: unknown until execution
- Routing reason: cross-epic multi-file integration and regression handling
- Why sufficient: terra high handles long integration loops; sol is reserved for fresh audit
- Escalation: architecture/product/security/public-contract/scope decision or forbidden dependency/config change
- Required skills: rtk-cli, caveman, agent-delegation-routing, redis-product-ui, redis-insight-plugin, redis-vector-search, systematic-debugging, verification-before-completion
- Prompt instruction: Use $agent-delegation-routing if available to confirm role, model/reasoning, ownership, command shape, and fallback before starting.
- Repo/branch: isolated worktree, codex/redis-vector-visualizer
- Owned files: shared integration/public exports, feature flag wiring, test fixtures, docs corrections; overlapping epic files only to resolve verified integration defects
- Forbidden files: geodata dirty files, CI, root build config beyond already approved plugin registry, lockfiles without dependency approval
- Inputs: all epic reports/evidence, tracker, specs, decisions
- Steps:
  1. Run resume ritual and verify changed files are a subset of planned ownership.
  2. Reconcile shared APIs, imports, theme providers, source transitions, state cleanup, and feature flag behavior.
  3. Run focused tests after each bounded repair; do not widen scope.
  4. Search for direct @redis-ui imports, raw vector logs/persistence, write commands, hidden HTTP, stale TODOs, default plugin conflicts, hardcoded colors/pixels, and geodata changes.
  5. Produce requirement-to-test/evidence matrix for REQ-VV-001 through REQ-VV-010.
- Compatibility: feature off equals prior behavior; no geodata diff; no write path; no unsupported parity.
- Example test shape: end-to-end source switch cancels prior jobs, clears raw vectors, preserves non-sensitive preferences, and loads correct capability UI.
- Verify:
  - rtk git diff --name-only main...HEAD
  - rtk git diff --check
  - rtk rg -n "from ['\"]@redis-ui/|console\.(log|debug)|localStorage.\*vector|VADD|DEL|UNLINK|FT\.CREATE|CONFIG SET|FLUSH" <changed-source-files>
  - all focused commands from E1–E4 reports
- Output: rigid report, diff ownership table, requirement matrix, bounded repairs
- Audit: E5.AUDIT
- Tracking: agent_memory plus tracker E5.T1
- Commit allowed: no

## Task E5.T2: Independent verification run

- Objective: re-run build/test/browser/performance/privacy gates from a clean state and record tool-result evidence.
- Worker role: Verifier
- Preferred provider: Codex
- Fallback: direct coordinator in a fresh process; record self-evidence limitation
- Requested model: gpt-5.6-terra
- Requested reasoning: medium
- Actual model: unknown until execution
- Actual reasoning: unknown until execution
- Inherited from coordinator: unknown until execution
- Routing reason: evidence collection is broad but commands are explicit; no implementation authority
- Why sufficient: verification is execution-heavy rather than strategic
- Escalation: unavailable required environment, non-reproducible failure, or command would modify external state
- Required skills: rtk-cli, caveman, agent-delegation-routing, redis-insight-plugin, playwright-test, verification-before-completion
- Prompt instruction: Use $agent-delegation-routing if available to confirm role, model/reasoning, ownership, command shape, and fallback before starting.
- Repo/branch: isolated worktree, codex/redis-vector-visualizer
- Owned files: verification artifacts and tracker evidence only
- Forbidden files: production/test implementation; no fixes; no commits
- Inputs: E5.T1 requirement matrix and exact changed-file list
- Steps:
  1. Start from clean generated-output state using only repo-safe cleanup commands.
  2. Run focused Jest suites for adapters, plugin, Query Lab, Explore/Health, Compare/Advanced, Search entry, Vector Set entry, and plugin matcher.
  3. Run UI typecheck and lint.
  4. Run plugin Vite build and verify declared bundles/activation method/manifest.
  5. Run relevant API tests if API files changed.
  6. Run Playwright entry-point and Workbench flows at both viewports/themes, including failure/cancel/WebGL/scale cases.
  7. Run privacy/network/bundle scans and git diff checks.
  8. Record exact pass/fail, durations, environment, screenshots/traces, and skipped/blocked gates.
- Verify:
  - rtk yarn test
  - rtk yarn test:api when API changed
  - rtk yarn lint
  - rtk yarn type-check:ui
  - rtk yarn --cwd redisinsight/ui/src/packages build
  - rtk yarn --cwd tests/e2e test <vector-visualizer-suite>
  - rtk git diff --check
  - manifest/bundle/network/privacy scans from prior tasks
- Playwright evidence: 1440x900 and 390x844, light/dark, Search/Vector Set/Workbench, Query Lab/Explore/Health/Compare/Advanced, empty/loading/fail/cancel/stale/WebGL unsupported, console/network clean
- Output: rigid report, command matrix, artifacts, no implementation
- Audit: E5.AUDIT consumes this evidence
- Tracking: agent_memory plus tracker E5.T2
- Commit allowed: no

## Task E5.AUDIT: Fresh independent delivery audit

- Objective: independently audit requirement compliance, architecture, UI semantics/accessibility, plugin contract, privacy/security, performance claims, and verification completeness.
- Worker role: Auditor
- Preferred provider: Codex
- Fallback: a fresh independent available Auditor; if independence fails record Audit independence: self-evidence only and do not claim audited
- Requested model: gpt-5.6-sol
- Requested reasoning: high
- Actual model: unknown until execution
- Actual reasoning: unknown until execution
- Inherited from coordinator: unknown until execution
- Routing reason: final high-risk architecture/privacy/performance/public-product claim warrants the frontier audit model
- Why sufficient: sol high is reserved for this cross-surface challenge; xhigh is unnecessary absent a discovered subtle/security blocker
- Escalation: unresolvable architecture/product/security/public-contract issue; otherwise issue a required bounded repair task
- Required skills: rtk-cli, caveman, agent-delegation-routing, agent-spec-writing, redis-insight-plugin, redis-product-ui, redis-vector-search, code-review, verification-before-completion
- Prompt instruction: Use $agent-delegation-routing if available to confirm role, model/reasoning, ownership, command shape, and fallback before starting.
- Repo/branch: isolated worktree, codex/redis-vector-visualizer
- Owned files: audit report/evidence only
- Forbidden files: all implementation files; no fixes, commits, or pushes
- Inputs: specs, charter/index/components/decisions, changed-file list, requirement matrix, E5.T2 raw command/artifact evidence
- Gates:
  1. Every non-deferred REQ-VV acceptance scenario maps to current-session evidence.
  2. Search/Vector Set capability differences and profile/topology labels are truthful.
  3. Plugin manifest, activation, Phase 1/2/3, match/default, and error contracts pass.
  4. Redis Product UI themes, typography, semantic colors, state coverage, table/inspector, chart, keyboard/accessibility rules pass.
  5. No raw vector/content/key/query leakage, write command, hidden network, ACL bypass, or unsafe export exists.
  6. Sampling/projection/exactness/freshness/performance claims match measured evidence.
  7. Existing behavior and feature-off rollback pass.
  8. Verification includes independent reruns, not copied worker claims.
- Verdict: APPROVED, NOT APPROVED, or BLOCKED
- Findings: severity, file/line, violated gate/requirement, evidence, required fix, closure command, residual risk
- Output: rigid report plus audit report with verdict, findings or explicit no-findings, evidence paths, residual risks
- Tracking: agent_memory plus tracker E5.AUDIT; only APPROVED transitions plan/tasks to audited
- Done evidence: fresh tool results and audit report; no P0/P1 open
- Commit allowed: no

## Task E5.T3: Documentation promotion and cleanup

- Objective: align durable specs/docs with audited behavior, record deviations/deferrals, and clean stale planning noise without deleting user work.
- Worker role: Documentation Maintainer
- Preferred provider: direct coordinator or Codex
- Fallback: direct coordinator
- Requested model: gpt-5.6-terra
- Requested reasoning: low
- Actual model: unknown until execution
- Actual reasoning: unknown until execution
- Inherited from coordinator: unknown until execution
- Routing reason: mechanical evidence-linked documentation after audit; no senior inherited reasoning needed
- Why sufficient: source behavior and audit are authoritative
- Escalation: documentation would change public product behavior or delete user-owned files
- Required skills: rtk-cli, caveman, agent-delegation-routing, agent-spec-writing, agent-plan-lifecycle
- Prompt instruction: Use $agent-delegation-routing if available to confirm role, model/reasoning, ownership, command shape, and fallback before starting.
- Repo/branch: isolated worktree, codex/redis-vector-visualizer
- Owned files: specs, plan status/tracker, new feature docs/README, memory records
- Forbidden files: implementation, existing unrelated docs/research, deletion of user files, commits
- Inputs: APPROVED audit and final changed behavior
- Steps:
  1. Update specs only for audited intentional deviations; preserve history with superseded/deferred entries.
  2. Update plugin/native feature docs and validation commands.
  3. Mark task/plan states audited and record evidence/promotion disposition.
  4. Keep durable spec/audit docs; mark stale intermediate notes obsolete or archive only under repo policy.
  5. Save compact durable outcomes/pointers to agent_memory; never store logs/secrets/vectors.
- Verify:
  - rtk rg -n "TBD|TODO|PLACEHOLDER|<created|<vector|unknown until execution" redisinsight/docs/specs redisinsight/docs/agent-plans/2026-08-07-redis-vector-visualizer
  - rtk git diff --check
  - link/path existence checks for every documented artifact
- Output: rigid report, docs changed, memory write confirmation, final residual
- Audit: E5.AUDIT verdict remains authority; material post-audit doc behavior changes require re-audit
- Tracking: agent_memory plus tracker E5.T3
- Commit allowed: no
