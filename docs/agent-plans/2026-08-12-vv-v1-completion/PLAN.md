# Vector Visualizer V1 Completion — Delegation Plan (rev 3)

## Control

- Repo: `/Users/pierre/Documents/Work/RedisInsight`
- Branch: `feature/vector-visualizer`
- Plan directory: `docs/agent-plans/2026-08-12-vv-v1-completion/`
- Plan files:
  - overview: `PLAN.md` (this file)
  - spec: `SPEC.md` (rev 2, validated by agent-spec-writing)
  - coordinator prompt: `coordinator-prompt.md`
  - tracker: `tracker.md`
- Memory persistence:
  - backend: `agent-memory` MCP
  - namespace: `redisinsight-vv-v1`
  - user_id: `pierre`
  - records: plan overview, task status transitions
  - status: available
- Anchoring: omitted — single-session bounded sprint, not resumable across sessions; coordinator maintains full context
- Source of truth: `SPEC.md` rev 2 (7 requirements: PCA, Legend, KDE, Tune, DBSCAN, Topology, Compare)
- Spec/change source: `docs/agent-plans/2026-08-12-vv-v1-completion/SPEC.md`
- Local terminology sources:
  - `contracts.ts` — `LayoutJobV1`, `VectorMetric`, `NativeVisualizerWorkflow`, `CommandPlan`
  - `atlas/Atlas/Atlas.types.ts` — `AtlasClusterLabel`, `AtlasProps`
  - `renderer/AtlasRenderer.ts` — `AtlasRenderer`, `normalizeCoordinates`
  - `worker/layout.ts` — `runLayout`, `LayoutResult`, `LayoutQuality`, `measureBoundedNeighborhoodPreservation`
  - `sampling/sampling.ts` — `validateLayoutJob`, `normalizeCosineVectors`
  - `health/calculations.ts` — `calculateDuplicateCandidates`, `calculateOutlierCandidates`
  - `nativeHandoff.ts` — `NativeVisualizerWorkflow`, `createNativeVisualizerSession`
- Non-goals: t-SNE, 3D projection, automated optimization solver, ML recommendations, grid search
- Execution: plan-only
- Autonomy: checkpoint
- Commit policy: user-approved only
- Plan lifecycle state: planned
- Assumptions:
  1. No new npm dependencies — all math pure TypeScript
  2. WebGL2 available (existing fallback)
  3. Existing test patterns (Jest + Testing Library + renderComponent)
  4. i18n keys in `vectorVisualizer.*` namespace
- Open questions: see SPEC.md "Unresolved Decisions" (density color ramp, mini-atlas size, DBSCAN auto-epsilon, compare layout, legend position)

## Required Skill Stack

- Whole plan:
  - `caveman`: compressed prose for prompts and reports
  - `agent-delegation-routing`: confirm role/model/reasoning before dispatch
- Repo/task-specific:
  - `frontend`: React components, styled-components, named exports, FlexGroup, theme tokens
  - `redis-insight-plugin`: VV is internal plugin — Vite build, ComponentName folders
  - `code-quality`: TypeScript strict, no `any`, naming, imports, lint
  - `testing`: Jest + Testing Library, renderComponent, faker
  - `redis-ui-components`: component APIs via `uiSrc/components/ui` wrappers
  - `type-check-baselines`: `npm run type-check` before commit
  - `i18n`: translation keys for new UI labels
- Prompt requirement: every worker prompt includes `Use $agent-delegation-routing if available to confirm role, model/reasoning, ownership, command shape, and fallback before starting.`

## Routing and Model Budget

Agent tool model IDs: `sonnet` = Claude Sonnet 5, `opus` = Claude Opus 4.6.

| Role | Provider | Model (Agent param) | Version | Reasoning | Justification |
|------|----------|---------------------|---------|-----------|---------------|
| Wave 1 engine Implementor | Claude Code Agent | `sonnet` | Sonnet 5 | medium | Bounded pure-TS module + spec, 2-4 files |
| Wave 2 UI Implementor (small) | Claude Code Agent | `sonnet` | Sonnet 5 | medium | Component creation, bounded scope |
| Wave 2 UI Integrator (VV-ATLAS-INT) | Claude Code Agent | `opus` | Opus 4.6 | medium | Largest integration: WebGL + legend + density + DBSCAN across 8+ files |
| Wave 3 Implementor | Claude Code Agent | `sonnet` | Sonnet 5 | medium | Bounded cross-cutting feature |
| Wave 3 Auditor | Claude Code Agent | `opus` | Opus 4.6 | high | Independent fresh-context verification, 13+ acceptance criteria |
| Coordinator | Claude Code (this session) | `opus` | Opus 4.6 | high | Multi-wave orchestration, conflict resolution |

- Escalation: any task that fails verification twice escalates to opus 4.6/high
- No inherited model: every Agent call specifies explicit `model` parameter (`"sonnet"` or `"opus"`)

## Token Economy

- RTK usage: `rtk` for test output, lint output, type-check output
- Caveman usage:
  - default mode: full
  - worker report: full (exact file paths + verification evidence)
  - status/tracker: ultra
  - never compress: code, identifiers, file paths, error text
- References to load lazily: skill files only when worker needs them
- Worker output limit: verification commands + results + changed file list
- Evidence format: command output excerpts (pass/fail) + file paths
- Cleanup: remove `docs/agent-plans/2026-08-12-vv-v1-completion/` before PR

## Granularity Decision

- Shape: task-only (no epics)
- Reason: single ownership area (VV package + VV page), single branch, single coordinator session
- Epic triggers checked:
  - batches: 3 waves but all same ownership area ✗
  - workers: multiple but all same role (Implementor) except Auditor ✗
  - ownership areas: 1 (VV) ✗
  - phases: 3 waves but bounded sprint ✗
  - delivery surfaces: 1 (web UI) ✗
  - crates/packages: 1 (`vector-visualizer` + `pages/vector-visualizer`) ✗
  - CI/live-system tracks: 0 ✗
- Why epics would be overkill: all tasks share one ownership boundary, one branch, one test suite, one delivery surface

## Packet Mode Decision

- Packet mode: no
- Reason: 12 tasks across 3 dependency waves; standard wave parallelization is sufficient. File ownership conflicts are resolved by serialization (see Integration), not packet contracts.

## Parallelization

```
Wave 1 (6 parallel — disjoint files):
  VV-PCA-ENGINE | VV-KDE-ENGINE | VV-LEGEND | VV-TUNE-ENGINE | VV-DBSCAN | VV-TOPO-LAYOUT

Wave 2 (corrected — serialized shared-file track + 1 parallel):
  Parallel track: VV-TOPO-UI (disjoint: only AdvancedView.tsx + new files)
  Serial track:   VV-PCA-UI → VV-ATLAS-INT → VV-TUNE-UI
                  (all touch VectorVisualizerPage.tsx and/or VectorVisualizerControls.tsx)

Wave 3 (serial):
  VV-COMPARE → VV-AUDIT
```

- Why Wave 2 serial track: `VectorVisualizerPage.tsx` (2000+ lines) and `VectorVisualizerControls.tsx` modified by 3 tasks. Parallel writes would create merge conflicts. Each task builds on prior state.
- Parallel candidates checked: VV-TOPO-UI is the only Wave 2 task with fully disjoint files ✓

## Integration

- Integrator: coordinator (this session) — resolves shared-file writes between serial Wave 2 tasks
- Shared files with conflict risk:
  - `VectorVisualizerPage.tsx` — VV-PCA-UI (algorithm state), VV-ATLAS-INT (atlas section + density + DBSCAN), VV-TUNE-UI (tune workflow), VV-COMPARE (dual projection)
  - `VectorVisualizerControls.tsx` — VV-PCA-UI (algorithm selector), VV-ATLAS-INT (density toggle + cluster colorBy), VV-TUNE-UI (none), VV-COMPARE (compare toggle)
  - `components/index.ts` — VV-LEGEND, VV-TUNE-UI, VV-TOPO-UI (exports only, low conflict)
- Merge order: VV-PCA-UI → VV-ATLAS-INT → VV-TUNE-UI → VV-COMPARE (additive, each extends prior)
- Coordinator blocker policy:
  - bounded: fix directly or dispatch immediate repair
  - decision: escalate to user (architecture, product, security, scope)

## Task Tracking

- Memory backend: `agent-memory` MCP
- Namespace: `redisinsight-vv-v1`
- User ID: `pierre`
- Tracker file: `docs/agent-plans/2026-08-12-vv-v1-completion/tracker.md`
- Task status values: planning → running → blocked → failed → done → audited
- Done evidence required: verification command output (pass)
- Audited evidence required: Auditor verdict + independent verification

---

## Wave 1: Engines (6 parallel — disjoint files)

### Wave 1 Defaults

- Worker role: Implementor
- Provider: Claude Code Agent (`general-purpose`)
- Model: `sonnet` (Sonnet 5)
- Reasoning: medium
- Why sufficient: bounded pure-TS module with spec-defined interface, 2-4 owned files, unit test verification
- Escalation trigger: verification fails twice → `opus` (Opus 4.6) / high
- Commit allowed: no
- Prompt instruction: `Use $agent-delegation-routing if available to confirm role, model/reasoning, ownership, command shape, and fallback before starting.`
- Repo: `/Users/pierre/Documents/Work/RedisInsight`
- Branch: `feature/vector-visualizer`
- Required skills: `code-quality`, `testing`, `redis-insight-plugin`
- Output format: changed files list + verification command output (pass/fail)

### Task VV-PCA-ENGINE: PCA Layout Engine

- Objective: implement `runPCA` in layout worker; extend `validateLayoutJob` to accept `'pca'`
- Routing reason: bounded math module, 4 files, spec-defined interface
- Owned files:
  - `redisinsight/ui/src/packages/vector-visualizer/src/worker/layout.ts`
  - `redisinsight/ui/src/packages/vector-visualizer/src/worker/layout.spec.ts`
  - `redisinsight/ui/src/packages/vector-visualizer/src/sampling/sampling.ts`
  - `redisinsight/ui/src/packages/vector-visualizer/src/sampling/sampling.spec.ts`
- Forbidden files: any component file, `VectorVisualizerPage.tsx`, `AtlasRenderer.ts`
- Inputs: SPEC.md REQ-1, existing `runLayout` at `layout.ts:309-364`, `validateLayoutJob` in `sampling.ts`
- Target API:
  ```ts
  // layout.ts
  export const runPCA = (job: LayoutJobV1): Complete => { /* power iteration for top-2 eigenvectors */ }
  // runLayout dispatches pca when job.algorithm === 'pca'
  // sampling.ts: validateLayoutJob accepts 'pca'
  ```
- Compatibility: existing UMAP path unchanged; `LayoutResult` union already has `Unsupported` for tsne
- Example test shape:
  ```ts
  it('recovers 2D structure from 3D data with known principal components', () => {
    const vectors = new Float32Array([1,0,0, 0,1,0, 1,1,0]) // z=0 plane
    const result = runPCA(makeJob({ vectors, count: 3, dimensions: 3, algorithm: 'pca' }))
    expect(result.type).toBe('complete')
    // z-component should not contribute
  })
  ```
- Steps:
  1. Read `layout.ts` and `sampling.ts` to understand current structure
  2. Implement `runPCA`: mean-center, covariance (or Gram when count < dims), power iteration top-2, project
  3. Quality = variance explained ratio `(λ₁ + λ₂) / Σλ`
  4. Update `runLayout` dispatch: `if (job.algorithm === 'pca') return runPCA(job)`
  5. Update `validateLayoutJob` to accept `'pca'`
  6. Write tests: 2D-in-3D recovery, single point, zero count, variance ratio, cosine metric normalization
  7. Run `node 'node_modules/.bin/jest' 'redisinsight/ui/src/packages/vector-visualizer/src/worker/layout' -c 'jest.config.cjs'`
  8. Run `npm run lint -- --scope vector-visualizer` or `npm run lint`
- Verify: jest + lint green
- Done evidence: test output showing PCA tests pass, lint clean
- Audit: VV-AUDIT
- Tracking: memory record `vv-pca-engine`, tracker row
- Initial status: planning

### Task VV-KDE-ENGINE: Density Computation

- Objective: Gaussian KDE grid computation for 2D projected coordinates
- Routing reason: standalone math module, 2 new files, no dependencies on other VV code
- Owned files:
  - NEW `redisinsight/ui/src/packages/vector-visualizer/src/renderer/density.ts`
  - NEW `redisinsight/ui/src/packages/vector-visualizer/src/renderer/density.spec.ts`
- Forbidden files: `AtlasRenderer.ts`, any component file, `VectorVisualizerPage.tsx`
- Inputs: SPEC.md REQ-3
- Target API:
  ```ts
  export const computeDensityGrid = (
    coordinates: Float32Array, count: number, gridSize: number, bandwidth?: number
  ): Float32Array // normalized [0,1] grid
  ```
- Steps:
  1. Implement `computeDensityGrid` with Gaussian kernel
  2. Silverman bandwidth auto-selection when `bandwidth` omitted
  3. Output normalized [0,1] grid mapping to [0,1]² coordinate space
  4. Grid: 64×64 default, 128×128 for >5000 points
  5. Tests: single-point peak, two-cluster peaks, empty input, perf <200ms for 20K points
  6. Run jest for `renderer/density`
- Verify: jest green
- Done evidence: test output pass
- Tracking: memory record `vv-kde-engine`, tracker row
- Initial status: planning

### Task VV-LEGEND: AtlasLegend Component

- Objective: create AtlasLegend component with swatch+label+count rows
- Routing reason: standalone new component, 5 new files, no modification of existing components
- Required skills (additional): `frontend`, `redis-ui-components`
- Owned files:
  - NEW `redisinsight/ui/src/packages/vector-visualizer/src/atlas/AtlasLegend/AtlasLegend.tsx`
  - NEW `redisinsight/ui/src/packages/vector-visualizer/src/atlas/AtlasLegend/AtlasLegend.styles.ts`
  - NEW `redisinsight/ui/src/packages/vector-visualizer/src/atlas/AtlasLegend/AtlasLegend.types.ts`
  - NEW `redisinsight/ui/src/packages/vector-visualizer/src/atlas/AtlasLegend/AtlasLegend.spec.tsx`
  - NEW `redisinsight/ui/src/packages/vector-visualizer/src/atlas/AtlasLegend/index.ts`
- Forbidden files: `Atlas.tsx`, `AtlasRenderer.ts`, `VectorVisualizerPage.tsx`
- Inputs: SPEC.md REQ-2, existing neighbor chart legend pattern for visual consistency
- Target API:
  ```ts
  export interface AtlasLegendEntry { label: string; color: string; count: number }
  export interface AtlasLegendProps { entries: AtlasLegendEntry[]; onEntryClick?: (label: string) => void; maxVisible?: number }
  export const AtlasLegend: React.FC<AtlasLegendProps>
  ```
- Steps:
  1. Create folder structure per `frontend` skill (`ComponentName/` pattern)
  2. Types: `AtlasLegendEntry`, `AtlasLegendProps`
  3. Styles: scrollable container, swatch+label+count row, theme tokens, `import * as S`
  4. Component: iterate entries, click handler, "Show all" expander when >12
  5. Tests with `renderComponent`: render entries, click triggers callback, empty state, truncation
  6. Named export + barrel `index.ts`
  7. Run jest for `atlas/AtlasLegend`
- Verify: jest green, follows frontend skill patterns
- Done evidence: test output pass
- Tracking: memory record `vv-legend`, tracker row
- Initial status: planning

### Task VV-TUNE-ENGINE: Tune Recommendations + Sensitivity Logic

- Objective: create recommendation heuristics and sensitivity run planner
- Routing reason: 4 new files, pure logic modules, no UI
- Owned files:
  - NEW `redisinsight/ui/src/packages/vector-visualizer/src/tune/recommendations.ts`
  - NEW `redisinsight/ui/src/packages/vector-visualizer/src/tune/recommendations.spec.ts`
  - NEW `redisinsight/ui/src/packages/vector-visualizer/src/tune/sensitivity.ts`
  - NEW `redisinsight/ui/src/packages/vector-visualizer/src/tune/sensitivity.spec.ts`
- Forbidden files: any component file, `VectorVisualizerPage.tsx`
- Inputs: SPEC.md REQ-4, existing `LayoutJobV1` contract
- Target API:
  ```ts
  // recommendations.ts
  export interface TuneRecommendation { parameter: string; currentValue: unknown; guidance: string; impact: string; confidence: 'high' | 'medium' | 'low' }
  export const recommendVectorSetTuning = (profile: Record<string, unknown>, benchmarkRun?: unknown): TuneRecommendation[]
  export const recommendSearchIndexTuning = (indexInfo: Record<string, unknown>): TuneRecommendation[]

  // sensitivity.ts
  export interface SensitivityRun { nNeighbors: number; quality: number; coordinates: Float32Array }
  export const planSensitivityRuns = (baseJob: LayoutJobV1, values?: number[]): LayoutJobV1[]
  ```
- Steps:
  1. `recommendations.ts`: heuristic rules for EF_RUNTIME, M, EF_CONSTRUCTION by index size/dims
  2. `sensitivity.ts`: create 3 LayoutJobV1 copies with nNeighbors 5/15/30, unique jobIds
  3. Tests for both modules: recommendation generation, sensitivity plan creation
  4. Run jest for `tune/`
- Verify: jest green
- Done evidence: test output pass
- Tracking: memory record `vv-tune-engine`, tracker row
- Initial status: planning

### Task VV-DBSCAN: Clustering Engine

- Objective: DBSCAN clustering on 2D projected coordinates
- Routing reason: standalone math module, 2 new files
- Owned files:
  - NEW `redisinsight/ui/src/packages/vector-visualizer/src/health/clustering.ts`
  - NEW `redisinsight/ui/src/packages/vector-visualizer/src/health/clustering.spec.ts`
- Forbidden files: `HealthExplorers.tsx`, `VectorVisualizerPage.tsx`, `calculations.ts`
- Inputs: SPEC.md REQ-5
- Target API:
  ```ts
  export const computeDBSCAN = (
    coordinates: Float32Array, count: number, epsilon: number, minPoints: number
  ): { assignments: Int32Array; clusterCount: number }
  // -1 = noise, 0..n = cluster IDs

  export const autoEpsilon = (coordinates: Float32Array, count: number, k: number): number
  // k-distance graph knee detection
  ```
- Steps:
  1. Implement DBSCAN core with O(n²) spatial search (acceptable for 2D, n ≤ 20K)
  2. `autoEpsilon`: compute k-th nearest neighbor distances, find knee point
  3. Tests: two well-separated clusters, noise points, single cluster, auto-epsilon
  4. Run jest for `health/clustering`
- Verify: jest green
- Done evidence: test output pass
- Tracking: memory record `vv-dbscan`, tracker row
- Initial status: planning

### Task VV-TOPO-LAYOUT: Spring Embedding Graph Layout

- Objective: force-directed layout algorithm for HNSW topology graphs
- Routing reason: standalone math module, 2 new files
- Owned files:
  - NEW `redisinsight/ui/src/packages/vector-visualizer/src/advanced/topologyLayout.ts`
  - NEW `redisinsight/ui/src/packages/vector-visualizer/src/advanced/topologyLayout.spec.ts`
- Forbidden files: `AdvancedView.tsx`, any component file
- Inputs: SPEC.md REQ-6
- Target API:
  ```ts
  export interface GraphNode { id: string; degree: number }
  export interface GraphEdge { source: string; target: string }
  export const springLayout = (
    nodes: GraphNode[], edges: GraphEdge[], iterations?: number
  ): Map<string, { x: number; y: number }>

  export const graphStats = (
    nodes: GraphNode[], edges: GraphEdge[]
  ): { nodeCount: number; edgeCount: number; avgDegree: number; components: number }
  ```
- Steps:
  1. Implement spring embedding: repulsion (all pairs) + attraction (edges) + damping
  2. ~50 iterations default, capped at 200 nodes
  3. `graphStats`: count components via BFS/union-find
  4. Tests: two disconnected components separate, star graph centers hub
  5. Run jest for `advanced/topologyLayout`
- Verify: jest green
- Done evidence: test output pass
- Tracking: memory record `vv-topo-layout`, tracker row
- Initial status: planning

---

## Wave 2: UI Integration (depends on Wave 1)

### Wave 2 Defaults

- Worker role: Implementor
- Provider: Claude Code Agent (`general-purpose`)
- Model: `sonnet` (Sonnet 5) — except VV-ATLAS-INT → `opus` (Opus 4.6)
- Reasoning: medium
- Escalation trigger: verification fails twice → `opus` (Opus 4.6) / high
- Commit allowed: no
- Required skills: `frontend`, `redis-insight-plugin`, `code-quality`, `testing`, `redis-ui-components`, `i18n`
- Output format: changed files list + verification command output

### Task VV-PCA-UI: Algorithm Selector (serial track, position 1)

- Objective: add algorithm selector to controls, wire PCA into page layout dispatch
- Routing reason: 3 modified files + tests, bounded UI addition
- Model: sonnet | Reasoning: medium
- Why sufficient: additive UI control + state wiring, spec-defined behavior
- Depends on: VV-PCA-ENGINE
- Owned files:
  - `redisinsight/ui/src/pages/vector-visualizer/components/VectorVisualizerControls/VectorVisualizerControls.tsx`
  - `redisinsight/ui/src/pages/vector-visualizer/components/VectorVisualizerControls/VectorVisualizerControls.types.ts`
  - `redisinsight/ui/src/pages/vector-visualizer/components/VectorVisualizerControls/VectorVisualizerControls.spec.tsx`
  - `redisinsight/ui/src/pages/vector-visualizer/VectorVisualizerPage.tsx` (algorithm state + LayoutJobV1 dispatch ONLY)
- Forbidden files: `layout.ts`, `sampling.ts`, `AtlasRenderer.ts`, `Atlas.tsx`
- Other agents active: VV-TOPO-UI (disjoint files)
- Steps:
  1. Read current controls structure and page algorithm handling
  2. Add `VectorVisualizerAlgorithmControl` type (select: UMAP / PCA)
  3. Add algorithm selector in ControlsBody after source selector
  4. Add `projectionAlgorithm` state to page, default `'umap'`
  5. Pass selected algorithm into `LayoutJobV1` in layout dispatch
  6. Update summary line: show "PCA (42% variance)" or "UMAP (quality: 0.87)"
  7. Add i18n keys for algorithm labels
  8. Update `VectorVisualizerControls.spec.tsx`
  9. Run lint + type-check + jest for controls + page
- Verify: `npm run lint && npm run type-check && node 'node_modules/.bin/jest' 'redisinsight/ui/src/pages/vector-visualizer' -c 'jest.config.cjs'`
- Done evidence: lint clean, type-check pass, tests pass
- Tracking: memory record `vv-pca-ui`, tracker row
- Initial status: planning

### Task VV-ATLAS-INT: Atlas Legend + Density + Cluster Integration (serial track, position 2)

- Objective: integrate legend panel, density heatmap texture, DBSCAN cluster coloring into Atlas
- Routing reason: largest integration task — WebGL shader work + 3 new features across 8+ files; requires opus for quality
- Model: opus | Reasoning: medium
- Why sufficient: complex multi-feature integration into WebGL renderer; sonnet insufficient for shader + multi-feature coordination
- Depends on: VV-LEGEND, VV-KDE-ENGINE, VV-DBSCAN, VV-PCA-UI (for page state baseline)
- Owned files:
  - `redisinsight/ui/src/packages/vector-visualizer/src/atlas/Atlas/Atlas.tsx`
  - `redisinsight/ui/src/packages/vector-visualizer/src/atlas/Atlas/Atlas.types.ts`
  - `redisinsight/ui/src/packages/vector-visualizer/src/atlas/Atlas/Atlas.styles.ts`
  - `redisinsight/ui/src/packages/vector-visualizer/src/atlas/Atlas/Atlas.spec.tsx`
  - `redisinsight/ui/src/packages/vector-visualizer/src/renderer/AtlasRenderer.ts`
  - `redisinsight/ui/src/packages/vector-visualizer/src/renderer/AtlasRenderer.spec.ts`
  - `redisinsight/ui/src/packages/vector-visualizer/src/components/index.ts`
  - `redisinsight/ui/src/pages/vector-visualizer/VectorVisualizerPage.tsx` (atlas section + density state + DBSCAN colorBy)
  - `redisinsight/ui/src/pages/vector-visualizer/components/VectorVisualizerControls/VectorVisualizerControls.tsx` (density toggle + cluster colorBy)
  - `redisinsight/ui/src/pages/vector-visualizer/components/VectorVisualizerControls/VectorVisualizerControls.types.ts`
- Forbidden files: `layout.ts`, `sampling.ts`, `density.ts` (engine), `clustering.ts` (engine), `nativeHandoff.ts`
- Steps:
  1. Read Atlas.tsx, AtlasRenderer.ts, and current page atlas section
  2. **Density**: add WebGL texture program to AtlasRenderer — textured quad behind points, upload KDE grid as LUMINANCE, color ramp fragment shader, transform with pan/zoom uniforms
  3. **Legend**: integrate AtlasLegend into Atlas.tsx right panel, pass entries from colorByValue map, wire onLegendEntryClick to select matching IDs
  4. **Cluster labels**: make in-map labels conditional (showMapLabels toggle, default off)
  5. **DBSCAN colorBy**: add "Clusters (DBSCAN)" option to colorBy, run `computeDBSCAN` after layout, assign colors per cluster
  6. **Cluster centroids**: when DBSCAN active, compute per-cluster centroid for labels
  7. Export AtlasLegend from components/index.ts
  8. Add density/cluster props to Atlas.types.ts
  9. Update all tests
  10. Run full lint + type-check + jest
- Verify: `npm run lint && npm run type-check && node 'node_modules/.bin/jest' 'redisinsight/ui/src/packages/vector-visualizer' -c 'jest.config.cjs'`
- Done evidence: lint clean, type-check pass, all VV tests pass
- Tracking: memory record `vv-atlas-int`, tracker row
- Initial status: planning

### Task VV-TUNE-UI: Tune Workflow Tab (serial track, position 3)

- Objective: create Tune workflow with MiniAtlas thumbnails, sensitivity visual, recommendations
- Routing reason: new workflow tab, 9+ new files + page integration
- Model: sonnet | Reasoning: medium
- Why sufficient: component creation + page wiring; reuses existing patterns (CompareTune Pareto)
- Depends on: VV-TUNE-ENGINE, VV-ATLAS-INT (for page state baseline)
- Owned files:
  - NEW `redisinsight/ui/src/packages/vector-visualizer/src/tune/Tune/Tune.tsx`
  - NEW `redisinsight/ui/src/packages/vector-visualizer/src/tune/Tune/Tune.styles.ts`
  - NEW `redisinsight/ui/src/packages/vector-visualizer/src/tune/Tune/Tune.types.ts`
  - NEW `redisinsight/ui/src/packages/vector-visualizer/src/tune/Tune/Tune.spec.tsx`
  - NEW `redisinsight/ui/src/packages/vector-visualizer/src/tune/Tune/index.ts`
  - NEW `redisinsight/ui/src/packages/vector-visualizer/src/tune/MiniAtlas/MiniAtlas.tsx`
  - NEW `redisinsight/ui/src/packages/vector-visualizer/src/tune/MiniAtlas/MiniAtlas.styles.ts`
  - NEW `redisinsight/ui/src/packages/vector-visualizer/src/tune/MiniAtlas/MiniAtlas.spec.tsx`
  - NEW `redisinsight/ui/src/packages/vector-visualizer/src/tune/MiniAtlas/index.ts`
  - `redisinsight/ui/src/packages/vector-visualizer/src/components/index.ts`
  - `redisinsight/ui/src/pages/vector-visualizer/nativeHandoff.ts` (add 'tune' to union)
  - `redisinsight/ui/src/pages/vector-visualizer/nativeHandoff.spec.ts`
  - `redisinsight/ui/src/pages/vector-visualizer/VectorVisualizerPage.tsx` (tune workflow section)
- Forbidden files: `layout.ts`, `AtlasRenderer.ts`, `Atlas.tsx`, `recommendations.ts`, `sensitivity.ts`
- Steps:
  1. Create MiniAtlas: lightweight 200×200 canvas, takes Float32Array coordinates, renders dots (no interaction)
  2. Create Tune component — 3 sections: Sensitivity (3 MiniAtlas K=5/15/30 + quality chart), Parameter Analysis (config facts + Pareto reuse), Recommendations (list)
  3. Add `'tune'` to `NativeVisualizerWorkflow` union in nativeHandoff.ts
  4. Register in page workflows array
  5. Page: on Tune mount, create 3 LayoutJobV1 with different nNeighbors, dispatch to worker
  6. Compute recommendations from profile/info
  7. Tests with renderComponent for Tune + MiniAtlas, nativeHandoff update test
  8. Run full lint + type-check + jest
- Verify: `npm run lint && npm run type-check && node 'node_modules/.bin/jest' 'redisinsight/ui/src/packages/vector-visualizer' -c 'jest.config.cjs'`
- Done evidence: lint clean, type-check pass, tests pass
- Tracking: memory record `vv-tune-ui`, tracker row
- Initial status: planning

### Task VV-TOPO-UI: Topology Graph Component (parallel track)

- Objective: SVG force-directed graph replacing text list in AdvancedView
- Routing reason: new component + AdvancedView modification, disjoint from other Wave 2 tasks
- Model: sonnet | Reasoning: medium
- Why sufficient: bounded SVG component creation, follows existing AdvancedView patterns
- Depends on: VV-TOPO-LAYOUT
- Owned files:
  - NEW `redisinsight/ui/src/packages/vector-visualizer/src/advanced/TopologyGraph/TopologyGraph.tsx`
  - NEW `redisinsight/ui/src/packages/vector-visualizer/src/advanced/TopologyGraph/TopologyGraph.styles.ts`
  - NEW `redisinsight/ui/src/packages/vector-visualizer/src/advanced/TopologyGraph/TopologyGraph.types.ts`
  - NEW `redisinsight/ui/src/packages/vector-visualizer/src/advanced/TopologyGraph/TopologyGraph.spec.tsx`
  - NEW `redisinsight/ui/src/packages/vector-visualizer/src/advanced/TopologyGraph/index.ts`
  - `redisinsight/ui/src/packages/vector-visualizer/src/advanced/AdvancedView/AdvancedView.tsx`
  - `redisinsight/ui/src/packages/vector-visualizer/src/advanced/AdvancedView/AdvancedView.types.ts`
  - `redisinsight/ui/src/packages/vector-visualizer/src/components/index.ts`
- Forbidden files: `Atlas.tsx`, `AtlasRenderer.ts`, `VectorVisualizerPage.tsx`, `VectorVisualizerControls.tsx`
- Other agents active: Wave 2 serial track (disjoint files confirmed)
- Steps:
  1. Create TopologyGraph component: SVG circles (nodes) + lines (edges)
  2. Node size proportional to degree
  3. Selected node + edges highlighted
  4. Layer selector tabs
  5. Summary stats row: node count, edge count, avg degree, components
  6. Falls back to text list if <5 nodes
  7. Replace text list in AdvancedView with TopologyGraph
  8. Tests with mock topology data
  9. Run jest for `advanced/`
- Verify: `node 'node_modules/.bin/jest' 'redisinsight/ui/src/packages/vector-visualizer/src/advanced' -c 'jest.config.cjs'`
- Done evidence: tests pass
- Tracking: memory record `vv-topo-ui`, tracker row
- Initial status: planning

---

## Wave 3: Cross-cutting (serial — all Wave 2 complete)

### Task VV-COMPARE: Projection Comparison View

- Objective: side-by-side PCA vs UMAP Atlas with shared selection
- Worker role: Implementor
- Provider: Claude Code Agent (`general-purpose`)
- Model: sonnet | Reasoning: medium
- Why sufficient: additive feature on existing Atlas, bounded scope
- Depends on: VV-PCA-UI, VV-ATLAS-INT (both complete)
- Required skills: `frontend`, `code-quality`, `testing`
- Owned files:
  - `redisinsight/ui/src/packages/vector-visualizer/src/atlas/Atlas/Atlas.tsx`
  - `redisinsight/ui/src/packages/vector-visualizer/src/atlas/Atlas/Atlas.types.ts`
  - `redisinsight/ui/src/packages/vector-visualizer/src/atlas/Atlas/Atlas.styles.ts`
  - `redisinsight/ui/src/packages/vector-visualizer/src/atlas/Atlas/Atlas.spec.tsx`
  - `redisinsight/ui/src/pages/vector-visualizer/VectorVisualizerPage.tsx` (comparison state + dual projection)
  - `redisinsight/ui/src/pages/vector-visualizer/components/VectorVisualizerControls/VectorVisualizerControls.tsx` (compare toggle)
- Forbidden files: `layout.ts`, `AtlasRenderer.ts` (core), `density.ts`, `clustering.ts`
- Steps:
  1. Add "Compare projections" toggle to controls
  2. Atlas split mode: two panels, each with AtlasRenderer instance
  3. Left = current, Right = alternative projection
  4. Shared selection: click in one → highlights in both via shared selectedIds
  5. Shared color mapping (metadata or clusters)
  6. Labels: "PCA (variance: 42%)" / "UMAP (quality: 0.87)"
  7. Page: compute both projections when compare toggled on
  8. Tests: split rendering, synchronized selection
  9. Run lint + type-check + jest
- Verify: `npm run lint && npm run type-check && node 'node_modules/.bin/jest' 'redisinsight/ui/src/packages/vector-visualizer' -c 'jest.config.cjs'`
- Done evidence: lint clean, type-check pass, tests pass
- Commit allowed: no
- Tracking: memory record `vv-compare`, tracker row
- Initial status: planning

### Task VV-AUDIT: Full Integration Audit

- Objective: independently verify all 7 requirements against code and running app
- Worker role: Auditor
- Provider: Claude Code Agent (`general-purpose`, fresh context)
- Model: opus | Reasoning: high
- Why sufficient: 7 requirements with 13+ acceptance criteria, WebGL + multi-file verification, needs senior model for thorough independent review
- Depends on: all prior tasks
- Required skills: `code-quality`, `testing`, `frontend`
- Inputs:
  - source of truth: `SPEC.md` rev 2
  - changed files: all files modified/created by VV-PCA-ENGINE through VV-COMPARE
  - verification evidence: prior task done evidence
  - known risks: WebGL shader correctness, DBSCAN auto-epsilon edge cases, shared state sync in Compare mode
- Owned files: none (read-only + test execution)
- Forbidden files: no modifications (audit-only)
- Gates:
  - spec compliance: all 7 REQs acceptance criteria met
  - code quality: lint clean, type-check pass, no `any`, naming conventions
  - verification completeness: all test suites pass
  - runtime: no console errors, no WebGL context loss
- Steps:
  1. `npm run lint` — zero errors
  2. `npm run type-check` — no new errors
  3. `npm test` — all pass
  4. `node 'node_modules/.bin/jest' 'redisinsight/ui/src/packages/vector-visualizer' -c 'jest.config.cjs'` — all pass
  5. `node 'node_modules/.bin/jest' 'redisinsight/ui/src/pages/vector-visualizer' -c 'jest.config.cjs'` — all pass
  6. Start dev server: `npm run dev:ui`
  7. Browser verification:
     - PCA: switch algorithm, verify different layout
     - Legend: color swatches with metadata field, click selects points
     - Density: toggle on, heatmap behind scatter, pan/zoom works
     - DBSCAN: switch colorBy to Clusters, verify natural clusters
     - Tune: open tab, verify 3 mini-atlases, recommendations
     - Topology: open Advanced for Vector Set, verify graph
     - Compare: toggle, verify side-by-side with shared selection
     - Regression: Query Lab, Health, CompareTune, Explorer still work
  8. Fix any issues found (dispatch repair to coordinator)
- Verdict: APPROVED / NOT APPROVED / BLOCKED
- Findings format: `file:line | gate | issue | required fix | residual risk`
- Output format:
  - verdict
  - findings (if any)
  - verification evidence (command outputs)
  - residual risks
- Playwright evidence:
  - URL/dev server: `http://localhost:8080` via `npm run dev:ui`
  - Browser: Claude Browser
  - Viewports: desktop (1280×800)
  - Console/network errors: check for zero errors
- Done evidence: audit verdict + independent verification command outputs
- Commit allowed: no
- Tracking: memory record `vv-audit`, tracker row
- Initial status: planning

---

## File Count

| Wave | New files | Modified files |
|------|-----------|---------------|
| Wave 1 | 12 (6 modules + 6 specs) | 4 |
| Wave 2 | 14 (components + specs) | 12 |
| Wave 3 | 0 | 8 |
| **Total** | **26 new** | **24 modified** |

## Documentation Cleanup

- Cleanup owner: coordinator
- Archive: remove `docs/agent-plans/2026-08-12-vv-v1-completion/` before PR
- Tracker disposition: keep until VV-AUDIT reaches `audited`, then delete
- Commit policy: cleanup committed with user approval only

## Memory and Handoff

- Search: namespace `redisinsight-vv-v1`, user `pierre`
- Save: plan overview, task status transitions, coordinator prompt, audit verdict
- Do not save: test output, intermediate file contents, worker prompts
- Tracker file fallback: `tracker.md` always updated alongside memory
