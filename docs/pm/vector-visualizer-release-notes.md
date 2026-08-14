# Release Notes

## Vector Visualizer (Preview)

RedisInsight now includes Vector Visualizer -- a built-in toolkit for inspecting, debugging, and tuning vector embeddings in Redis. It works with both Redis Search indexes and Vector Sets, letting you understand your data, diagnose search quality, and optimize index parameters without leaving RedisInsight.

### Explore Your Embeddings

The Atlas projects high-dimensional vectors onto a 2D scatter plot so you can see the shape of your data at a glance.

- WebGL2-accelerated scatter plot supporting up to 20,000 vectors with UMAP or PCA projection
- Automatic cluster detection with labeled centroids and density heatmap overlay
- Distinct marker shapes for selected, neighbor, outlier, and duplicate states
- Compare mode for side-by-side before/after snapshot inspection

### Debug Similarity Search

The Query Lab turns your FT.SEARCH, FT.AGGREGATE, FT.HYBRID, FT.PROFILE, or VSIM results into an interactive diagnostic.

- Score histogram showing result distribution with rank-gap identification
- Configurable threshold rings to validate your score cutoffs
- Execution profile display with query stages, counters, and vector mode

### Monitor Data Quality

Health Explorers proactively surface data quality issues.

- X-Ray summary tiles with severity indicators for quick triage
- Duplicate explorer using connected-component analysis with configurable similarity thresholds
- Outlier explorer using MAD z-scores over kth-neighbor distances
- Full evidence provenance on every finding

### Tune Index Parameters

Tune and Compare help you move from default HNSW parameters to data-informed ones.

- Heuristic recommendations for M, EF_CONSTRUCTION, and EF_RUNTIME ranked by confidence
- Sensitivity sweep thumbnails showing projection stability across neighborhood sizes
- Snapshot drift detection comparing seven health dimensions over time
- Controlled-truth benchmarking with a Pareto recall-vs-latency plot

### Inspect Index Internals

- HNSW topology graph showing layer-by-layer adjacencies for Vector Sets
- Cluster purity heatmap cross-referencing cluster labels against metadata fields
- Virtualized selection table and inspector sidebar for drilling into individual records

### Getting Started

1. Enable the `dev-vectorVisualizer` feature flag.
2. Open from the Search page (click Visualize on a search index), the Browser (click Visualize on a Vector Set key), or the Workbench (run any vector search command).
3. Requires a search index with a vector field, or a Vector Set key.

### Safety by Design

Vector Visualizer is read-only -- it samples your data, computes locally, and never modifies your database. Benchmark truth-comparisons require explicit confirmation. All commands are shown with provenance before execution. Sample sizes are bounded (20K for projection, 512 for pairwise calculations).
