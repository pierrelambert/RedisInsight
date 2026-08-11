# Coordinator prompt — Vector Visualizer Product UI Remediation

Role: Coordinator  
Execution: start-now only when the user explicitly authorizes this plan  
Autonomy: autonomous within task contracts after start  
Commit policy: prohibited

Repo: `/private/tmp/redisinsight-vector-visualizer`  
Branch: `codex/redis-vector-visualizer`

## Resume

Read `charter.md`, `00-index.md`, `tracker.md`, `decisions.md`, `capability-ledger.md`, `reverification-report.md`, the visual/product/technical specs, reference asset README, newest user request, and current Git status. Restate the active residual. Preserve the protected dirty checkout and unrelated work. Do not commit, push, stage broadly, change refs, edit CI/build/backend/public APIs, add dependencies, or update shared memory without separate authority.

## Routing requirement

Every worker prompt begins: `Use $agent-delegation-routing if available to confirm role, model/reasoning, ownership, command shape, and fallback before starting.` Use `00-overview.md` routes. Workers never edit tracker, ledger, decisions, charter, or specs. After each task, independently inspect its diff/evidence and update tracker plus ledger.

## Wave 1 — acceptance first

Dispatch E1.T1 from `tasks/E1-T1-visual-acceptance.md` using Terra medium. Accept only if the harness is valid and current fidelity failures are genuinely red. Do not accept current-layout screenshots as baselines.

## Wave 2 — parallel, file-disjoint

After E1 acceptance, dispatch E2.T1 controls, E2.T2 results, and E2.T3 canvas simultaneously from their task files using Terra high UI Designer routes. Wait for all three. Inspect APIs, tests, owned-path type/lint/format evidence, and confirm no worker touched `VectorVisualizerPage.tsx`.

## Wave 3 — exclusive integration

Dispatch E3.T1 using Terra high Integrator. No other native-page worker runs concurrently. Require desktop geometry and connected mode gates. Review before/after screenshots manually; do not approve baselines yet.

## Wave 4 — serial refinement

Dispatch E4.T1 desktop-window/theme/a11y, then E4.T2 Workbench refinement, both Terra high UI Designer. Use RedisInsight's configured `960x680` minimum; do not introduce mobile-screen layouts. Reject PCA/t-SNE, >20k sampling, implied Workbench Atlas parity, duplicated domain state, or backend/public-contract expansion.

## Wave 5 — fresh proof

Dispatch E5.VERIFY in fresh context using Terra high. If NOT READY, create bounded repair tasks from exact findings and require a fresh verifier. Only after READY, dispatch E5.AUDIT in fresh context using Sol high. If NOT APPROVED, repair narrowly and require a new verifier plus new audit.

## Promotion boundary

Mark audited only when REQ-VV-011 through REQ-VV-015 have fresh evidence; real-route screenshots and numeric geometry pass at reference, intermediate, and `960x680` minimum desktop sizes; Atlas/Neighbors/Selection, themes, keyboard, states, console, and network pass; no P0/P1 remains; and aggregate/live Redis/Electron/deployment boundaries are stated honestly.

Do not commit, push, create a PR, deploy, or update shared memory without separate user authorization.
