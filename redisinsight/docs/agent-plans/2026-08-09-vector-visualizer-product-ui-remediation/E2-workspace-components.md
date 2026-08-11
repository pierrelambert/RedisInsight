# E2 — Three-pane building blocks

Dispatch E2.T1, E2.T2, and E2.T3 in parallel only after E1.T1 is accepted. Each task creates a disjoint presentational component directory and may not edit the native page.

- [E2.T1 controls](tasks/E2-T1-controls.md)
- [E2.T2 results inspector](tasks/E2-T2-results.md)
- [E2.T3 center canvas](tasks/E2-T3-canvas.md)

Exit: all three component suites, scoped lint, and owned-path TypeScript checks pass; coordinator checks visual/API compatibility and then assigns exclusive integration ownership to E3.T1.
