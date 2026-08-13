# Vector Visualizer

Internal RedisInsight plugin for exploring, diagnosing, and explaining vector
retrieval results. It renders a 2D scatter plot of high-dimensional embeddings
(via UMAP or PCA), paired with tools for query debugging, health analysis, and
HNSW topology inspection.

## Architecture

The package is organised into self-contained modules under `src/`:

| Module        | Purpose                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| `advanced/`   | HNSW topology parsing, execution profiles, TopologyGraph                                               |
| `atlas/`      | Atlas scatter plot, AtlasLegend, CompareAtlas, provenance tracking                                     |
| `compare/`    | Snapshot drift detection, CompareTune, Pareto benchmark                                                |
| `components/` | Shared component barrel exports                                                                        |
| `explore/`    | MetadataMatrix (cluster purity heatmap)                                                                |
| `health/`     | Duplicate detection (union-find), outlier detection (MAD), clustering (DBSCAN), HealthExplorers, X-Ray |
| `query-lab/`  | QueryLab retrieval debugger (radial plot, histogram, rank gaps)                                        |
| `renderer/`   | WebGL2 AtlasRenderer (point cloud, hit-testing, density heatmap)                                       |
| `sampling/`   | Float32 snapshot management, cosine normalization, freshness checks                                    |
| `selection/`  | SelectionTable (virtualized), SelectionInspector                                                       |
| `tune/`       | Sensitivity sweep (MiniAtlas), parameter recommendations                                               |
| `types/`      | Shared type utilities                                                                                  |
| `worker/`     | Web Worker for UMAP/PCA dimensionality reduction                                                       |

Key entry points:

| File                      | Role                                                                                      |
| ------------------------- | ----------------------------------------------------------------------------------------- |
| `main.tsx`                | Plugin entry point (ThemeProvider, React root lifecycle)                                  |
| `contracts.ts`            | Central type system (`VectorMetric`, `CommandPlan`, `ViewManifest`, `EvidenceProvenance`) |
| `searchAdapter.ts`        | `FT.SEARCH` / `FT.INFO` / `FT.PROFILE` command builder                                    |
| `vectorSetAdapter.ts`     | `VSIM` / `VLINKS` / `VCARD` / `VGETATTR` command builder                                  |
| `workbenchIntegration.ts` | Workbench plugin payload parser                                                           |
| `workbenchSdk.ts`         | Workbench plugin SDK bridge (`redisinsight-plugin-sdk` binding)                           |
| `capabilityProof.ts`      | Capability resolution for search-index vs. vector-set sources                             |
| `distribution.ts`         | Build-time CSS sanitization                                                               |

## Data Flow

```
           sample               layout (Worker)            render
Redis  ---------->  Float32   ------------------>  xy[]  ---------->  WebGL2
       FT.SEARCH    snapshot     UMAP / PCA        coords   AtlasRenderer
       VSIM         (sampling/)  (worker/)                  (renderer/)
```

1. **Sampling** -- An adapter (`searchAdapter` or `vectorSetAdapter`) issues
   read-only Redis commands to fetch vector IDs and raw embeddings into a
   `Float32Array` snapshot. Cosine vectors are L2-normalized before layout.
2. **Layout** -- The snapshot is posted to a dedicated Web Worker that runs
   UMAP or PCA (via `umap-js`). The worker supports cancellation and transfers
   the result buffer back via `postMessage` with transferable ownership.
3. **Render** -- `AtlasRenderer` plots the 2D coordinates as a WebGL2 point
   cloud with GPU-accelerated hit-testing, selection state colouring, and
   optional density heatmap.

Downstream modules (QueryLab, Health, Advanced) overlay analysis on the same
snapshot and coordinate set without re-fetching.

## Development

### Running tests

```bash
# From the repo root
node 'node_modules/.bin/jest' \
  'redisinsight/ui/src/packages/vector-visualizer/src/**/*.spec.*' \
  -c 'jest.config.cjs'

# Or from the package directory
npm test
```

### Lint and type-check

```bash
# Lint (from repo root)
npm run lint:ui

# Type-check (from repo root -- compares against .tscheck.rec.json baselines)
npm run type-check
```

### Local dev server

```bash
npm run dev   # starts Vite dev server via the shared plugin config
```

### Test conventions

- Jest + Testing Library.
- Use the `renderComponent` helper for component tests.
- Use `faker` for test data generation, never hardcoded magic values.
- No `console.log` in production code; `console.warn` / `console.error` only.

## Key Contracts

### VectorSourceAdapter

The primary data interface. Each source kind (search-index, vector-set)
implements `discover`, `sample`, and `neighbors`. Optional methods `profile`
and `topology` are gated by `VectorSourceCapabilities`:

```ts
interface VectorSourceAdapter {
  readonly source: VectorDataSourceRef;
  readonly capabilities: VectorSourceCapabilities;
  discover(signal?: AbortSignal): Promise<VectorSourceDescription>;
  sample(request: SampleRequest, signal?: AbortSignal): Promise<VectorSample>;
  neighbors(
    request: NeighborRequest,
    signal?: AbortSignal,
  ): Promise<NeighborResult>;
  profile?(
    request: ProfileRequest,
    signal?: AbortSignal,
  ): Promise<QueryProfile>;
  topology?(
    request: TopologyRequest,
    signal?: AbortSignal,
  ): Promise<TopologyResult>;
}
```

### EvidenceProvenance

Every data value carries provenance metadata indicating how it was obtained
(`measured`, `sampled`, `derived`, `estimated`, `unavailable`) and its
exactness (`exact`, `approximate`, `sample-exact`, `unknown`). UI components
use this to display confidence indicators.

### CommandPlan

All Redis commands are built as `CommandPlan` objects before execution. Each
plan carries `readOnly: true`, provenance, optional ordering guarantees, and
an optional `requiresConfirmation` flag that triggers an explicit user consent
gate before the command runs.

### ViewManifest

A content-addressed snapshot identity (`version`, `sourceKind`, `sourceId`,
`sampleIdDigest`) used for drift detection between compare views.

## Constraints

- **Read-only commands only.** Every `CommandPlan` has `readOnly: true`. The
  plugin never issues writes.
- **Confirmation gates.** Commands marked `requiresConfirmation` require
  explicit user approval before execution. No command runs automatically on
  plugin load.
- **WebGL2 required.** The renderer targets WebGL2 with no canvas/2D fallback.
  `onUnsupported` fires when the context is unavailable.
- **20,000-vector limit.** Layout jobs reject snapshots exceeding 20k vectors
  to bound Worker memory and render time.
- **Single runtime dependency.** `umap-js@1.4.0` is the only non-dev
  dependency. All other computation (PCA, DBSCAN, union-find, MAD) is
  implemented in-tree.
- **Feature flag.** The visualizer is gated behind `devVectorVisualizer`.
- **Three host contexts.** The plugin renders in Workbench (plugin iframe),
  Browser (key details panel), and a dedicated full-page view, each providing
  a `VectorVisualizerHostAdapter`.
- **Styling.** Uses `styled-components` with Redis UI semantic theme tokens
  via internal wrappers from `uiSrc/components/ui`. Does not import directly
  from `@redis-ui/*`.
