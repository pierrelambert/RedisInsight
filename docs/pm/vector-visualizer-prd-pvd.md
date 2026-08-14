# Vector Visualizer -- Product Requirements & Value Document

## Executive Summary

Vector Visualizer is a comprehensive embedding inspection and debugging toolkit built into RedisInsight. It gives developers who use Redis as a vector database the ability to visually explore, diagnose, and tune their embeddings and vector indexes without leaving their database tool. Today, developers building AI/ML applications with Redis have no visibility into embedding quality, search accuracy, or index health -- they can only observe symptoms (bad search results, high latency) long after root causes have taken hold. Vector Visualizer closes that gap with projection, retrieval debugging, data quality detection, parameter tuning, benchmarking, and topology inspection -- all read-only, all in one place.

**Target users:** Developers and ML engineers building AI/ML applications with Redis as their vector database -- RAG pipelines, semantic search, recommendation engines, and similarity-based retrieval systems.

**Key insight:** Developers currently operate vector indexes blind. There is no standard tool to answer "are my embeddings clustered correctly?", "is my index returning the right neighbors?", or "should I change my HNSW parameters?" Vector Visualizer makes all of these questions answerable in minutes.

---

## Feature Inventory with Developer Value

### 1. Atlas -- 2D Embedding Projection

**What it does:** Projects high-dimensional vector embeddings onto a 2D scatter plot so developers can see the shape and structure of their data at a glance.

**Developer problem it solves:** Embeddings are opaque arrays of floats. Without visualization, developers cannot tell whether their data forms meaningful clusters, whether categories overlap, or whether the embedding model produced useful representations. Debugging starts with "my search results are bad" and ends with guesswork.

**Value proposition:** Instant spatial intuition about embedding quality. A 30-second look at the Atlas reveals cluster separation, outlier presence, and data distribution issues that would otherwise require custom Python scripts and hours of iteration.

**Key capabilities:**
- WebGL2 hardware-accelerated scatter plot supporting up to 20,000 points
- UMAP and PCA dimensionality reduction algorithms with deterministic seeding
- Five marker shapes encoding point states: default (circle), selected (ring), live-neighbor (diamond), outlier (triangle), duplicate (square)
- Per-point coloring by cluster assignment or custom metadata fields
- DBSCAN-based automatic cluster detection with cluster centroid labels
- Gaussian kernel density heatmap overlay (Silverman bandwidth, adaptive square grid: 64x64 for <=5K points, 128x128 for >5K)
- Compare mode: side-by-side atlas views for before/after snapshot comparison
- Pan, zoom, region-select interaction with shift-click box selection
- Provenance details: source/sample counts, projection method, seed, freshness, exactness, and measured k-neighbor preservation quality score
- Sensitivity sweep: thumbnail previews at nNeighbors = 5, 15, 30 to show projection stability

---

### 2. Query Lab -- Retrieval Debugger

**What it does:** Visualizes the results of a similarity search (FT.SEARCH KNN, FT.AGGREGATE, FT.HYBRID, FT.PROFILE, or VSIM) as a radial neighbor plot with score distribution analysis.

**Developer problem it solves:** When a RAG pipeline returns irrelevant results, developers cannot tell whether the problem is the embedding, the query, the index configuration, or the score threshold. They have no way to see how neighbors are distributed or where score gaps occur.

**Value proposition:** Turns opaque search results into an actionable diagnostic. Developers can see the score distribution, identify rank gaps (where relevant results end and noise begins), validate threshold choices, and inspect execution profiles -- all from the search result they just ran.

**Key capabilities:**
- Radial neighbor plot showing all returned neighbors with rank-ordered distance/similarity
- Score histogram and distribution analysis for returned results
- Rank-gap detection: visual identification of natural boundaries in result quality
- Configurable threshold rings: overlay score thresholds with provenance labels
- Top-K boundary marker showing where the result set was truncated
- FT.PROFILE and VSIM execution profile display: stage names, counters, vector execution mode
- Support for both search-index (FT.SEARCH/FT.AGGREGATE/FT.HYBRID) and vector-set (VSIM) sources
- Freshness tracking: current, stale, or changed-while-sampled indicators
- Workbench integration: automatic parsing of executed query results (including PARAMS redaction for safety)

---

### 3. Health Explorers -- Data Quality Detection

**What it does:** Runs automated data quality checks on the sampled vectors and surfaces issues through summary tiles, a duplicate explorer, and an outlier explorer.

**Developer problem it solves:** Data quality issues in vector databases are invisible until they cause downstream failures. Duplicate embeddings waste memory and skew results. Outliers pollute the HNSW graph and degrade recall. Developers have no proactive way to detect these problems.

**Value proposition:** Proactive data hygiene without writing a single line of analysis code. Health Explorers surface duplicates and outliers with statistical rigor, give developers configurable thresholds to tune sensitivity, and link directly to the affected vectors for inspection.

**Key capabilities:**
- **X-Ray summary tiles:** At-a-glance health indicators with severity status (candidate/unknown/unavailable), formula transparency, sample count, and freshness
- **Duplicate explorer:** Connected-component analysis over original-space similarity (cosine, L2, inner product); configurable similarity threshold (default 0.995 for cosine); union-find grouping; per-metric default thresholds; coverage reporting (threshold-complete vs. partial-neighbor-graph)
- **Outlier explorer:** Median Absolute Deviation (MAD) z-score analysis over kth-neighbor distances; configurable k and robust deviation threshold (default k=10, threshold=3.5); works with cosine distance, L2 distance, and inner-product dissimilarity
- **Metadata coverage:** Per-field presence counting over the bounded sample
- All calculations run in a Web Worker via bounded metric evidence jobs (capped at 512 sample points for O(n^2) pair calculations)
- Evidence provenance on every result: measured/derived/sampled/estimated/unavailable x exact/approximate/sample-exact/unknown

---

### 4. Tune -- Parameter Sensitivity & Recommendations

**What it does:** Displays current HNSW index parameters, generates heuristic tuning recommendations with confidence badges, and shows projection sensitivity sweep thumbnails.

**Developer problem it solves:** HNSW index parameters (M, EF_CONSTRUCTION, EF_RUNTIME) have non-obvious interactions with dataset characteristics. Developers either use defaults and accept suboptimal performance, or experiment blindly without knowing which parameters matter for their data.

**Value proposition:** Data-driven parameter guidance without requiring deep HNSW expertise. Recommendations are ranked by confidence and tied to measurable dataset properties (count, dimensionality, measured recall), giving developers a clear path from "my index is slow" to "change EF_RUNTIME to 200-300."

**Key capabilities:**
- Current parameter display for both search indexes (FT.INFO) and vector sets (VINFO): M, EF_CONSTRUCTION, EF_RUNTIME, algorithm, quantization
- Heuristic recommendations with confidence badges (high/medium/low) for:
  - **M:** Guidance based on dimensionality thresholds (256, 512) with excessive-M warnings above 64
  - **EF_CONSTRUCTION:** Build-time quality guidance (default 200+)
  - **EF_RUNTIME:** Size-tiered guidance (small <10K, medium 10K-100K, large >100K vectors)
- Recall-aware recommendation: when benchmark recall is measured below 0.9, EF_RUNTIME increase is flagged with high confidence
- Sensitivity sweep thumbnails: side-by-side mini atlas projections at nNeighbors = 5, 15, 30 showing how projection structure changes with neighborhood size
- Confidence-sorted output: recommendations sorted by confidence weight (high=2, medium=1, low=0)

---

### 5. Compare & Benchmark -- Snapshot Drift Detection

**What it does:** Saves local snapshots of index state, compares them over time to detect drift, and optionally runs controlled-truth benchmarks to measure recall and latency.

**Developer problem it solves:** Vector indexes change as data is added, updated, or reindexed. Developers have no way to tell whether their index quality has degraded over time, whether a configuration change improved things, or what recall/latency tradeoff they are actually getting.

**Value proposition:** Turns index management from guesswork into evidence-based decision-making. Snapshot comparison reveals drift across seven dimensions; benchmarking measures actual recall against ground truth with a Pareto plot showing the recall-latency-memory frontier.

**Key capabilities:**
- **Local snapshot manifests (v1):** Capture source kind, dimensions, metric, sample count, source count, algorithm, quantization, sampling method, projection parameters, and schema digest -- all stored locally with no raw vectors
- **Drift detection across seven dimensions:** Cluster population, vector norm distribution, neighbor overlap, duplicate rate, outlier rate, metadata coverage, and source configuration changes
- **Manifest comparison:** Compatibility checks (source kind, dimensions, metric, vector field must match); delta reporting on sample and source counts
- **Pareto plot:** Recall vs. latency scatter with memory-proportional bubble size for benchmark runs
- **Controlled-truth benchmark:** VSIM TRUTH or FT.SEARCH KNN exact comparison with bounded sample counts
- **Confirmation gates:** Benchmark commands require explicit user confirmation before execution (requiresConfirmation flag)
- **Evidence classification:** Every benchmark metric (recall, latency, memory) carries measured/derived/sampled/estimated/unavailable evidence kind

---

### 6. Advanced Evidence -- HNSW Topology & Execution Profiles

**What it does:** Exposes the internal HNSW graph structure (layer adjacencies) as an interactive topology graph and displays search execution profiles with ACL-aware status badges.

**Developer problem it solves:** HNSW indexes are black boxes. When search quality degrades, developers cannot see the graph structure, check layer connectivity, or understand the execution path that produced their results. ACL restrictions silently hide capabilities.

**Value proposition:** The only tool that lets developers look inside their HNSW index. Topology visualization reveals connectivity problems, isolated nodes, and layer structure; execution profiles show exactly how Redis processed the query.

**Key capabilities:**
- **VLINKS topology graph:** Layer-by-layer HNSW adjacency visualization showing source-target connections per layer; layout with member argument preservation for subsequent read-only plans
- **Search execution profiles (FT.PROFILE):** Stage names, counters, vector execution mode, and timing facts
- **Vector set profiles (VSIM):** Result count, EF, FILTER-EF, elapsed time facts
- **ACL-aware status:** Graceful degradation when commands are permission-denied (acl-unavailable status)
- **Source-kind adaptive:** Different evidence display for search-index vs. vector-set sources

---

### 7. Metadata Matrix -- Cluster Purity Heatmap

**What it does:** Cross-tabulates cluster labels against a selected metadata field, showing sampled counts in a heatmap grid with clickable cells.

**Developer problem it solves:** Cluster quality assessment is manual and tedious. Developers want to know whether their embedding clusters align with semantic categories (e.g., do product embeddings cluster by category?), but have no way to check without exporting data and writing analysis scripts.

**Value proposition:** One-click cluster purity assessment. The heatmap immediately shows whether clusters map cleanly to metadata categories or whether there is cross-contamination -- a direct signal of embedding model effectiveness.

**Key capabilities:**
- Cluster label x metadata field count matrix with heatmap intensity coloring
- Clickable cells that select all matching vector IDs for further inspection
- Supplied-cluster-labels-only design (UMAP positions are not treated as clusters -- the UI warns about this explicitly)
- Graceful handling of missing data: clear messages for no records, no clusters, and no metadata values
- Stale and error state display

---

### 8. Selection Table & Inspector -- Vector Detail Tools

**What it does:** Provides a virtualized data grid for browsing selected vectors and an inspector sidebar showing metadata, provenance, and available actions for individual vectors.

**Developer problem it solves:** Once a developer spots an interesting pattern in the atlas or a suspect result in the query lab, they need to drill into individual vectors -- see their metadata, understand their provenance, and take action. Without a structured inspection tool, this requires manual CLI commands.

**Value proposition:** Seamless drill-down from visual pattern to individual record. The selection table handles thousands of rows efficiently, and the inspector provides all context needed to understand and act on a specific vector.

**Key capabilities:**
- Virtualized grid (react-window FixedSizeList) for smooth scrolling through large selections
- Keyboard navigation support
- Inspector sidebar with per-vector metadata display
- Selection state sync across all views (atlas, query lab, health explorers, table)
- Rank, metric value, and plotted status for each candidate
- Provenance tracking on selection operations

---

## Cross-Cutting Capabilities

| Capability | Description |
|---|---|
| **Dual data source support** | Full support for both Redis Search indexes (FT.SEARCH, FT.AGGREGATE, FT.HYBRID, FT.PROFILE) and Vector Sets (VSIM, VLINKS, VRANGE, VRANDMEMBER) |
| **Evidence provenance** | Every computed value carries provenance (measured/derived/estimated/sampled/unavailable) and exactness (exact/approximate/sample-exact/unknown) |
| **Read-only safety** | All Redis commands are read-only; write operations (benchmarks with TRUTH) require explicit confirmation gates |
| **Web Worker computation** | UMAP/PCA layout, bounded metric evidence, and density computation run off the main thread for responsive UI |
| **Feature-flagged rollout** | Behind `dev-vectorVisualizer` feature flag for controlled preview release |
| **Multiple entry points** | Search page (index list action), Browser (Vector Set key detail), Workbench (plugin), and routable dedicated page |
| **Command plan transparency** | Every Redis command shown before execution with provenance, caveats, sample method, and visible warnings |
| **Sample-bounded** | All operations capped at 20,000 vectors for Atlas, 512 for O(n^2) health calculations |
| **Deterministic seeding** | Layout algorithms use explicit seeds for reproducible projections |

---

## Capability Summary

The following table lists every capability delivered in Vector Visualizer V1. Competitive positioning should be verified against current competitor offerings before external use -- some vendors (e.g., Qdrant) are developing similar visual tooling.

| Capability | Implementation |
|---|---|
| 2D embedding projection | UMAP + PCA, WebGL2, up to 20K points |
| Cluster detection & labeling | DBSCAN with centroid labels |
| Density heatmap overlay | Gaussian KDE behind scatter |
| Retrieval debugging | Radial neighbor plot (Query Lab) |
| Score histogram & rank-gap analysis | Clickable bins, auto-detected largest gap |
| Execution profile display | FT.PROFILE stages + VSIM parameters |
| Duplicate detection | Union-find, configurable per-metric threshold |
| Outlier detection | MAD-based robust z-scores on k-neighbor distance |
| HNSW topology visualization | VLINKS adjacency graph with layer view |
| Parameter tuning recommendations | Confidence-ranked (high/medium/low) for M, EF_CONSTRUCTION, EF_RUNTIME |
| Snapshot drift detection | 7 drift dimensions between manifests |
| Recall/latency benchmarking | Pareto plot with optional memory marker sizing |
| Cluster purity heatmap | Metadata matrix (label x metadata field) |
| Evidence provenance tracking | Every measurement tagged (kind x exactness) |
| Compare mode | Side-by-side PCA vs UMAP, before/after snapshots |
| Sensitivity sweep | Thumbnails at 3 nNeighbors values (K=5, 15, 30) |

---

## User Journey

1. **Entry:** Developer opens a vector set key in the Browser or navigates to the Vector Visualizer page. They select a search index or vector set as their data source.

2. **Sample:** The tool samples up to 20,000 vectors from the source using the appropriate command (FT.SEARCH, VRANGE, or VRANDMEMBER). Provenance is shown: source count, sample count, sampling method, and determinism.

3. **Explore Atlas:** UMAP or PCA projects the sample into 2D. The developer sees the embedding landscape -- clusters, gaps, density. They toggle the density heatmap and enable cluster labels to understand structure.

4. **Spot an issue:** The developer notices a cluster of outlier triangles in the corner, or sees that two clusters that should be separate are merged. They region-select the problematic area.

5. **Drill into Health:** The X-Ray tiles confirm: 12 duplicate groups detected, 8 outlier candidates flagged. The developer opens the Duplicate Explorer, adjusts the similarity threshold, and inspects the duplicate groups. They open the Outlier Explorer and see which vectors have abnormally high kth-neighbor distances.

6. **Debug queries:** Switching to the Query Lab, the developer runs a similarity search and sees the score histogram. A clear rank gap after position 5 confirms the top-5 are relevant but positions 6-10 are noise. The threshold ring confirms their current cutoff is too generous.

7. **Tune parameters:** The Tune panel shows current M=16, EF_RUNTIME=100. For their 50K-vector index, the tool recommends EF_RUNTIME 200-300 (medium confidence). Sensitivity thumbnails show the projection is stable across nNeighbors values -- the parameters are the issue, not the data.

8. **Benchmark:** The developer saves a "before" snapshot, adjusts EF_RUNTIME, and runs a controlled-truth benchmark. Recall improves from 0.82 to 0.96. The Pareto plot shows the new point is Pareto-optimal.

9. **Confirm improvement:** A "before vs. after" comparison shows drift: neighbor overlap increased, outlier rate decreased. The developer commits the parameter change with confidence.

---

## Success Metrics (Suggested)

| Metric | Definition | Target |
|---|---|---|
| **Adoption rate** | Percentage of active RedisInsight users with vector indexes who open Vector Visualizer at least once per month | 15% within 3 months of GA |
| **Engagement depth** | Average number of distinct feature tabs used per session (Atlas, Query Lab, Health, Tune, Compare, Advanced) | >= 2.5 tabs/session |
| **Retention** | Percentage of first-time users who return within 30 days | >= 40% |
| **Time to insight** | Median time from opening Vector Visualizer to first selection action (proxy for finding something useful) | < 90 seconds |
| **Support deflection** | Reduction in vector-search-related support tickets mentioning "recall", "accuracy", "slow", or "tuning" | 20% reduction within 6 months |
| **Feature discovery rate** | Percentage of sessions that progress beyond Atlas to at least one of Health/Query Lab/Tune | >= 35% |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| **Performance with large datasets** | Projection or health calculations could be slow or memory-intensive with high-dimensional vectors | 20K sample cap for Atlas; 512-point cap for O(n^2) health calculations; Web Worker offloading; bounded metric evidence design |
| **WebGL2 browser support** | Users on older browsers or restricted environments may not see the Atlas | Graceful fallback with `onUnsupported` callback; context loss recovery (`webglcontextlost`/`webglcontextrestored` handlers); modern browser requirement documented |
| **Learning curve** | Feature richness could overwhelm first-time users | Provenance tooltips on every metric; progressive disclosure (start with Atlas, drill down); explicit warnings (e.g., "UMAP positions are not clusters"); formula transparency on all health calculations |
| **Accuracy of sampled evidence** | All health and quality metrics are computed on samples, not the full dataset | Every value carries explicit provenance (sampled/measured) and exactness labels; UI never claims global guarantees; quality metrics state their sample size and method |
| **ACL restrictions** | Users with limited Redis permissions may not be able to use all features | ACL-aware status badges; graceful degradation to available capabilities rather than error states |
| **Read-only safety perception** | Users may worry about the tool modifying their data | All commands marked `readOnly: true`; benchmark truth commands require confirmation gates; command plans shown before execution with caveats and warnings |
| **Projection quality misconceptions** | Developers might treat 2D positions as ground truth | Explicit provenance warning: "Projection positions do not preserve exact global geometry"; measured k-neighbor preservation quality score shown with sample size and exactness |
