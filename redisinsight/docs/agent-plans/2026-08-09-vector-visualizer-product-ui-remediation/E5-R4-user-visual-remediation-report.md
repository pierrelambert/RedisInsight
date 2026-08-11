# E5.R4 User Visual Remediation Report

Date: 2026-08-10
Status: DONE — independent re-audit pending

## Why the previous approval was reopened

The user's live RedisInsight screenshot contradicted the normative visual contract. The previous final audit accepted an uncolored real Vector Set as an intentional capability boundary even though the live set exposed scalar attributes and the reference requires semantic color groups. That approval is superseded.

The implementation and the live app were both in `/private/tmp/redisinsight-vector-visualizer` on `codex/redis-vector-visualizer`. The defect was an incorrect acceptance boundary, compounded by a fixture that did not reproduce the live RAW CLI response shape.

## Repairs

- Moved source, freshness, operation status, and selection count directly below the `Vector Visualizer` title and removed duplicate mode-level context.
- Removed the Projection control. UMAP and seed remain read-only sampling evidence because UMAP is the only v1 projection.
- Added read-only `VGETATTR` sampling metadata for Vector Sets, retaining only one selected scalar field per record.
- Decoded the extra JSON escape layer returned by the live RedisInsight RAW CLI endpoint. The live `vv:knowledge` route now selects the response-backed `category` field and colors all attributable points.
- Split the result table and detail inspector into bounded regions. Sampled and selected contexts omit the repeated unavailable-score column; nearest-neighbor results retain their response-backed score column.
- Strengthened component and browser acceptance so an uncolored attributed Vector Set, a Projection menu, misplaced context, or the old sampled-score layout fails.

## Fresh evidence

| Gate                                            | Result                                                                      |
| ----------------------------------------------- | --------------------------------------------------------------------------- |
| Native Vector Visualizer Jest                   | PASS — 12 suites, 81 tests                                                  |
| Plugin package Jest                             | PASS — 25 suites, 178 tests                                                 |
| Native-host Playwright                          | PASS — 3/3                                                                  |
| Product UI fixture plus live RedisInsight route | PASS — 9/9                                                                  |
| E2.T3 desktop Playwright                        | PASS — 3/3                                                                  |
| Changed-source ESLint                           | PASS                                                                        |
| E2E ESLint, Prettier, and TypeScript            | PASS                                                                        |
| UI baseline type comparator                     | no diagnostics printed; execution transport did not return a numeric status |
| Direct UI TypeScript owned-path filter          | no Vector Visualizer diagnostics printed                                    |
| Renderer production build                       | PASS — 9,704 modules transformed                                            |
| `git diff --check`                              | PASS; staged index empty                                                    |

The final live-route capture is `/tmp/e5-r4-real-route-1440x900.png`. It shows colored Atlas points, `Color by: category`, title-level context, no Projection control, a one-column sampled-ID table, and the separate inspector.

## Boundaries

- The working tree remains intentionally unstaged and uncommitted.
- No screenshot baseline was approved.
- Packaged Electron and deployment proof are not claimed.
- Vector Set metadata currently requires one bounded read-only `VGETATTR` per sampled member in addition to vector reconstruction; this is correct for the tested bounded sample but remains a performance boundary for large samples.
- The superseded audit cannot promote this repair. A fresh independent audit of the corrected tree remains required.
