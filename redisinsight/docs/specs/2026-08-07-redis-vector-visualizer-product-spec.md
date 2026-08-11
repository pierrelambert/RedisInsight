# Redis Vector Visualizer — Product Specification

Date: 2026-08-07
Status: Proposed; visual contract amended 2026-08-09
Product: RedisInsight
Surfaces: Vector Search, Browser Vector Set details, Workbench visualization plugin

## Summary

RedisInsight shall provide one vector visualization workspace for two Redis data-source types:

- a Redis Search index containing at least one `VECTOR` field; and
- a native Redis Vector Set key.

The workspace is organized around developer questions rather than vector-index internals. It combines an embedding atlas, a query-centered neighborhood, linked selection inspection, retrieval diagnostics, data-health analysis, comparison/tuning tools, and an explicitly advanced topology view.

“Collection” is not used as a Redis object name. In product copy:

- a Redis Search collection is a **Search index**;
- a native vector collection is a **Vector Set**;
- the shared internal/product abstraction is a **vector data source**.

The system must expose capability differences honestly. A control or metric that Redis cannot provide for the selected source is disabled with an explanation; it is never estimated and presented as measured fact.

## Normative visual reference

The versioned visual contract in `2026-08-09-redis-vector-visualizer-visual-contract.md` and the artifacts under `assets/vector-visualizer/` are normative for workspace composition, information hierarchy, density, connected interaction, and supported desktop-window behavior. They preserve the Redis product mockups produced during brainstorming instead of relying on transient `.superpowers` state.

The product and technical specifications remain authoritative for Redis semantics, supported algorithms, evidence labels, privacy, and performance limits. Where a mockup conflicts with a later decision, the later semantic decision wins. In particular, v1 remains UMAP-only and the explicit supported sample range remains 500–20,000 even though an early visual artifact illustrates a PCA control and a larger range.

## Product outcome

A developer should be able to answer these questions without leaving RedisInsight:

1. What broad structure exists in this Search index or Vector Set?
2. Why did this query return these results?
3. Are the scores meaningful for this data source?
4. Did filtering starve or slow the candidate set?
5. Are duplicates, outliers, missing metadata, or ingestion problems present?
6. What changed between two samples, models, or index configurations?
7. Which recall, latency, and memory trade-off is acceptable?
8. What graph structure can Redis expose for advanced debugging?

## Entry points

### Vector Search

Each vector-capable Search index exposes a **Visualize vectors** action from its index context. Opening it selects the index and a vector field. If the index has multiple vector fields, the user must choose one before sampling or querying.

### Browser — Vector Set

Vector Set key details expose a **Visualize** action that opens the same workspace with the current key selected. Existing element browsing, similarity search, and editing remain unchanged.

### Workbench plugin

An internal Vite Workbench plugin exposes **Vector visualizer** for:

- `FT.SEARCH`, `FT.AGGREGATE`, and `FT.HYBRID` commands containing a vector query;
- `FT.PROFILE` commands profiling a vector query; and
- `VSIM`.

The Workbench view starts in Query Lab using the executed command and result. It may issue additional read-only commands through the plugin SDK after explicit user action. It is never the default visualization when that would conflict with the existing Search table or Profile/Explain visualization.

Atlas-scale exploration is available in Workbench only when the SDK adapter proves the required bounded sampling and cancellation capabilities. Otherwise Workbench links to the native full-page workspace and says why.

## Information architecture

The workspace uses five peer workflows. Individual charts are synchronized subviews, not separate top-level products.

### Explore

Purpose: understand semantic structure and metadata coverage.

- **Atlas** — a sampled 2D projection with cluster, density, and outlier overlays.
- **Metadata × cluster matrix** — a heatmap that relates semantic regions to a selected metadata field.
- **Selection** — a linked virtualized table and inspector for selected points.

### Query Lab

Purpose: explain and debug one retrieval.

- **Neighbors** — the query or selected vector at the center; radius represents the real metric-aware distance or similarity.
- **Similarity distribution** — result scores compared with a bounded source-space sample and configured thresholds.
- **Rank-gap waterfall** — ordered scores with meaningful gaps and suggested inspection cutoffs; suggestions are descriptive, never automatic configuration changes.
- **Filter/candidate profile** — Search uses measured `FT.PROFILE` stages when available; Vector Set shows only stages and counts Redis actually returns.
- **Content and metadata preview** — linked inspector for the selected result.

Selecting a point, histogram bin, rank, table row, or matrix cell highlights the corresponding items in every visible Query Lab view.

### Health

Purpose: answer “is this vector data source sane?” quickly, then provide evidence.

- **X-ray summary** — dimensions, metric, algorithm/quantization, indexed count, sample freshness, duplicate rate, outlier rate, metadata coverage, and score distribution.
- **Duplicate explorer** — connected groups above a configurable near-duplicate threshold.
- **Outlier explorer** — low-local-density or high-nearest-neighbor-distance items, with direct content/metadata inspection.

Health labels such as `Healthy`, `Attention`, or `Unknown` must name the threshold, sample, and calculation behind them. Unknown or unavailable evidence must not render as healthy.

### Compare & Tune

Purpose: compare evidence across controlled runs.

- **Drift comparison** — compares two saved view manifests or snapshots: cluster population, vector norm, neighbor overlap, duplicate/outlier rate, metadata coverage, and source configuration.
- **Recall / latency / memory Pareto** — compares explicitly executed benchmark runs across algorithms and tunable parameters. Bubble size represents measured memory only when a comparable memory measure is available.

RedisInsight does not silently run expensive truth scans or background benchmarks. The user reviews the estimated work and starts each benchmark.

### Advanced

Purpose: expose index structure without confusing it with semantic truth.

- **Vector Set topology** uses `VLINKS` when supported and labels links as HNSW adjacency, not nearest-neighbor results.
- Search-index topology or traversal is unavailable unless Redis exposes an authoritative command or profile trace for it.
- `FT.PROFILE` execution modes and iterator evidence may be shown as a search trace, but must not be drawn as HNSW node traversal unless the response contains that information.

## Core visualization contracts

### Atlas

- The default projection is seeded UMAP over a bounded sparse k-nearest-neighbor graph.
- UMAP is the only v1 projection. PCA and t-SNE are deferred until measured user demand justifies them.
- The v1 UI exposes no projection selector. The versioned layout contract retains typed unsupported results so later algorithms do not require renderer changes.
- The page always says **2D projection of a sample** and displays sampled count, source count, sampling method, filter, projection algorithm, seed, freshness, and a neighborhood-quality measure.
- Clicking a point runs a fresh whole-source neighbor query. Returned neighbors outside the plotted sample appear in Selection as **not plotted** and may be added to the current overlay.
- Shift-drag selects only plotted sample points.
- Color can encode one metadata/attribute field; shape or outline is reserved for selected, queried, outlier, duplicate, or live-neighbor state.
- Distances between arbitrary 2D points are not described as original-space similarity.

### Neighbors

- The center is the query vector or selected source element.
- Radius is a monotonic rendering of the real source metric and the exact value appears in the tooltip/table.
- Angle is labelled **layout only** unless it encodes a named category or is derived from measured neighbor-to-neighbor relations.
- Rings represent named top-k boundaries or explicit score/distance thresholds.
- Query exactness is labelled `exact`, `approximate`, `sample exact`, or `unknown` using adapter evidence.

### Selection and inspector

- The table is virtualized for large local selections and is not paginated at the same time.
- Stable row identity is the document ID or Vector Set element name.
- Default columns: rank, ID/member, score/distance, plotted state, selected color field, and freshness/provenance.
- Long IDs and values use code typography, bounded columns, ellipsis, tooltip, and copy actions.
- The inspector preserves map/table context and shows allow-listed content, metadata/attributes, source facts, exactness, and the command that produced the row.
- Copy/export defaults to IDs and view-manifest facts. Payload/content export is explicit.

## Capability matrix

| Capability               | Search index                                            | Vector Set                                                     |
| ------------------------ | ------------------------------------------------------- | -------------------------------------------------------------- |
| Source description       | `FT.INFO`, vector schema                                | `VCARD`, `VDIM`, `VINFO`                                       |
| Enumeration/sample       | bounded document enumeration with stable-order caveats  | `VRANGE` when supported; bounded `VRANDMEMBER` fallback        |
| Live neighbors           | filtered KNN or vector-range Search query               | `VSIM`                                                         |
| Filter language          | Redis Query Engine syntax                               | Vector Set `FILTER` syntax                                     |
| Query profile            | measured `FT.PROFILE` iterator and vector-mode evidence | reduced `VSIM` inputs/results only; no invented profile stages |
| Raw/reconstructed vector | bounded HASH/JSON field retrieval                       | `VEMB`; labelled reconstructed/quantized where applicable      |
| Exact comparison         | FLAT or explicit controlled truth method                | `VSIM TRUTH` after explicit cost confirmation                  |
| HNSW adjacency           | unavailable unless Redis exposes it                     | `VLINKS` when supported                                        |

## Sampling, trust, and freshness

- Sampling is on by default. Initial default: 2,000 items; explicit supported range: 500–20,000 until measured limits justify expansion.
- Sampling must be cancellable and bounded by item count, dimensions, estimated bytes, Redis command count, and layout time.
- Deterministic ID-hash sampling is preferred where enumeration permits it. Optional stratification may use one TAG or attribute field.
- A saved view manifest records source identity, vector field, source count, sample IDs or digest, sampling method/seed, filter, metric conversion, graph exactness, projection algorithm/version/parameters/seed, Redis/app version, and timestamp.
- Source count is checked before and after sampling. A changed source is marked **changed while sampled**.
- The visualizer never claims a sampled statistic is source-wide without an extrapolation label and method.

## Redis Product UI requirements

- Surface: compact RedisInsight product workspace and Workbench plugin iframe.
- Themes: RedisInsight `light` and `dark`; never `light2`/`dark2`.
- Typography: Geist for UI; Source Code Pro for commands, keys, IDs, metrics, parameters, and raw values.
- Desktop composition: below the RedisInsight page header and truth banner, the primary workspace is a single viewport-filling row with persistent left controls, the dominant central visualization, and a persistent right result inspector. It must not degrade into a vertical stack of unrelated component demonstrations.
- Left controls contain the source/vector field, filter and active chips, color-by, projection disclosure, sample budget, display toggles, and sample/freshness summary. Controls that are unsupported remain visible only when an explanation is useful; they are not presented as operational.
- The central region contains the connected `Atlas`, `Neighbors`, and `Selection` modes, a compact mode header/status line, and the largest available plotting surface. Selection in the plot and result list remains synchronized.
- The right inspector contains a context-sensitive title, provenance subtitle, search, copy/export affordances, a virtualized results table, and an optional detail inspector without displacing the plot.
- At `1440x900`, all three regions are visible in one row: left controls 200–280 px, right inspector 280–360 px, and the central region receives at least 55% of the workspace width. The primary ready-state workspace fits the available content height without requiring page-level vertical scrolling.
- At intermediate desktop widths the side regions compact before the central plot. At RedisInsight's configured `960x680` minimum Electron window, all three regions remain visible and keyboard-accessible while the central visualization stays primary. Mobile drawers, overlays, and mobile-specific navigation are out of scope.
- `Atlas`, `Neighbors`, and `Selection` are three connected states of the same workspace, not independent vertically stacked showcase panels.
- Tables are preferred over card grids for operational records.
- Charts include title, units, axes where applicable, tooltips, source/freshness, and empty/loading/error states.
- Semantic color families distinguish informative, success, notice, attention, danger, discovery, and selected states. Redis Red is not the universal accent or status color.
- Meaning is never carried by color alone.
- Keyboard users can reach tabs, filters, points through the linked table, selection actions, and inspector. Canvas/WebGL marks have an equivalent accessible table interaction.
- Reduced-motion mode disables nonessential animated layout transitions.

## State model

Every workflow must render these states:

- source not selected;
- capability discovery;
- ready but not sampled/queried;
- fetching with bounded progress and cancel;
- graph/layout progress;
- partial result with disclosure;
- stale or changed while sampled;
- empty after filter;
- unsupported capability;
- ACL/command unavailable;
- cancelled;
- recoverable error with retry;
- fatal visualization error with a non-blank fallback.

The Workbench activation function checks `#app`, validates props, catches activation errors, uses a React error boundary, and logs with `[vector-visualizer-plugin]`.

## Safety, privacy, and operations

- All Redis operations are read-only and use the current connection and ACLs.
- No hidden network calls or third-party telemetry.
- Raw embeddings are treated as sensitive: held in memory only, never logged, never sent to analytics/crash reports, never copied/exported by default, and cleared on source change/unmount.
- Content/metadata fields are opt-in allow-listed for display and export.
- Expensive operations such as `VSIM TRUTH`, full enumeration, or many per-anchor KNN queries show an estimate and require explicit confirmation.
- Commands are tokenized according to Redis grammar. Vector payloads and `PARAMS` values are not scanned as query syntax.

## Compatibility and rollout

- Existing Search result tables, Profile/Explain, Vector Search, and Vector Set editing behavior remain available and unchanged.
- Plugin visualizations use non-conflicting command matchers and mutually exclusive defaults.
- Unsupported Redis versions show capability guidance rather than failing silently.
- New functionality is gated behind a RedisInsight feature flag until product, performance, telemetry, accessibility, and security gates pass.
- No stored Redis data, index schema, Vector Set contents, or public Redis API is migrated.
- Disabling the feature flag is the rollback path.

## Success criteria

The feature is successful when a developer can:

1. open the correct vector data source from each supported entry point;
2. run one query and inspect synchronized neighborhood, score, rank-gap, profile, and payload evidence;
3. inspect a sampled Atlas with honest projection and freshness disclosures;
4. find duplicate and outlier candidates and inspect their source records;
5. compare two saved manifests or benchmark runs without confusing sampled and measured facts;
6. understand every unavailable capability from the UI; and
7. complete the workflows in both themes and by keyboard without console/runtime errors;
8. recognize the versioned reference composition at desktop width: persistent controls, dominant canvas, persistent linked inspector, compact header, and connected mode tabs; and
9. complete a real-route visual acceptance suite whose geometry assertions and approved screenshots cover Atlas, Neighbors, Selection, reference and minimum desktop windows, light, dark, and meaningful non-ready states.

## Non-goals

- Editing vectors, Search schemas, or Vector Set elements from the visualizer.
- Replacing the existing Search results table or Vector Set element table.
- Claiming that a 2D projection preserves exact global geometry.
- Running continuous production monitoring or background scheduled health scans.
- Automatically changing index parameters.
- Implementing a generic database-agnostic “collection dashboard.”
- Presenting HNSW adjacency as semantic nearest-neighbor truth.

## Open product decisions

None before v1 implementation.

Closed decisions: saved manifests remain local to the RedisInsight profile with no file import/export in v1; duplicate and outlier calculations ship with visible, tested, configurable defaults; Atlas is native-only in v1 because the current Workbench SDK cannot provide cancellable bounded sampling; metadata/content defaults to IDs only.

## Source evidence

- Current canonical RedisInsight baseline: `origin/main` commit `0b53c6c2fac260ab2d1b439ee23ea6554d9ce8f4` fetched 2026-08-07.
- RedisInsight plugin contract: repository `docs/plugins/development.md`, `docs/plugins/introduction.md`, and `ui/src/packages/redisinsight-plugin-sdk/README.md` at that commit.
- Current product surfaces: `ui/src/pages/vector-search/`, `ui/src/pages/browser/modules/key-details/components/vector-set-details/`, `ui/src/packages/redisearch/`, `ui/src/packages/ri-explain/`, and `ui/src/packages/geodata/`.
- Research synthesis: `docs/research/2026-08-07-vector-visualization-research.md`.
- Normative visual contract: `docs/specs/2026-08-09-redis-vector-visualizer-visual-contract.md`.
- Preserved brainstorming artifacts and reference captures: `docs/specs/assets/vector-visualizer/`.
