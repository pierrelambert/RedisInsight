# Change Delta: Redis Vector Visualizer

Source of truth: `2026-08-07-redis-vector-visualizer-product-spec.md`, `2026-08-07-redis-vector-visualizer-technical-spec.md`, and the 2026-08-09 visual-fidelity delta
Existing spec/docs checked: canonical RedisInsight plugin docs, current Vector Search and Vector Set surfaces, internal plugin packages, plugin SDK, research note
OpenSpec detected: no
Document family: standard Markdown product and technical specifications
Discovery/index updates needed: none; the repository has no existing spec index or spec directory on `origin/main`
Author: Codex
Date: 2026-08-07

## Summary

Add one capability-aware vector visualization workspace for Redis Search indexes and native Vector Sets, exposed through native RedisInsight entry points and an internal Workbench plugin. Organize it around Explore, Query Lab, Health, Compare & Tune, and Advanced workflows. Preserve existing result tables and editing flows.

## ADDED

### REQ-VV-001: Shared vector data-source model

- Source: product and technical specifications.
- Rationale: Redis uses different concrete objects and commands for Search indexes and Vector Sets.
- Acceptance scenarios:
  - Given a Search index with one vector field, when the visualizer opens, then it identifies the index, field, dimensions, metric, algorithm, and supported capabilities.
  - Given a Search index with multiple vector fields, when the visualizer opens, then source discovery succeeds and execution waits for a field choice.
  - Given a Vector Set key, when the visualizer opens, then it identifies the key, dimensions, quantization/graph facts, and supported capabilities.
  - Given a capability available on only one source type, when the other source is selected, then the UI shows an unavailable explanation and no fabricated equivalent.
- Constraints: separate filter grammars and evidence provenance; no generic “collection” object in Redis-facing copy.
- Compatibility impact: additive.
- Verification: adapter unit tests and capability-gating component tests.
- Handoff: E1 in the delegated plan.

### REQ-VV-002: Three supported entry points

- Acceptance scenarios:
  - Given a vector-capable Search index, when its Visualize action is activated, then the native workspace opens with the index context.
  - Given a Vector Set key, when its Visualize action is activated, then the native workspace opens with the key context.
  - Given a matching vector command in Workbench, when Vector visualizer is selected, then its iframe renders Query Lab using the executed command/result.
  - Given a non-vector Search command, when Workbench resolves visualizations, then the vector plugin is not offered.
- Constraints: Workbench visualization is internal Vite, non-default, and does not displace current Search/Profile defaults.
- Verification: matcher tests, native route/component tests, plugin API/Workbench Playwright.
- Handoff: E1 and E2.

### REQ-VV-003: Synchronized Query Lab

- Acceptance scenarios:
  - Given a completed query, when a result is selected in any Query Lab view, then Neighbors, distribution, rank-gap, table, and inspector share the selection.
  - Given Search `FT.PROFILE` evidence, when profile is shown, then only response-backed stages/counts/modes appear.
  - Given a Vector Set `VSIM` run, when profile is shown, then the reduced profile does not imitate Search iterator stages.
  - Given a live neighbor outside the plotted sample, when it is selected, then Selection shows it as not plotted.
- Constraints: radius preserves real anchor distance/similarity; angle is labelled layout-only unless explicitly encoded.
- Verification: state-store tests, parser tests, component tests, Playwright linked-selection flow.
- Handoff: E2.

### REQ-VV-004: Sampled Atlas and metadata matrix

- Acceptance scenarios:
  - Given a supported source and sample budget, when Atlas completes, then the UI shows a 2D sample projection, sample/source counts, method/seed/filter, freshness, and quality measure.
  - Given a Shift-drag region, when selection ends, then only plotted points in that region are selected.
  - Given a metadata field, when it is chosen, then color and the metadata × cluster matrix update consistently.
  - Given a source change during sampling, when post-sample count differs, then the view is marked changed while sampled.
- Constraints: seeded UMAP is the sole v1 projection through `umap-js@1.4.0`; PCA and t-SNE return typed unsupported results; worker layout, custom WebGL2 large mode, and 500–20,000 explicit supported range remain subject to measured target evidence.
- Verification: deterministic worker tests, stale/cancel tests, performance fixture, light/dark Playwright.
- Handoff: E3.

### REQ-VV-005: Health workflows

- Acceptance scenarios:
  - Given a bounded sample, when Health loads, then X-ray shows evidence-backed configuration, duplicate, outlier, metadata coverage, and distribution facts.
  - Given a duplicate group or outlier, when it is selected, then the same item opens in Selection/inspector with rule and provenance.
  - Given missing evidence, when a health status renders, then it is Unknown/unavailable rather than Healthy.
- Constraints: every status names calculation, parameters, sample, and threshold.
- Verification: known-fixture calculation tests and component state tests.
- Handoff: E3.

### REQ-VV-006: Compare, tune, and advanced evidence

- Acceptance scenarios:
  - Given two compatible manifests, when compared, then drift shows comparable changes and sampled/measured provenance.
  - Given incompatible metrics/dimensions/fields, when compared, then the UI explains incompatibility and does not coerce values.
  - Given completed benchmark runs, when Pareto opens, then recall, latency, and memory show only comparable measured values.
  - Given a supported Vector Set, when Advanced topology runs, then `VLINKS` adjacency is labelled topology rather than semantic neighbors.
  - Given a Search index without adjacency evidence, when Advanced opens, then topology is unavailable.
- Constraints: expensive truth/benchmark work is estimated, explicit, read-only, cancellable, and never scheduled silently.
- Verification: manifest compatibility tests, benchmark fixture tests, capability Playwright flows.
- Handoff: E4.

### REQ-VV-007: RedisInsight product UI and accessibility

- Acceptance scenarios:
  - Given either theme, when any workflow renders, then it uses RedisInsight `light`/`dark` tokens with semantic states and readable contrast.
  - Given a keyboard-only user, when navigating plotted records, then the linked table provides focus, selection, and inspector access equivalent to point interaction.
  - Given a large local selection, when the table renders, then it is virtualized and not paginated.
  - Given empty/loading/error/stale/unsupported/cancelled states, when encountered, then each has visible copy and a next action where possible.
- Constraints: Geist UI typography, Source Code Pro technical values, no universal Redis Red, no color-only meaning.
- Verification: component accessibility checks and Playwright at `1440x900`, an intermediate desktop width, and the configured `960x680` Electron minimum in both themes.
- Handoff: all UI epics; final audit in E5.

### REQ-VV-008: Privacy, safety, and bounded execution

- Acceptance scenarios:
  - Given raw embeddings, when sampling/layout completes or the source changes, then vectors remain memory-only and are not logged, persisted, exported, or sent to telemetry.
  - Given an expensive exact/truth operation, when the user initiates it, then an estimate and confirmation appear before execution.
  - Given current Redis ACL restrictions, when a command is denied, then the visualizer reports the capability failure and does not bypass the connection.
  - Given a plugin exception, when activation/render fails, then a non-blank error state and prefixed safe log are produced.
- Constraints: read-only commands; no hidden outbound network calls; payload fields opt-in.
- Verification: command allowlist tests, logging/bundle audit, network inspection, error-boundary tests.
- Handoff: E1, E2, and E5.

## MODIFIED

### REQ-VV-009: Extend native Vector Search and Vector Set surfaces

- Previous behavior: Vector Search manages indexes and queries; Vector Set details browse/edit elements and run similarity search without a shared visualization workspace.
- New behavior: both expose a Visualize entry point while retaining their current workflows.
- Compatibility: additive UI action; existing routes, tables, forms, and editing behavior remain intact.
- Migration/rollback: feature flag removal/disable hides the action.
- Verification: existing focused tests plus new entry-point tests.
- Handoff: E2/E3 integration tasks.

### REQ-VV-010: Extend internal plugin build registry

- Previous behavior: `ui/src/packages/vite.config.mjs` builds the existing plugin list.
- New behavior: register the vector visualizer internal package and its static assets.
- Compatibility: existing plugin entries and bundles remain unchanged; activation matchers are non-conflicting.
- Migration/rollback: remove registry entry and feature flag exposure.
- Verification: plugin Vite build, bundle/activation grep, matcher regression tests, `/api/plugins` evidence.
- Handoff: E1.

## REMOVED

None.

## SUPERSEDED

| Old item                                | Superseded by                                                 | Why                                                                | Evidence                              |
| --------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------- |
| Generic “collection” terminology        | Search index / Vector Set / vector data source                | Matches Redis object vocabulary and the user’s explicit correction | Product spec terminology              |
| One generic vector dashboard            | Five developer-question workflows                             | Turns visuals into retrieval and data-quality tools                | Product spec information architecture |
| Arbitrary radial angle implying meaning | Labelled layout-only or explicit category/graph-derived angle | Avoids false semantic interpretation                               | Product spec Neighbors contract       |

## DEFERRED

| Item                                    | Reason deferred                                                                                                                       | Decision needed                                             | Revisit trigger                                                              |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Search-index HNSW node traversal        | No authoritative Redis command currently exposes traversal nodes                                                                      | Redis capability/API decision                               | Redis adds authoritative traversal evidence                                  |
| Unconditional Atlas parity in Workbench | E1 proved the current plugin SDK lacks cancellable bounded sampling and the persistence limits cannot hold the default vector payload | None for v1; native Atlas with a Workbench link is approved | SDK adds cancellable bounded streaming/sampling or an approved native bridge |
| PCA projection                          | UMAP-only v1 reduces dependency and UI scope                                                                                          | None for v1; explicitly deferred                            | Measured user demand or a demonstrated UMAP failure mode                     |
| t-SNE projection                        | UMAP-only v1 reduces dependency, tuning, and maintenance scope                                                                        | None for v1; explicitly deferred                            | Measured user demand for a distinct t-SNE workflow                           |
| Continuous drift monitoring             | Requires scheduler/storage/operational product scope beyond visualizer                                                                | Product scope                                               | Explicit monitoring initiative                                               |
| Automatic index tuning                  | Risky write behavior and benchmark interpretation                                                                                     | Product/safety scope                                        | Explicit opt-in tuning project                                               |

## Non-goals

See the product specification. No data mutation, automatic tuning, background monitoring, or exact-global-geometry claim is included.

## Assumptions

- Implementation begins from a fresh branch based on canonical `main` commit `0b53c6c2f` or a later fetched successor.
- Current geodata feature-branch edits are unrelated and must not be merged into this work.
- The active Redis connection and existing read-only execution paths remain the authority boundary.
- New runtime dependencies require explicit approval under repository policy.

## Open decisions

None before v1 implementation. Manifests are local-only; duplicate and outlier rules have visible, tested, configurable defaults.

## Validation report

- Errors: none identified in the specification set.
- Warnings: the original `REQ-VV-007` acceptance language did not preserve the brainstorming composition or require screenshot comparison. Its visual acceptance is superseded by `2026-08-09-redis-vector-visualizer-visual-fidelity-delta.md`. Atlas-scale Workbench parity and new visualization dependencies remain decision-gated; Search lacks public adjacency/traversal evidence.
- Info: canonical local `main` was synchronized to `origin/main` at `0b53c6c2f` before authoring.

## Execution handoff

- Planning skill: `agent-delegation-planning`.
- Plan directory: `docs/agent-plans/2026-08-07-redis-vector-visualizer/`.
- Validation commands: focused Jest, package typecheck, changed-scope lint, plugin Vite build, `git diff --check`, and Playwright gates defined in the plan.
