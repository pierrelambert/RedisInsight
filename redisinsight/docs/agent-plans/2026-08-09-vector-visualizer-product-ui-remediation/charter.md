# Charter: Vector Visualizer Product UI Remediation

Plan ID: 2026-08-09-vector-visualizer-product-ui-remediation  
Date: 2026-08-09  
Repository: `/private/tmp/redisinsight-vector-visualizer`  
Branch: `codex/redis-vector-visualizer`  
Execution: started by explicit user authorization on 2026-08-10  
Autonomy after explicit start: autonomous within task contracts  
Commit policy: prohibited

## Goal

Bring the native RedisInsight Vector Visualizer to the product-quality bar already established by the preserved brainstorming artifacts: a compact, viewport-filling, connected three-pane desktop workspace with persistent controls, a dominant Atlas/Neighbors/Selection canvas, a linked result inspector, supported-window compaction, and measurable real-route visual acceptance.

## Non-goals

- Do not reimplement or destabilize delivered adapters, sampling, UMAP, WebGL, evidence, privacy, routing, feature flags, or PR-readiness fixes.
- Do not add PCA, t-SNE, a sample range above 20,000, Workbench Atlas parity, data mutation, new telemetry, or new dependencies.
- Do not treat the Workbench iframe as the full native page; it remains a capability-reduced internal plugin surface.
- Do not touch Geodata, CI/build policy, backend/public APIs, commit, push, or change branch refs.

## Sources of truth

1. `../../specs/2026-08-09-redis-vector-visualizer-visual-contract.md`
2. `../../specs/2026-08-09-redis-vector-visualizer-visual-fidelity-delta.md`
3. the amended 2026-08-07 product and technical specs
4. `../../specs/assets/vector-visualizer/`
5. this charter, tracker, capability ledger, decisions, and task contracts

Product/technical semantics override illustrative mockup values. The visual contract overrides the current implementation for composition, hierarchy, density, and linked interaction.

## Success criteria

- REQ-VV-011 through REQ-VV-015 have fresh, mapped evidence.
- At `1440x900`, controls (200–280 px), visualization (at least 55%), and results (280–360 px) share one row and the ready state has no page-level vertical overflow.
- Atlas, Neighbors, and Selection preserve compatible source/filter/color/selection context and update the persistent inspector.
- At RedisInsight's configured `960x680` minimum Electron window, all three regions remain visible and keyboard-accessible, with the canvas still primary.
- Real-route Playwright geometry, screenshot, console, network, theme, state, and keyboard checks pass without automatic baseline replacement.
- A fresh Verifier returns READY and a fresh independent visual Auditor returns APPROVED with no P0/P1.

## Active residual

The technical/capability and bounded PR-readiness audits remain valid for their exact scopes. E1–E4 fixture evidence now proves the native three-pane composition, supported desktop minimum, linked modes, and capability-reduced Workbench hierarchy. Product visual fidelity is not final until E5 supplies fresh current screenshots/reference comparison, real-route evidence where available, complete gate classification, and an independent audit.

## Resume ritual

Read `charter.md`, `00-index.md`, `tracker.md`, `decisions.md`, `capability-ledger.md`, the visual contract, the latest verifier/auditor report, and the newest user request. Restate the active residual before dispatch.
