# D3FC, Buzz, and 3D UMAP inputs for E3

Date: 2026-08-07
Scope: read-only architecture research for the pending E3 projection/renderer
decision. The supplied Medium post is a lead, not an authority.

## Decision

Keep the technical specification's **seeded 2D UMAP + PCA baseline in a Web
Worker, custom WebGL2 scatter renderer, and linked virtualized DOM table**.
Do not add a package or copy code from the researched projects. The UMAP
dependency decision remains blocked pending explicit approval and a target
compatibility spike.

| Candidate / boundary                     | Projection input and algorithm                                                                                                 | Renderer / interaction fit                                                                                                                         | Material constraint                                                                                                                                                                  | Disposition                                                                           |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| Custom E3 WebGL2 + approved UMAP adapter | Matches `LayoutJobV1`: vectors or sparse semantic k-NN graph, seed, transferable arrays, cancellation/stale rejection          | Exact ownership of GPU/indexed picking, shift-drag, context loss, linked table and evidence UI                                                     | Projection dependency and actual Electron 2k/20k proof still required                                                                                                                | **ADOPT** architecture; dependency remains **SPIKE**                                  |
| D3FC WebGL                               | No PCA, UMAP, t-SNE, graph construction, worker or cancellation API                                                            | Reusable _reference_ for 2D WebGL point series, D3 zoom/brush composition and context-loss handling; no documented GPU picking or accessible table | New dependency; point attributes are populated from JS data and E3 still owns picking/selection/accessibility                                                                        | **REFERENCE** only                                                                    |
| Buzz                                     | Consumes already reduced columns selected as x/y; README explicitly says dimensionality reduction is not its goal              | WebGL point scatter, D3 zoom, SVG brush, CPU quadtree click-nearest-point and histograms                                                           | Root GPL-3.0-or-later notices conflict with nested MIT metadata; NW.js/Snowpack/Alpine/Tailwind app; no worker, 3D, source adapter, provenance, or E3 accessibility/privacy contract | **REJECT** code/dependency; **REFERENCE** interaction ideas only                      |
| Apple Embedding Atlas / UMAP-Wasm        | Strong seeded UMAP/precomputed-kNN API shape, but package is private/unpublished and graph validation/cancellation remain gaps | Viewer is WebGPU/Svelte-oriented and not E3's WebGL2/table contract                                                                                | Existing fit report rejects viewer and requires an approved isolated Wasm spike                                                                                                      | **REFERENCE** API semantics; **REJECT** viewer; **SPIKE** only if separately approved |
| DruidJS                                  | A JavaScript DR library offering PCA, t-SNE and UMAP under one API                                                             | It is a projection library, not a renderer/picking/table/worker solution                                                                           | No E3 target, cancellation/stale-job, privacy, or Electron measurement evidence was supplied; dependency approval still required                                                     | **SPIKE** only, after source/package/license and target-proof audit                   |

## What the supplied references actually establish

### The 3D lead does not change the default

The Medium article itself says ordinary 3D UMAP duplicates the same similarity
information and records that free 3D navigation was disorienting. Its useful
design move is narrower: retain a **2D** UMAP and use a controlled z value only
for a different, named measurement (Webster used a loading score), with a
preselected viewpoint and a linked table. It cites ScatterGL/WebGL rather than
D3FC or Buzz for its renderer. That supports a possible later, opt-in,
measurement-specific view only when RedisInsight has an independently measured
z fact. It does not justify 3D Atlas coordinates.

For E3, 3D would add occlusion, depth/picking ambiguity, camera/navigation and
keyboard-equivalence work without adding original-space evidence beyond the
already-required 2D sampled projection. It also makes linked selection less
legible. Retain 2D as the sole Atlas contract. Any later controlled `flip`
must preserve x/y, bind z to a labelled measured/sampled value, provide a
non-3D table/2D equivalent, avoid free orbit by default, and pass separate
accessibility and target-performance tests. Source: [Pattern/Webster post]
(https://medium.com/@patternvizlab/introducing-a-novel-approach-to-3d-umap-visualization-for-single-cell-genomic-analysis-b79cf09f1af6).

### D3FC

D3FC describes itself as composable D3 chart components and explicitly includes
rendering-surface/WebGL components. Its maintained monorepo publishes separate
packages under MIT; `@d3fc/d3fc-webgl@3.2.1` is a low-level WebGL utility
package with only `@d3fc/d3fc-rebind` plus D3 scale/shape peers. Its point
series maps JS datum accessors into WebGL attributes and draws points, while
the WebGL README documents context-loss handling. These are renderer precedents,
not a data/layout engine.

The documentation/source contains no UMAP/PCA/t-SNE, Web Worker, transferable
buffer protocol, off-main-thread cancellation, color-ID picking, lasso ID
resolution, virtualized accessible table, Redis adapter, or vector privacy
boundary. A D3FC adoption would therefore create a new runtime dependency and
leave the riskiest E3 seams to implement; do not add it merely to replace a
small custom 2D scatter renderer. Sources: [D3FC site](https://d3fc.io/),
[package manifest](https://raw.githubusercontent.com/d3fc/d3fc/master/packages/d3fc-webgl/package.json),
[WebGL API/readme](https://raw.githubusercontent.com/d3fc/d3fc/master/packages/d3fc-webgl/README.md),
[point-series source](https://raw.githubusercontent.com/d3fc/d3fc/master/packages/d3fc-series/src/webgl/point.js),
and [MIT license](https://raw.githubusercontent.com/d3fc/d3fc/master/LICENSE).

### Buzz

Buzz is an interactive viewer for **precomputed low-dimensional embeddings**:
the application selects two descriptor columns for x/y, constructs a D3
quadtree for CPU nearest-point clicks, and draws `seriesWebglPoint` with D3FC.
It combines D3 zoom/pan with an SVG brush; brushing updates selected rows and
histograms. This validates a useful product pattern--GPU points plus a separate
index for hit testing and linked population analysis--but not GPU picking or a
worker/streaming architecture.

Its source uses an NW.js menu and filesystem-selected Feather input, then also
fetches features from `http://127.0.0.1:5000`; package metadata targets NW.js
and Snowpack, not RedisInsight's Vite/Electron plugin. It has no UMAP/PCA/t-SNE
implementation, no Web Worker/transferable flow, no 3D code, no virtualized
table, and no E3 source-count/freshness/evidence contract. Its root package
declares GPL-3.0-or-later and source files carry GPL notices, while
`config/package.json` declares MIT. That material license conflict means Buzz
source cannot be incorporated without maintainer and legal clarification (and
an explicit commercial decision). The feature loader targets loopback, not
third-party egress, but is still an undocumented service path outside E3's
current-connection/no-hidden-data-path posture; no raw-vector or payload data
flow from it is acceptable.
Sources: [repository README](https://github.com/MaximLippeveld/buzz),
[package manifest](https://raw.githubusercontent.com/MaximLippeveld/buzz/master/package.json),
[scatter source](https://raw.githubusercontent.com/MaximLippeveld/buzz/master/src/js/scatter.js),
[application/data-flow source](https://raw.githubusercontent.com/MaximLippeveld/buzz/master/src/js/index.js),
and [GPL text](https://raw.githubusercontent.com/MaximLippeveld/buzz/master/COPYING).

## Concrete E3 inputs and non-inputs

| E3 question       | Result                                                                                                                 | Required implementation consequence                                                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Projection engine | Neither D3FC nor Buzz supplies it. Apple remains unavailable as a clean package; DruidJS is unproven.                  | Preserve UMAP/PCA/t-SNE behind `LayoutJobV1`; do not alter manifests. Authorize one small dependency spike only after a named candidate is approved. |
| 2D versus 3D      | 2D is evidence-sufficient for the Atlas contract; Webster is a controlled, distinct-z precedent, not 3D UMAP evidence. | Keep `2D projection of a sample` disclosure and original-space quality measure; no 3D default.                                                       |
| Rendering/picking | D3FC/Buzz prove a WebGL point + D3 interaction pattern, but Buzz uses CPU quadtree picking.                            | Use custom WebGL2 plus GPU color/indexed picking (or a tested spatial index); account for selection IDs, resize and context loss.                    |
| Worker/streaming  | No researched renderer provides the required worker protocol. Buzz has main-thread async loading only.                 | Transfer typed arrays; progress/cancel/invalidate by job ID; keep render and Redis fetch stage measurements distinct.                                |
| Accessibility     | Neither source provides E3's keyboard-equivalent linked virtualized table/inspector.                                   | Canvas/WebGL remains supplementary; Selection table is authoritative keyboard path and must carry ID, plotted state, provenance and actions.         |
| Performance       | Buzz README's `10,000s` and Webster's million-point statement are rendering claims only.                               | Do not infer end-to-end capacity. Measure Redis fetch/graph/layout/render/picking separately at 2k and 20k in Vite/Electron.                         |
| Privacy           | D3FC is rendering-only; Buzz uses file/local-HTTP data paths; neither is a Redis privacy boundary.                     | Maintain memory-only vectors; transfer only required buffers; zero/terminate on source change; no logs/telemetry/default export.                     |

## Exact impact on the pending architecture decision

1. **No approval is closed.** Keep the decision-log blocker: an approved seeded
   UMAP implementation/build path is still required before dependency,
   manifest, lockfile or Wasm work.
2. **Narrow the renderer choice:** custom WebGL2 stays preferred. D3FC is a
   permissively licensed reference, not a candidate dependency; Buzz is
   rejected for licensing/product boundaries.
3. **Retain the contract exactly:** `LayoutJobV1` accepts raw/reconstructed
   vectors or sparse semantic k-NN input; `VLINKS` remains topology-only and
   cannot become UMAP input by library convenience.
4. **Add closure gates to any approved projection spike:** source/package and
   license review; Vite iframe/Electron worker and emitted-asset proof;
   deterministic seed + malformed-input validation; abort/stale-job handling;
   2k/20k per-stage measurements; WebGL2 context-loss/picking; keyboard table;
   raw-vector memory/log/network audit. A renderer-only benchmark is not proof
   of these gates.
5. **Do not add 3D to E3.** Revisit only with a named independent z metric and
   a controlled-view, accessibility, selection, privacy and performance design.

## Verification

- `npx prettier --check docs/research/2026-08-07-d3fc-buzz-umap-inputs.md`
  (run after writing)
- `git diff --check -- docs/research/2026-08-07-d3fc-buzz-umap-inputs.md`
  (run after writing)

```text
STATUS: DONE_WITH_CONCERNS
ROLE: Architecture/Product Researcher
REQUESTED_MODEL: gpt-5.6-terra (architecture research task)
REQUESTED_REASONING: medium
ACTUAL_MODEL: unknown (host did not expose model identity)
ACTUAL_REASONING: unknown (host did not expose reasoning identity)
INHERITED_FROM_COORDINATOR: no
ANCHORS_READ:
- charter: docs/agent-plans/2026-08-07-redis-vector-visualizer/charter.md
- status board: docs/agent-plans/2026-08-07-redis-vector-visualizer/00-index.md
- components: docs/agent-plans/2026-08-07-redis-vector-visualizer/components.md
- decisions: docs/agent-plans/2026-08-07-redis-vector-visualizer/decisions.md
ACTIVE_RESIDUAL: Resolve an explicitly approved UMAP dependency/build direction, then prove it in the actual Vite/Electron target without weakening E3 evidence, privacy, accessibility or cancellation requirements.
FILES_CHANGED:
- docs/research/2026-08-07-d3fc-buzz-umap-inputs.md
VERIFICATION_RUN: npx prettier --check docs/research/2026-08-07-d3fc-buzz-umap-inputs.md; git diff --check -- docs/research/2026-08-07-d3fc-buzz-umap-inputs.md
VERIFICATION_RESULT: both passed after Prettier formatting; report is the only scoped worktree change.
BLOCKERS: Dependency/vendor/build approval and target proof remain required; Buzz has root GPL notices plus conflicting nested MIT metadata and is not reusable code without legal/maintainer resolution.
BLOCKER_DISPOSITION: blocked for decision
ASSUMPTIONS: DruidJS is a candidate only; no local dependency/install or package-source audit was authorized in this task.
NEXT_ACTION: Coordinator reviews this report, then asks for an explicit dependency/vendor/build decision or retains E3 blocked.
```
