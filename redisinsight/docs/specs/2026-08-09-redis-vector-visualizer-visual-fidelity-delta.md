# Change Delta: Vector Visualizer Visual Fidelity

Source of truth: `2026-08-09-redis-vector-visualizer-visual-contract.md`
Amends: 2026-08-07 product, technical, and change-delta specifications
OpenSpec detected: no
Document family: standard Markdown product and technical specifications
Author: Codex
Date: 2026-08-09

## Summary

Restore the brainstormed Redis product workspace as an explicit acceptance contract. The implemented technical capabilities remain in scope and are not re-planned; the delta corrects the missing spatial hierarchy, connected-mode composition, supported desktop-window behavior, and visual-regression proof.

## ADDED

### REQ-VV-011: Preserve the normative visual evidence

- Given future implementation or review work, when visual acceptance is evaluated, then the versioned HTML and PNG artifacts under `assets/vector-visualizer/` are available in the repository.
- Given an artifact that illustrates a value superseded by a product decision, when implementing it, then the product/technical semantic contract wins and the visual composition is retained.
- Verification: asset manifest review and independent contract audit.

### REQ-VV-012: Desktop three-pane product workspace

- Given the native visualizer at `1440x900`, when the ready Atlas renders, then persistent controls, the dominant visualization, and the persistent result inspector share one workspace row.
- Then controls are 200–280 px, results are 280–360 px, and the visualization receives at least 55% of workspace width.
- Then the ready workspace fits the available content height without page-level vertical scrolling.
- Then the UI reads as a compact RedisInsight developer tool rather than a vertical component showcase.
- Verification: landmark geometry assertions, overflow assertions, and approved real-route screenshot comparison.

### REQ-VV-013: Connected Atlas, Neighbors, and Selection modes

- Given a source, filter, color field, or selection, when the user switches between Atlas, Neighbors, and Selection, then compatible context is preserved.
- Given any point or table-row selection, when it changes, then plot, table, inspector, and active-mode title remain synchronized.
- Given Neighbors, when metric rings render, then radius is metric-aware and angle remains explicitly layout-only unless evidence says otherwise.
- Verification: state tests, component interaction tests, and real-route browser flows for all three modes.

### REQ-VV-014: Supported desktop-window access to workspace regions

- Given a width above 1100 px, then all three regions remain visible.
- Given 960–1100 px, then side regions compact before the central plot loses priority.
- Given the configured `960x680` minimum Electron window, then controls, visualization, and results remain visible and keyboard-accessible in the desktop workspace.
- Mobile drawers, overlays, and mobile-specific navigation are explicitly not required.
- Verification: geometry, overflow, and keyboard checks at reference, intermediate, and minimum desktop widths.

### REQ-VV-015: Visual-regression acceptance

- Given a candidate implementation, when final acceptance runs, then real RedisInsight routes are used for product proof.
- Then screenshot comparisons cover Atlas, Neighbors, Selection, light/dark at reference and minimum desktop sizes, and meaningful non-ready states.
- Then geometry, overflow, console, and network assertions run in addition to screenshots.
- Then an independent auditor compares the result with the preserved reference artifacts.
- Verification: Playwright report, approved baselines, visual-diff artifacts, and independent audit report.

## MODIFIED

### REQ-VV-007: RedisInsight product UI and accessibility

- Previous behavior: required theme, keyboard, virtualization, and state handling with generic desktop and mistakenly introduced mobile browser checks.
- New behavior: retains those requirements and adds the exact composition, hierarchy, connected modes, supported desktop-window access, and visual-regression evidence in REQ-VV-011 through REQ-VV-015.
- Compatibility: additive product-quality constraint; no Redis data or public API migration.
- Verification: the new visual acceptance suite supersedes non-blank/readable screenshot inspection as proof of product fidelity.

## SUPERSEDED

| Old acceptance claim                                        | Superseded by             | Reason                                                                                 |
| ----------------------------------------------------------- | ------------------------- | -------------------------------------------------------------------------------------- |
| Generic layout sentence in the 2026-08-07 product spec      | REQ-VV-012 and REQ-VV-013 | It lost the brainstormed three-pane hierarchy and connected-mode behavior              |
| Viewport coverage without geometry or screenshot comparison | REQ-VV-014 and REQ-VV-015 | A page can fit a desktop window while materially missing the target product experience |
| Non-blank/readable screenshot inspection as visual proof    | REQ-VV-015                | It proves rendering only, not reference fidelity                                       |

## DEFERRED

- PCA, t-SNE, and a sample range above 20,000 remain deferred by the 2026-08-07 product decisions.
- Workbench Atlas parity remains deferred until its host adapter proves bounded cancellable sampling.

## Validation report

- Errors corrected: normative brainstorming evidence was absent from the durable spec set; spatial acceptance was under-specified; final browser evidence did not compare against the established reference.
- Warnings: desktop-window compaction must keep controls and results visible through the configured minimum; screenshot baselines require deliberate review and must not be auto-updated.
- Info: the 2026-08-09 PR-readiness audit remains valid for its bounded code-quality delta and is not product-visual approval.

## Execution handoff

- Plan directory: `docs/agent-plans/2026-08-09-vector-visualizer-product-ui-remediation/`.
- Execution is not authorized by this delta. Use the plan coordinator prompt only after explicit start authorization.
