# E5.R2 — Native visual-fidelity closure

Status: ready  
Role: UI Designer / Integrator  
Route: `gpt-5.6-terra`, high reasoning  
Commit: prohibited

## Goal

Close E5's material reference-fidelity P1 in the native RedisInsight page. The preserved Atlas, Neighbors, and Selection brainstorming images are normative for composition, operational density, semantic color, and linked interaction. Product and technical semantics remain authoritative: UMAP only, sample budget 500–20,000, response-backed values only, no fabricated filter/color capability, and no backend or public-contract expansion.

## Ownership

- `redisinsight/ui/src/pages/vector-visualizer/**` except Workbench/plugin fixtures outside this page
- Native-facing Atlas/Selection presentation seams under `redisinsight/ui/src/packages/vector-visualizer/src/atlas/**`, `selection/**`, and renderer files only when necessary
- `tests/e2e-playwright/tests/vector-visualizer/product-ui/**`
- `E5-R2-native-visual-fidelity-report.md`

Do not touch Workbench QueryLab, adapters/contracts, backend, routing/feature flags, dependency/build/CI files, shared plan control files, or screenshot baselines.

## Required result

- Compact the native header and status chrome so the visualization reads as the primary product surface.
- Atlas uses the full available canvas and renders a dense, legible, semantically colored sample when response-backed metadata is present. Use the existing metadata palette and point-state contract; do not invent production metadata.
- Neighbors shows multiple response-backed neighbors and preserves the selected anchor, metric rings, provenance, and inspector linkage.
- Selection keeps the Atlas spatial context visible and overlays/highlights the selected region or selected points; it must not degrade to a text-only replacement view.
- Controls and inspector achieve the reference's compact operational density while preserving truthful unsupported-state reasons and 216 / flexible / 296 desktop geometry.
- Fixture data may be enriched only with deterministic, response-shaped sample/query metadata needed to exercise real product rendering; no production fact may be fabricated.
- Remove unexpected external font/network requests from the native fixture proof.
- Preserve 1440x900, intermediate desktop, and 960x680 containment, keyboard behavior, light/dark themes, loading/empty/error states, UMAP-only semantics, and no page overflow.

## Verification

- Start with focused tests that fail for density, semantic color, linked Neighbors, and Selection spatial context, then make them green.
- Run the native focused Jest suites and package Atlas/Selection suites.
- Run scoped ESLint, Prettier, owned-path TypeScript diagnostic classification, and `git diff --check`.
- Run current `product-ui` Playwright at 1440x900 and 960x680. Capture new temporary screenshots for manual side-by-side review against all three reference PNGs. Do not approve or replace baselines.
- Browser proof must have no page errors, failed requests, same-origin HTTP errors, unexpected outbound requests, or console errors.
- Report exact geometry, visible sample/neighbor counts, color categories, selection behavior, screenshot paths, and residual boundaries.
- No staging, commit, push, ref, dependency, or unrelated dirty-tree change.

