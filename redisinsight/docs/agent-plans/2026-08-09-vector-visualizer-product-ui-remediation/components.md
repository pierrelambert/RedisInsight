# Component and ownership map

| Surface                | Current source                                                                                     | Planned owner                  | Contract                                                                               |
| ---------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------ | -------------------------------------------------------------------------------------- |
| Native orchestration   | `ui/src/pages/vector-visualizer/VectorVisualizerPage.tsx` and `native*.ts`                         | E3.T1 Integrator               | Preserve current Redis/evidence behavior; restructure presentation only where required |
| Left controls          | new `ui/src/pages/vector-visualizer/components/VectorVisualizerControls/**`                        | E2.T1 UI Designer              | Presentational, typed props, persistent desktop controls                               |
| Results inspector      | new `ui/src/pages/vector-visualizer/components/VectorVisualizerResults/**`                         | E2.T2 UI Designer              | Context title/provenance/search/actions/virtualized rows/detail                        |
| Center workspace       | new `ui/src/pages/vector-visualizer/components/VectorVisualizerCanvas/**`                          | E2.T3 UI Designer              | Atlas/Neighbors/Selection mode chrome and dominant plot region                         |
| Workspace grid         | new `ui/src/pages/vector-visualizer/components/VectorVisualizerWorkspace/**` plus page integration | E3.T1 Integrator               | Stable landmarks, desktop geometry, viewport fill, shared state wiring                 |
| Existing package views | `ui/src/packages/vector-visualizer/src/{atlas,query-lab,selection}/**`                             | E3.T1 only if necessary        | Reuse and adapt; do not duplicate domain contracts                                     |
| Desktop/a11y polish    | native workspace components and styles only                                                        | E4.T1 UI Designer              | minimum-window compaction, reduced motion, keyboard access, both themes                |
| Workbench composition  | `ui/src/packages/vector-visualizer/src/main.tsx`, `query-lab/**`                                   | E4.T2 UI Designer              | Capability-reduced hierarchy; no native Atlas parity claim                             |
| Visual acceptance      | `tests/e2e-playwright/tests/vector-visualizer/product-ui/**`                                       | E1.T1 then E5.VERIFY read-only | geometry, screenshots, console/network, keyboard, real routes                          |

No E2 worker may edit `VectorVisualizerPage.tsx`; this keeps the parallel wave file-disjoint. E3 owns the integration point exclusively after E2 completes.
