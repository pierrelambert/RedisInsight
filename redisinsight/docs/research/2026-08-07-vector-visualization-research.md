# Redis vector index and Vector Set visualization research

Date: 2026-08-07  
Scope: one visualizer for both Redis Search vector indexes and native Redis Vector Sets. Sources are limited to official documentation, specifications, research papers, and first-party source repositories.

## Recommendation

Build one visualizer with two data adapters and two complementary views:

1. **Similarity view (first release):** put a selected document at the center; place returned neighbors at radius proportional to the real distance from that anchor. This is cheap, explainable, and maps directly to one `FT.SEARCH` KNN / vector-range query or one `VSIM` query. Angle must be presented as layout-only unless it is derived from neighbor-to-neighbor relationships.
2. **Index map (second release):** project a bounded, visibly labelled sample with UMAP over a sparse k-NN graph, compute the layout in a Web Worker/Wasm, and render points with WebGL2. Clicking a point should issue a fresh whole-index nearest-neighbor query; Shift-drag should select only points in the displayed sample. For a native Vector Set, the equivalent scope is the full Vector Set key.

This split avoids pretending that one 2D map can answer both “what is near this document?” and “what broad structure exists in this collection?” The similarity view preserves the selected anchor distance; the collection map is exploratory and necessarily distorted.

Use a shared internal contract—data-source description, sampled point IDs, attributes, metric-aware distances, neighbor edges, and exact/approximate provenance—while keeping the two Redis filter syntaxes in their respective adapters.

## What Qdrant actually does

The premise needs one correction: **Qdrant's layout is not server-side.** Its server-side [Distance Matrix API](https://qdrant.tech/documentation/search/explore/#distance-matrix) randomly samples points and returns a sparse k-NN matrix (`sample` points, `limit` neighbors per point). The current Web UI then:

- requests that matrix, retrieves payloads without vectors, and fetches raw vectors only for PCA ([request pipeline](https://github.com/qdrant/qdrant-web-ui/blob/879970965faadce74cd389447dbdee5dc23bfd72/src/components/VisualizeChart/requestData.js));
- runs UMAP or Barnes-Hut t-SNE in a browser Web Worker using `@qdrant/graph-layout-wasm`, sending intermediate `Float32Array` coordinates to the UI ([worker](https://github.com/qdrant/qdrant-web-ui/blob/879970965faadce74cd389447dbdee5dc23bfd72/src/components/VisualizeChart/worker.js));
- renders and color-picks points with a custom WebGL2 renderer ([renderer](https://github.com/qdrant/qdrant-web-ui/blob/879970965faadce74cd389447dbdee5dc23bfd72/src/components/VisualizeChart/ScatterGL.js)); and
- performs a fresh collection-wide neighbor query after a click; those neighbors may be outside the plotted sample ([page behavior](https://github.com/qdrant/qdrant-web-ui/blob/879970965faadce74cd389447dbdee5dc23bfd72/src/pages/Visualize.jsx)).

The Wasm engine consumes a precomputed sparse k-NN graph, not raw vectors, and is deterministic for a given seed. Its published native reference measurements are 20,000 points / 300,000 edges in 4 seconds and 100,000 / 1.5 million in 21 seconds; these are useful sizing evidence, not a browser guarantee ([engine README and benchmark method](https://github.com/qdrant/graph-layout-wasm/blob/25ac7c69e1549c0dd2ff9b9b3b1c2d285a34df0f/README.md)).

The reusable pattern is therefore **server-produced sparse neighborhood graph → client worker/Wasm projection → WebGL rendering**, with payloads and live neighbors fetched separately. Redis currently supplies the query primitives but not Qdrant's one-call sampled distance matrix.

## Projection choices and trust limits

| View / method | What it preserves | Strength | Trust limit |
|---|---|---|---|
| Anchor-centric radial | Distance to one selected point | Directly explains a KNN/range result; no global layout required | Only radius has semantic meaning. An arbitrary angle says nothing about similarity between two non-anchor points. Query/index approximation still applies. |
| PCA | Maximum variance in a linear 2D subspace | Fast baseline; stable axes; supports projecting new points | It optimizes linear reconstruction/variance, not neighborhood preservation. Centering and projection can change cosine relationships. Requires raw vectors. |
| t-SNE | Local pairwise probability neighborhoods | Often separates fine local structure | Non-convex and stochastic; global distances are not explicitly preserved; perplexity changes the effective neighborhood scale; comparatively expensive. |
| UMAP | A fuzzy graph built from local neighborhoods | Best default for a sparse k-NN input; explicit local/global control via `n_neighbors`; supports cosine/precomputed distances | Stochastic unless the graph and seed are fixed; 2D cluster spacing and density remain an approximation, not evidence of semantic distance. |

PCA is a least-squares “closest fit” construction in the original method ([Pearson, 1901](https://doi.org/10.1080/14786440109462720)); modern PCA is a centered SVD projection and exposes explained variance ([scikit-learn PCA reference](https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.PCA.html)). t-SNE constructs high- and low-dimensional neighbor probabilities and minimizes their KL divergence ([van der Maaten and Hinton, 2008](https://www.jmlr.org/papers/v9/vandermaaten08a.html)); its objective is non-convex and global structure is not explicit ([scikit-learn manifold reference](https://scikit-learn.org/stable/modules/manifold.html)). UMAP constructs a neighborhood graph and optimizes a low-dimensional representation of it ([McInnes, Healy, and Melville](https://arxiv.org/abs/1802.03426)); its official documentation describes the local/global `n_neighbors` trade-off and direct cosine/precomputed metric support ([UMAP parameters](https://umap-learn.readthedocs.io/en/latest/parameters.html)).

For cosine embeddings, normalize vectors before any Euclidean preprocessing: for unit vectors, squared Euclidean distance is exactly `2 * (1 - cosine_similarity)`. Redis Search itself defines cosine distance as `1 - cos(u,v)` ([Redis vector metrics](https://redis.io/docs/latest/develop/ai/search-and-query/vectors/#distance-metrics)).

Every map should say “2D projection of a sample” and show a neighborhood-quality value such as trustworthiness/continuity or sampled neighbor-overlap@k. Trustworthiness measures whether apparent 2D neighbors are also neighbors in the source space; continuity measures whether source-space neighbors remain nearby in 2D ([Venna and Kaski, 2001](https://doi.org/10.1007/3-540-44668-0_68)). The radial view should label angle as “layout only” unless a secondary optimization gives it meaning.

## Redis data adapters

### Redis Search vector index

Discovery and description:

- `FT._LIST` discovers indexes, although Redis labels it temporary and notes that a future scan-style command is intended ([command reference](https://redis.io/docs/latest/commands/ft._list/)).
- `FT.INFO` supplies the index definition, attributes, document count, and vector-index memory statistics ([command reference](https://redis.io/docs/latest/commands/ft.info/)). Use its vector field type, dimension, data type, distance metric, and algorithm to configure decoding and labels.

Data and neighbors:

- `FT.SEARCH index "*" NOCONTENT LIMIT ...` enumerates matching document IDs; `RETURN` can restrict returned fields. Paging without a unique `SORTBY` is explicitly non-deterministic, so stable paging requires a unique sortable field or `FT.AGGREGATE ... WITHCURSOR` ([`FT.SEARCH`](https://redis.io/docs/latest/commands/ft.search/), [`FT.AGGREGATE`](https://redis.io/docs/latest/commands/ft.aggregate/)).
- Fetch HASH vectors as their stored binary field and JSON vectors as their numeric JSON path; the schema tells the adapter how to decode them. Redis documents that vectors and metadata live in hashes or JSON objects ([indexing overview](https://redis.io/docs/latest/develop/ai/search-and-query/indexing/)).
- Use filtered KNN for an anchor, or `VECTOR_RANGE` for a distance threshold. Redis supports TEXT/TAG/NUMERIC/GEO filters before vector search and exposes HNSW runtime accuracy controls such as `EF_RUNTIME` ([vector search concepts](https://redis.io/docs/latest/develop/ai/search-and-query/vectors/)). FLAT is exact; HNSW and SVS-VAMANA are approximate, so the UI must expose the index algorithm and never label all results “ground truth.”

There is no documented Search command equivalent to Qdrant's sampled distance matrix. A global map must therefore either (a) fetch a bounded raw-vector sample and build its k-NN graph in RedisInsight, or (b) issue bounded, pipelined KNN queries for sampled anchors. Option (a) is simpler and produces a graph constrained to the displayed sample but transfers sensitive vectors; option (b) reduces vector transfer but adds server load and can return neighbors outside the sample.

### Native Redis Vector Set

Discovery and description:

- Discover keys through the existing RedisInsight key browser/`SCAN`, then confirm the vector-set type. `VCARD`, `VDIM`, and `VINFO` expose size, dimensions, quantization, and graph metadata ([Vector Set command summary](https://redis.io/docs/latest/develop/data-types/vector-sets/), [`VINFO`](https://redis.io/docs/latest/commands/vinfo/)).

Data and neighbors:

- Redis 8.4's `VRANGE` is the preferred bounded enumeration API: it is a stateless lexicographic iterator with explicit concurrent-modification semantics ([`VRANGE`](https://redis.io/docs/latest/commands/vrange/)). On Redis 8.0–8.2, `VRANDMEMBER key count` can provide an unseeded random sample, but not a reproducible full traversal ([`VRANDMEMBER`](https://redis.io/docs/latest/commands/vrandmember/)).
- `VEMB` retrieves an element's reconstructed vector, but Redis explicitly calls it approximate because Vector Sets normalize and may quantize on insertion. `VEMB ... RAW` exposes the internal FP32/Q8/BIN form and metadata ([`VEMB`](https://redis.io/docs/latest/commands/vemb/)). Q8 is the default and BIN trades recall for speed/memory ([`VADD`](https://redis.io/docs/latest/commands/vadd/)).
- `VSIM key ELE member WITHSCORES [WITHATTRIBS] COUNT k` is ideal for anchor mode: it avoids transferring the anchor vector and supports JSON-attribute `FILTER`, `EPSILON`, tunable `EF`, and `TRUTH` for an exact O(N) scan ([`VSIM`](https://redis.io/docs/latest/commands/vsim/), [filter syntax](https://redis.io/docs/latest/develop/data-types/vector-sets/filtered-search/)). Its reported score runs from 1 (identical) to 0 (opposite); use `radius = 1 - score` for the normalized radial display.
- `VLINKS ... WITHSCORES` exposes HNSW adjacency by layer. That is valuable as an optional **index topology/debug view**, but graph links must not be presented as the semantic nearest-neighbor result of `VSIM` ([`VLINKS`](https://redis.io/docs/latest/commands/vlinks/)).

## Scaling and rendering

Recommended client pipeline:

```text
Redis adapter -> bounded IDs/payloads + sparse k-NN graph
              -> transferable typed arrays
              -> Web Worker + seeded Wasm UMAP
              -> Float32 coordinates
              -> WebGL2 point renderer + GPU picking
              -> React/DOM details and selection panel
```

For implementation, compare two primary-source-backed choices:

- **Small custom WebGL2 scatter renderer:** closest to Qdrant, smallest runtime surface, and exact control over Redis styling and rectangular selection. It requires maintaining shaders, picking framebuffer, transforms, accessibility fallback, and context-loss handling. WebGL2 is a standardized browser API ([Khronos specification](https://registry.khronos.org/webgl/specs/2.0/)).
- **deck.gl `ScatterplotLayer`:** supplies a WebGL2/WebGPU scatter layer, orthographic views, hover/click/drag events, and GPU color picking. It accepts typed-array attributes directly, and its official guide recommends workers plus transferable binary buffers for large data ([ScatterplotLayer](https://deck.gl/docs/api-reference/layers/scatterplot-layer), [picking](https://deck.gl/docs/developer-guide/custom-layers/picking), [performance guide](https://deck.gl/docs/developer-guide/performance)). It is a larger dependency and box selection still needs application logic.

Prefer WebGL2 marks with DOM/Canvas overlays for axes, rings, labels, tooltips, and accessible selected-point tables. Keep layout off the main thread. The HTML standard allows `OffscreenCanvas` and WebGL contexts in workers if rendering itself later becomes a bottleneck ([HTML Canvas standard](https://html.spec.whatwg.org/multipage/canvas.html)); it is not required for the first version if only layout runs in a worker.

Do not use one DOM/SVG element per point for the large mode. Progressive rendering should show fetch, graph-build, layout epoch, and final states separately. Rendering capacity is not the same as layout, network, or Redis-query capacity.

## Sampling, reproducibility, privacy, and operational limits

- **Sample by default.** Start around 2,000 points, allow an explicit higher cap after estimating `sample × dimensions × bytes` and sparse-edge memory, and never imply the sample is the full index or Vector Set. Add the clicked point and its live top-k neighborhood even if they were absent from the base sample.
- **Make sampling honest.** Random samples can hide rare clusters. Offer deterministic ID-hash sampling and optional stratification by a selected TAG/attribute. Search has no uniform random-index sample API; Vector Sets have random sampling but no seed. Exact deterministic sampling may require enumerating IDs, which is itself expensive.
- **Save a view manifest.** Record Redis target/index or key, vector field, filter, sample IDs (or their digest), counts before/after, sampling seed/method, metric conversion, graph exactness, projection algorithm/version/parameters/seed, and timestamp. UMAP is stochastic; its official reproducibility guide requires a fixed random state, and precomputed UMAP additionally requires the same k-NN graph ([UMAP reproducibility](https://umap-learn.readthedocs.io/en/latest/reproducibility.html), [precomputed k-NN](https://umap-learn.readthedocs.io/en/latest/precomputed_k-nn.html)).
- **Detect stale/inconsistent reads.** Re-check `FT.INFO` document count or `VCARD` after sampling. `VRANGE` says concurrent additions/removals may or may not appear; `FT.SEARCH` also documents changes/expiry during a query. Mark the view “changed while sampled” rather than silently treating it as a snapshot.
- **Apply filters server-side and cap work.** Bound sample size, per-point neighbors, total Redis commands, response bytes, layout duration, and cancellation. Do not run `VSIM TRUTH`, `VRANGE ... -1`, or thousands of per-anchor KNN queries without an explicit warning and budget.
- **Treat embeddings as sensitive data.** Research has demonstrated reconstruction of source text and personal information from dense text embeddings ([Morris et al., 2023](https://arxiv.org/abs/2310.06816)). Default to sending IDs, sparse edges, scores, and allow-listed display fields to the browser; fetch raw vectors only for layouts that require them, keep them in memory only, and omit them from logs, analytics, crash reports, clipboard, and exports.
- **Preserve Redis authorization.** Run through the current connection and its ACL/key permissions; never bypass them in a visualization service. Redis ACLs restrict both commands and accessible key patterns ([Redis ACL documentation](https://redis.io/docs/latest/operate/oss_and_stack/management/security/acl/)). Payload preview/export should be opt-in and visibly distinct from vector coordinates.

## Suggested delivery sequence

1. Ship the shared adapter contract and anchor-centric similarity view for both backends, with filtering, live neighbor inspection, metric/exactness labels, and selection/export of IDs only.
2. Add bounded raw-vector sampling, a seeded worker layout, PCA baseline, and UMAP default; show sample and projection-quality disclosures.
3. Move to sparse-graph input and tens-of-thousands scale after measuring Redis command load, transfer size, worker memory, and device-specific rendering. Reuse or independently implement the Qdrant Wasm/WebGL pattern; do not promise Qdrant-like scale until the missing Redis-side distance-matrix step is solved.
4. Add t-SNE as an advanced option and `VLINKS` as a separate Vector Set topology/debug mode, not as the default semantic map.
