# E5.R5 Independent Neighbors Audit Report

Date: 2026-08-10  
Status: **NOT APPROVED**

## Audit contract

- Role: fresh independent final Auditor for the corrected native Neighbors composition.
- Requested model/reasoning: not supplied. The routing assessment selects `gpt-5.6-sol` at high reasoning because this report is the final product-visual and semantic promotion authority after an earlier approval was invalidated by live evidence.
- Actual model/reasoning: unknown; inherited from the coordinator: yes.
- Ownership: this report only. Source, tests, specifications, tracker, capability ledger, stage, commits, refs, and remotes remained read-only.
- Command shape: RTK-prefixed non-interactive inspection and bounded verification. `rtk proxy` preserved exact source/test output; no raw fallback was needed.

## Verdict

**NOT APPROVED.** The E5.R5 composition correction is materially present, but the current live Vector Set route renders the query anchor twice and links selection to the displaced copy instead of the centered anchor. This is one **P1** against the normative query-centered metric and linked-selection contract. There are **0 P0**, **1 P1**, and **0 P2** findings.

## Accepted evidence

- The normative `neighbors-reference.png` and the current `/tmp/e5-r5-neighbors-real-route-1440x900.png` were inspected at original detail. The current native mode has a compact `Neighbors of doc:001` header, one dominant square radial field, three fully contained rings, no `Retrieval debugger` or `Returned results`, and one persistent right `Nearest elements` table/detail inspector.
- `VectorVisualizerPage.tsx:1329-1351` mounts the focused native `VectorVisualizerNeighbors`; the full `QueryLab` remains only under the separately opened additional workflow at `:1133-1184` and `:1527-1549`. `VectorVisualizerPage.tsx:1513-1524` mounts the sole persistent `VectorVisualizerResults` instance.
- Returned values remain response-backed: native orchestration maps parsed finite `FT.SEARCH`/`VSIM` values and provenance at `nativeOrchestration.ts:523-541,576-618`; the radial tooltip uses that returned metric/value at `VectorVisualizerNeighbors.tsx:202-224`; the right inspector derives exactness and `Bounded read-only ... response` provenance at `VectorVisualizerPage.tsx:1308-1318,1513-1524`.
- Point color is derived from sampled response metadata at `VectorVisualizerNeighbors.tsx:59-83,107-117`; missing metadata uses the neutral informative fallback and is excluded from `data-colored-point-count`. The all-green live points are therefore not independently a defect when the returned rows share the same response-backed category.
- The active product acceptance uses desktop viewports (`1440x900`, `1100x768`, and the configured `960x680` minimum) and does not require a mobile native composition.

## Findings

### P0

None.

### P1 — The returned anchor is plotted twice and linked selection highlights the displaced copy

**Evidence**

- The product contract requires the query or selected source element at the center and radius as a monotonic rendering of the real source metric (`2026-08-07-redis-vector-visualizer-product-spec.md`, Neighbors contract). The visual contract likewise requires a query-centered radial plot and bidirectional point/row/inspector linkage.
- The normative preserved prototype has one center anchor (`redis-product-vector-visualizer.html:244`) and generates radial result dots beginning with other documents (`:285-290`), while retaining the anchor as the selected first result row (`:293-297`). The reference capture shows the same composition: the selected query row corresponds to the single center anchor, not a second offset mark.
- The current page passes `queryAnchorId` as `anchorId` but also passes the complete `query.neighbors` response without excluding that ID (`VectorVisualizerPage.tsx:1329-1351`). `VectorVisualizerNeighbors.tsx:196-201` renders the static center anchor, then `:202-229` renders every returned row as a separate radial point and applies `selectedIds` only to those points.
- The supplied live capture proves this path is active: the header and selected first row both identify `doc:001`; the plot simultaneously shows the blue center anchor and a separately outlined green point inside the first ring. The right row/inspector selection for `doc:001` is therefore linked to the offset point, while the actual center anchor has no selected state or selection semantics.
- For the self result (`Similarity score: 1.00` in the live inspector), the displaced point is placed at the component's minimum 12% radius rather than at the query center. That makes one response-backed entity occupy two positions and weakens the stated metric geometry.

**Impact**

The primary exact-focus visualization misrepresents the selected query item and its metric position. A user following the selected row sees both a centered anchor and a distinct selected “neighbor” for the same ID, so query centering and linked selection are not truthful even though the surrounding composition is correct.

**Required fix and closure criteria**

1. Collapse a returned row whose ID equals `anchorId` into the center anchor, or exclude it from radial neighbor marks while retaining its response-backed row in the persistent inspector.
2. Give the center anchor the linked selected/focused state and accessible identity when the anchor row is selected; selecting another returned row must highlight only that returned point while the query anchor remains uniquely centered.
3. Add a focused component/browser assertion for a response that contains the anchor as rank 1, proving there is exactly one visual representation of that ID, the selected row links to the center, and no offset self point is rendered.
4. Refresh the real-route Neighbors capture and rerun the bounded focused Jest/browser geometry checks. Closure requires one centered anchor, no duplicate self mark, contained rings, one right inspector, and preserved response-backed score/color/provenance.

### P2

None.

## Fresh bounded checks

| Check | Result |
| --- | --- |
| Original-detail comparison of `neighbors-reference.png` and `/tmp/e5-r5-neighbors-real-route-1440x900.png` | Major composition correction confirmed; P1 duplicate-anchor defect observed |
| Focused no-cache Jest for `VectorVisualizerNeighbors.spec.tsx` and `VectorVisualizerPage.spec.tsx`, default reporter | PASS — 2 suites, 13 tests |
| Cached `git diff --check` | PASS; staged index remains empty |
| Current source/test inspection for native Neighbors, persistent Results, query parsing/orchestration, and desktop browser contracts | Completed |

The passing tests do not close the P1: they verify response counts, contained rings, tooltip values, and shared callbacks, but no test supplies a returned row whose ID equals `anchorId` and asserts unique centered representation.

## Residual boundaries

- This audit used the supplied current real-route PNG and did not relaunch RedisInsight, Redis, API, or Electron. The E5.R5 live rerun remains evidenced by the implementation/verification reports and browser contract.
- No screenshot baseline is approved. Packaged Electron, deployment, production performance, and live Workbench-host execution remain outside this bounded Neighbors verdict.
- Aggregate UI TypeScript and the shared multi-plugin/Geodata build remain known non-passes and were not reclassified.

## Disposition

Keep `VV.UI.005` and `VV.UI.012` at the pending/partial promotion boundary. Repair the duplicate anchor/selection mapping, obtain a refreshed live capture and focused proof, then run a fresh independent re-audit.

## Rigid handoff

```text
STATUS: DONE_WITH_CONCERNS
ROLE: Auditor
REQUESTED_MODEL: unknown (routing recommendation: gpt-5.6-sol)
REQUESTED_REASONING: unknown (routing recommendation: high)
ACTUAL_MODEL: unknown
ACTUAL_REASONING: unknown
INHERITED_FROM_COORDINATOR: yes
ANCHORS_READ:
- charter: yes
- status board/tracker: yes
- components: yes
- decisions: yes
ACTIVE_RESIDUAL: independent E5.R5 promotion audit of the corrected native Neighbors composition.
FILES_CHANGED: E5-R5-audit-report.md only
VERIFICATION_RUN: normative/live PNG comparison; focused no-cache Jest; cached diff check; source/test audit.
VERIFICATION_RESULT: NOT APPROVED; 0 P0, 1 P1, 0 P2.
BLOCKERS: none for audit completion; the P1 requires a repair before promotion.
BLOCKER_DISPOSITION: none
ASSUMPTIONS: the supplied E5.R5 live-route PNG is the current tracker-named capture.
NEXT_ACTION: repair unique center-anchor selection mapping, refresh proof, and obtain fresh independent re-audit.
```
