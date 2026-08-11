# Redis Vector Visualizer — Normative Visual Contract

Date: 2026-08-09
Status: Active normative contract
Applies to: native RedisInsight Vector Visualizer and capability-appropriate Workbench plugin views

## Purpose

This document restores the product-quality bar established during brainstorming. The preserved HTML prototypes and reference captures are normative for composition, hierarchy, density, and interaction. They are not inspirational mood boards and must not be replaced by a vertically stacked component showcase.

## Source artifacts

| Artifact                                                                                 | Contract represented                                                                          |
| ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `assets/vector-visualizer/atlas-reference.png`                                           | Persistent controls, dominant Atlas canvas, linked sampled-document inspector                 |
| `assets/vector-visualizer/neighbors-reference.png`                                       | Exact-focus mode with metric rings and linked nearest-document inspector                      |
| `assets/vector-visualizer/selection-reference.png`                                       | Region selection overlay and linked selected-document inspector                               |
| `assets/vector-visualizer/brainstorm/redis-product-vector-visualizer.html`               | Full RedisInsight product shell, all major states, light/dark behavior, three-column geometry |
| `assets/vector-visualizer/brainstorm/redis-product-vector-visualizer-responsive-v3.html` | Compact desktop composition experiments                                                       |
| `assets/vector-visualizer/brainstorm/unified-vector-visualizer.html`                     | Atlas, Neighbors, and Selection as connected workspaces                                       |
| `assets/vector-visualizer/brainstorm/vector-visualizer-modes.html`                       | Atlas plus exact-focus interaction model                                                      |
| remaining files in `assets/vector-visualizer/brainstorm/`                                | Desktop-density iterations and Search-index/Vector-Set terminology evidence                   |

## Precedence

1. Product and technical specifications govern Redis semantics, evidence, privacy, supported algorithms, and resource limits.
2. This contract and the preserved artifacts govern spatial composition, visual hierarchy, density, and linked interaction.
3. Existing implementation details do not override either contract.

Consequently, the implementation must reproduce the reference workspace while retaining UMAP-only v1 and the supported 500–20,000 sample range. The PCA toggle and larger illustrative range in early HTML are not requirements.

## Desktop composition

At `1440x900`, below the existing RedisInsight chrome:

- a compact `Vector Visualizer` page header identifies the Search index or Vector Set and provides source actions;
- source, sample freshness, current operation status, and selection count sit directly below that title, not inside or above the mode tabs;
- a dismissible truth banner explains that the Atlas is a 2D projection of a sample;
- a single workspace row contains persistent controls, the dominant visualization, and a persistent result inspector;
- the controls column is 200–280 px wide;
- the result inspector is 280–360 px wide;
- the visualization receives at least 55% of the workspace width and all remaining height;
- the primary ready state does not require page-level vertical scrolling;
- dividers, compact typography, restrained spacing, table rows, and Redis semantic colors produce an operational developer-tool density rather than a card dashboard.

## Left controls

The persistent control region provides, when supported:

- vector field/source context;
- filter input, syntax help, and removable active-filter chips;
- color-by metadata field;
- UMAP algorithm and seed evidence in the sampling summary, with no projection selector while UMAP is the only supported algorithm;
- bounded sample-size control and sample/source counts;
- cluster-label and outlier visibility toggles; and
- sampling method, seed, freshness, and quality summary.

Unsupported controls are omitted or disabled with a useful reason. They never imply functionality the adapter cannot provide.

## Connected center modes

`Atlas`, `Neighbors`, and `Selection` are mode tabs over one stateful visualization workspace.

- Atlas shows sampled structure, response-backed semantic color groups whenever the selected source exposes a usable scalar metadata field, axes/units where useful, labels when enabled, and selection overlays. A real Vector Set route with attributes must not be accepted as an uncolored Atlas.
- Neighbors renders the query/source item exactly once at the center of one dominant radial plot, renders fully contained metric-aware rings, labels angle as layout-only, and retains result-table linkage. A self result may remain in the result table but must not appear as a displaced radial neighbor. The native mode does not embed the Workbench Query Lab, a second results table, or a second inspector; Query Lab remains an optional additional evidence workflow.
- Selection preserves the Atlas context while emphasizing the selected region or set.
- Mode headers show concise context, sample/freshness status, and bounded utility actions.
- Switching modes preserves source, filter, color field, selection, and inspector context unless the user explicitly clears them.

## Right result inspector

The desktop result region remains visible while the user explores the canvas. It contains:

- a context-sensitive title such as `Sampled documents`, `Nearest documents`, or `Selected documents`;
- a provenance/exactness subtitle;
- search, copy, and export affordances subject to privacy rules;
- a virtualized operational table with stable row identity and code typography; sampled rows omit a meaningless repeated score column until a query provides response-backed scores; and
- a separately bounded detail inspector below the table, with internal table scrolling so inspection never destroys plot context.

Point, region, table-row, and inspector selection are bidirectionally synchronized.

## Desktop window behavior

- Above 1100 px, preserve all three columns with the desktop hierarchy.
- Between the RedisInsight desktop minimum of 960 px and 1100 px, compact side columns and actions before reducing the plotting surface.
- At the configured Electron minimum window of `960x680`, all three regions remain visible and keyboard-accessible; no mobile drawer, overlay, or mobile-specific navigation is required.
- The visualization remains the dominant region throughout the supported desktop range.
- Light and dark themes preserve hierarchy, contrast, selection, focus, and non-color status meaning.

## State fidelity

Ready, loading/progress, empty after filter, unsupported, ACL unavailable, cancelled, recoverable error, fatal fallback, and stale/changed-while-sampled states occupy the same coherent workspace. They must not collapse into blank panels or unrelated full-page cards.

## Acceptance evidence

Final visual acceptance requires all of the following:

1. real-route Playwright flows through RedisInsight entry points;
2. geometry assertions for the three desktop landmarks and page overflow;
3. screenshot comparisons for Atlas, Neighbors, Selection, desktop light/dark at reference and minimum window sizes, and representative non-ready states;
4. keyboard and focus verification for tabs, controls, table selection, and the inspector across the supported desktop range;
5. clean browser console for owned code and no unexpected outbound requests; and
6. a live Vector Set with scalar attributes proves a visible color field and a nonzero colored-point count; and
7. an independent visual audit against the preserved artifacts, with differences classified as intentional semantic corrections, desktop-window adaptations, or defects.

A screenshot that is merely non-blank and readable is evidence of rendering, not evidence of fidelity.
