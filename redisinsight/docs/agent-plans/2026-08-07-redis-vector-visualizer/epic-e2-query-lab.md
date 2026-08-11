# Epic E2: Query Lab and entry points

## Objective

Deliver the synchronized retrieval debugger and expose it safely from Workbench, Vector Search, and Vector Set details.

- Source of truth: REQ-VV-002, REQ-VV-003, REQ-VV-007, REQ-VV-009
- Required skills: rtk-cli, caveman, agent-delegation-routing, redis-product-ui, redis-insight-plugin, redis-vector-search, playwright-test, test-driven-development
- Owned areas: Query Lab shared UI; Workbench host binding; Vector Search/Vector Set entry actions; related state/tests/telemetry
- Forbidden: Atlas worker/renderer owned by E3; Compare/Advanced owned by E4; geodata; direct @redis-ui imports
- Dependencies: E1.T2 and E1.T3 done
- Parallelizable: E2.T1 and E2.T2 may run in parallel only if shared state contracts are frozen and files are disjoint; E2.T3 integrates afterward
- Acceptance: one query drives Neighbors, score distribution, rank gaps, measured/reduced profile, Selection, and inspector from all supported entry points

## Task E2.T1: Query Lab synchronized views

- Objective: implement the Neighbors, distribution, rank-gap, profile, virtualized Selection, and inspector views over shared state.
- Worker role: UI Implementor
- Preferred provider: Codex
- Fallback: direct coordinator
- Requested model: gpt-5.6-terra
- Requested reasoning: high
- Actual model: unknown until execution
- Actual reasoning: unknown until execution
- Inherited from coordinator: unknown until execution
- Routing reason: multi-view React interaction, charts, virtualization, accessibility, and source-dependent evidence
- Why sufficient: latest-generation multi-file UI persistence is justified; final truth review remains independent
- Escalation: missing Redis UI component API, chart/virtualization dependency, or spec-level interaction conflict
- Required skills: rtk-cli, caveman, agent-delegation-routing, redis-product-ui, repository redis-ui-components skill, redis-vector-search, playwright-test, test-driven-development
- Prompt instruction: Use $agent-delegation-routing if available to confirm role, model/reasoning, ownership, command shape, and fallback before starting.
- Repo/branch: isolated worktree, codex/redis-vector-visualizer
- Owned files: shared Query Lab/Selection/inspector components and focused tests
- Forbidden files: packages/vector-visualizer host entry, native page entry files, E3 worker/renderer, E4 features, geodata
- Inputs: E1 shared contracts/state, product visualization contracts, Redis Product UI references
- Steps:
  1. Write failing component/state tests for linked selection, not-plotted neighbors, metric-aware radius, layout-only angle label, score/rank gaps, profile capability differences, virtualization, and all state variants.
  2. Build compact workflow/tab shell using internal layout/UI wrappers and light/dark semantic tokens.
  3. Implement Neighbors with DOM/canvas scale appropriate for query result counts and exact-value tooltip/table linkage.
  4. Implement score distribution and rank-gap waterfall with axes, units, thresholds, freshness, and non-color annotations.
  5. Implement full Search profile and reduced Vector Set profile branches from evidence only.
  6. Implement virtualized Selection plus persistent inspector; code typography for IDs/commands/values.
  7. Add keyboard and aria-live behavior and reduced-motion handling.
- Compatibility: no pagination with virtualization; no Redis Red as universal status; no inferred funnel stage.
- Example test shape: selecting rank 4 highlights the radial mark, waterfall row, table row, and inspector; a missing FT.PROFILE field renders Unavailable, not 0.
- Verify:
  - rtk node node_modules/.bin/jest <query-lab-spec-files> -c redisinsight/jest.config.cjs --runInBand
  - rtk yarn type-check:ui
  - rtk yarn lint:ui
  - rtk git diff --check
- Playwright evidence: isolated story/dev route at 1440x900 and 390x844, light/dark, keyboard-only selection, empty/error/loading/unsupported, console clean
- Output: rigid report plus screenshots/trace and accessibility findings
- Audit: E5.AUDIT
- Tracking: agent_memory plus tracker E2.T1
- Commit allowed: no

## Task E2.T2: Native Search and Vector Set entry points

- Objective: add feature-flagged Visualize actions and host wiring without changing existing index/key workflows.
- Worker role: Integration Implementor
- Preferred provider: Codex
- Fallback: direct coordinator
- Requested model: gpt-5.6-terra
- Requested reasoning: medium
- Actual model: unknown until execution
- Actual reasoning: unknown until execution
- Inherited from coordinator: unknown until execution
- Routing reason: bounded native surface integration with established components/tests
- Why sufficient: focused repository patterns and tests make medium sufficient
- Escalation: route/public API decision, feature-flag semantics conflict, or required backend endpoint
- Required skills: rtk-cli, caveman, agent-delegation-routing, redis-product-ui, feature-flags, repository redis-ui-components skill, test-driven-development
- Prompt instruction: Use $agent-delegation-routing if available to confirm role, model/reasoning, ownership, command shape, and fallback before starting.
- Repo/branch: isolated worktree, codex/redis-vector-visualizer
- Owned files: vector-search page/index components and tests; vector-set-details action/hooks/tests; selected feature flag/telemetry files
- Forbidden files: shared Query Lab internals, plugin package, geodata, E3/E4 features, unrelated routes
- Inputs: E1 contracts, feature-flags skill, current VectorSearchPage/VectorSetDetails behavior
- Steps:
  1. Add the repository-standard feature flag using the feature-flags skill.
  2. Write failing tests for hidden/visible actions, source context, multi-vector-field choice, state preservation, and unchanged existing actions.
  3. Add Search index Visualize action and source-field selection.
  4. Add Vector Set Visualize action preserving list/search/editor/drawer state.
  5. Add only privacy-safe telemetry fields allowed by the technical spec.
  6. Run focused existing and new tests.
- Target behavior: native host adapter opens the same workspace with a VectorDataSourceRef.
- Compatibility: feature off equals prior UI; no Vector Set mutation changes; no index-table regression.
- Example test shape: with flag off no action; with flag on Search source ref includes selected field; Vector Set source ref preserves binary-safe key identity.
- Verify:
  - rtk node node_modules/.bin/jest <vector-search-and-vector-set-spec-files> -c redisinsight/jest.config.cjs --runInBand
  - rtk yarn type-check:ui
  - rtk yarn lint:ui
  - rtk git diff --check
- Playwright evidence: Search and Vector Set entry flows, light/dark desktop/mobile, return to prior context
- Output: rigid report, files, telemetry fields, screenshots, regression evidence
- Audit: E5.AUDIT
- Tracking: agent_memory plus tracker E2.T2
- Commit allowed: no

## Task E2.T3: Workbench Query Lab Phase 3

- Objective: bind the plugin command/result and read-only SDK executor to the shared Query Lab and finish the mandatory Phase 3 proof.
- Worker role: Plugin Integration Implementor
- Preferred provider: Codex
- Fallback: direct coordinator
- Requested model: gpt-5.6-terra
- Requested reasoning: medium
- Actual model: unknown until execution
- Actual reasoning: unknown until execution
- Inherited from coordinator: unknown until execution
- Routing reason: internal plugin integration after separately verified core and shell
- Why sufficient: contracts and visual components are already verified
- Escalation: SDK cannot satisfy a required read-only action or iframe constraint contradicts product spec
- Required skills: rtk-cli, caveman, agent-delegation-routing, redis-insight-plugin, redis-product-ui, playwright-test
- Prompt instruction: Use $agent-delegation-routing if available to confirm role, model/reasoning, ownership, command shape, and fallback before starting.
- Repo/branch: isolated worktree, codex/redis-vector-visualizer
- Owned files: packages/vector-visualizer/\*\* and integration tests; shared code only through E5 integrator
- Forbidden files: native entry points, geodata, existing redisearch/ri-explain implementations, E3/E4 files
- Inputs: E1.T3 shell, E2.T1 Query Lab, E1.T2 adapters
- Steps:
  1. Parse and validate Workbench command/result into a source/query run.
  2. Bind safe read-only follow-up actions through SDK with cancel/stale protection.
  3. Persist only non-sensitive UI/view state.
  4. Render capability-specific link to native workspace when Atlas sampling is unsupported.
  5. Run Phase 3 Workbench flows for FT vector query, FT.PROFILE vector query, VSIM, empty, fail, ACL denied, and malformed results.
  6. Prove no existing default visualization conflict and no unexpected network request.
- Compatibility: default false; activation error cannot blank iframe; raw vectors never persist/log.
- Example test shape: VSIM result opens reduced profile; vector FT.PROFILE opens measured profile; plain FT.SEARCH does not match.
- Verify:
  - rtk node node_modules/.bin/jest <plugin-integration-spec-files> -c redisinsight/jest.config.cjs --runInBand
  - rtk yarn --cwd redisinsight/ui/src/packages build
  - rtk rg -n "renderVectorVisualizer" redisinsight/ui/src/packages/vector-visualizer/dist/index.js
  - rtk git diff --check
- Playwright evidence: actual Workbench iframe at 1440x900 light/dark, linked selection, fail/empty, console/network clean; artifacts/playwright/e2-t3-
- Output: rigid report and explicit Phase 3 evidence
- Audit: E5.AUDIT
- Tracking: agent_memory plus tracker E2.T3
- Commit allowed: no
