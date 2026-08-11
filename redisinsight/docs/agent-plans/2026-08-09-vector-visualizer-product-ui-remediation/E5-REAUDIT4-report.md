# E5.REAUDIT4 — Independent audit report

Date: 2026-08-10
Role: Fresh independent auditor
Branch: `codex/redis-vector-visualizer`
Repository: `/private/tmp/redisinsight-vector-visualizer`
Commit policy: read-only; no commit, stage, push, rebase, reset, deploy, or baseline approval

## VERDICT: APPROVED

No P0 or P1 findings. Two P2 observations are recorded for future refinement.

---

## P0 findings

None.

## P1 findings

None.

## P2 findings

**P2-1: Dual color-field controls in Neighbors fixture view.**
The Neighbors fixture screenshot (`/tmp/vector-visualizer-neighbors-reference-repair-1440x900.png`) shows both a `Color by` dropdown selector (response-backed, from discovered fields) and a `Color by metadata field` free-text input below it. The free-text input is a legacy fallback for contexts where metadata discovery is not available. It does not appear in the real-route Atlas view, where only the dropdown is rendered. This is not a contract violation — the visual contract requires a response-backed Color by field, which is present — but the dual controls may confuse users. The free-text fallback could be hidden when the dropdown is populated.

**P2-2: Cluster labels not visible in the 96-point fixture Atlas.**
In the 1440x900 fixture Atlas screenshot, cluster labels (`product`, `document`, `catalog`, `support`) appear as expected. In the real-route Atlas (81 points, `vv:knowledge` Vector Set), cluster labels (`Community`, `Product`, `Support`, `Documentation`) are clearly visible. At the 960x680 minimum window, cluster labels remain legible though the plot area is compressed. No issue with the labels themselves, but the fixture only exercises four label values across 96 points, whereas a real large dataset may produce different layout characteristics. This is an observation about fixture coverage, not a code defect.

---

## Evidence reviewed

### Documents read

| Document | Status |
|----------|--------|
| `charter.md` | Consistent with plan state and boundaries |
| `00-index.md` | Plan state: running; E5.R8 done; E5.REAUDIT4 pending |
| `tracker.md` | E5.R8 status: done. E5.REAUDIT4 status: pending. All earlier E5 audits correctly marked as superseded |
| `capability-ledger.md` | 13 capabilities; all `delivered` or `superseded`; closure targets reference E5.REAUDIT4 correctly |
| `decisions.md` | 21 decisions; the latest treats the user-provided Atlas screenshot as the active E5.R8 target |
| `visual-contract.md` | Normative desktop composition, mode behavior, inspector, and acceptance criteria reviewed |
| `assets/vector-visualizer/README.md` | Confirms normative precedence of reference images |
| `E5-R8-atlas-reference-repair-report.md` | Locally verified; claims 9/9 product UI, 3/3 native-host, 84/84 native Jest, 182/182 package Jest |
| `E5-R6-neighbors-reference-repair-report.md` | Locally verified; claims 84/84 native Jest, 9/9 product UI, 3/3 native-host |
| `E5-R7-selection-reference-repair-report.md` | Locally verified; claims 84/84 native Jest, 180/180 package Jest, 9/9 product UI, 3/3 native-host |

### Reference images compared

| Reference | Contract represented |
|-----------|---------------------|
| `atlas-reference.png` | Persistent controls, dominant Atlas canvas, linked sampled-document inspector |
| `neighbors-reference.png` | Exact-focus mode with metric rings and linked nearest-document inspector |
| `selection-reference.png` | Region selection overlay and linked selected-document inspector |

### Current screenshot evidence reviewed

| Screenshot | What it shows |
|------------|---------------|
| `/tmp/e5-r8-atlas-reference-repair-1440x900.png` | Fixture Atlas at 1440x900: colored points (4 categories), cluster labels, UMAP axes, `Color by: region` dropdown, no Projection menu, compact sampled-rows table, inspector placeholder |
| `/tmp/e5-r8-atlas-reference-repair-960x680.png` | Fixture Atlas at 960x680: all three panes visible, cluster labels visible, controls scroll internally, no page overflow |
| `/tmp/e5-r8-atlas-real-route-1440x900.png` | Real RedisInsight route: 81 response-backed colored points, `Color by: category` dropdown, cluster labels (`Community`, `Product`, `Support`, `Documentation`), UMAP axes, `Method: vrange`, full RedisInsight chrome, no Projection selector |
| `/tmp/vector-visualizer-neighbors-reference-repair-1440x900.png` | Fixture Neighbors at 1440x900: one dominant radial plot, centered anchor (`doc:1`), 49 compact neighbor marks, three metric-threshold rings (0.23, 0.45, 0.67), compact legend, persistent right results/inspector, scores shown, inspector has detail |
| `/tmp/vector-visualizer-neighbors-reference-repair-960x680.png` | Fixture Neighbors at 960x680: all three panes visible, radial plot remains dominant, controls and results compacted |
| `/tmp/e5-r7-selection-reference-repair-1440x900.png` | Fixture Selection at 1440x900: colored UMAP context preserved, persistent translucent selection rectangle, 24 of 96 points selected, right inspector filtered to selected records, inspector shows `Distance: Unavailable` (correct for sampled rows) |
| `/tmp/e5-r7-selection-reference-repair-960x680.png` | Fixture Selection at 960x680: all three panes visible, selection rectangle still visible, right inspector filtered |
| `/tmp/e5-r7-selection-real-route-1440x900.png` | Real-route Selection: 37 of 81 points selected, full RedisInsight chrome, cluster labels visible, selection box present, right inspector filtered to selected IDs |

---

## Audit checklist results

### 1. Correct checkout and branch

PASS. Branch is `codex/redis-vector-visualizer` (32 commits ahead of `origin/main`). No staged files. `git diff --check` reports no whitespace issues.

### 2. Tracker/capability-ledger consistency

PASS.
- E5.R8 is `done` in the tracker.
- E5.REAUDIT4 is `pending` in the tracker — consistent with this audit being the gate.
- Earlier E5 audits (E5.AUDIT, E5.REAUDIT, E5.REAUDIT2, E5.REAUDIT3) are all `superseded`.
- Capability ledger entries are all `delivered` or `superseded`; VV.UI.012 correctly marks the earlier audit as superseded and targets E5.REAUDIT4.

### 3. Visual comparison — Atlas, Neighbors, Selection vs. reference

PASS with intentional semantic corrections documented.

**Atlas comparison (current vs. `atlas-reference.png`):**
- Reference: full product shell, `Visualize index` title, `Color by: Document type` dropdown, UMAP/PCA projection toggle, 20,000 sample slider, colored clusters with labels.
- Current: `Vector Visualizer` title (semantic correction), `Color by: region/category` dropdown (response-backed), no Projection toggle (intentional UMAP-only v1), `Sample budget: 2000` numeric input, colored clusters with labels, UMAP axes.
- Assessment: composition, hierarchy, density, and interaction match the reference. The three-column desktop layout is preserved. Differences are intentional v1 semantic corrections (no PCA, bounded sample range, updated terminology).

**Neighbors comparison (current vs. `neighbors-reference.png`):**
- Reference: centered anchor at plot center, metric-threshold rings with labels (0.5, 0.7, 0.9), scattered neighbor points by distance, right panel shows nearest documents with scores.
- Current: centered anchor (`doc:1`), three metric-threshold rings (0.23, 0.45, 0.67 — values reflect fixture data), 49 compact colored neighbor marks, compact legend, right panel shows nearest documents with scores and inspector detail.
- Assessment: the radial plot is dominant and occupies the full center canvas. The composition matches. Ring labels differ because they are response-derived, not hardcoded. Point density is higher (50 vs. the reference's ~15 visible) which is an improvement.

**Selection comparison (current vs. `selection-reference.png`):**
- Reference: Atlas context preserved, translucent blue selection rectangle, 12 selected points, right panel shows `Selected documents`.
- Current: colored Atlas context preserved, translucent selection rectangle, 24 selected (fixture) / 37 selected (real route), right panel title `Selected documents` with filtered records, `Clear selection` button.
- Assessment: composition, hierarchy, and interaction match. The persistent rectangle overlay is visible and theme-appropriate.

### 4. Atlas confirmation

| Requirement | Status |
|-------------|--------|
| Response-backed colored points | PASS — visible in both fixture (4 region categories) and real route (4 category values) |
| Visible available Color by field list (not free-text workaround) | PASS — `RiSelect` dropdown rendered with discovered scalar fields; real route shows `category` dropdown |
| Cluster labels where enabled | PASS — visible in all three Atlas screenshots; toggle is `Show cluster labels: ON` |
| UMAP axes/evidence | PASS — `UMAP 1 - derived coordinate` (x) and `UMAP 2 - derived coordinate` (y) visible; `Projection: UMAP` in summary |
| No Projection menu while UMAP-only | PASS — no Projection selector dropdown; `Projection: UMAP` appears as read-only evidence in the sampling summary only |
| Compact sampled rows without fake scores | PASS — right table shows `ID/member` column only; no score column in Atlas/Selection; score column appears only in Neighbors where response-backed |

### 5. Neighbors confirmation

| Requirement | Status |
|-------------|--------|
| One dominant radial plot | PASS — single full-canvas radial plot visible |
| Query/source item centered exactly once | PASS — `doc:1` centered; self result is in the table but not displaced as a radial point |
| Metric-aware rings | PASS — three rings with metric labels (0.23, 0.45, 0.67) |
| No embedded Query Lab, second results table, or second inspector | PASS — no QueryLab/table/inspector in the Neighbors component source; Query Lab exists only under "Additional evidence workflows" |
| Table/canvas/inspector selection linked | PASS — Inspector shows `doc:1` detail (Plotted, Distance: 0.00, Exactness: approximate) |

### 6. Selection confirmation

| Requirement | Status |
|-------------|--------|
| Preserves colored Atlas context | PASS — same UMAP layout with metadata colors retained in Selection screenshots |
| Ordinary region drag | PASS — Selection mode uses ordinary drag for region selection; confirmed in code and visible in screenshot |
| Persistent selected region overlay | PASS — translucent rectangle visible at both 1440x900 and 960x680 |
| Right inspector filtered to selected records | PASS — "Selected documents" title with `24 results` / `37 results`; only selected IDs shown |

### 7. Desktop-only behavior

| Requirement | Status |
|-------------|--------|
| No mobile/drawer/overlay acceptance active | PASS — `grep` for mobile/drawer/390x844/375x812 returns zero results in both source and E2E tests |
| 960x680 minimum-window target | PASS — all three modes have 960x680 screenshots showing contained three-pane layout |

### 8. Browser/live evidence

| Requirement | Status |
|-------------|--------|
| Real route path works | PASS — `/tmp/e5-r8-atlas-real-route-1440x900.png` and `/tmp/e5-r7-selection-real-route-1440x900.png` show the full RedisInsight shell at the `vector-visualizer` route with real Vector Set data |
| Expected listeners localhost:8080 / localhost:5540 | Consistent with the real-route evidence; the environment variables in the E5.R8 report specify `E1_REAL_APP_BASE_URL=http://localhost:8080` and `E1_REAL_APP_API_ORIGIN=http://localhost:5540` |
| No 4185/4196 fixture listeners left behind | PASS — `lsof -i :4185 -i :4196 -sTCP:LISTEN` returns no active listeners |

### 9. Verification boundaries stated honestly

| Boundary | Status |
|----------|--------|
| No screenshot baselines approved | PASS — confirmed in all three repair reports and the tracker |
| No packaged Electron/deployment proof claimed | PASS — stated as a boundary in the charter, tracker, and all repair reports |
| Aggregate type-check has existing non-Vector-Visualizer baseline/package dependency failures | PASS — aggregate `npm run type-check` fails with non-Vector-Visualizer diagnostics in `redistimeseries-app` and `ri-explain` packages (TS2307: missing module declarations, TS7006: implicit `any`). The failing paths are exclusively `src/packages/redistimeseries-app/` and `src/packages/ri-explain/` |
| No Vector Visualizer-owned diagnostics in final aggregate output | PASS — grep for `vector-visualizer`, `vector-set-details`, `VectorSetDetails`, `VectorFieldPicker`, `useListContent`, `defaultRoutes`, `known-features`, and `VectorVisualizer` in the type-check output returns zero source-file matches |

---

## Commands run and exit codes

| Command | Exit code | Notes |
|---------|-----------|-------|
| `git status --short --branch` | 0 | Branch `codex/redis-vector-visualizer`, 32 ahead of origin/main, no staged files |
| `git diff --cached --name-only` | 0 | No staged files |
| `git diff --check` | 0 | No whitespace issues |
| `npm run type-check` (aggregate) | 1 | Expected failure from pre-existing non-Vector-Visualizer package dependency issues |
| `npm run type-check` filtered for VV paths | 0 matches | No Vector Visualizer-owned diagnostic |
| `npm run lint` (aggregate) | 1 | Expected failure from `artifacts/playwright/` build output files outside tsconfig |
| `npx eslint redisinsight/ui/src/pages/vector-visualizer/ --quiet` | 0 | No lint issues in native Vector Visualizer |
| `jest redisinsight/ui/src/pages/vector-visualizer` | 0 | 13 suites, 84 tests passed |
| `npm test --prefix .../vector-visualizer` | 0 | 25 suites, 182 tests passed |
| `lsof -i :4185 -i :4196 -sTCP:LISTEN` | 1 (no matches) | No fixture listeners running |

---

## Visual comparison notes

The current implementation reproduces the normative reference composition across all three modes:

1. **Three-column desktop workspace**: controls (left), dominant visualization (center), persistent inspector (right) — preserved at both 1440x900 and 960x680.

2. **Atlas**: visually matches `atlas-reference.png` with intentional semantic corrections. The colored scatter plot with cluster labels is the dominant center element. UMAP axes provide orientation. The `Color by` field uses a proper dropdown selector populated from discovered metadata fields, replacing the earlier free-text workaround. The Projection toggle is correctly absent for the UMAP-only v1.

3. **Neighbors**: visually matches `neighbors-reference.png` with improved density. The centered anchor, concentric metric-threshold rings, and response-normalized radial layout are all present. The right panel contains the sole results table and inspector — no embedded Query Lab or duplicate surfaces.

4. **Selection**: visually matches `selection-reference.png`. The colored Atlas context is fully preserved during selection. The persistent translucent selection rectangle and filtered right inspector work at both desktop sizes.

5. **Real route**: the live RedisInsight route shows real Vector Set data (81 elements, `vv:knowledge` key) with response-backed `category` coloring and all four cluster labels visible. The full RedisInsight product chrome is present.

---

## Boundary/residual risks

1. **No approved screenshot baselines.** All screenshots are temporary comparison evidence. Pixel-level regression gates are not active.
2. **No packaged Electron or deployment proof.** The real-route evidence uses the development server, not a packaged application.
3. **Aggregate type-check is a non-pass.** The 1,311 diagnostics are in `redistimeseries-app` and `ri-explain` packages and predate the Vector Visualizer work. No Vector Visualizer-owned diagnostic exists.
4. **Aggregate lint reports errors in `artifacts/playwright/` build output.** These are generated JavaScript files outside the TypeScript project configuration, not source code.
5. **Live Workbench host integration remains a stated boundary.** The Workbench iframe plugin operates in capability-reduced mode and does not claim Atlas parity.
6. **Geodata shared-build dependency issue is pre-existing and unrelated.**

---

## Tracker/capability-ledger promotion recommendation

The tracker may promote E5.REAUDIT4 from `pending` to `done` with the status `APPROVED with zero P0/P1`. The capability ledger entries targeting E5.REAUDIT4 (VV.CORE.003, VV.UI.003, VV.UI.004, VV.UI.005, VV.UI.006, VV.UI.010, VV.UI.011, VV.UI.012, VV.UI.013) may update their "Missing proof / defect" column to reflect the completed independent audit. The two P2 observations do not block promotion.
