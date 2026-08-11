# Components and terminology

| Term                 | Local definition                                                               | Source                                     | Owns / does                                            | Does not mean               |
| -------------------- | ------------------------------------------------------------------------------ | ------------------------------------------ | ------------------------------------------------------ | --------------------------- |
| Search index         | Redis Query Engine index with a VECTOR field                                   | ui/src/pages/vector-search/, FT.INFO usage | Schema-backed vector source                            | Generic collection          |
| Vector Set           | Native Redis Vector Set key                                                    | Vector Set browser components/slices       | Element/attribute/VSIM source                          | Search index                |
| Vector data source   | Shared product/domain union of Search index or Vector Set                      | Technical spec                             | Capability-aware UI contract                           | Claim of backend parity     |
| Workbench plugin     | Internal Vite iframe visualization package                                     | docs/plugins/, ui/src/packages/            | Command-result view plus read-only SDK actions         | Native full-page app        |
| Query Lab            | Synchronized query debugging workspace                                         | Product spec                               | Neighbors, distribution, rank gaps, profile, inspector | Generic query editor        |
| Atlas                | Seeded 2D projection of a bounded sample                                       | Product/research specs                     | Exploratory structure and selection                    | Exact global geometry       |
| Neighbors            | Anchor-centered original-space query result                                    | Product spec                               | Radius encodes real score/distance                     | Arbitrary 2D pairwise map   |
| Selection            | Shared IDs/table/inspector state                                               | Product/technical specs                    | Accessible cross-view record inspection                | A separate data source      |
| Query profile        | Measured facts returned by Redis/profile execution                             | FT.PROFILE, VSIM contracts                 | Explains execution evidence                            | Invented universal funnel   |
| View manifest        | Versioned vector-free provenance record                                        | Technical spec                             | Reproducibility/comparison                             | Embedding or payload export |
| Internal UI wrappers | RedisInsight components exported through uiSrc/components/ui or local wrappers | AGENTS.md, .ai/skills/redis-ui-components/ | Product UI implementation                              | Direct @redis-ui/\* imports |

## Component map

| Area                     | Current source                                                          | Planned ownership                                           |
| ------------------------ | ----------------------------------------------------------------------- | ----------------------------------------------------------- |
| Plugin registry/matching | ui/src/packages/vite.config.mjs, ui/src/utils/plugins.ts                | E1                                                          |
| Plugin SDK host          | ui/src/packages/redisinsight-plugin-sdk/                                | E1; modify only if proven necessary                         |
| Search entry point       | ui/src/pages/vector-search/                                             | E2                                                          |
| Vector Set entry point   | ui/src/pages/browser/modules/key-details/components/vector-set-details/ | E2                                                          |
| Query profile precedent  | ui/src/packages/ri-explain/                                             | Read-only reference; E2 does not import sibling plugin      |
| Product UI precedent     | ui/src/packages/geodata/, internal wrappers                             | Read-only reference; existing dirty geodata files forbidden |
| Shared visualizer core   | path chosen by E1 discovery under ui/src/                               | E1 integration owner                                        |
| Worker/renderer          | shared visualizer core                                                  | E3                                                          |
| Playwright               | repository tests/ conventions                                           | E5                                                          |

## Rules

- Use local definitions and cited source paths.
- Do not import from a sibling plugin.
- Do not import directly from @redis-ui/\*; use internal wrappers.
- If a missing term affects architecture or public behavior, record the checked sources, working interpretation, risk, and decision in decisions.md.
