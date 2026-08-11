# Epic E4: Compare, Tune, and Advanced

## Objective

Deliver reproducible view manifests, drift comparison, controlled recall/latency/memory evidence, and source-specific advanced topology/profile views.

- Source of truth: REQ-VV-006 and REQ-VV-008
- Required skills: rtk-cli, caveman, agent-delegation-routing, redis-product-ui, redis-vector-search, redis-search, playwright-test, test-driven-development
- Owned areas: manifest persistence/import-export decision, comparison/tuning models/views, advanced capability views
- Forbidden: E2/E3 internals except documented APIs; native entry points; geodata; any Redis write command; background scheduler
- Dependencies: E2 and E3 done
- Parallelizable: manifest/comparison calculations and Advanced capability UI can run in parallel if files are disjoint; final view integration is serial
- Acceptance: compatible comparisons work, incompatible ones explain why, exact benchmarks require confirmation, and topology/profile labels remain honest

## Task E4.T1: View manifests, drift, and Pareto evidence

- Objective: implement versioned vector-free manifests, compatibility checks, drift evidence, and controlled benchmark run comparison.
- Worker role: Implementor
- Preferred provider: Codex
- Fallback: direct coordinator
- Requested model: gpt-5.6-terra
- Requested reasoning: medium
- Actual model: unknown until execution
- Actual reasoning: unknown until execution
- Inherited from coordinator: unknown until execution
- Routing reason: multi-file but schema-driven state/calculation/UI work with strong tests
- Why sufficient: medium is sufficient because compatibility and calculations are explicit; final Auditor reviews semantics
- Escalation: local-vs-file storage product decision, new persistence dependency, or exact benchmark requires destructive/write behavior
- Required skills: rtk-cli, caveman, agent-delegation-routing, redis-product-ui, redis-vector-search, test-driven-development
- Prompt instruction: Use $agent-delegation-routing if available to confirm role, model/reasoning, ownership, command shape, and fallback before starting.
- Repo/branch: isolated worktree, codex/redis-vector-visualizer
- Owned files: manifest schema/storage, drift/Pareto calculations and UI, tests
- Forbidden files: adapters/renderer except public interfaces; package/lockfiles; native pages; plugin manifest; geodata
- Inputs: ViewManifestV1 contract, E2 query runs, E3 sample/health metrics, decisions.md
- Steps:
  1. Implement the approved local-only v1 manifest storage; do not add file import/export.
  2. Write failing schema/version/redaction/compatibility tests and fixed benchmark fixtures.
  3. Implement manifests containing no raw vectors/payloads and source identity without secrets.
  4. Implement compatible drift deltas and explicit incompatibility reasons.
  5. Implement benchmark-run capture with previewed read-only commands, work estimate, cancel, and explicit confirmation for truth scans.
  6. Implement Pareto view with measured/estimated badges, units, axes, tooltips, and comparability filters.
  7. Prove no automatic tuning or background execution exists.
- Target API: ViewManifestV1 and typed BenchmarkRunV1 with evidence kind per metric.
- Compatibility: versioned schema, no silent coercion, no Redis mutation, feature rollback leaves optional local data harmless.
- Example test shape: mismatched dimensions are incompatible; sampled recall cannot be labelled exact; raw vector property is rejected/omitted during serialization.
- Verify:
  - rtk node node_modules/.bin/jest <manifest-compare-tune-spec-files> -c redisinsight/jest.config.cjs --runInBand
  - rtk yarn type-check:ui
  - rtk yarn lint:ui
  - rtk rg -n "VADD|DEL|UNLINK|FT\.CREATE|FT\.ALTER|CONFIG SET|FLUSH" <owned-files>
  - rtk git diff --check
- Playwright evidence: compatible/incompatible drift, Pareto measured/estimated labels, confirmation/cancel, both themes/viewports; artifacts/playwright/e4-t1-
- Output: rigid report, schema path/version, read-only command inventory, screenshots
- Audit: E5.AUDIT
- Tracking: agent_memory plus tracker E4.T1
- Commit allowed: no

## Task E4.T2: Advanced topology and profile evidence

- Objective: implement VLINKS topology, FT.PROFILE execution evidence, and explicit unavailable states without semantic overclaiming.
- Worker role: Implementor
- Preferred provider: Codex
- Fallback: direct coordinator
- Requested model: gpt-5.6-terra
- Requested reasoning: medium
- Actual model: unknown until execution
- Actual reasoning: unknown until execution
- Inherited from coordinator: unknown until execution
- Routing reason: bounded capability-specific parsers and UI with strong semantic constraints
- Why sufficient: response-backed mapping and focused tests reduce ambiguity
- Escalation: Redis response/version behavior contradicts cited capability matrix or product wants inferred Search traversal
- Required skills: rtk-cli, caveman, agent-delegation-routing, redis-vector-search, redis-search, redis-product-ui, test-driven-development
- Prompt instruction: Use $agent-delegation-routing if available to confirm role, model/reasoning, ownership, command shape, and fallback before starting.
- Repo/branch: isolated worktree, codex/redis-vector-visualizer
- Owned files: Advanced profile/topology adapters/views/tests
- Forbidden files: E1 shared adapter internals except integrator-approved interface patch; E2/E3 views; native pages; geodata; write commands
- Inputs: capability matrix, current Redis versions/fixtures, E1 adapter evidence
- Steps:
  1. Write response-shape/version tests for VLINKS layer adjacency and FT.PROFILE vector execution modes.
  2. Implement topology labels, layers, scores, limits, and selection linkage for Vector Sets.
  3. Implement Search execution-mode/profile display only from returned evidence.
  4. Implement Search topology unavailable state and Vector Set reduced-profile distinction.
  5. Add limits/cancel/error/ACL/version states.
  6. Review every label for topology-versus-semantic and measured-versus-derived accuracy.
- Compatibility: VLINKS never appears as nearest-neighbor truth; FT.PROFILE never appears as graph traversal.
- Example test shape: Vector Set source with VLINKS gets topology capability; Search source gets unavailable; missing FT.PROFILE vector mode remains unavailable.
- Verify:
  - rtk node node_modules/.bin/jest <advanced-profile-topology-spec-files> -c redisinsight/jest.config.cjs --runInBand
  - rtk yarn type-check:ui
  - rtk yarn lint:ui
  - rtk git diff --check
- Playwright evidence: Vector Set topology and Search unavailable/profile states in both themes; artifacts/playwright/e4-t2-
- Output: rigid report, response fixture matrix, screenshots, semantic-label checklist
- Audit: E5.AUDIT
- Tracking: agent_memory plus tracker E4.T2
- Commit allowed: no
