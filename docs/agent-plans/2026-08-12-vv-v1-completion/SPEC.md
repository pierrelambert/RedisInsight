# Vector Visualizer V1 Completion — Requirement Spec (rev 2)

**Status**: ACTIVE
**Branch**: `feature/vector-visualizer` (main repo)
**Date**: 2026-08-12
**Revision**: 2 — addresses gaps from first review

## Source of Truth

- Existing VV code in `redisinsight/ui/src/packages/vector-visualizer/src/`
- Existing VV page in `redisinsight/ui/src/pages/vector-visualizer/`
- LayoutJobV1 contract in `contracts.ts:128` — declares `algorithm: 'umap' | 'pca' | 'tsne'`
- Atlas component in `atlas/Atlas/Atlas.tsx` — WebGL2 scatter with cluster labels
- AtlasRenderer in `renderer/AtlasRenderer.ts` — WebGL2 point renderer with marker shapes
- CompareTune in `compare/CompareTune/` — existing Pareto plot and drift comparison
- Layout worker in `worker/layout.ts` — UMAP implementation, currently rejects non-UMAP
- Health calculations in `health/calculations.ts` — duplicates (union-find), outliers (MAD), metadata coverage; NO algorithmic clustering
- AdvancedView in `advanced/AdvancedView/AdvancedView.tsx` — VLINKS topology as flat text list, FT.PROFILE facts, VSIM profile
- KNN reference adaptations:
  - Observable `@antoinebrl/knn-visualizing-the-variance` → adapted as **nNeighbors sensitivity visual** (how layout changes with K)
  - Stanford CS231N KNN demo → adapted as **metric/projection comparison** (same data under PCA vs UMAP, side-by-side)
  - Decision boundary heatmap → adapted as **density heatmap** (concentration, not classification)

## Scope

Seven requirement deltas to complete VV V1 before PR.

---

### REQ-1: PCA Projection [ADDED]

**What**: Implement PCA as alternative 2D projection alongside UMAP.

**Why**: PCA provides instant global-variance view. Different structure becomes visible. Contract already supports it.

**Acceptance**:
- `runLayout` in `worker/layout.ts` accepts `algorithm: 'pca'` and returns valid 2D coordinates
- PCA uses power iteration or covariance eigendecomposition for top-2 components
- When `count <= dimensions`: uses Gram matrix (n×n) instead of covariance (d×d) for efficiency
- Quality measurement: variance explained ratio for top-2 components
- Algorithm selector in VectorVisualizerControls (dropdown: UMAP / PCA)
- VectorVisualizerPage wires selected algorithm into LayoutJobV1
- Unit tests: `layout.spec.ts` covers PCA with known data
- `validateLayoutJob` in `sampling.ts` accepts `'pca'` algorithm

**Constraints**:
- No external dependencies — pure TypeScript math
- Must run in Web Worker (same as UMAP)
- Deterministic (no random seed needed)
- Max 20,000 × 768 within <2s

**Impacted files**:
- `worker/layout.ts` — add `runPCA`, modify `runLayout` dispatch
- `worker/layout.spec.ts` — PCA test cases
- `sampling/sampling.ts` — extend `validateLayoutJob`
- `sampling/sampling.spec.ts` — validation test
- `VectorVisualizerPage.tsx` — algorithm state, LayoutJobV1 dispatch
- `VectorVisualizerControls.tsx` — algorithm selector UI
- `VectorVisualizerControls.types.ts` — algorithm control type

**Non-goals**: t-SNE (slow). 3D projection.

---

### REQ-2: Atlas Color Legend Panel [ADDED]

**What**: Add a color legend panel showing `[swatch] label (count)` for each metadata value. Keep in-map cluster labels as optional (toggle), but default to legend-only for clarity.

**Why**: Current in-map labels collide, obscure points, and don't show color↔value mapping. Neighbor chart already has a legend — Atlas should match.

**Acceptance**:
- New `AtlasLegend` component renders in a panel beside Atlas canvas
- Each metadata value shows color swatch + label + count
- Clicking a legend entry selects all points with that metadata value on Atlas
- In-map cluster labels become optional (toggle: "Show cluster labels on map")
- Default: legend panel on, map labels off
- Legend scrolls when >12 entries; "Show all" expander
- Footer shape legend retained (circle/ring/diamond/triangle/square)
- Unit test with renderComponent pattern

**Constraints**:
- Redis UI components, styled-components, theme tokens
- `ComponentName/` folder structure, named export, barrel
- No direct `@redis-ui/*` import

**Impacted files**:
- NEW: `atlas/AtlasLegend/AtlasLegend.tsx` + `.styles.ts` + `.types.ts` + `.spec.tsx` + `index.ts`
- `atlas/Atlas/Atlas.tsx` — integrate legend, make cluster labels conditional
- `atlas/Atlas/Atlas.types.ts` — legend props, showMapLabels toggle
- `components/index.ts` — export
- `VectorVisualizerPage.tsx` — pass colorByValue, wire legend click
- `VectorVisualizerControls.tsx` — map labels toggle

---

### REQ-3: Density Heatmap Layer [ADDED]

**What**: Gaussian KDE heatmap behind scatter points showing vector concentration. Adapted from KNN decision boundary concept (Observable ref).

**Why**: Decision boundaries don't apply (no supervised labels), but density regions reveal cluster structure and sparse areas that dots alone don't convey.

**Acceptance**:
- KDE computed from 2D projected coordinates (UMAP or PCA)
- WebGL texture behind point layer in AtlasRenderer
- Toggle: "Show density heatmap" (default off)
- Single-hue color ramp: transparent → theme informative color at opacity levels
- Grid: 64×64 default, 128×128 for >5000 points
- Performance: <100ms for 20,000 points
- Recomputes on layout change, not on pan/zoom (transform via shader)
- Unit test: KDE with known distributions

**Constraints**:
- Same WebGL2 context as points
- No external dependencies
- Must not degrade pan/zoom/select interaction

**Impacted files**:
- NEW: `renderer/density.ts` + `density.spec.ts`
- `renderer/AtlasRenderer.ts` — density texture, second draw pass
- `renderer/AtlasRenderer.spec.ts` — density toggle
- `atlas/Atlas/Atlas.tsx` — density props
- `atlas/Atlas/Atlas.types.ts` — `showDensity`, `densityGrid`
- `VectorVisualizerControls.tsx` — density toggle
- `VectorVisualizerControls.types.ts` — density visibility
- `VectorVisualizerPage.tsx` — density computation + state

---

### REQ-4: Standalone Tune Workflow with Parameter Sweep [ADDED]

**What**: Dedicated Tune workflow with three panels: nNeighbors sensitivity visualization, M/EF parameter sweep analysis, and actionable recommendations.

**Why**: Tune was planned as workflow #4. Current CompareTune only benchmarks — it doesn't answer "what should I change." The nNeighbors sensitivity visual is adapted from the Observable KNN variance demo: instead of showing how K changes classification boundaries, show how K changes UMAP layout structure.

**Acceptance**:
- New 'tune' workflow registered in page
- **nNeighbors Sensitivity Visual** (adapted from Observable KNN variance ref):
  - Runs UMAP at 3 nNeighbors values: 5 (tight local), 15 (default), 30 (global)
  - Shows **side-by-side mini-atlas thumbnails** (not just quality numbers) — user sees how layout changes visually with K, like the Observable demo shows how decision boundary changes with K
  - Quality bar chart alongside showing bounded-k-neighbor-preservation per run
  - User selects which K to use as main Atlas layout
- **Parameter Analysis** (adapted from Stanford KNN demo's metric comparison panel):
  - For Vector Sets: reads EF, FILTER-EF, M from profile; displays current config with impact descriptions
  - For Search indices: reads FT.INFO config; displays algorithm params (M, EF_CONSTRUCTION, EF_RUNTIME)
  - Pareto chart reused from CompareTune showing recall/latency at different EF_RUNTIME values (benchmark-backed when available)
- **Recommendations Panel**:
  - Heuristic guidance based on index size, dimensions, and current params
  - "Your EF_RUNTIME=100 with 50K vectors: consider 200 for +5-10% recall at ~2x latency"
  - Clear "heuristic guidance, not optimization" disclaimer
- Unit tests for all logic modules

**Constraints**:
- Sensitivity runs layout worker 3 times max (bounded cost)
- Mini-atlas thumbnails render in small canvases (200×200px), not full AtlasRenderer
- Recommendations are heuristic, never claim precision
- Reuse existing benchmark/Pareto from CompareTune
- Works for both Vector Set and Search Index sources

**Impacted files**:
- NEW: `tune/Tune/Tune.tsx` + `.styles.ts` + `.types.ts` + `.spec.tsx` + `index.ts`
- NEW: `tune/recommendations.ts` + `.spec.ts`
- NEW: `tune/sensitivity.ts` + `.spec.ts`
- NEW: `tune/MiniAtlas/MiniAtlas.tsx` + `.styles.ts` + `.spec.tsx` + `index.ts` (lightweight canvas for thumbnails)
- `components/index.ts` — exports
- `nativeHandoff.ts` — add 'tune' to workflow union
- `nativeHandoff.spec.ts` — update
- `VectorVisualizerPage.tsx` — Tune workflow section, sensitivity runner, recommendation wiring

**Non-goals**: automated optimization solver. ML-based tuning. Grid search of all parameter combinations.

---

### REQ-5: Algorithmic Clustering for Health [ADDED]

**What**: Add DBSCAN-based clustering to the Health workflow so cluster labels on the Atlas represent actual embedding structure, not just metadata field values.

**Why**: Current "clusters" are metadata-based groupings (e.g., all records where `bike_type="mountain"`). This doesn't show embedding-space structure. DBSCAN finds natural density-based clusters in the UMAP/PCA projection — revealing whether embeddings actually separate into groups.

**Acceptance**:
- New `computeDBSCAN` function in `health/calculations.ts` or separate `health/clustering.ts`
- Operates on 2D projected coordinates (UMAP/PCA output)
- Parameters: epsilon (neighborhood radius), minPoints (cluster minimum size)
- Auto-epsilon using k-distance graph knee detection (k=minPoints)
- Returns cluster assignments: `{ id: string; clusterId: number }[]` where -1 = noise
- New "Color by: Clusters (DBSCAN)" option in colorBy selector alongside metadata fields
- Cluster count shown in Health XRay tiles
- Atlas cluster labels use DBSCAN centroids when cluster coloring is active
- Unit tests with known cluster patterns

**Constraints**:
- Operates on 2D coordinates (already computed), not raw high-dim vectors
- No external dependencies
- O(n²) acceptable for 2D with n ≤ 20,000
- Noise points labeled as "Unclustered" in legend

**Impacted files**:
- NEW: `health/clustering.ts` + `clustering.spec.ts`
- `health/HealthExplorers/HealthExplorers.tsx` — cluster count in XRay
- `health/HealthExplorers/HealthExplorers.types.ts` — cluster evidence type
- `VectorVisualizerPage.tsx` — run DBSCAN after layout, add cluster colorBy option
- `VectorVisualizerControls.tsx` — cluster option in colorBy
- `atlas/Atlas/Atlas.tsx` — cluster-based labels when active

---

### REQ-6: Interactive Topology Graph for Advanced [ADDED]

**What**: Upgrade VLINKS HNSW topology from flat text list to an SVG force-directed graph per layer, showing node connectivity visually.

**Why**: Current AdvancedView at lines 56-73 renders layers as `layer.targets.join(', ')` — text. Hub nodes, disconnected components, and layer distribution are invisible. A visual graph diagram reveals topology at a glance.

**Acceptance**:
- New `TopologyGraph` component renders SVG graph per HNSW layer
- Nodes positioned using simple force-directed layout (spring embedding) in 2D
- Edges drawn between connected nodes
- Node size proportional to degree (number of connections = hub indicator)
- Selected node highlighted with edges
- Layer selector to switch between HNSW layers
- Summary stats: node count, edge count, average degree, connected components per layer
- Falls back to existing text view if SVG fails or topology is small (<5 nodes)
- Unit test with mock topology data

**Constraints**:
- Pure SVG + React, no external graph library (d3-force is large)
- Simple iterative spring layout: ~50 iterations, O(n²) per iteration, bounded at 200 nodes per layer (already capped by VLINKS response)
- Read-only visualization, no graph editing
- Works only for Vector Set sources (Search indices don't have VLINKS)

**Impacted files**:
- NEW: `advanced/TopologyGraph/TopologyGraph.tsx` + `.styles.ts` + `.types.ts` + `.spec.tsx` + `index.ts`
- NEW: `advanced/topologyLayout.ts` + `.spec.ts` (spring embedding)
- `advanced/AdvancedView/AdvancedView.tsx` — replace text list with TopologyGraph
- `advanced/AdvancedView/AdvancedView.types.ts` — pass through topology data
- `components/index.ts` — export

---

### REQ-7: Projection Comparison View [ADDED]

**What**: Side-by-side PCA vs UMAP display showing the same sampled data under both projections simultaneously. Adapted from Stanford CS231N demo's L1/L2 metric comparison concept.

**Why**: Different projections reveal different structure. PCA shows global variance axes; UMAP shows local neighborhoods. Side-by-side comparison helps users understand their embedding space. Stanford demo shows same data under different K/metrics — we adapt this as same data under different projections.

**Acceptance**:
- New option in Atlas header or controls: "Compare projections"
- When active, Atlas splits into two panels: left = current algorithm, right = alternative
- Both share the same selection state — clicking a point in one highlights it in both
- Both share the same color mapping (metadata or cluster colors)
- Both labeled clearly: "PCA (variance explained: 42%)" / "UMAP (quality: 0.87)"
- Can be dismissed back to single-projection view
- Unit test for split layout and synchronized selection

**Constraints**:
- Requires both PCA and UMAP coordinates computed (Wave 1 PCA engine must exist)
- Two canvas elements, each with its own AtlasRenderer instance
- Selection sync via shared selectedIds state (already exists in page)
- Performance: two renders acceptable since each is independent
- Only available when both projections have been computed for current sample

**Impacted files**:
- `atlas/Atlas/Atlas.tsx` — split mode rendering
- `atlas/Atlas/Atlas.types.ts` — comparison mode props
- `atlas/Atlas/Atlas.styles.ts` — split layout styles
- `atlas/Atlas/Atlas.spec.tsx` — comparison mode tests
- `VectorVisualizerPage.tsx` — dual projection state, compute both when compare active
- `VectorVisualizerControls.tsx` — compare toggle

---

## Gap Checklist (rev 2 additions)

| Gap from rev 1 | Now addressed in |
|----------------|------------------|
| nNeighbors sensitivity only showed quality numbers, not visual | REQ-4 now specifies side-by-side mini-atlas thumbnails |
| Tune lacked real param sweep / M/EF analysis | REQ-4 now includes EF_RUNTIME sweep analysis + Pareto |
| No algorithmic clustering | REQ-5 adds DBSCAN on 2D projection |
| Topology graph was deferred | REQ-6 adds SVG force-directed graph |
| Observable KNN variance ref not incorporated | REQ-4 sensitivity visual directly adapts this concept |
| Stanford metric comparison ref not incorporated | REQ-7 projection comparison adapts this concept |
| Decision boundary heatmap ref not incorporated | REQ-3 density heatmap is the adapted version |

## Assumptions

1. All work targets `feature/vector-visualizer` branch in main repo
2. No new npm dependencies — all math (PCA, KDE, DBSCAN, spring layout) is pure TypeScript
3. WebGL2 availability assumed (existing fallback)
4. Existing test patterns (Jest + Testing Library + renderComponent) apply
5. i18n keys in existing `vectorVisualizer.*` namespace

## Unresolved Decisions

1. **Density color ramp**: single-hue informative or neutral? → Recommend informative (blue tint)
2. **Mini-atlas thumbnail size**: 200×200 or responsive? → Recommend 200×200 fixed for consistency
3. **DBSCAN auto-epsilon**: knee detection or user slider? → Recommend auto with optional manual override
4. **Compare projections**: side-by-side or overlay? → Recommend side-by-side (clearer)
5. **Legend position**: right panel or overlay? → Recommend right panel matching neighbor pattern

## Validation Commands

```bash
npm run lint
npm run type-check
node 'node_modules/.bin/jest' 'redisinsight/ui/src/packages/vector-visualizer' -c 'jest.config.cjs'
node 'node_modules/.bin/jest' 'redisinsight/ui/src/pages/vector-visualizer' -c 'jest.config.cjs'
npm test
```
