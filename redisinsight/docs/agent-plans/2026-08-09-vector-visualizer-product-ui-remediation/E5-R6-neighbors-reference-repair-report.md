# E5.R6 Neighbors Reference Repair Report

Date: 2026-08-10
Status: LOCALLY VERIFIED; INDEPENDENT RE-AUDIT PENDING
Commit policy: no commit, stage, push, PR, deployment, or baseline update

## Active residual

The live native Neighbors mode did not match the preserved normative reference. It showed ten large points inside a bordered square instead of using the dominant center canvas for a dense, coloured, metric-aware neighborhood.

## Root cause

- `VectorVisualizerPage.tsx` hard-coded a ten-result native query.
- Both native acceptance fixtures returned ten unrelated neighbor IDs, preventing metadata colours from being exercised across the result set.
- Product-UI and native-host acceptance explicitly asserted ten plotted neighbors and a `Top-10` ring.
- `VectorVisualizerNeighbors` used one square field for rings and points, large button marks, and an inner card border. Those checks could pass without reproducing the reference hierarchy or density.

## Repair

- Raised the bounded native query result limit to 50.
- Updated deterministic Search fixtures to return the selected source item plus 49 sampled, metadata-bearing response rows.
- Kept the selected source item exactly once at the center and retained its self result only in the right-hand response table.
- Distributed 49 compact response points across the dominant canvas while preserving monotonic metric radius and layout-only angle.
- Replaced the inner card treatment with the workspace plot surface, retained three contained response-derived metric threshold rings, and added a compact legend containing only visible response-backed metadata values.
- Preserved the single persistent nearest-results table and detail inspector.

## Test-first evidence

The initial focused Jest run failed because the component still exposed `data-layout="response-normalized-radial"` and no metric-threshold rings. The initial focused browser run failed because the ten-row fixture could not produce `doc:49`. These were the intended RED failures.

| Gate                                                                    | Result                                                                                                                                       |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Native Vector Visualizer Jest                                           | PASS — 13 suites, 84 tests                                                                                                                   |
| Product-UI desktop fixture                                              | PASS — 8 local cases; 1 environment-gated case skipped in that run                                                                           |
| Running RedisInsight Browser → `vv:knowledge` → Vector Visualizer route | PASS — 1/1 using localhost UI/API and the configured instance                                                                                |
| Native-host Search/Vector Set Playwright                                | PASS — 3/3                                                                                                                                   |
| Scoped UI ESLint and Prettier                                           | PASS                                                                                                                                         |
| Scoped E2E ESLint, Prettier, and TypeScript                             | PASS                                                                                                                                         |
| Raw UI TypeScript                                                       | NON-PASS — 1,324 aggregate existing diagnostics; zero matches in `VectorVisualizerNeighbors`, `VectorVisualizerPage`, or the E5 fixture mock |
| `git diff --check`                                                      | PASS                                                                                                                                         |

## Visual evidence

- Normative fixture, 1440×900: `/tmp/vector-visualizer-neighbors-reference-repair-1440x900.png`
- Minimum desktop, 960×680: `/tmp/vector-visualizer-neighbors-reference-repair-960x680.png`
- Running RedisInsight route, 1440×900: `/tmp/e5-r5-neighbors-real-route-1440x900.png`

The live route shows 50 response rows, one centered anchor, 49 compact radial marks, three contained metric threshold rings, four response-backed `category` colours, a compact legend, and the persistent nearest-elements table/inspector. The established live-route observer passed.

## Boundary

This report is coordinator verification, not the fresh independent audit required to restore an audited promotion claim. No pixel baseline was approved. Packaged Electron and deployment remain outside this bounded proof.
