# Apple Embedding Atlas fit for RedisInsight Vector Visualizer

Date: 2026-08-07
Status: completed decision-gated dependency spike; no runtime dependency approved
Scope: Apple Embedding Atlas only, compared with the proposed RedisInsight Vector Visualizer contracts.

## Active residual

Execution is running in the isolated `codex/redis-vector-visualizer` worktree.
E3 implementation remains blocked: it cannot select or add a projection or
renderer dependency until the dependency decision is explicitly approved. The
unresolved implementation proof is a RedisInsight/Vite/Electron worker-and-Wasm
spike with actual 2,000 and 20,000 point measurements; Apple source does not
provide that proof for this product or those target sizes.

## Sources and method

All implementation findings below were inspected at Apple’s public repository
commit `16cbdd3ee0544e6cc0f8ef04f4258efcf84a22ad` (shallow clone on 2026-08-07),
plus Apple’s published package/docs. Direct primary sources:

- [Apple repository README](https://github.com/apple/embedding-atlas/blob/16cbdd3ee0544e6cc0f8ef04f4258efcf84a22ad/README.md) and [MIT license](https://github.com/apple/embedding-atlas/blob/16cbdd3ee0544e6cc0f8ef04f4258efcf84a22ad/LICENSE).
- [Published package manifest](https://github.com/apple/embedding-atlas/blob/16cbdd3ee0544e6cc0f8ef04f4258efcf84a22ad/packages/embedding-atlas/package.json), [UMAP-Wasm manifest](https://github.com/apple/embedding-atlas/blob/16cbdd3ee0544e6cc0f8ef04f4258efcf84a22ad/packages/umap/umap-wasm/package.json), and [UMAP-Wasm Cargo manifest](https://github.com/apple/embedding-atlas/blob/16cbdd3ee0544e6cc0f8ef04f4258efcf84a22ad/packages/umap/umap-wasm/Cargo.toml).
- [Wasm JS API](https://github.com/apple/embedding-atlas/blob/16cbdd3ee0544e6cc0f8ef04f4258efcf84a22ad/packages/umap/umap-wasm/index.js), [TypeScript API](https://github.com/apple/embedding-atlas/blob/16cbdd3ee0544e6cc0f8ef04f4258efcf84a22ad/packages/umap/umap-wasm/index.d.ts), and [Rust binding implementation](https://github.com/apple/embedding-atlas/blob/16cbdd3ee0544e6cc0f8ef04f4258efcf84a22ad/packages/umap/umap-wasm/src/lib.rs).
- [Worker RPC implementation](https://github.com/apple/embedding-atlas/blob/16cbdd3ee0544e6cc0f8ef04f4258efcf84a22ad/packages/utils/src/worker_helper.ts), [viewer manifest](https://github.com/apple/embedding-atlas/blob/16cbdd3ee0544e6cc0f8ef04f4258efcf84a22ad/packages/viewer/package.json), and [published Vite configuration](https://github.com/apple/embedding-atlas/blob/16cbdd3ee0544e6cc0f8ef04f4258efcf84a22ad/packages/embedding-atlas/vite.config.js).
- [Apple algorithm documentation](https://apple.github.io/embedding-atlas/algorithms.html), [EmbeddingView documentation](https://apple.github.io/embedding-atlas/embedding-view.html), and the [npm package record](https://www.npmjs.com/package/embedding-atlas). A current registry query on 2026-08-07 verified public `embedding-atlas@0.22.0`, MIT, 4,787,437 unpacked bytes and its published integrity. The same query returned npm `E404` for `@embedding-atlas/umap-wasm`.

## What Apple actually provides

### Reusable boundary: UMAP-Wasm only

The only plausible dependency candidate is the internal, private
`@embedding-atlas/umap-wasm` workspace package. It exposes `createUMAP`,
`createUMAPFromKNN`, and `createNNDescent`; the published `embedding-atlas`
package re-exports them. Its artifact list includes JS bindings and a `.wasm`
binary, and it is built with Rust, `wasm-bindgen`, and `wasm32-unknown-unknown`.
It is not separately published by the inspected manifest (`private: true`), so
RedisInsight cannot depend on that package name from npm without either an
upstream publication/change or vendoring/forking under an approved policy.

The public `embedding-atlas` tarball does contain a working bundled UMAP chunk,
but it does not expose `./umap` as a package subpath. A direct public-package
root import failed in a clean consumer because it also resolves the viewer's
`@uwdata/mosaic-core` peer surface; importing `embedding-atlas/dist/umap.js`
failed with `ERR_PACKAGE_PATH_NOT_EXPORTED`. Importing the extracted UMAP file
by absolute file URL was only a diagnostic and successfully produced a seeded
four-point embedding; it is not a supported dependency boundary. Therefore the
public package is not an acceptable minimal UMAP dependency as currently
published.

`EmbeddingView`, `EmbeddingAtlas`, the Svelte/React wrappers, the viewer,
clustering, search and dashboard features are not a suitable drop-in. The
published package pulls its component/viewer surface behind peer dependencies
on Svelte and Mosaic/VGPlot; the private viewer also contains DuckDB-Wasm,
Svelte, Tailwind, inference and many UI/editor dependencies. Those architectural
and UI assumptions conflict with RedisInsight’s React/internal-wrapper,
capability-adapter and WebGL2-plus-accessible-table design.

### Exact algorithm input/output contract

`createUMAP(count, inputDim, outputDim, data, options)` requires a row-major
`Float32Array` of exactly `count * inputDim`; it constructs its own NNDescent
graph and returns a stateful UMAP object. `embedding` is a reusable
`Float32Array` of `count * outputDim`; `knnIndices` and `knnDistances` are
flat typed arrays. `run()` and `step()` return promises, and `destroy()` frees
the Wasm object. The default UMAP input metric is Euclidean, `nNeighbors=15`,
spectral initialization, SGD and no seed.

`createNNDescent(count, inputDim, data, options)` has the same raw-vector
requirement and returns an index that offers `queryByIndex` and
`queryByVector`, each returning `{ indices: Int32Array, distances:
Float32Array }`. It supports `euclidean` and `cosine` in its public TypeScript
type, plus graph-build configuration and a seed.

`createUMAPFromKNN(count, outputDim, knnIndices, knnDistances, options)` is the
important fit: it skips NNDescent and needs no high-dimensional vectors. Inputs
are equally-sized, row-major `Int32Array`/`Float32Array` buffers of `count * k`.
Each row must be sorted by ascending distance; self may be omitted or occur once
at distance zero. It checks non-zero count, matching lengths, divisibility and
at least one neighbor. The documented caller contract additionally requires
valid indices, finite distances and a uniform real-neighbor count; malformed
graph content can silently degrade to a bad/NaN layout. It returns the same
stateful UMAP, with `inputDim=0` and the supplied graph surfaced through the
KNN getters.

This maps cleanly to E3 `LayoutJobV1` only after an adapter converts its CSR
`edgeOffsets`/`edgeTargets`/`edgeDistances` to Apple’s fixed-width row-major
KNN representation, verifies all invariants before transfer, and preserves the
Redis metric/distance provenance. That conversion, source sampling, graph
construction, validation, quality metric, freshness checks and manifest are
RedisInsight-owned; Apple does not supply them.

### Determinism, progress and cancellation

Both builders accept `seed`; a fixed seed is passed to the Rust random state,
and Apple has fixed-seed determinism tests for NNDescent and UMAP/from-KNN.
The default is no seed (OS randomness), so determinism is opt-in and the
complete RedisInsight manifest must pin the seed, parameters, algorithm build
version and exact graph/sample digest.

Apple exposes a `(progress, stage)` callback and asynchronous build/run/step.
Its JS wrapper serializes overlapping Wasm operations and queues `destroy()`
until a borrowed Wasm instance is idle. This is resource-safe sequencing, not
cancellation: the inspected UMAP API has no `AbortSignal`, cancel message, or
mid-run abort. Its generic worker RPC supports typed-array transfer and a
destroy message, but has no pending-request cancellation, worker termination,
or stale-result protocol. RedisInsight must retain E3’s job ID/version gate,
explicit worker termination or cooperative cancellation design, and late-result
rejection; Apple’s wrapper cannot prove that requirement.

### Browser, Vite and Electron compatibility

The UMAP binding is browser-Wasm oriented: it uses `wasm-bindgen` web output and
the source package lists the `.wasm` asset. Apple builds its own consumer using
Vite and sets worker output to ESM, which is useful precedent but not proof of
RedisInsight Vite-plugin/iframe/Electron packaging compatibility. GPU use is
optional, disabled by default and feature-gated in Rust; Apple describes the
renderer as WebGPU-based, while the E3 contract is WebGL2 with an unsupported
fallback. Consequently, no WebGPU requirement should be introduced.

An approved spike must prove: emitted Wasm URL loading inside the internal Vite
plugin and Electron renderer; CSP/worker URL behavior; correct teardown on
source/filter change; WebGL2 fallback; and a bundle-size/licensing review.

### Renderer/UI and privacy boundaries

Apple’s `EmbeddingView` is a component consuming already-projected x/y typed
arrays, supports React/Svelte wrappers, and Apple documents a WebGPU renderer
for millions of points. It does not implement RedisInsight’s selection model,
virtualized table/inspector, native Search/Vector Set adapters, evidence kinds,
theme wrappers or source-specific capability gates. Reusing it would impose
WebGPU and foreign component dependencies, and would still require parallel
RedisInsight selection/accessibility UI. Reject full renderer/UI reuse.

The viewer source has its own data loading/backend fetches, localStorage-backed
stores (including a documented API-key store), optional model inference and
console logging. There is no evidence that it meets the visualizer’s raw-vector
memory-only/no-log/no-telemetry/no-default-export contract. The small UMAP-Wasm
core does not itself provide persistence, telemetry or Redis operations, but
RedisInsight must wrap progress callbacks and errors so raw-vector data is never
logged, store only vector-free manifests, destroy buffers/Wasm on lifecycle
changes, and not import the viewer.

## Decision matrix

| Candidate boundary                               | Evidence-backed benefit                                                                      | Conflict/residual                                                                                                | Disposition                                                     |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Private `@embedding-atlas/umap-wasm` fork/vendor | Wasm UMAP, NNDescent, seeded from-KNN path, typed arrays, progress and resource-safe destroy | Not npm-published separately; Wasm build/asset, licensing, cancellation, security/bundle and 2k/20k proof remain | **Adapt only after approval and a bounded compatibility spike** |
| `createUMAPFromKNN` API shape                    | Accepts a sparse precomputed KNN graph without raw vectors                                   | Fixed-width row-major graph, not CSR; weak malformed-graph validation; no source provenance                      | **Adapt** behind `LayoutJobV1` validation/conversion            |
| Apple NNDescent                                  | Local raw-vector graph construction and query API                                            | Requires raw vectors; changes privacy/transfer budget; no Redis source/freshness/cancellation semantics          | **Optional later experiment, not E3 default**                   |
| `EmbeddingView` renderer                         | Typed-array point view and documented WebGPU scale goal                                      | WebGPU/Svelte/component coupling; no E3 WebGL2/accessibility/linked-selection contract; no measured target proof | **Reject**                                                      |
| `EmbeddingAtlas` viewer/app                      | Dashboard, metadata and search capabilities                                                  | Mosaic/DuckDB/Svelte/inference/localStorage/backend architecture; privacy and product mismatch                   | **Reject**                                                      |

## 2,000 / 20,000 evidence

Apple’s algorithm documentation demonstrates API usage at 2,000 vectors with
100 dimensions. The repository includes native benchmark harnesses, but the
inspected source contains no published result artifact or browser/Electron
timing for either 2,000 or 20,000 points. The README’s “few million points”
claim is renderer marketing/documentation and cannot establish E3 worker-layout,
Redis-command, bundle, memory or target-device performance. Treat both E3 scale
tiers as unproven until the project’s required measured fixture runs complete.

## Redis source fit

| Redis data source | Atlas graph input fit                                                                                                                                                              | Required RedisInsight adapter work                                                                                                                                   |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Search index      | Conditional: can use a bounded raw/reconstructed sample with NNDescent, or a bounded per-anchor graph converted to fixed-width KNN rows                                            | Stable/deterministic sampling caveats, vector decoding, metrics, filter semantics, raw-vector privacy, source-count freshness and original-space evidence stay local |
| Vector Set        | Best when an approved bounded sample graph is available; `VEMB` can supply reconstructed vectors only with its provenance; `VLINKS` is topology, not semantic KNN input by default | Capability detection, `VRANGE`/`VRANDMEMBER` caveats, `VSIM` live neighbors, reconstructed/quantized labels, freshness and topology separation stay local            |

Neither source gets a server-side Apple-style distance-matrix primitive. Do not
equate Vector Set `VLINKS` to the UMAP semantic KNN graph, and do not make
Search/Vector Set capability parity claims because a projection library accepts
typed arrays.

## Recommendation

Do not adopt Apple Embedding Atlas as the visualizer. Keep the technical
specification’s shared React/WebGL2 core and source/host adapters. If the team
chooses to evaluate third-party code, authorize a separate dependency decision
and a tiny, isolated proof-of-compatibility for the MIT UMAP-Wasm code only:

1. use `createUMAPFromKNN` semantics behind a validated `LayoutJobV1` adapter;
2. use a fixed seed and record graph/sample/parameter/build identity;
3. implement cancellation/stale-job rejection independently;
4. measure clean 2,000 and 20,000 fixtures in the actual Electron/Vite target;
5. inspect emitted Wasm assets, licensing/notices, bundle delta and memory;
6. keep raw vectors transient and never import the Apple viewer/component.

Until that proof and explicit approval exist, the dependency decision remains
blocked and E3 should use no Apple package or copied code.

## Blockers and closure criteria

- **Decision blocker:** repository policy requires approval before adding a
  dependency, vendoring/forking, changing build handling or adding Wasm assets.
- **Packaging blocker:** `@embedding-atlas/umap-wasm` is private in the inspected
  repository, so direct package consumption is not evidenced.
- **Correctness blocker:** Apple lacks abort/stale-job semantics and accepts some
  malformed precomputed-KNN content without a full validation failure.
- **Performance blocker:** no Apple browser/Electron 2k/20k timing evidence.
- **Product/privacy blocker:** Apple viewer persistence/inference/backend surface
  is incompatible with RedisInsight’s no-raw-vector-persistence policy.

Close only with an approved dependency direction, a file-owned spike, actual
target measurements, explicit cancellation and privacy tests, and a review of
the emitted Wasm/bundle/license assets.
