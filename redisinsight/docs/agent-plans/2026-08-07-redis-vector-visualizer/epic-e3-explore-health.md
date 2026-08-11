# Epic E3: Explore and Health

## Objective

Deliver the sampled Atlas, metadata × cluster matrix, linked Selection integration, X-ray, duplicate explorer, and outlier explorer with honest trust/performance evidence.

- Source of truth: REQ-VV-004, REQ-VV-005, REQ-VV-007, REQ-VV-008
- Required skills: rtk-cli, caveman, agent-delegation-routing, redis-product-ui, redis-vector-search, playwright-test, test-driven-development
- Owned areas: sample coordinator, worker/layout, WebGL2 renderer, Explore/Health UI and calculations
- Forbidden: Query Lab internals owned by E2; native entry files; Compare/Advanced; geodata; dependency manifests without approval
- Dependencies: E1.T2 done and E1.T1 dependency decisions closed
- Parallelizable: E3.T1 and E3.T2 are serial at the renderer/state boundary; calculation-only tests may be delegated in parallel if file ownership is disjoint
- Acceptance: deterministic/cancellable sample layout, 20,000-point measured fixture, linked selection, honest provenance, and evidence-backed health states

## Task E3.T1: Sampling, worker layout, and WebGL2 renderer

- Objective: implement bounded source sampling, graph/layout worker, the approved UMAP-only v1 contract, WebGL2 Atlas interactions, freshness, and accessible Selection linkage.
- Worker role: Visualization Implementor
- Preferred provider: Codex
- Fallback: direct coordinator
- Requested model: gpt-5.6-terra
- Requested reasoning: high
- Actual model: unknown until execution
- Actual reasoning: unknown until execution
- Inherited from coordinator: unknown until execution
- Routing reason: multi-file worker protocol, numerical transformations, GPU interaction, cancellation, and performance correctness
- Why sufficient: terra high is warranted by the integration surface; final sol audit challenges claims
- Escalation: dependency approval, browser support decision, or measured 20,000-point target cannot be met within approved architecture
- Required skills: rtk-cli, caveman, agent-delegation-routing, redis-product-ui, redis-vector-search, playwright-test, test-driven-development
- Prompt instruction: Use $agent-delegation-routing if available to confirm role, model/reasoning, ownership, command shape, and fallback before starting.
- Repo/branch: isolated worktree, codex/redis-vector-visualizer
- Owned files: shared sampling/worker/renderer/Atlas components and focused tests/fixtures
- Forbidden files: package/lockfiles absent approved decision; Query Lab; native entry points; geodata; telemetry; CI
- Inputs: E1 contracts and decisions, LayoutJobV1, sample/trust requirements
- Steps:
  1. Write failing deterministic sampling, worker protocol, cancellation/stale-job, cosine normalization, UMAP seed, typed unsupported-algorithm, and renderer interaction tests.
  2. Implement bounded sample budget estimation and pre/post source count freshness checks.
  3. Implement transferable typed-array worker messages and invalidation.
  4. Implement `umap-js@1.4.0` behind the worker adapter; return typed unsupported results for deferred PCA and t-SNE.
  5. Implement WebGL2 points, picking, zoom/pan, shift-drag, resize, context-loss/unsupported state, and DOM table linkage.
  6. Display source/sample counts, method/seed/filter, quality, exactness, freshness, and projection warning.
  7. Measure each pipeline stage at 2,000 and 20,000 points; record device/browser and avoid unsupported performance claims.
- Target API: LayoutJobV1, VectorSample, ViewManifestV1 fields from technical spec.
- Compatibility: no raw vector persistence; no DOM node per large point; angle/global-distance claims prohibited.
- Example test shape: starting job B cancels A; late A completion cannot update state; Shift-drag selects only sample IDs; clicked live neighbor outside sample becomes plotted false.
- Verify:
  - rtk node node_modules/.bin/jest <sampling-worker-renderer-spec-files> -c redisinsight/jest.config.cjs --runInBand
  - rtk yarn type-check:ui
  - rtk yarn lint:ui
  - rtk git diff --check
- Playwright evidence: 1/0/malformed/2,000/20,000 fixtures, light/dark, both viewports, selection/pan/zoom/cancel/context-lost, console clean; performance JSON and screenshots under artifacts/playwright/e3-t1-
- Output: rigid report, measured stage timings, supported-limit claim, artifacts, residual browser risks
- Audit: E5.AUDIT
- Tracking: agent_memory plus tracker E3.T1
- Commit allowed: no

## Task E3.T2: Metadata matrix, X-ray, duplicates, and outliers

- Objective: implement Explore/Health analytics and views using original-space evidence and shared selection.
- Worker role: UI/Data-quality Implementor
- Preferred provider: Codex
- Fallback: direct coordinator
- Requested model: gpt-5.6-terra
- Requested reasoning: medium
- Actual model: unknown until execution
- Actual reasoning: unknown until execution
- Inherited from coordinator: unknown until execution
- Routing reason: bounded analytical calculations and product UI after renderer foundation
- Why sufficient: formulas are named/testable; medium avoids over-routing
- Escalation: health threshold/product decision not specified or algorithm requires a new dependency
- Required skills: rtk-cli, caveman, agent-delegation-routing, redis-product-ui, repository redis-ui-components skill, playwright-test, test-driven-development
- Prompt instruction: Use $agent-delegation-routing if available to confirm role, model/reasoning, ownership, command shape, and fallback before starting.
- Repo/branch: isolated worktree, codex/redis-vector-visualizer
- Owned files: metadata matrix, health calculations/X-ray/duplicate/outlier components and tests
- Forbidden files: worker/renderer except integration through owner; Query Lab; native pages; geodata; manifests/lockfiles
- Inputs: E3.T1 sample/selection contracts, product health rules, allow-listed metadata
- Steps:
  1. Write known-fixture tests for cluster × metadata counts, coverage, duplicate components, outlier rule, visible/configurable default parameters, threshold labels, and Unknown states.
  2. Implement metadata field selection and synchronized matrix/Atlas/Selection state.
  3. Implement X-ray with evidence type, source/sample count, calculation, threshold, and freshness per fact.
  4. Implement duplicate groups and outlier candidates with visible, tested, configurable defaults and direct Selection/inspector linkage.
  5. Add empty/loading/error/partial/stale/unsupported states, keyboard access, tooltips/axes/units, and theme-safe semantic colors.
  6. Prove no sampled metric is presented as source-wide measured truth.
- Compatibility: no automatic deletion/remediation; no opaque health score; content fields remain opt-in.
- Example test shape: missing evidence yields Unknown; duplicate threshold groups A/B/C but not D; selecting matrix cell highlights exact IDs and table rows.
- Verify:
  - rtk node node_modules/.bin/jest <explore-health-spec-files> -c redisinsight/jest.config.cjs --runInBand
  - rtk yarn type-check:ui
  - rtk yarn lint:ui
  - rtk git diff --check
- Playwright evidence: Explore/Health at both viewports/themes, matrix selection, duplicate/outlier inspector, Unknown/stale/empty states; artifacts/playwright/e3-t2-
- Output: rigid report, formula/threshold inventory, screenshots, tests
- Audit: E5.AUDIT
- Tracking: agent_memory plus tracker E3.T2
- Commit allowed: no
