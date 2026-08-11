# Epic E1: Foundation and capability proof

## Objective

Freeze the shared contracts, prove host/source capabilities against current RedisInsight, and establish the internal plugin shell without committing to unsupported parity.

- Source of truth: REQ-VV-001, REQ-VV-002, REQ-VV-008, REQ-VV-010 and the technical spec
- Required skills: rtk-cli, caveman, agent-delegation-routing, redis-insight-plugin, redis-product-ui, redis-vector-search, redis-search, test-driven-development
- Owned areas: planned shared visualizer directories under redisinsight/ui/src/, redisinsight/ui/src/packages/vector-visualizer/\*\*, plugin registry/matcher tests
- Forbidden: existing geodata dirty files; lockfiles/manifests for new dependencies until approval; CI; unrelated API/UI
- Dependencies: none
- Parallelizable: E1 tasks are serial because T1 selects contracts/paths, T2 implements them, and T3 consumes them
- Acceptance: capability matrix is executable; adapter fixtures pass; Phase 1 and Phase 2 plugin proofs exist; no current default visualization regresses

## Task E1.T1: Capability and dependency proof

- Objective: prove current SDK/native execution, response shapes, cancellation, binary-vector handling, renderer/layout dependency inventory, and exact owned paths.
- Worker role: Implementor/technical investigator
- Preferred provider: Codex
- Fallback: direct coordinator
- Requested model: gpt-5.6-terra
- Requested reasoning: medium
- Actual model: unknown until execution
- Actual reasoning: unknown until execution
- Inherited from coordinator: unknown until execution
- Routing reason: bounded but cross-file repository proof; current runtime exposes no cheaper explicit worker
- Why sufficient: no implementation architecture is accepted without commands/tests; sol is unnecessary until audit
- Escalation: only if a new dependency/API/module is required or Workbench Atlas parity is impossible
- Required skills: rtk-cli for evidence; caveman for report; agent-delegation-routing for route; redis-insight-plugin for SDK/iframe; redis-vector-search for command facts
- Prompt instruction: Use $agent-delegation-routing if available to confirm role, model/reasoning, ownership, command shape, and fallback before starting.
- Repo/branch: isolated worktree, codex/redis-vector-visualizer based on fetched main
- Owned files: a narrow proof directory under redisinsight/ui/src/packages/vector-visualizer/\*\*; decisions.md; tracker.md
- Forbidden files: geodata files, existing lockfiles, root configs, CI, production API code
- Inputs: charter.md, components.md, decisions.md, product/technical specs, plugin SDK README/types, current Search/Vector Set services, package manifests
- Steps:
  1. Run the resume ritual and record actual model/reasoning.
  2. Inventory installed projection/graph/WebGL/worker dependencies and current browser/build targets.
  3. Prove read-only SDK execution and native execution cancellation using safe fixture commands or mocks.
  4. Prove representative Search HASH/JSON and Vector Set vector/reply decoding with sanitized fixtures.
  5. Measure/estimate the Workbench command/byte limits relevant to the 2,000 default sample; do not run unbounded Redis commands.
  6. Record the shared directory choice and Workbench Atlas disposition in decisions.md.
  7. If a new dependency is necessary, stop only that dependency path and present package, purpose, size/license/security evidence, and no-dependency alternative.
- Target contract: VectorVisualizerHostAdapter, VectorSourceAdapter, VectorSourceCapabilities, and LayoutJobV1 from the technical spec.
- Compatibility: no data writes, no manifest default changes, no geodata import, no lockfile changes.
- Example test shape: table-driven fixture proving Search/Vector Set capability outputs and unavailable states from representative replies.
- Verify:
  - rtk git diff --check
  - rtk git status --short
  - focused proof tests named by created spec files
  - rtk rg -n "process\.env|console\.(log|debug).\*vector|fetch\(|XMLHttpRequest" redisinsight/ui/src/packages/vector-visualizer
- Output: rigid worker report; capability table; decision entries; exact commands; dependency decision/blocker if any
- Audit: E5.AUDIT; T1 done requires proof evidence paths and decisions recorded
- Tracking: agent_memory plus tracker row E1.T1
- Commit allowed: no

## Task E1.T2: Shared contracts, source adapters, and privacy boundary

- Objective: implement tested shared types/state, command planning/parsing, Search and Vector Set source adapters, evidence provenance, cancellation, and memory-only vector handling.
- Worker role: Implementor
- Preferred provider: Codex
- Fallback: direct coordinator
- Requested model: gpt-5.6-terra
- Requested reasoning: high
- Actual model: unknown until execution
- Actual reasoning: unknown until execution
- Inherited from coordinator: unknown until execution
- Routing reason: multi-file adapter correctness spans RESP shapes, filters, exactness, cancellation, and sensitive data
- Why sufficient: terra high is justified by multi-file integration; sol remains reserved for independent audit
- Escalation: public API/backend module or dependency requirement not approved by E1.T1 decision
- Required skills: rtk-cli, caveman, agent-delegation-routing, redis-vector-search, redis-search, redis-product-ui, test-driven-development
- Prompt instruction: Use $agent-delegation-routing if available to confirm role, model/reasoning, ownership, command shape, and fallback before starting.
- Repo/branch: isolated worktree, codex/redis-vector-visualizer
- Owned files: selected shared vector visualizer directories under redisinsight/ui/src/\*\* and their focused tests
- Forbidden files: plugin registry/package until E1.T3; native entry pages; geodata; new API modules without recorded approval; telemetry; CI
- Inputs: E1.T1 report/decisions, technical spec contracts, existing Redis response parsers and Vector Set API DTOs
- Steps:
  1. Write failing tests for capabilities, token-aware commands, filters/PARAMS/quotes, response variants, metric conversions, exactness, cancellation, stale responses, and vector cleanup.
  2. Implement versioned source/host contracts and normalized evidence kinds.
  3. Implement Search discovery/sample/neighbor/profile planning and parsing with explicit nondeterministic-order caveat.
  4. Implement Vector Set discovery/sample/neighbor/reduced-profile/topology planning and parsing.
  5. Implement normalized selection state and not-plotted IDs.
  6. Add safe logging/telemetry redaction helpers and prove raw vectors cannot enter persisted manifest state.
  7. Run focused tests, typecheck, lint, and diff checks.
- Target API: exact interfaces in technical spec; command builders return read-only command plans plus provenance, never execute writes.
- Compatibility: preserve Redis filter languages separately; current connection/ACL remains authority; no fake capability.
- Example test shape: given a Vector Set VINFO/VSIM fixture, expect reduced profile and topology capability; given Search FT.INFO/PROFILE fixture, expect full profile and no topology.
- Verify:
  - rtk node node_modules/.bin/jest <created-shared-spec-files> -c redisinsight/jest.config.cjs --runInBand
  - rtk yarn lint:ui
  - rtk yarn type-check:ui
  - rtk git diff --check
- Output: rigid report, files, tests, capability evidence, residual risks
- Audit: E5.AUDIT; done only with green focused tests/typecheck
- Tracking: agent_memory plus tracker E1.T2
- Commit allowed: no

## Task E1.T3: Internal plugin Phase 1 and Phase 2

- Objective: scaffold the internal Vite package, safe matcher/manifest, defensive activation, theme shell, and prove iframe wiring then React mounting.
- Worker role: Plugin Implementor
- Preferred provider: Codex
- Fallback: direct coordinator
- Requested model: gpt-5.6-terra
- Requested reasoning: medium
- Actual model: unknown until execution
- Actual reasoning: unknown until execution
- Inherited from coordinator: unknown until execution
- Routing reason: bounded plugin package and manifest integration with exact proof gates
- Why sufficient: current plugin precedents and focused verification make medium sufficient
- Escalation: required build-config change beyond registering the plugin, dependency addition, or default visualization conflict
- Required skills: rtk-cli, caveman, agent-delegation-routing, redis-insight-plugin, redis-product-ui, playwright-test, test-driven-development
- Prompt instruction: Use $agent-delegation-routing if available to confirm role, model/reasoning, ownership, command shape, and fallback before starting.
- Repo/branch: isolated worktree, codex/redis-vector-visualizer
- Owned files: redisinsight/ui/src/packages/vector-visualizer/\*\*; redisinsight/ui/src/packages/vite.config.mjs; focused plugin matcher tests
- Forbidden files: geodata; ri-explain/redisearch implementation; native pages; new dependencies/lockfiles without approval; CI
- Inputs: E1.T2 contracts, current clients-list/geodata manifests, plugin matcher, SDK
- Steps:
  1. Write matcher regression tests for FT vector syntax, VSIM, PARAMS payloads, command boundaries, and unchanged existing defaults.
  2. Add manifest with all required fields, default false, bounded matchQuery, and activation name matching the export.
  3. Phase 1: render safe command/result-shape proof and record iframe/registry evidence.
  4. Phase 2: mount React through current repo convention, ThemeProvider, error boundary, loading/empty/fail/unsupported states, and prefixed safe logs.
  5. Register the package in the shared Vite config and build it.
  6. Verify activation export/bundle, both themes, no blank failure, and no vector leakage/process.env residue beyond build substitution.
- Target manifest: proposed JSON in technical spec, adjusted only by tested matcher constraints.
- Compatibility: non-default; no sibling plugin imports; existing Search and Profile/Explain defaults remain.
- Example test shape: FT.SEARCH with KNN offered; plain FT.SEARCH absent; FT.PROFILE vector offered but explain remains default; VSIM offered; malformed props render error.
- Verify:
  - rtk node node_modules/.bin/jest <plugin-and-matcher-spec-files> -c redisinsight/jest.config.cjs --runInBand
  - rtk yarn --cwd redisinsight/ui/src/packages build
  - rtk test -f redisinsight/ui/src/packages/vector-visualizer/dist/index.js
  - rtk test -f redisinsight/ui/src/packages/vector-visualizer/dist/styles.css
  - rtk rg -n "renderVectorVisualizer" redisinsight/ui/src/packages/vector-visualizer/dist/index.js
  - rtk git diff --check
- Playwright evidence: Workbench iframe, 1440x900, light/dark, safe matching command, empty/fail states, console/network clean; artifact prefix artifacts/playwright/e1-t3-
- Output: rigid report plus separate Phase 1 and Phase 2 evidence paths
- Audit: E5.AUDIT; done only when both phases are independently visible in evidence
- Tracking: agent_memory plus tracker E1.T3
- Commit allowed: no
