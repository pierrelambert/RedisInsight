# E5.AUDIT4 — fourth independent final audit

**Verdict: NOT APPROVED — 0 P0, 1 P1, 4 P2.**

Date: 2026-08-08  
Repository: `/private/tmp/redisinsight-vector-visualizer/redisinsight` (git root `/private/tmp/redisinsight-vector-visualizer`)  
Branch: `codex/redis-vector-visualizer`  
Audited HEAD: `0b53c6c2fac260ab2d1b439ee23ea6554d9ce8f4`  
Current `origin/main`: `f39c7b868f3f2a67a99970e2f56683b3ad9986c7`

## Identity, routing, ownership, and final re-anchor

- Provider: Codex. Requested model: `gpt-5.6-sol`. Requested reasoning: high. Actual model: unknown because the runtime does not expose it. Actual reasoning: unknown for the same reason. Inheritance: unknown because the spawn path is not observable from this worker. These fields are reported separately rather than treating requested routing as observed runtime identity.
- Role: direct fresh independent Auditor; no subagents. Frontier/high routing is proportionate to the cross-layer Redis reply, privacy, and release-approval challenge. Fallback was coordinator-owned read-only audit.
- Command shape: read-only inspection and exact raw commands. `rtk 0.39.0` was installed, but mandatory `rtk gain` failed SQLite error 14, so scoped raw commands were used. No Redis command was executed.
- Ownership: implementation, tests, configuration, specifications, index/tracker, and memory remained read-only. This report is the only authored source-tree file. No repair, dependency action, backend/public-API/CI/build-policy change, geodata action, stage, commit, push, or deploy occurred.
- Shared Agent Memory was searched with `namespace=repo-redisinsight`, `user_id=pierre`; it supplied plan orientation only. No memory was written. Repository anchors and the current tree governed the result.
- The charter resume ritual was performed at start and again before this report: `charter.md`, `00-index.md`, `tracker.md`, `components.md`, `decisions.md`, the active E5 epic, three source specifications, all prior E5 audit reports, `e5-verify6-report.md`, and current source/tests/artifacts were read. The active residual was a final independent verdict over the exact E5.VERIFY6-ready tree.
- HEAD is the merge base with `origin/main` and is behind it by one commit (`0 1`). No merge/rebase was performed or implied.

## Executive result

E5.REPAIR3 genuinely closes AUDIT3 P1-02: ordinary Workbench `VSIM` keeps adapter-proven `approximate` exactness through `WorkbenchQueryRun` and the Query Lab DOM, while Search remains `unknown` without algorithm evidence. It also closes the outer `FT.PROFILE` tuple/map and SEARCH/AGGREGATE/HYBRID matching boundaries.

Approval is still blocked because the claimed Redis-7 profile fixture is not exact. Current tests add one array level around the iterator record. The repository's exact Redis 7 fixture provides one flat pair-array (`["Type", "WILDCARD", ..., "Counter", 10]`), and Redis 8 provides the same iterator inside `Shards`/`Coordinator`. The current parser silently returns no stages for either. This drops response-backed iterator type and count, violating REQ-VV-003.2 even though the result rows render and all fixture-driven tests pass.

## Complete non-deferred acceptance matrix (40/40)

| Scenario | Current source plus fresh command/artifact evidence | Result |
| --- | --- | --- |
| REQ-VV-001.1 one-field Search discovery | `searchAdapter.ts`, `nativeOrchestration.ts`; all-VV Jest 30/30 suites and native focused Jest | PASS |
| REQ-VV-001.2 multi-field Search waits for field choice | `VectorFieldPicker.tsx`; entry tests | PASS; P2-02 remains |
| REQ-VV-001.3 Vector Set discovery | `vectorSetAdapter.ts`, native orchestration; VINFO tests and E5 Chromium | PASS |
| REQ-VV-001.4 source-only capability honesty | Separate adapters; Search topology unavailable and Vector Set-only facts | PASS |
| REQ-VV-002.1 Search native entry | list-content handoff/action and route tests; E5 Search desktop artifact | PASS |
| REQ-VV-002.2 Vector Set native entry | binary-safe handoff/action tests; E5 Vector Set mobile artifact | PASS |
| REQ-VV-002.3 matching Workbench vector command renders Query Lab | `commandKind`, `profileResults`, registry matcher; focused 3/58 Jest and E2.T3 Chromium 3/3 | PASS; profile content is separately blocked below |
| REQ-VV-002.4 non-vector Search is not offered | token-aware parser/matcher negatives in focused Jest | PASS |
| REQ-VV-003.1 synchronized Query Lab selection | Query Lab evidence/store/table/inspector tests; inspected desktop/mobile artifacts | PASS |
| REQ-VV-003.2 response-backed FT.PROFILE stages/counts/modes | `searchAdapter.ts:371-422`; exact Redis-7/Redis-8 probes return `stages: []` | **FAIL — A4-P1-01** |
| REQ-VV-003.3 reduced VSIM profile | `workbenchIntegration.ts:253-270`; exact probe returns only `Result count` and no Search stages | PASS |
| REQ-VV-003.4 unplotted live neighbor state | native overlay/selection and Query Lab tests | PASS |
| REQ-VV-004.1 Atlas projection/count/config/freshness/quality | seeded UMAP Worker and native evidence tests; emitted Worker; E5 Chromium | PASS |
| REQ-VV-004.2 Shift-drag plotted-region selection | renderer interaction/index tests | PASS |
| REQ-VV-004.3 metadata color/matrix linkage | shared point state and `MetadataMatrix` tests | PASS; P2-04 remains |
| REQ-VV-004.4 changed-while-sampled state | before/after count and stale-generation orchestration tests | PASS |
| REQ-VV-005.1 bounded Health X-ray | metric-aware source/duplicate/outlier/coverage/distribution evidence and inspected Health screenshot | PASS |
| REQ-VV-005.2 Health selection/inspector linkage | shared selection and Health inspector tests/artifact | PASS |
| REQ-VV-005.3 missing evidence is Unknown/unavailable | typed fallback branches and E5 evidence | PASS |
| REQ-VV-006.1 compatible manifest drift | vector-free stable digests and compare tests/artifact | PASS |
| REQ-VV-006.2 incompatible manifest explanation | `compareManifests` gates and tests | PASS |
| REQ-VV-006.3 comparable measured benchmark evidence | bounded ordinary VSIM then TRUTH, overlap/client latency, memory unavailable; E5 mobile artifact | PASS; P2-01 remains |
| REQ-VV-006.4 VLINKS is topology | nested layer parser and topology labels/tests | PASS |
| REQ-VV-006.5 Search topology unavailable | explicit unavailable UI; no traversal inference | PASS |
| REQ-VV-007.1 theme/token/readable states | internal wrappers/tokens; fresh light/dark desktop/mobile screenshots | PASS; P2-04 remains |
| REQ-VV-007.2 keyboard-equivalent point access | virtual grid keyboard/active-descendant tests | PASS; P2-03 tabs remain |
| REQ-VV-007.3 virtualized large selection | `react-window` grid and tests | PASS |
| REQ-VV-007.4 visible operational states | component states plus E2.T3 mobile and E5 cancel/ACL Chromium | PASS |
| REQ-VV-008.1 memory-only embeddings | generation cleanup plus vector-free state/manifest/privacy scans | PASS |
| REQ-VV-008.2 truth estimate/confirmation | confirm precedes bounded reads; native benchmark tests | PASS; P2-01 preview remains |
| REQ-VV-008.3 ACL denial without bypass | executor classification and E5 Chromium | PASS |
| REQ-VV-008.4 plugin exception fallback/safe log | host/error-boundary tests and payload-free production scan | PASS |
| REQ-VV-009.1 additive Visualize actions | Search and Vector Set entry source/tests | PASS |
| REQ-VV-009.2 prior routes/tables/forms remain | additive handoff/route and 14/128 native/entry regression tests | PASS |
| REQ-VV-009.3 feature off hides actions/route | dev flag defaults off and feature tests | PASS |
| REQ-VV-009.4 rollback has no Redis migration | UI flag/route only; scope/write scans | PASS |
| REQ-VV-010.1 package/assets registered | package registry; two focused Vite builds | PASS |
| REQ-VV-010.2 registry non-default/non-conflicting | manifest `default:false`; matcher/registry focused Jest | PASS |
| REQ-VV-010.3 specified vector command matching | direct/profiled SEARCH/AGGREGATE/HYBRID and VSIM positive/unsafe-negative tests | PASS |
| REQ-VV-010.4 bundle/activation/API without public API change | focused bundles/Chromium; existing CLI executor; scoped backend diff | PASS |

All 40 non-deferred scenarios are mapped. Deferred Search HNSW traversal, unconditional Workbench Atlas, PCA, t-SNE, continuous monitoring, and automatic tuning remain excluded exactly as specified.

## Historical finding challenge ledger

| Prior finding | Current source plus fresh evidence | Disposition |
| --- | --- | --- |
| Audit1 F1 VSIM RESP/binary/VINFO | `vectorSetAdapter.ts`; parser/native suites | CLOSED |
| Audit1 F2 VLINKS nesting | Advanced parser/orchestration suites | CLOSED |
| Audit1 F3 AGGREGATE/HYBRID Workbench | `commandKind`; focused Workbench/matcher suite | CLOSED |
| Audit1 F4 Query Lab evidence/grid | Query Lab source/tests and fresh screenshots | CLOSED |
| Audit1 F5 profile stages | Exact Redis 7/8 probes lose stages | **OPEN as A4-P1-01** |
| Audit1 F6 Atlas/matrix/table linkage | controlled state and component/browser evidence | CLOSED |
| Audit1 F7 UMAP quality | Worker quality tests and emitted Worker | CLOSED |
| Audit1 F8 Health completeness | native Health source/tests/screenshot | CLOSED |
| Audit1 F9 drift/benchmark reachability | compare/native benchmark tests/browser | CLOSED; P2-01 disclosure remains |
| Audit1 F10 fonts/notices | fresh builds: zero Google-font/`@import`; Worker/license/notice present | CLOSED |
| Audit2 P1-01 RESP3 VSIM Map | adapter/Workbench tests | CLOSED |
| Audit2 P1-02 fabricated Query Lab evidence | numeric response-backed evidence tests/browser | CLOSED |
| Audit2 P1-03 false benchmark memory | unavailable memory and empty Pareto state | CLOSED |
| Audit2 P1-04 manifest provenance | vector-free identity/sample digests/tests | CLOSED |
| Audit2 P1-05 IP UMAP | metric-specific Worker tests | CLOSED |
| Audit2 P1-06 L2/IP Health | metric-aware Health tests | CLOSED |
| Audit2 P1-07 VINFO max level | allow-listed discovery evidence/tests | CLOSED |
| Audit2 P1-08 virtual-grid hierarchy | grid roles/keyboard tests | CLOSED |
| Audit2 P1-09 Search exactness | native FLAT/HNSW/unknown tests | CLOSED |
| VERIFY4 P1-10 lint/case collision | exact root lint exits 0; authoritative 30-path Jest includes the sole advanced-view spec | CLOSED |
| Audit3 P1-01 real FT.PROFILE | tuple/map and profiled HYBRID boundaries close, but exact flat Redis 7 and wrapped Redis 8 iterator stages fail | **OPEN as A4-P1-01** |
| Audit3 P1-02 VSIM exactness | exact probe: VSIM `approximate`, Search `unknown`; main integration tests/Chromium | CLOSED |

## Blocking finding

### A4-P1-01 — exact Redis profile iterator shapes silently lose response-backed stage/count evidence

- **Severity:** P1.
- **Exact source evidence:** `searchAdapter.ts:371-422` converts top-level pair arrays but assumes every `Iterators profile` array element is a complete stage. At lines 396-400 it calls `toRecord` separately on `"Type"`, `"WILDCARD"`, `"Time"`, and so on, producing no stage. Recursive visitation does not recover that record. `workbenchIntegration.ts:284-297` can only render stages returned by that parser.
- **Exact fixture evidence:** `ri-explain/test-data/result-profile_r7.json:19-29` contains `['Iterators profile', ['Type','WILDCARD','Time','0','Counter',10]]`. `result-profile_r8.json:19-41` wraps a flat shard profile and the same iterator record under `Shards`, with `Coordinator: []`.
- **Fixture/test gap:** `workbenchIntegration.spec.ts:147-176` labels its case “ri-explain Redis 7” but inserts an extra array level around the iterator pair-array. `e2-t3.fixture.tsx:39-46` also uses a nested list of stage arrays. Their green results do not challenge the exact repository shapes.
- **Fresh semantic probe:** a read-only `node --import tsx` probe imported current `parseWorkbenchQueryRun`, loaded both repository JSON fixtures, retained each exact profile portion, and substituted only one scored KNN result so Query Lab could reach profile rendering. Redis 7 returned `kind=ready`, three top-level timing facts, `stages=[]`; Redis 8 returned `kind=ready`, `facts={}`, `stages=[]`; profiled HYBRID with the exact Redis-7 profile also returned `stages=[]`. The expected response-backed Redis-7/Redis-8 stage is `WILDCARD` with count `10`.
- **Timing-fact disposition:** nested Redis-8 timing facts are not a separate hard requirement of REQ-VV-003.2; the technical specification says such latency facts *may* be shown when actually present. Their loss demonstrates incomplete wrapper traversal but is not independently counted as another blocker. If retained, they must be response-backed. The mandatory blocker is loss of the actual iterator stage/count; mode should be preserved when a fixture supplies it and remain absent otherwise.
- **Violated requirement/gates:** REQ-VV-003.2; response-backed profile semantics, exact-fixture, cross-RESP/version, and semantic-probe gates. The green compile/tests/browser fixture cannot substitute for actual emitted shape behavior.
- **User impact:** real Redis 7/8 Search, Aggregate, or Hybrid profile results can show a “Measured Search profile” without the Redis-returned iterator and count, making retrieval diagnosis materially incomplete.
- **Smallest closure:** normalize both (a) one flat iterator pair-array and (b) an array of stage pair-arrays; traverse RESP2 pair arrays plus Redis 8 shard/coordinator wrappers without treating result processors as iterator stages; preserve named type/count/mode only when present. Replace the claimed exact test with imported or byte-for-byte adapted Redis 7 and Redis 8 fixtures.
- **Closure command:** rerun the exact parser probe and assert Redis 7 and Redis 8 each yield `WILDCARD/count=10`, coordinator/shard wrappers do not fabricate stages, result processors remain excluded, top-level/nested timing facts follow an explicit supported policy, and absent mode remains absent. Then rerun focused Workbench/matcher Jest, authoritative all-VV Jest, E2.T3 Chromium with exact fixtures, lint, and privacy/redaction scans.
- **Residual risk:** FT.PROFILE varies across Redis/Search and RESP versions. Closure needs a small versioned fixture corpus for flat, nested, RESP3 map/client, empty, malformed, ACL, coordinator/shard, and profiled SEARCH/AGGREGATE/HYBRID shapes. This local fixture audit is not live Redis/Cloud parity.

## Non-blocking AUDIT3 P2 dispositions

- **P2-01 benchmark preview transparency — OPEN, non-blocking.** `compare/compare.ts:414-415` previews only the truth command, `CompareTune.tsx:260-270` says singular “Read-only command,” while `nativeBenchmark.ts` executes ordinary VSIM then TRUTH. Smallest fix: preview both bounded commands in order and identify which latency is measured.
- **P2-02 field-picker dialog/focus semantics — OPEN, non-blocking.** `VectorFieldPicker.tsx:21-51` remains a visual overlay without dialog naming, initial/contained focus, Escape, or focus return. Buttons remain reachable and the required selection path works.
- **P2-03 workflow-tab roving keys — OPEN, non-blocking.** `VectorVisualizerPage.tsx:1226-1245` supplies tab roles/relationships but not roving `tabIndex` or Arrow/Home/End behavior. The explicit minimum keyboard acceptance still passes through reachable buttons and the linked point table.
- **P2-04 heatmap contrast/layout-token debt — OPEN, non-blocking.** `MetadataMatrix.tsx:10-17,144-158` applies intensity opacity to text and fill together; current screenshots are readable and labels are not color-only, but no computed low-positive contrast proof exists. Previously identified hardcoded layout-token debt also remains.

## Fresh executable and artifact evidence

| Gate | Fresh result |
| --- | --- |
| Exact Audit3 semantic probes | Exact Redis 7: ready, facts retained, `stages=[]`; Redis 8 shard/coordinator: ready, `facts={}`, `stages=[]`; profiled HYBRID: ready but `stages=[]`; ordinary VSIM: `approximate`; Search: `unknown` |
| Authoritative all-VV Jest | Explicit sorted 30-path command with `jest.query-lab.config.cjs`: **30/30 suites, 202/202 tests**, exit 0, 23.494 s |
| Workbench/main/matcher Jest | `workbenchIntegration.spec.ts`, `main.spec.tsx`, `plugins.spec.ts`: **3/3 suites, 58/58 tests**, exit 0 |
| Native/entry/feature Jest | Exact current paths across two bounded invocations after correcting three stale path spellings: **14/14 suites, 128/128 tests**, exit 0 |
| API feature suites | **2/2 suites, 15/15 assertions pass**, but Jest retained an open handle and required interruption after its completion warning; explicitly **not a clean process pass** |
| Exact root package-aware lint | `node_modules/.bin/eslint --config .eslintrc.js --no-ignore --max-warnings=0 redisinsight/ui/src/packages/vector-visualizer/src redisinsight/ui/src/pages/vector-visualizer`: exit 0 |
| Format and E2E types | Scoped Prettier: exit 0. `npm run type-check --prefix tests/e2e-playwright`: exit 0 |
| Focused builds | E2.T3 Vite: 3,385 modules, exit 0. E5 Vite: 3,421 modules, emitted `layout.worker-BHqMKI-T.js`, exit 0. Standard large-chunk warning only |
| Fresh Chromium | E2.T3 **3/3**, E5 native **3/3**, both Chromium/one worker. Specs assert no console/page errors and loopback-only requests. The E2.T3 profile fixture is not exact and does not close A4-P1-01 |
| Screenshot inspection | Fresh Query Lab light desktop/dark mobile and E5 Search light/Health/Compare plus Vector Set dark-mobile benchmark screenshots were opened at original resolution; no blank/crashed state or unexpected network/error UI was observed. Visual evidence remains local fixture evidence |
| Emitted assets/network | Fresh E2.T3/E5 output has zero `fonts.googleapis.com`, `fonts.gstatic.com`, or CSS `@import` matches. E5 emits Worker plus `notices/UMAP-JS-LICENSE` and `UMAP-JS-NOTICE.md`; E2.T3 emits its UMAP notice. Generic `https://` CSS match is an embedded modern-normalize license comment, not a request |
| Privacy/read-only/import | Scoped production scans found no direct `@redis-ui/*` import, `console.log/debug`, clipboard, fetch/XHR/WebSocket/beacon, prompt, or Vector Visualizer telemetry path. Local manifest persistence is vector-free. Workbench/native executors are explicit bounded read allowlists; write verbs appear only in rejection logic/tests. No sibling-plugin import was added |
| Git/scope | `git diff --check` exit 0; stage empty; protected geodata and `.github` diffs empty. Backend delta is feature-flag wiring/tests only; dependency delta is the approved `umap-js` package/lock change. Branch/base state is reported above |

## Explicit non-passes and claim boundaries

- Aggregate UI typecheck remains **not a pass**. Baseline-aware wrapper output is not converted into a zero-diagnostics Vector Visualizer proof.
- The shared multi-plugin/geodata build remains **not a pass** because of the preserved unrelated protected Leaflet/geodata baseline. Focused Vite builds do not prove shared-build parity.
- API feature assertions passed, but the process did not exit cleanly because of an open handle; this is not called a clean API pass.
- Local fixtures/builds/Chromium do not establish live Redis, RESP transport, Redis Cloud, backend parity, production readiness, deployment, global geometry, HNSW traversal, or Search/Vector Set parity.
- No TRUTH or exactness is inferred across sources. No Redis command was run. No hidden write, telemetry, clipboard, import/export, or raw-vector persistence path was accepted.

## Final disposition

**NOT APPROVED.** There are zero open P0 findings, one open P1 finding, and four open P2 findings. Thirty-nine of forty non-deferred acceptance scenarios pass; REQ-VV-003.2 fails against exact repository Redis profile shapes. Promotion remains blocked until A4-P1-01 is repaired and independently reverified with exact Redis 7 flat iterator and Redis 8 Shards/Coordinator fixtures.

```text
STATUS: FAILED
ROLE: Auditor
PROVIDER: Codex
REQUESTED_MODEL: gpt-5.6-sol
REQUESTED_REASONING: high
ACTUAL_MODEL: unknown (runtime not exposed)
ACTUAL_REASONING: unknown (runtime not exposed)
INHERITED_FROM_COORDINATOR: unknown (spawn path not observable)
ANCHORS_READ: charter, index/tracker, overview, components, decisions, active E5 epic, three specs, AUDIT1/2/3, VERIFY6, current source/tests/artifacts
ACTIVE_RESIDUAL: independent final E5.AUDIT4 over exact VERIFY6-ready tree
FILES_CHANGED: docs/agent-plans/2026-08-07-redis-vector-visualizer/e5-audit4-report.md only
VERIFICATION_RESULT: NOT APPROVED, 0 P0, 1 P1, 4 P2; 40/40 scenarios mapped
BLOCKERS: A4-P1-01 exact Redis 7/8 profile iterator stage/count loss
BLOCKER_DISPOSITION: repair required, then fresh independent verification/audit
ASSUMPTIONS: local fixtures prove local contracts only, not live Redis/Cloud/production parity
NEXT_ACTION: coordinator owns tracker transition and bounded repair dispatch; no promotion
```
