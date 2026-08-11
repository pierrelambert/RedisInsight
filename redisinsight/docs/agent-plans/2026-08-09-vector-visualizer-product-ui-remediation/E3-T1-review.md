# E3.T1 fresh independent review — native three-pane integration

STATUS: NOT APPROVED

SPEC_COMPLIANCE: NOT APPROVED

CODE_QUALITY: NOT APPROVED

VISUAL_FIDELITY: NOT APPROVED

VERDICT: NOT_APPROVED

CONFIDENCE: High

## Routing and boundary

- Role: fresh independent Auditor / Verifier, `quality_gate` and
  `regression_gate` review.
- Requested model/reasoning: `gpt-5.6-sol`, high. A fresh visual/runtime
  regression decision over three linked modes, truth claims, and acceptance
  evidence needs the high-risk-audit route; a docs or bounded implementation
  route is insufficient.
- Actual model/reasoning/inheritance: unknown; this host does not expose a
  reportable independently selected execution model or reasoning setting.
- Command shape: RTK-wrapped read-only Git/source inspection and one focused
  Jest command. Fallback: raw read-only inspection if RTK changed behaviour;
  RTK remained usable. No worker was dispatched.
- Ownership: this review creates only `E3-T1-review.md`. No implementation,
  tests, anchors, tracker/ledger, staging/index, refs, commit, or remote state
  was changed.

## Anchors and evidence reviewed

Read the full E3 task and report; charter, index, components, decisions,
tracker, and capability ledger; product, technical, and normative visual
specifications; reference-asset README and Atlas/Neighbors/Selection captures;
the accepted E1 and all accepted E2 final reviews; all E3-owned page,
workspace, SelectionTable and relevant specs; and the E2 controls/results/
canvas component contracts. The repository has the expected broad pre-existing
dirty worktree, an empty index, and branch
`codex/redis-vector-visualizer` (three commits behind `origin/main`).

I inspected
`.playwright-cli/page-2026-08-10T10-09-24-357Z.png` at original detail. Its
reported `216 / 904 / 296` desktop widths satisfy the numerical bands, but the
capture does not meet visual acceptance by geometry alone.

Focused check run:

```text
rtk proxy node node_modules/.bin/jest \
  redisinsight/ui/src/pages/vector-visualizer/components/VectorVisualizerCanvas/VectorVisualizerCanvas.spec.tsx \
  redisinsight/ui/src/pages/vector-visualizer/components/VectorVisualizerWorkspace/VectorVisualizerWorkspace.spec.tsx \
  redisinsight/ui/src/packages/vector-visualizer/src/selection/SelectionTable/SelectionTable.spec.tsx \
  -c jest.config.cjs --runInBand --no-cache
```

Exit 0, but Jest reported only Canvas and Workspace: 2 suites / 8 tests. It
did not execute the supplied SelectionTable path under this configuration.
This is limited component evidence, not an E3 page, type-check, browser, or
real-route pass. The E3 report itself records no terminal UI type-check result
and no final E1 Playwright aggregate exit; those remain unproven.

## Findings

### P1 — inactive mode panels are visibly rendered below Atlas

**Evidence.** `VectorVisualizerCanvas.tsx:167-194` marks inactive panels with
`hidden`, but `VectorVisualizerCanvas.styles.ts:60-65` wraps the project
`Col`, whose authored base style is `display: flex`
(`ui/src/components/base/layout/flex/flex.styles.ts:304-314`). The supplied
ready-state screenshot visibly shows the inactive Neighbors content — “Run
selected anchor query”, “Runs one bounded read-only KNN request…”, and
“Retrieval debugger” — below the active Atlas plot. That is browser evidence,
not an inference from geometry. The inactive Selection content is similarly
mounted and is only clipped by the page/workspace overflow.

The Canvas test at `VectorVisualizerCanvas.spec.tsx:190-199` deliberately
checks inactive content only with `toBeInTheDocument()` and never asserts that
the inactive panels are not visible or have `display: none`; its focused suite
therefore passes despite the defect.

**Impact.** The center is a vertical component showcase rather than one
connected mode viewport. It violates the visual contract's connected-mode and
dominant-canvas requirements, destroys the reported usable plot height, and
makes the 904px geometry claim insufficient.

**Required repair.** Make the inactive tabpanel's display state explicit in
the authored Canvas style (for example, a `$isActive` prop with
`display: none` when false), while keeping the slots mounted for state
preservation. Add a browser-real visibility assertion for every inactive panel
and a page capture showing Atlas without Neighbors/Selection payload below it.

### P1 — Neighbors inspector claims query evidence while rendering sampled rows

**Evidence.** `VectorVisualizerPage.tsx:1243-1251` always builds
`resultRows` from `sample.result.ids`, with `Number.NaN` values. On Neighbors,
the same page changes only the inspector context/exactness/provenance at
`:1266-1271` and `:1459-1474`: it labels the inspector “Nearest documents”
and says “Bounded read-only query response”, but still supplies the sampled
IDs and `Unavailable` scores. `QueryLab` receives the actual `query.neighbors`
separately at `:1283-1323`. No page test selects a Results row after a query
and proves title, row identity, score, canvas selection, and inspector
identity together.

**Impact.** This is a direct truth/provenance contradiction and fails the
product/technical contract that each mode update inspector title, subtitle,
rows, and provenance from the shared selection/query state. It also leaves the
claimed point/table/inspector synchronization unproven.

**Required repair.** Derive inspector rows and metric/provenance from the
response-backed query when `workspaceMode === 'neighbors'`; retain sampled
rows only for Atlas/Selection. Add an integration test that activates a result
row after a real mocked query and proves the same focused ID in Canvas, table,
and detail inspector without fabricated score data.

### P1 — the required 296px inspector cannot scan its default table

**Evidence.** At the report's exact 296px result width, the original 1440px
capture shows overlapping/truncated `Score/distance` and `Plotted state`
headers, IDs rendered as `doc…`, and values/actions compressed into the same
line. The fixed five-column layout requires rank, flexible ID, score,
plotted-state, action, four gaps, and horizontal padding
(`SelectionTable.styles.ts:16-45`) inside an inspector that adds its own
padding (`VectorVisualizerResults.styles.ts:5-15`). `VirtualGrid` merely
allows horizontal overflow (`SelectionTable.styles.ts:6-13`); it does not make
the default desktop scan readable. The table tests assert roles and
virtualization, not target-width rendering or column overflow.

**Impact.** The persistent operational inspector is unreadable at an expressly
required desktop geometry. This violates the visual contract and table contract
for bounded columns, deliberate overflow/detail disclosure, and operator
scanning.

**Required repair.** Design the 280–360px inspector as its own responsive
table variant: reserve a viable ID column, use compact semantic labels/tooltips
or move rank/plotted state into detail/row metadata, and keep the action column
narrow. Prove the 296px layout by screenshot and browser assertions for each
header/cell rather than accepting horizontal collision.

### P1 — E3's required green E1 acceptance evidence is absent and semantically stale

**Evidence.** The E3 task requires E1 desktop geometry, overflow, mode,
console, and network assertions to be green. The E3 report instead records no
final E1 comparator/exit and identifies the unchanged expected-RED wrapper.
The current E1 fixture still fills Filter and Color by
(`e1-t1.product-ui.playwright.spec.ts:151-172`), while native integration
truthfully disables/unsets those unsupported controls
(`VectorVisualizerPage.tsx:1392-1399`). The test still wraps REQ-VV-012–015
in `expectProductFidelityRed` (`e1-t1.product-ui.playwright.spec.ts:177-270`).
The capture additionally records a favicon 404 and development warnings, so
it cannot be represented as a clean-console pass.

**Impact.** Neither the required E3 acceptance gate nor the final browser
signals are green. The unsupported-control distinction is semantically correct
in the product, but the acceptance contract must be repaired rather than
declaring an expected-red suite or a screenshot sufficient.

**Required repair.** Send an E1-owner repair packet: split genuinely green
desktop mode/geometry/console-network tests from historical expected-red
tests; assert disabled Filter's useful reason and Color by absence instead of
typing into unsupported controls; then run a final, reported suite. Classify
favicon/dev diagnostics explicitly and do not claim console cleanliness until
owned-code signals are separated.

### P2 — unequal inspector height and duplicate center headings weaken the reference hierarchy

**Evidence.** The E3 report measures Results at `507.96875px` while the
Canvas is `713.625px`; `ResultsRegion` supplies no fill rule
(`VectorVisualizerWorkspace.styles.ts:37-42`) and Inspector has no flex/height
fill (`VectorVisualizerResults.styles.ts:5-16`). The screenshot shows the
right border/table ending far above the Canvas bottom. It also shows the Canvas
active-mode label followed by the child Explore `Atlas` heading; the Canvas
inserts the extra title at `VectorVisualizerCanvas.tsx:181-188` while the
native page passes an already headed `Explore` view at
`VectorVisualizerPage.tsx:1272-1281`.

**Impact.** The screen reads as assembled component panels rather than the
aligned, viewport-filling three-pane workspace in the normative Atlas capture.

**Required repair.** Fill the Results region to the workspace row and make its
table/detail area internally scrollable; own exactly one mode title in the
center header or the view body. Re-capture against the reference after P1
repairs.

## Closed / bounded claims

- The numerical desktop widths in the E3 capture are within contract bands;
  this is not a visual-fidelity approval.
- The SelectionTable patch retains virtualisation, stable IDs, row click and
  keyboard transitions in source. Its supplied focused Jest invocation did not
  run that suite here, and no E3 integration proof covers it after a query.
- The existing E3 report is appropriately honest that full UI type-check and
  final E1 aggregate browser evidence are unproven. Those limitations are
  release/advance blockers, not passes.
- No real-route RedisInsight/Electron, dark-theme, mobile access/focus return,
  baseline comparison, or clean owned-code console/network proof was available
  in this review. E4/E5 retain their stated scopes; they cannot erase the
  desktop P1s above.

## Recommended order and disposition

1. **Coordinator direct repair / E3 owner:** fix inactive-panel display and
   derive Neighbors inspector rows from query evidence; add focused page and
   browser tests.
2. **E3 repair task:** make the 296px inspector usable and fill the persistent
   right region; remove duplicate center heading.
3. **E1 repair packet:** update the expected-RED harness to the truthful
   supported-control semantics, then collect terminal desktop browser evidence.
4. Re-run fresh independent visual review against all three normative captures.

Zero P0/P1 is required to advance. Current result: **0 P0, 4 P1, 1 P2 — NOT
APPROVED.**
