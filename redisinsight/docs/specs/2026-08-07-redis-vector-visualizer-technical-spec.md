# Redis Vector Visualizer — Technical Specification

Date: 2026-08-07
Status: Proposed; visual contract amended 2026-08-09
Depends on: `2026-08-07-redis-vector-visualizer-product-spec.md`

## Architecture decision

Implement an internal RedisInsight feature with a shared visualization core and three host adapters:

```text
Search index page ─────┐
Vector Set details ────┼─> host adapter ─> vector source adapter ─> shared state/core
Workbench iframe ──────┘                                         │
                                                                  ├─ Worker layout
                                                                  ├─ WebGL2 renderer
                                                                  └─ DOM table/inspector
```

The Workbench surface is an **internal Vite plugin** under `ui/src/packages/vector-visualizer/`. It follows the monorepo Vite conventions and is registered in `ui/src/packages/vite.config.mjs`. It is not an external Parcel plugin.

Shared presentational and domain code must not live inside a sibling plugin. The implementation may use a repository-native shared feature directory selected during the foundation task, but imports must follow existing `uiSrc` aliases and internal Redis UI wrappers. The plugin, Search page, and Vector Set page consume the same domain contracts.

## Native workspace layout contract

The native host page implements one connected application workspace, not a component gallery. Its top-level layout has named landmarks for `controls`, `visualization`, and `results-inspector`, plus the existing page header and truth banner. Those landmarks must be addressable by stable test IDs so browser tests can assert geometry without coupling to styled-component class names.

At desktop acceptance size (`1440x900`), the workspace uses one grid row with bounded side columns and a fluid center. The center owns at least 55% of the workspace width, the controls column remains within 200–280 px, the result inspector remains within 280–360 px, and the ready-state workspace consumes the available content height without page-level vertical overflow. The exact CSS may use RedisInsight layout primitives or CSS grid, but hardcoded one-off positioning is not acceptable.

The `Atlas`, `Neighbors`, and `Selection` mode headers operate on the same normalized selection/query state. The renderer stays mounted when a mode switch can preserve context safely. The results table and inspector remain present on desktop and update their title, subtitle, rows, and provenance to match the active mode.

Desktop window behavior is progressive: compact the side columns at intermediate widths while keeping all three regions visible through RedisInsight's configured `960x680` minimum Electron window. The center remains primary; mobile drawers, overlays, and mobile-specific navigation are not part of this desktop product contract. The Workbench plugin may use a reduced Query Lab composition because it lacks native Atlas sampling, but it must preserve the same hierarchy and evidence semantics for the capabilities it exposes.

`2026-08-09-redis-vector-visualizer-visual-contract.md` and `assets/vector-visualizer/` are the geometry and interaction references. Product and technical semantic decisions override illustrative mockup values such as PCA and a 50,000-item sample range.

## Logical modules

### Host adapter

Normalizes host lifecycle without hiding capabilities:

```ts
type VectorVisualizerHost =
  | 'workbench'
  | 'vector-search'
  | 'vector-set-browser';

interface VectorVisualizerHostAdapter {
  host: VectorVisualizerHost;
  executeReadOnly(command: string, signal?: AbortSignal): Promise<RedisReply>;
  loadState<T>(): Promise<T | undefined>;
  saveState<T>(state: T): Promise<void>;
  openNativeWorkspace?(source: VectorDataSourceRef): void;
}
```

- Workbench wraps `redisinsight-plugin-sdk` `executeRedisCommand`, `getState`, and `setState`.
- Native surfaces use existing Redux/API service patterns and cancellable requests.
- Neither host adapter logs command parameters containing raw vectors.

### Vector source adapter

```ts
type VectorDataSourceRef =
  | { kind: 'search-index'; index: string; vectorField: string }
  | { kind: 'vector-set'; key: Uint8Array };

type EvidenceKind =
  | 'measured'
  | 'sampled'
  | 'derived'
  | 'estimated'
  | 'unavailable';

interface VectorSourceCapabilities {
  describe: boolean;
  enumerate: boolean;
  deterministicSample: boolean;
  rawVectors: boolean;
  reconstructedVectors: boolean;
  filteredNeighbors: boolean;
  exactNeighbors: 'native' | 'controlled-comparison' | 'none';
  queryProfile: 'full' | 'reduced' | 'none';
  topology: 'hnsw-adjacency' | 'none';
}

interface VectorSourceAdapter {
  readonly source: VectorDataSourceRef;
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

Every returned fact includes `EvidenceKind`, source command(s), timestamp, and exactness/provenance. The shared UI branches on `VectorSourceCapabilities`; it must not infer parity from method presence.

### Projection and graph worker

The main thread sends transferable typed arrays and a versioned job contract to a Web Worker. The worker returns progress, final coordinates, quality metrics, or a typed cancellation/error result.

```ts
interface LayoutJobV1 {
  version: 1;
  jobId: string;
  algorithm: 'umap' | 'pca' | 'tsne';
  metric: 'cosine' | 'l2' | 'ip';
  count: number;
  dimensions?: number;
  vectors?: Float32Array;
  edgeOffsets?: Uint32Array;
  edgeTargets?: Uint32Array;
  edgeDistances?: Float32Array;
  seed: number;
  parameters: Record<string, number>;
}
```

Requirements:

- UMAP accepts a sparse k-NN graph and is seeded.
- `umap` is the only implemented v1 algorithm. `pca` and `tsne` return a typed unsupported result and remain reserved for compatible future additions.
- Cosine vectors are normalized before Euclidean preprocessing.
- A new source, filter, or job cancels and invalidates previous work.
- Stale worker messages cannot replace newer results.
- No raw vectors are persisted outside process memory.

Use `umap-js@1.4.0` behind the worker adapter for v1, subject to the required package-install and target-compatibility proof. The approved dependency is pure JavaScript; no Wasm build or asset path is part of v1. Preserve its upstream license notices and verify the npm package, transitive dependencies, Vite iframe, Electron Worker, cancellation, seed, malformed-input, and 2,000/20,000-point behavior before claiming support.

### Renderer

Use a custom WebGL2 scatter renderer with GPU or indexed picking. Do not add D3FC, deck.gl, or another renderer dependency for v1.

The renderer must support:

- at least 20,000 plotted points on the agreed supported browser/device matrix;
- hover, click, shift-drag rectangular selection, pan, zoom, and resize;
- selected/live-neighbor/outlier/duplicate visual states;
- context-loss recovery and a clear unsupported-WebGL state;
- no one-DOM-node-per-point implementation in large mode;
- a linked DOM table as the accessible point-navigation alternative.

Performance claims require measured browser evidence. The implementation must not claim “tens of thousands” based only on renderer capacity if sampling, graph construction, layout, or Redis retrieval is the limiting stage.

## Search index adapter

### Discovery

- Parse `FT.INFO` to identify vector fields, algorithm, dimensions, type, metric, indexed count, and memory evidence available in the installed Redis version.
- Preserve HASH versus JSON storage and field/path semantics.
- If multiple vector fields exist, discovery succeeds but sampling/querying remains blocked until one is selected.

### Sampling

- Prefer deterministic, bounded ID enumeration when a stable order can be established.
- State explicitly when `FT.SEARCH ... LIMIT` ordering is nondeterministic.
- Use a cursor-based aggregate path where suitable and supported.
- Fetch only the selected vector field plus explicitly allow-listed display fields.
- Build the sample k-NN graph locally from fetched vectors or through a bounded query plan selected by measured command/transfer cost.
- Re-read `FT.INFO` count after sampling and mark concurrent change.

### Neighbors and profile

- Build token-aware KNN/vector-range queries using the index’s actual metric and field.
- Preserve Redis Query Engine filter syntax separately from Vector Set filter syntax.
- Parse Search replies across RESP shapes already supported by RedisInsight.
- `FT.PROFILE` facts may include iterator reads, estimated matches, vector execution mode, batch counts/sizes, processors, and latency when actually present.
- A funnel stage absent from the response is `unavailable`, not zero.
- Approximate indexes are labelled approximate. Exact claims require FLAT or a declared controlled truth method.

## Vector Set adapter

### Discovery and sampling

- Use `VCARD`, `VDIM`, and `VINFO` through the current connection.
- Prefer `VRANGE` for bounded traversal when supported. Use `VRANDMEMBER` only as a visibly unseeded fallback.
- Use `VEMB` only for bounded items and label values reconstructed and potentially quantized.
- Detect source count change before/after sampling.

### Neighbors, profile, and topology

- Use `VSIM` with `WITHSCORES` and optional attributes/filter.
- Normalize score/distance only through a named metric conversion; preserve the raw returned score.
- `VSIM TRUTH` is an explicit high-cost action with a visible estimate and confirmation.
- The Vector Set query profile is reduced: inputs, result counts/scores, elapsed client/server evidence if available, and configured `EF`/`FILTER-EF`; it must not mimic `FT.PROFILE` iterator stages.
- Use `VLINKS` only in Advanced topology and label layer/adjacency provenance.

## Workbench plugin contract

### Manifest

`ui/src/packages/vector-visualizer/package.json` shall contain `main`, `styles`, and non-empty `visualizations`. Proposed entry:

```json
{
  "id": "ri-vector-visualizer",
  "name": "Vector visualizer",
  "activationMethod": "renderVectorVisualizer",
  "matchCommands": [
    "FT.SEARCH",
    "FT.AGGREGATE",
    "FT.HYBRID",
    "FT.PROFILE",
    "VSIM"
  ],
  "description": "Explore and explain vector retrieval results",
  "default": false
}
```

`matchQuery` must restrict Search commands to vector syntax with bounded linear patterns or a repository-supported token-aware matcher. It must ignore `PARAMS` vector payloads, quoted keyword-like values, and longer/prefix command names. Overlap tests prove the existing Search table and Profile/Explain defaults remain unchanged.

### Activation

`renderVectorVisualizer` must:

1. check `#app`;
2. validate command/result props;
3. create the React root through the repo’s current React convention;
4. wrap the application in the plugin theme provider and an error boundary;
5. render command-failed, empty, unsupported, loading, and fatal-error states;
6. catch activation failures and render text rather than a blank iframe; and
7. log only safe metadata with `[vector-visualizer-plugin]`.

### Mandatory phased proof

- Phase 1: manifest, bundle, iframe, command, and raw safe-shape proof.
- Phase 2: React mount, theme, validated props, and defensive states.
- Phase 3: shared visualization core, adapters, worker, and renderer.

Each phase has current-session screenshot/console or automated evidence before the next phase is accepted.

## Shared interaction state

```ts
interface VectorVisualizerState {
  source?: VectorDataSourceRef;
  capabilities?: VectorSourceCapabilities;
  workflow: 'explore' | 'query-lab' | 'health' | 'compare-tune' | 'advanced';
  sample?: VectorSample;
  query?: QueryRun;
  selectedIds: string[];
  focusedId?: string;
  colorField?: string;
  filter?: SourceFilter;
  manifest?: ViewManifestV1;
  status: VisualizerStatus;
}
```

One normalized selection store coordinates Atlas, Neighbors, distributions, matrix, table, and inspector. Views do not maintain conflicting private selections. Selection IDs absent from the base sample remain valid with `plotted: false`.

## View manifest and comparison contract

`ViewManifestV1` is versioned, contains no raw vector or payload by default, and records:

- database/source identity using non-secret identifiers;
- vector field/key, schema facts, metric, algorithm/quantization;
- source/sample counts, sample ID digest, sampling method/seed/filter;
- graph/projection configuration and quality metrics;
- query command digest and profile evidence references;
- Redis and RedisInsight versions; and
- timestamps/freshness flags.

Compare & Tune accepts compatible manifests/runs only. It explains incompatible dimensions, metrics, fields, or source types rather than coercing them.

## Health calculations

- Duplicate candidates: connected components or groups above an explicit original-space similarity threshold.
- Outlier candidates: named local-density or nearest-neighbor-distance rule with sample-size and k parameters.
- Duplicate and outlier rules ship with tested default parameters that are visible and configurable before recomputation; results are labelled candidates, not confirmed defects.
- Metadata coverage: present/non-empty value count over the bounded sample for an allow-listed field.
- Semantic density: a derived sampled statistic with its formula; never a generic unlabeled “health score.”
- Status thresholds live in tested constants/configuration and appear in the inspector.

## Testing contract

### Unit and property-focused tests

- command tokenizer/matcher boundaries, `PARAMS`, quoted empty values, malformed commands;
- Search and Vector Set response shapes, empty/malformed rows, binary/reconstructed vectors;
- metric conversion and score ordering;
- deterministic sampling/seed and stale-result rejection;
- worker protocol, cancellation, transfer buffers, and projection result validation;
- selection synchronization and `not plotted` neighbors;
- capability gating and evidence labels;
- duplicate/outlier calculations with known fixtures;
- manifest versioning and compatibility checks.

### Component tests

- every meaningful state in the product specification;
- light/dark semantic tokens and code typography roles;
- keyboard selection through table and inspector;
- virtualization without pagination;
- chart axes, units, tooltips, source/freshness, and non-color labels;
- plugin error boundary and non-blank activation fallback.

### Integration and Playwright

- internal plugin appears in plugin API/registry and matches only intended commands;
- Workbench Phase 1/2/3 evidence;
- Search index entry point and multi-vector-field choice;
- Vector Set entry point and live `VSIM` neighborhood;
- linked selection across views;
- 1, 0, malformed, 2,000, and 20,000-point fixtures;
- cancellation/source switch with no stale result;
- `1440x900`, an intermediate desktop width, and the configured `960x680` minimum, light and dark;
- real RedisInsight route coverage rather than fixture-only HTML for final product acceptance;
- stable landmark geometry assertions for controls, visualization, and result inspector at desktop width;
- approved screenshot comparisons for Atlas, Neighbors, Selection, light/dark desktop at reference and minimum sizes, and representative loading/empty/error states;
- assertions that the ready Atlas fits the available content viewport without page-level vertical scrolling;
- no console/network errors and no unexpected outbound network requests;
- WebGL unavailable/context-lost state.

### Repository gates

Use the repository’s focused Jest commands first, then package typecheck, changed-scope lint, `git diff --check`, plugin Vite build, and relevant Playwright suites. Full UI/API gates run before audited completion when shared application/API wiring changes.

## Security and telemetry

- Telemetry may record entry point, source kind, workflow, sample-size bucket, projection choice, completion/cancellation, and error category.
- Telemetry must not record keys, index names, field names, filters, commands, IDs, vectors, scores tied to IDs, content, metadata values, or view manifests.
- No generated fixture may contain real customer embeddings or content.
- The audit searches bundles/logging paths for vector leakage and unexpected HTTP calls.

## Files and components expected to be impacted

The execution plan may refine names after discovery, but ownership is expected across:

- `ui/src/packages/vector-visualizer/**` and `ui/src/packages/vite.config.mjs`;
- a shared UI/domain directory under `ui/src/` chosen from repository conventions;
- Vector Search index/list/detail entry-point components;
- Vector Set details and related hooks/slices;
- plugin manifest/matcher tests;
- API/service code only if existing read-only execution paths cannot satisfy bounded, cancellable sampling;
- telemetry constants/tests;
- Playwright fixtures/tests; and
- durable docs/spec updates.

Existing modified geodata files on `feature/5921/geodata-workbench-plugin` are explicitly outside this change.

## Rollback

Disable the feature flag and remove entry-point affordances. Existing Search, Workbench, and Vector Set behavior remains intact. View manifests are local optional artifacts with no v1 file import/export and require no Redis data migration.
