# E5.AUDIT — independent final audit

**Verdict: NOT APPROVED**

Date: 2026-08-08  
Repository: `/private/tmp/redisinsight-vector-visualizer`  
Branch / HEAD / base: `codex/redis-vector-visualizer` / `0b53c6c2fac260ab2d1b439ee23ea6554d9ce8f4` / `0b53c6c2f`  
Open severity: **0 P0, 10 P1**

The work is bounded and repairable, so this is not an environment or decision blocker. Approval is withheld because non-deferred acceptance scenarios in REQ-VV-001, REQ-VV-002, REQ-VV-003, REQ-VV-004, REQ-VV-005, REQ-VV-006, and REQ-VV-007 are not implemented against current executable contracts. In particular, the green fixtures do not use Redis's documented `VSIM` and `VLINKS` reply shapes.

## Independence, routing, ownership, and residual

- Role: fresh independent final Auditor. I did not ask an implementation worker for conclusions and did not adopt E5.T1/E5.T2 dispositions as audit findings.
- Requested provider/model/reasoning: Codex / `gpt-5.6-sol` / high.
- Actual provider/model/reasoning: runtime identifies the agent as Codex but exposes no exact model or reasoning value; exact provider, model, and reasoning are therefore recorded as unknown rather than inferred.
- Inherited: no (`fork_turns=none`).
- Routing: reserved frontier audit for cross-surface architecture, product, privacy, performance, accessibility, and verification integrity. Fallback was a precise `NOT APPROVED`/`BLOCKED` report, never an implementation repair.
- Auditor ownership: read-only inspection plus this report and normal generated read-only command artifacts only. No production, test, config, spec, tracker, index, overview, decision, component, dependency, lockfile, memory, geodata, commit, staging, push, deploy, or Redis write was authorized or performed.
- Active residual restated before work: independently map every non-deferred REQ-VV-001..010 scenario to the current uncommitted filesystem and fresh E5.T2-style evidence; any missing scenario is P0/P1; defects are reported, not repaired.
- Shared memory backend: `agent_memory` was queried for the narrow project/domain. It returned no relevant project memory, so repository anchors and current files remained authoritative. No memory was written.
- RTK: installed `rtk 0.39.0` could not open its gain database (`unable to open database file`, error 14). Direct scoped commands with raw exits were used; this did not block the audit.
- Repository `redis-ui-components` skill: the AGENTS instruction names `.ai/skills/redis-ui-components/`, but that skill is absent in this worktree. I inspected the actual internal `uiSrc/components/...` wrappers and emitted UI instead. No direct feature import from `@redis-ui/*` was found.

## Acceptance-scenario matrix

`PASS` means current code plus current command/artifact evidence covers the exact scenario. `FAIL-P1` identifies a non-deferred scenario covered by a finding below. No scenario is blanket-inherited from a worker report.

| Scenario                                                                                                         | Current code and fresh evidence                                                                                                                                                         | Result                                   |
| ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| REQ-VV-001.1 one-field Search discovery reports index/field/dimensions/metric/algorithm/capabilities             | `searchAdapter.ts:230-305`; `nativeOrchestration.ts:180-263`; current native 3/3 and adapter Jest                                                                                       | PASS                                     |
| REQ-VV-001.2 multi-field Search discovery waits for field choice                                                 | `useListContent.ts`, `VectorFieldPicker.tsx`; focused existing entry tests; E2.T2 evidence                                                                                              | PASS                                     |
| REQ-VV-001.3 Vector Set discovery reports key/dimensions/quantization/graph/capabilities                         | `combineVectorSetDiscovery` obtains quantization, but `nativeOrchestration.ts:348-367` drops it and the native UI never renders it; capabilities declare topology without version proof | **FAIL-P1 F1**                           |
| REQ-VV-001.4 source-specific capability is unavailable without fabricated parity                                 | Search topology and Vector Set metadata unavailable copy in current E5 screenshots; capability types                                                                                    | PASS                                     |
| REQ-VV-002.1 Search Visualize opens native workspace with selected field                                         | list action + process-local handoff; E2.T2/E5 native screenshots                                                                                                                        | PASS                                     |
| REQ-VV-002.2 Vector Set Visualize opens native workspace with key                                                | Vector Set action + binary-safe key handoff; E2.T2/E5 native screenshots                                                                                                                | PASS                                     |
| REQ-VV-002.3 matching Workbench vector command renders executed result                                           | FT.SEARCH/FT.PROFILE/VSIM fixture path passes, but required FT.AGGREGATE/FT.HYBRID commands are neither matched nor parsed                                                              | **FAIL-P1 F3**                           |
| REQ-VV-002.4 non-vector Search is not offered                                                                    | token-aware matcher tests, including plain FT.SEARCH rejection; current 24/143 Jest                                                                                                     | PASS                                     |
| REQ-VV-003.1 selection synchronizes Neighbors/distribution/rank-gap/table/inspector                              | Shared focus state exists, but Neighbors is not radial, distribution is not a distribution, and ready mobile/table equivalence is absent                                                | **FAIL-P1 F4**                           |
| REQ-VV-003.2 FT.PROFILE shows only response-backed stages/counts/modes                                           | `parseSearchProfile` extracts stages, then `workbenchIntegration.ts:206-219` drops them and `QueryLab.tsx:201-205` always says stages unavailable                                       | **FAIL-P1 F5**                           |
| REQ-VV-003.3 VSIM shows a reduced profile without Search stages                                                  | The copy is truthful, but documented RESP2/RESP3 `WITHSCORES` replies parse to no neighbors, so the live scenario cannot reach it                                                       | **FAIL-P1 F1**                           |
| REQ-VV-003.4 live neighbor outside plotted sample is shown not plotted                                           | `nativeOrchestration.ts:457-466`, Query Lab selection/table; Jest coverage                                                                                                              | PASS                                     |
| REQ-VV-004.1 Atlas shows projection, counts, method/seed/filter/freshness/quality                                | All provenance except a measured quality statistic is present; worker always returns `quality: unknown/not-measured` for every real UMAP result                                         | **FAIL-P1 F7**                           |
| REQ-VV-004.2 Shift-drag selects only plotted region                                                              | renderer interaction/indexed-selection implementation and Jest/renderer browser evidence                                                                                                | PASS                                     |
| REQ-VV-004.3 metadata choice updates color and metadata x cluster matrix consistently                            | Matrix updates after allow-listed resampling, but `Explore` never supplies metadata-derived colors/point states to Atlas                                                                | **FAIL-P1 F6**                           |
| REQ-VV-004.4 source count change marks changed while sampled                                                     | before/after count paths in native orchestration; tests                                                                                                                                 | PASS                                     |
| REQ-VV-005.1 bounded Health X-ray shows configuration, duplicate, outlier, metadata coverage, distribution facts | `VectorVisualizerPage.tsx:421-457` X-ray contains only dimensions and metric; no algorithm/quantization/indexed count/rates/coverage/distribution summary                               | **FAIL-P1 F8**                           |
| REQ-VV-005.2 duplicate/outlier selection opens same item in Selection/inspector with rule/provenance             | Explorers only update page `selectedIds`; Health renders no shared Selection/inspector and does not navigate to one                                                                     | **FAIL-P1 F8**                           |
| REQ-VV-005.3 missing evidence renders Unknown/unavailable, not Healthy                                           | typed unknown evidence and current Vector Set mobile artifact                                                                                                                           | PASS                                     |
| REQ-VV-006.1 compatible manifests show comparable drift with provenance                                          | Native `saveManifest` omits every `driftEvidence` field, so all required drift facts are unavailable                                                                                    | **FAIL-P1 F9**                           |
| REQ-VV-006.2 incompatible metrics/dimensions/fields explain without coercion                                     | `compareManifests` checks dimensions/metric/field; E4 compatible/incompatible artifacts                                                                                                 | PASS                                     |
| REQ-VV-006.3 completed benchmark runs show comparable measured recall/latency/memory only                        | Component correctly filters fixture runs, but native integration always passes `runs={[]}` and confirm immediately sets unsupported; no product path can produce a completed run        | **FAIL-P1 F9**                           |
| REQ-VV-006.4 supported Vector Set VLINKS is topology-labelled                                                    | Label is correct, but documented Redis replies cannot be parsed by the executable parser                                                                                                | **FAIL-P1 F2**                           |
| REQ-VV-006.5 Search topology is unavailable absent evidence                                                      | current Search Advanced screenshot and code                                                                                                                                             | PASS                                     |
| REQ-VV-007.1 both themes use RedisInsight tokens and readable semantic states                                    | wrapper/theme usage and light/dark visual artifacts                                                                                                                                     | PASS                                     |
| REQ-VV-007.2 keyboard table gives point-equivalent focus/selection/inspector access                              | Atlas keeps private selection and receives no controlled selected point state; table/matrix selections therefore do not highlight the canvas                                            | **FAIL-P1 F6**                           |
| REQ-VV-007.3 large local selection is virtualized and not paginated                                              | `react-window` is used and there is no pagination; however the fixed 640px ready table contributes to F4's responsive failure                                                           | PASS with F4 residual                    |
| REQ-VV-007.4 empty/loading/error/stale/unsupported/cancelled have visible copy and next action where possible    | typed state copy, cancel/ACL/native and plugin failure artifacts                                                                                                                        | PASS                                     |
| REQ-VV-008.1 embeddings remain memory-only and clear after work/source/unmount                                   | memory store/session clear, Worker transfers, manifest sanitization, executable-path scan                                                                                               | PASS                                     |
| REQ-VV-008.2 exact/truth work shows estimate and confirmation first                                              | Compare preview is explicit and bounded; execution remains unsupported rather than silently running                                                                                     | PASS                                     |
| REQ-VV-008.3 ACL denial is reported without bypass                                                               | current connection executor, ACL categorization, browser state                                                                                                                          | PASS                                     |
| REQ-VV-008.4 plugin exception gives nonblank fallback and safe prefixed log                                      | error boundary and activation guards log only safe category/name facts; Jest                                                                                                            | PASS                                     |
| REQ-VV-009.1 additive native Visualize actions exist                                                             | Search/Vector Set entries and tests                                                                                                                                                     | PASS                                     |
| REQ-VV-009.2 existing routes/tables/forms/editing remain intact                                                  | focused prior-behavior Search/Vector Set tests pass; no schema/public API change                                                                                                        | PASS                                     |
| REQ-VV-009.3 feature off hides actions and route                                                                 | dev flag defaults false; route/action gates and tests                                                                                                                                   | PASS                                     |
| REQ-VV-009.4 rollback requires no Redis migration                                                                | UI-only flag path; no write command or data migration                                                                                                                                   | PASS                                     |
| REQ-VV-010.1 internal package and static assets are registered                                                   | additive Vite registry entry and focused build                                                                                                                                          | PASS                                     |
| REQ-VV-010.2 existing plugin registry remains non-default                                                        | manifest `default:false`; matcher registry tests                                                                                                                                        | PASS                                     |
| REQ-VV-010.3 activation/matching covers the specified vector command family                                      | FT.AGGREGATE and FT.HYBRID are omitted                                                                                                                                                  | **FAIL-P1 F3**                           |
| REQ-VV-010.4 bundle/activation/API evidence exists without changing public API                                   | focused package/native builds and plugin response tests; shared build baseline separately classified                                                                                    | PASS, subject to F3 and bundle F10 below |

## P1 findings and closure contracts

### F1 — documented VSIM replies and Vector Set source facts are not supported

- Severity: P1.
- Exact evidence: `redisinsight/ui/src/packages/vector-visualizer/src/vectorSetAdapter.ts:209-231` accepts only an array of object-like rows containing `name/member` and `score/distance`. `redisinsight/ui/src/packages/vector-visualizer/src/contracts.spec.ts:278-299`, `workbenchIntegration.spec.ts:88-106`, and `e5-t1-fixture/mocks/services.mock.ts:63-65` all use invented record rows. Redis documents `VSIM ... WITHSCORES` as flat juxtaposed element/score values in RESP2 and a map in RESP3: [VSIM return contract](https://redis.io/docs/latest/commands/vsim/). Neither shape is accepted. `nativeOrchestration.ts:145-148,319-325` decodes returned binary members to UTF-8 strings and then re-encodes those strings as command arguments, so arbitrary member bytes are not preserved. `nativeOrchestration.ts:348-367` also discards discovery quantization before UI state.
- Violated gate/REQ: gates 1, 2, 3, 5, 9; REQ-VV-001.3, REQ-VV-003.3; Vector Set live Query Lab, binary-safe plan, and honest source-description contracts.
- User impact: actual native and Workbench VSIM runs become empty instead of visualizing returned neighbors; a green fixture can mask this. Vector Set quantization is discovered but not presented.
- Smallest required fix: parse both documented RESP2 and RESP3 WITHSCORES shapes without converting binary member arguments to lossy strings; replace record-shaped fixtures; carry quantization/capability facts into vector-free page state and source UI.
- Closure command: rerun the authoritative 24-path Jest command with RESP2 flat-pair and RESP3 Map fixtures, then E5 native and Workbench Playwright with those exact serialized replies; assert returned IDs/scores and quantization copy.

### F2 — documented VLINKS replies are not supported

- Severity: P1.
- Exact evidence: `redisinsight/ui/src/packages/vector-visualizer/src/advanced/advanced.ts:23-50` requires each reply entry to contain `layer`, `member/source`, and `links/adjacency`. `advanced.spec.ts:4-42` and `e5-t1-fixture/mocks/services.mock.ts:65-67` encode that invented shape. Redis documents an array of per-layer adjacent-element arrays (or maps only when WITHSCORES is requested): [VLINKS return contract](https://redis.io/docs/latest/commands/vlinks/). The plan at `vectorSetAdapter.ts:143-144` does not request WITHSCORES and the selected source member is not passed to the parser.
- Violated gate/REQ: gates 1, 2, 3, 5, 9; REQ-VV-006.4.
- User impact: actual Advanced topology resolves to malformed even when Redis returns valid adjacency.
- Smallest required fix: accept documented RESP2/RESP3 per-layer arrays, pass the selected source member separately, preserve binary targets, retain the topology-only label, and replace fixtures.
- Closure command: targeted `advanced.spec.ts` plus authoritative 24/143 Jest, then E4.T2 and E5 native Playwright using documented nested-array replies and asserting every displayed layer/source/target.

### F3 — Workbench omits required FT.AGGREGATE and FT.HYBRID entry commands

- Severity: P1.
- Exact evidence: `redisinsight/ui/src/packages/vector-visualizer/package.json:16-24` lists only FT.SEARCH, FT.PROFILE, and VSIM. `workbenchIntegration.ts:67-95` rejects every verb except VSIM/FT.SEARCH/FT.PROFILE. The product entry contract explicitly includes FT.AGGREGATE and FT.HYBRID.
- Violated gate/REQ: gates 1, 2, 3, 7, 9; REQ-VV-002.3, REQ-VV-010.3.
- User impact: valid vector aggregate/hybrid results never offer or render Vector visualizer.
- Smallest required fix: add non-conflicting manifest matchers and token-aware parsers for supported vector FT.AGGREGATE/FT.HYBRID result shapes, retaining safe PARAMS redaction and non-default activation.
- Closure command: package matcher/plugin registry regressions, parser Jest for positive and non-vector negative shapes, authoritative 24/143 Jest, and Workbench build-preview Playwright for both added verbs.

### F4 — Query Lab's named charts are not the specified visualizations and its ready table is not mobile-proven

- Severity: P1.
- Exact evidence: `QueryLab.tsx:51-59,140-189` renders a wrapping row of buttons whose size is transformed by the metric; there is no query center, radial coordinate, threshold ring, axis, histogram, or bounded source-space comparison. `SelectionTable.tsx:11-13,98-104` fixes the virtual list to 640px. Current `e2-t3-light-1440x900.png` visibly shows two small buttons rather than a radial view and clipped virtual-row content; the only 390x844 Workbench screenshot is an empty/failure state, not ready Query Lab.
- Violated gate/REQ: gates 1, 5, 9; REQ-VV-003.1, REQ-VV-007.2 and responsive 390x844 product gate.
- User impact: radius is represented as mark size rather than distance from a centered query, “Similarity distribution” is a rank list, and the operational table can overflow/clamp on mobile.
- Smallest required fix: implement a query-centered radial layout with monotonic radial position, named rings and metric tooltip; implement an actual labelled distribution comparing results with a bounded source sample; make the virtual list container-responsive while retaining virtualization.
- Closure command: component interaction/accessibility Jest plus Workbench build-preview Playwright in light/dark at 1440x900 and ready 390x844; assert center/rings/axis/bin selection and table/inspector linkage without horizontal viewport overflow.

### F5 — response-backed FT.PROFILE iterator stages are discarded

- Severity: P1.
- Exact evidence: `searchAdapter.ts:371-386` parses `stages`, but `workbenchIntegration.ts:206-219` returns only `facts`; `QueryLab.tsx:201-205` hard-codes “Iterator stages unavailable” for every full profile.
- Violated gate/REQ: gates 1, 2, 3, 5; REQ-VV-003.2.
- User impact: Redis-supplied iterator evidence disappears and the UI states it is unavailable.
- Smallest required fix: carry sanitized response-backed stages through the Query Lab profile contract and render their returned names/counts/modes; keep missing fields unavailable and never infer traversal/HNSW behavior.
- Closure command: FT.PROFILE RESP2/RESP3 parser/component Jest containing real stages plus Workbench Playwright asserting returned stage text and absence of fabricated stages.

### F6 — Atlas, metadata matrix, and accessible selection are not actually linked

- Severity: P1.
- Exact evidence: `VectorVisualizerPage.tsx:250-275` passes no controlled `selectedIds` or metadata-derived `pointStates/colors` to Atlas. `Atlas.tsx:53-67,82-107,159` owns private selection state. Matrix/table actions update page state, but the canvas renderer never receives that selection; changing metadata updates the matrix only (`VectorVisualizerPage.tsx:336-347`).
- Violated gate/REQ: gates 1, 3, 5; REQ-VV-004.3, REQ-VV-007.2.
- User impact: keyboard/table/matrix selection is not point-equivalent and color does not encode the selected allow-listed metadata field as promised.
- Smallest required fix: make selected IDs and metadata colors controlled shared state, derive non-color marker state for selection, and feed identical state to renderer, table, matrix, and inspector.
- Closure command: Atlas/Explore Jest starting selection from table and matrix, renderer state assertions, and E5 Playwright verifying visible canvas state plus accessible selected-ID/inspector state in both themes.

### F7 — every real UMAP layout reports no neighborhood-quality measure

- Severity: P1.
- Exact evidence: `worker/layout.ts:147-158` always returns `{kind:'unknown', reason:'not-measured'}` after a successful multi-point UMAP fit. Fresh 2k/20k runs exercise this code but do not compute a quality metric.
- Violated gate/REQ: gates 1, 3, 6; REQ-VV-004.1 and the core Atlas quality contract.
- User impact: the required projection-quality evidence is never available for any supported sample.
- Smallest required fix: compute a named, bounded, documented neighborhood preservation measure in the Worker against original-space neighbors, including sample/k/exactness provenance and typed insufficient-evidence fallback.
- Closure command: deterministic worker Jest with known good/bad layouts and fresh E3/E5 performance/browser runs asserting the named quality value and provenance.

### F8 — Health does not implement the X-ray or Selection/inspector acceptance paths

- Severity: P1.
- Exact evidence: `VectorVisualizerPage.tsx:421-457` supplies X-ray only dimensions and source metric; it omits algorithm/quantization/indexed count, duplicate/outlier rates, metadata coverage, and score distribution. `:465-474` forwards explorer selection to `selectedIds`, but the Health workflow renders neither Selection nor the shared inspector.
- Violated gate/REQ: gates 1, 3, 5; REQ-VV-005.1 and REQ-VV-005.2.
- User impact: a candidate can be selected but cannot be inspected with its rule/source record in the Health workflow, and the advertised X-ray is incomplete.
- Smallest required fix: compose response-backed configuration and bounded computed rates/coverage/distribution into X-ray; link candidate selection to the shared virtualized Selection and inspector with calculation rule/provenance. Preserve Unknown for missing evidence and disclose the 200/k10 cap.
- Closure command: Health integration Jest for available/unknown evidence plus E5 Playwright selecting a duplicate and outlier and asserting X-ray facts, shared inspector, formula, sample size, k, freshness, and exactness.

### F9 — native Compare saves no drift evidence and cannot produce a completed benchmark run

- Severity: P1.
- Exact evidence: `VectorVisualizerPage.tsx:755-781` saves counts and projection facts but no `driftEvidence`; `compare.ts:271-315` therefore marks all seven required drift facts unavailable. `VectorVisualizerPage.tsx:888-894` always passes `runs={[]}` and confirmation only changes status to unsupported.
- Violated gate/REQ: gates 1, 3, 5; REQ-VV-006.1 and REQ-VV-006.3.
- User impact: two product-generated compatible manifests cannot show the promised drift, and the product has no route from controlled confirmation to completed measured Pareto evidence.
- Smallest required fix: save vector-free, provenance-labelled drift facts derived from the bounded sample; either implement the bounded read-only measured benchmark path or explicitly defer/remove that non-deferred acceptance surface by product decision. Never fabricate memory/recall/latency.
- Closure command: native manifest/Compare Jest using manifests created through the page and E5 Playwright showing at least comparable drift; if benchmark remains in scope, execute a controlled fixture benchmark through confirmation and assert measured-only Pareto inclusion.

### F10 — emitted bundles make third-party font requests and omit the approved UMAP license notice

- Severity: P1.
- Exact evidence: current focused output `artifacts/playwright/e5-t1-vite/assets/e5-t1-BAYbZU8i.css:1` and package `ui/src/packages/vector-visualizer/dist/styles.css:1` contain three `https://fonts.googleapis.com` imports. The real worker `artifacts/playwright/e5-t1-vite/assets/layout.worker-5-U7jR9_.js` contains UMAP code but no `Apache License`, `PAIR-code`, or `umap-js` notice. Installed `umap-js@1.4.0` metadata says MIT (`node_modules/umap-js/package.json:9`) while its shipped `LICENSE:2` is Apache-2.0, the exact mismatch already acknowledged by the approved decision. All transitives declare and ship MIT notices.
- Violated gate/REQ: gates 4, 8, 9; product privacy rule “No hidden network calls” and technical requirement to preserve upstream notices.
- User impact: opening the emitted feature can contact Google font endpoints, and distribution does not preserve the dependency's shipped license notice.
- Smallest required fix: exclude remote font imports from the plugin/native feature output or use already-packaged local fonts; emit the `umap-js` shipped license/notice alongside every worker/package distribution and resolve the MIT-vs-Apache declaration in the distribution notice without inventing a license.
- Closure command: fresh focused native and package builds; fail on any `https://`, `@import url`, `fonts.googleapis.com`, `fonts.gstatic.com` in emitted VV assets; assert a distributed UMAP license/notice; Playwright network interception must observe zero third-party requests.

## Gates with no additional blocking finding

- Read-only execution: the native executor checks both `readOnly` and a narrow allowlist; Workbench explicit follow-up accepts only bounded vector reads and rejects known write verbs. No accepted write plan was found.
- Cancellation/staleness/memory: source changes and cancel abort the current native request, terminate the active Worker, increment generation, reject stale completions, and clear the vector store. Raw vector values are not placed in URL/history, logs, telemetry, clipboard, local manifest, export, or plugin SDK state.
- Renderer mechanics: current code uses a dedicated real Worker, WebGL2, resize/context loss and restoration hooks, indexed picking, and non-color marker shapes. The controlled-selection integration gap is isolated as F6.
- Source truth: Search and Vector Set remain distinct adapters and filter syntaxes. FT.PROFILE facts are response-backed; VLINKS is labelled HNSW adjacency and never semantic neighbors; no Search HNSW traversal or sampled-global-geometry claim was accepted.
- Projection scope: UMAP is the only executable v1 algorithm; PCA and t-SNE return typed unsupported results and are correctly deferred.
- Feature compatibility: feature-off routing/actions preserve prior behavior in focused tests; package activation remains internal and non-default; no public Redis API, backend data path, schema, CI, or build-policy change was found.
- Privacy source scan: no feature-source `fetch`, XHR, WebSocket, beacon, third-party telemetry, clipboard write, or sensitive URL/history state was found. F10 is specifically the emitted CSS network path that source-only scans missed.
- Geodata/scope: the protected geodata diff is empty; no production file or dependency outside the approved surfaces/inventory was found.

## Changed-surface and ownership audit

The audit used `git status --short`, tracked diff, and explicit filesystem traversal because all feature work is uncommitted and much of it is untracked.

- API/config: only the approved dev feature flag config, known-feature constants/provider, and focused tests are modified. No new backend module, database schema, Redis public API, or CI workflow exists.
- Native route/flag: additive page/route/feature-flag constants, route registration, process-local source handoff, page orchestration, and tests.
- Native entry surfaces: Search list field picker/action and Vector Set detail/subheader actions/tests. Feature-off gates preserve prior UI paths.
- Package/plugin: approved `umap-js@1.4.0`, exact lock graph, additive internal Vite registry, non-default local package, SDK bridge, matcher/parser, Query Lab, Worker, renderer, Explore/Health/Compare/Advanced, and tests/config fixtures.
- E2E/evidence: untracked vector-visualizer Playwright configs/specs and generated artifacts. Generated `dist`, Vite outputs, screenshots, reports, and test-results are evidence/build products, not source.
- Dependencies: only direct `umap-js@1.4.0`; exact resolved transitives are `ml-levenberg-marquardt@2.1.1`, `ml-matrix@6.14.0`, `ml-array-rescale@2.0.0`, `ml-array-max@2.0.0`, `ml-array-min@2.0.0`, `is-any-array@0.1.1`, and nested `is-any-array@3.0.0`. Lock metadata declares MIT for all; installed license files are MIT for transitives, while UMAP's installed file is Apache-2.0 as covered by F10. No install or dependency mutation was run.
- No direct feature import from `@redis-ui/*`; actual code uses internal wrappers plus styled-components. No Elastic UI addition or `!important` was found. A few raw `div`/hardcoded dimensions remain standards debt, with the material responsive instance captured in F4.
- No accepted Redis write command exists. Native allowlist is read-only and Workbench follow-up rejects writes. No Redis command of any kind was executed by this audit.
- No source XHR/fetch/WebSocket/telemetry/clipboard/history-sensitive-state path was found. The emitted CSS third-party network path is F10. Raw embeddings are confined to session/Worker typed arrays and sanitized out of manifests/logs; fixture vector values were not found as retained product evidence payloads.
- `git diff --name-only -- redisinsight/ui/src/packages/geodata` is empty. Protected geodata was not edited.
- No commit exists: HEAD equals base. No stage, commit, push, main switch, or deployment occurred.

## Command and artifact matrix

| Gate                                               | Current independent result                                                                                     | Interpretation                                                                                         |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Authoritative package-aware Jest                   | PASS, exit 0, 24/24 suites, 143/143 tests, 19.24s                                                              | Current, but official-shape fixture gaps F1/F2 remain                                                  |
| E5 native Chromium                                 | PASS, exit 0, 3/3, 10.8s                                                                                       | Search light desktop; Vector Set dark mobile; cancel/ACL; invented reply fixtures do not close F1/F2   |
| Workbench build-preview Chromium                   | PASS, exit 0, 2/2, 9.1s                                                                                        | Supersedes E5.T2's initial optimize-dep red; ready desktop plus mobile failure state, not mobile ready |
| Advanced build-preview Chromium                    | PASS, exit 0, 2/2, 7.6s                                                                                        | Supersedes E5.T2's initial SDK-alias red; fixture topology is not a Redis reply                        |
| Renderer/Worker/performance Chromium               | PASS, exit 0, 3/3, 12.3s                                                                                       | Current fixture-only measurements below; real worker chunk emitted                                     |
| Fresh 2k UMAP fixture                              | 1,640.4ms layout; 30.0ms transfer; 1.4ms first render                                                          | Chromium 149, 2 dimensions, fixture vectors; sampling not run                                          |
| Fresh 20k UMAP fixture                             | 8,587.5ms layout; 44.7ms transfer; 16.1ms first render                                                         | Chromium 149, 2 dimensions, fixture vectors; no browser/server/high-dimensional extrapolation          |
| Focused native bundle                              | PASS during E5 run; `layout.worker-5-U7jR9_.js` 109,217 bytes and main JS 4,727,114 bytes; large-chunk warning | Real Worker asset; F10 license/network output remains                                                  |
| Sampling range                                     | Code enforces integer 500..20,000 and default 2,000                                                            | Explicit; no live Redis sampling/performance claim                                                     |
| Health bounds                                      | Code caps original-space cosine candidate work at 200 records and k=10; UI discloses maximum 200               | Honest but incomplete X-ray/inspector per F8                                                           |
| E2E TypeScript / production lint / Prettier / diff | E5.T2 final evidence PASS                                                                                      | No current contradictory artifact observed                                                             |
| Official UI typecheck                              | E5.T2 raw exit 1, comparator 1,311 errors, zero VV paths                                                       | Baseline only; not called a feature pass                                                               |
| Shared multi-plugin build                          | Baseline blocked resolving `leaflet/dist/leaflet.css` in protected geodata                                     | Preserved exception; not attributed to VV and not repaired                                             |
| Geodata diff                                       | exit 0, empty                                                                                                  | Protected boundary preserved                                                                           |

Verification integrity: the first E5.T2 generic-root Jest 23/24, Workbench 1/2 optimize-dependency failure, and Advanced unresolved-SDK run are historical superseded reds. The final authoritative package-aware command is exactly the 24 explicit spec paths piped to `jest.query-lab.config.cjs`, and it is 24/143. Workbench and Advanced use build-preview, strict loopback ports, readiness URLs, `reuseExistingServer:false`, and no fixed waits. Raw command exits above were not RTK-masked.

## Visual inspection

- `e5-t1-search-light-1440x900.png`: nonblank Search Advanced state and honest unavailable topology/profile copy; very sparse layout.
- `e5-t1-vector-set-dark-390x844.png`: readable dark mobile layout and correct “HNSW layer adjacency, not semantic nearest-neighbor truth” copy, but its row comes from the invented VLINKS fixture.
- `e2-t3-light-1440x900.png` and dark counterpart: nonblank Workbench Query Lab; confirm F4 (no centered radial plot or distribution chart) and visible selection-row clipping.
- `e2-t3-mobile-fail-390x844.png`: valid mobile failure state only; it does not prove ready Query Lab at 390x844.
- `e4-t2-vector-light-1440x900.png` and dark 390x844 counterpart: readable labelled Advanced fixture; does not close the executable VLINKS mismatch.

No visual artifact shows a current ready Workbench mobile layout, a real Redis-shaped Vector Set response, Atlas selection initiated from keyboard/table, a measured UMAP quality value, Health-to-inspector linkage, product-generated drift facts, or a completed product benchmark.

## Baseline exceptions and non-blocking residuals

- Protected shared-build baseline: canonical geodata cannot resolve Leaflet CSS. No geodata fix is authorized or required for this audit verdict.
- Official aggregate UI typecheck: raw exit 1 with 1,311 unrelated package errors and zero Vector Visualizer paths. This is neither a VV pass nor a VV defect.
- Origin/main drift was not material: HEAD equals the supplied base and no incompatibility requires a rebase for this uncommitted audit.
- Sampling, UMAP, transfer, and render timings are fixture/browser measurements only. They do not prove Redis server cost, Electron performance, high-dimensional performance, or production readiness.
- Vector Set metric remains Unknown rather than inferring Search parity; VLINKS remains topology-labelled; no HNSW traversal/global-geometry/source-wide-statistic claim was accepted.
- UMAP is the sole v1 projection; PCA and t-SNE remain typed unsupported/deferred. No projection selector is required.

## Safety statement

This was a read-only implementation audit except for this single report and normal generated command artifacts. I executed no Redis command, accepted no Redis write path, installed no dependency, changed no implementation/test/config/spec/tracker/index/overview/decision/component/memory/geodata file, and performed no stage, commit, push, branch/default-branch mutation, deployment, or external write. Raw embeddings were not copied into this report.

Approval requires closure of every P1 above, replacement of invented response fixtures with documented Redis shapes, current reruns of the named closure gates, and a fresh independent E5.AUDIT showing every non-deferred scenario covered with no open P0/P1.
