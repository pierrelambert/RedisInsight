# Vector Visualizer holiday handoff

Date: 2026-08-15 19:49 CEST
Branch: `feature/vector-visualizer`
Implementation/documentation checkpoint before this preservation note: `f1611797a docs(vector-visualizer): update holiday handoff status`
Parking target: `fork` remote, `https://github.com/pierrelambert/RedisInsight.git`, branch `feature/vector-visualizer`

This file is the current resume point. Older reports that say the plan is fully PR-ready are historical; they predate the later live-route review, recovery from `6fe901323`, and the latest Query Lab / evidence-workflow fixes.

## Current state in one paragraph

The branch contains the original Vector Visualizer implementation, the Aggregate/Hybrid/Profile query pipeline, the recovered visual capabilities from the mixed `6fe901323` commit, the follow-up live-route UX repairs made on 2026-08-15, and this preservation documentation update. The implementation code and previous handoff documentation are committed through `f1611797a`; the branch should next be committed with this preservation note and pushed to Pierre's fork. The implementation is substantial and locally committed, but it is not ready to open as a final PR without one deliberate live RedisInsight route pass, a clean PR gate pass, and the remaining product-readiness decisions listed below.

## Parking branch safely before pause

Goal: preserve all committed Vector Visualizer work while Pierre has no time to invest in it.

- Current local branch: `feature/vector-visualizer`.
- Preservation target: GitHub fork `pierrelambert/RedisInsight`.
- Remote configured locally: `fork` -> `https://github.com/pierrelambert/RedisInsight.git`.
- Branch to push: `feature/vector-visualizer`.
- This is a durability checkpoint only. It does not make the feature PR-ready and does not promote the feature flag.
- Resume by fetching `pierrelambert/RedisInsight`, checking out `feature/vector-visualizer`, and starting from this handoff plus `00-index.md`.
- After pushing, verify the fork branch points to this documentation commit or newer before deleting any local checkout, worktree, or stash.
- Do not rewrite or force-push the fork branch unless Pierre explicitly asks for that.

## Latest committed chain

These are the most relevant recent commits on `feature/vector-visualizer`:

| Commit      | Purpose                                                                                                                                              |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `46477e80c` | Center the `Vector Visualizer` title in the top header line while keeping `Indexes / <index>` left and `View index` right.                           |
| `4cd1fb758` | Center collapsed Atlas projections so initial and compact chart states are framed like compare mode.                                                 |
| `dc1cbf7b9` | Align additional workflow controls with the mode-tab styling and layout.                                                                             |
| `f2b56e9d4` | Mark severe Health metrics with danger styling.                                                                                                      |
| `b9833e4cc` | Keep profiled queries readable in Query Lab / copied query output.                                                                                   |
| `79dee1ab1` | Compact the Search index header so it consumes less vertical space.                                                                                  |
| `78eaee42f` | Copy the last executed query instead of a stale/default query.                                                                                       |
| `14f58c6c5` | Match Query Lab tab selection styling to the Query page selected-tab color treatment.                                                                |
| `46eeaa875` | Align the View Index panel placement/width behavior.                                                                                                 |
| `6f4495d96` | Brighten active selections for dark mode and selected-document visibility.                                                                           |
| `776169862` | Restore Search navigation context when leaving and returning from Vector Visualizer.                                                                 |
| `e9c79cd03` | Align index access and selected states with the Search page conventions.                                                                             |
| `347706a68` | Copy executable vector queries when binary context is available.                                                                                     |
| `68e2dd806` | Copy binary-safe query templates when a raw executable vector blob cannot be represented safely.                                                     |
| `22c8768db` | Render partial Hybrid profile score channels instead of blank evidence when Redis returns split score rows.                                          |
| `60eab97b8` | Return Hybrid profile document IDs coherently.                                                                                                       |
| `4ec7c446c` | Generate measurable Hybrid `FT.PROFILE` queries.                                                                                                     |
| `4529c3df9` | Surface K sensitivity run status.                                                                                                                    |
| `b5ad8f5ec` | Correct Hybrid `VSIM` score argument grouping.                                                                                                       |
| `ee46dd88d` | Add the first holiday handoff checklist.                                                                                                             |
| `e0a69de64` | Fix Compare & Tune to show Redis vector tuning defaults instead of `undefined`; adds SVS-VAMANA defaults and `CONSTRUCTION_WINDOW_SIZE` propagation. |
| `9673ff65f` | Clarify Aggregate evidence metrics so grouped results are less misleading.                                                                           |
| `51833e672` | Render Aggregate and Hybrid evidence directly instead of failing with generic Query Lab unavailable states.                                          |
| `c83087140` | Use `FT.PROFILE` for Hybrid and Aggregate query paths.                                                                                               |
| `342a6a65e` | Wire the native evidence workspace and additional workflow surface.                                                                                  |
| `3d40042ae` | Restore core visual analysis capabilities from the constructive parts of `6fe901323`.                                                                |
| `0686b33f0` | Record v1 completion planning.                                                                                                                       |
| `cdcc01ec3` | Preserve safe topology/tune/compare modules after the destructive mixed commit was isolated.                                                         |

Do not reapply `6fe901323` wholesale. It mixed useful visual work with destructive deletions of `searchAdapter`, `searchAdapter.spec`, `nativeOrchestration`, and `HybridScoreChart`.

## What is currently delivered

- Search index and Vector Set entry points for the native Vector Visualizer route.
- Three-pane desktop workspace: controls, chart, results/inspector.
- Atlas with response-backed color fields, DBSCAN cluster color/labels, density heatmap, legend truncation, and UMAP/PCA compare mode.
- Neighbors radial chart with response-backed similarity display.
- Selection mode with selected result details/actions.
- Query Lab with KNN, Range, Hybrid, and Aggregate modes; recent commits restored direct evidence rendering for Aggregate/Hybrid and `FT.PROFILE` execution.
- Compare & Tune with parameter defaults for HNSW and SVS-VAMANA:
  - HNSW: `M=16`, `EF_CONSTRUCTION=200`, `EF_RUNTIME=10`, `EPSILON=0.01`
  - SVS-VAMANA: `COMPRESSION=none`, `GRAPH_MAX_DEGREE=32`, `CONSTRUCTION_WINDOW_SIZE=200`, `SEARCH_WINDOW_SIZE=10`, `EPSILON=0.01`, `USE_SEARCH_HISTORY=AUTO`, `SEARCH_BUFFER_CAPACITY=SEARCH_WINDOW_SIZE`
- Vector Search row submenu has a `Vector Visualizer` action; icon/label behavior was repaired, but verify it visually after a clean rebuild.
- Header/navigation polish: `Indexes / <index>` left, `Vector Visualizer` centered in the same line, and `View index` right-aligned.
- Additional workflow surface was moved toward a lower, scrollable evidence area so the main chart retains usable height.
- Health tiles now use stronger severity coloring for bad metrics and a more compact layout.

## Verification already run

Focused verification after the tuning-default fix:

```bash
node ../node_modules/.bin/jest --runTestsByPath \
  ui/src/packages/vector-visualizer/src/tune/recommendations.spec.ts \
  ui/src/packages/vector-visualizer/src/tune/Tune/Tune.spec.tsx \
  ui/src/packages/vector-visualizer/src/searchAdapter.spec.ts \
  ui/src/pages/vector-visualizer/nativeOrchestration.spec.ts \
  ui/src/pages/vector-visualizer/VectorVisualizerPage.spec.tsx \
  -c ../jest.config.cjs --runInBand
```

Result: 5 suites passed, 124 tests passed.

Focused verification after the latest header alignment fix:

```bash
node ../node_modules/.bin/jest \
  ui/src/pages/vector-visualizer/VectorVisualizerPage.spec.tsx \
  -c ../jest.config.cjs --runInBand
```

Result: 1 suite passed, 16 tests passed.

Also clean:

- `npx eslint --no-ignore ui/src/pages/vector-visualizer/VectorVisualizerPage.tsx ui/src/pages/vector-visualizer/VectorVisualizerPage.spec.tsx`
- `npx prettier --check ui/src/pages/vector-visualizer/VectorVisualizerPage.tsx ui/src/pages/vector-visualizer/VectorVisualizerPage.spec.tsx`
- `npx prettier --check` on the earlier 10 touched tuning/default files.
- `git diff --check`.
- Staged index and working tree were empty after the latest commit.

Known verification boundary:

- `npx eslint --no-ignore` on the vector-visualizer package still exposes pre-existing `no-bitwise` errors in float/vector byte helpers in `searchAdapter.ts` and `searchAdapter.spec.ts`. Those lines existed before `e0a69de64`; they were not part of the tuning-default change.
- Aggregate UI type-check/build boundaries have historically included non-Vector-Visualizer or baseline/transitive failures. Re-run before PR; do not claim repository-wide green from focused gates.

## How to run the local app for manual verification

From `/Users/pierre/Documents/Work/RedisInsight`:

```bash
npm run dev:desktop
```

This starts API, UI on `localhost:8080`, and Electron. If using web-only testing, run the relevant API/UI dev scripts separately.

Feature flag note:

- Local `api/config/features-config.json` may still have `dev-vectorVisualizer.flag=false`.
- For local manual testing only, ensure the effective API feature response exposes Vector Visualizer.
- Do not commit a local-only flag promotion unless the PR explicitly promotes the feature.
- If the API appears to ignore a local config change, inspect the `/api/features` response and the local feature-config cache before assuming the UI code is broken.

Recommended manual smoke dataset:

- Search index: `idx:bikes_vss`
- Vector field: `description_embeddings`
- Exercise:
  1. Open Search indexes.
  2. Use the three-dot menu for `idx:bikes_vss`.
  3. Open `Vector Visualizer`.
  4. `Sample vectors`.
  5. Verify Atlas, Color by, density, cluster labels, Neighbors, Selection, Query Lab KNN, Range, Hybrid, Aggregate, Compare & Tune.

## Must have before PR

These are blockers or near-blockers for opening a credible PR.

1. Fresh live-route verification on `localhost:8080` after a clean rebuild/restart from `46477e80c` or newer.

   - Verify the browser is actually running the latest commit.
   - Confirm the Vector Visualizer submenu icon and label.
   - Confirm the `idx:bikes_vss` route opens and samples.
   - Confirm the header line: `Indexes / <index>` left, `Vector Visualizer` centered, `View index` far right.
   - Capture any console errors and Redis command errors.

2. Query Lab mode matrix against real Redis.

   - KNN: expected to run and show neighbors.
   - Range: expected to run and show bounded range results.
   - Hybrid: must run the actual command, appear in profiler, and render evidence/results with coherent text/vector/hybrid score channels.
   - Aggregate: must run the actual command, appear in profiler, and render a useful grouped explanation, for example `count by type` or `max similarity by type` with an explicit metric label.
   - If a mode fails, inspect the exact Redis command and response shape before changing UI code.

3. Fix remaining Query Lab UX issues if still present in the live route.

   - Response evidence chart should sit to the right of the evidence summary, not below a tall text header.
   - Additional evidence workflows should be in a separate bottom panel with its own scroll area, not consuming chart height or blocking center/right pane scroll.
   - Query Lab should not show only `Selected <id>` after running a query.
   - Health candidate selection should not expose a raw selected-ID dump; use the shared sampled-record inspector or remove the low-value raw list.

4. Fix result export semantics.

   - Current export can return chart/projection row payloads.
   - Product expectation is the stored Redis document or a clearly named evidence export, not internal chart state.

5. Fix Copy Query semantics.

   - The copied command must reflect the last executed Query Lab mode, not a stale KNN command.
   - If a raw binary vector cannot be represented safely for Workbench/CLI, the UI must say so clearly and provide a safe replay path.
   - For copied Hybrid/Aggregate commands, verify the pasted Workbench command parses and returns the same result shape the visualizer renders.

6. Verify neighbor-limit behavior end to end.

   - Control value must affect the command K and the displayed neighbor dots/table.
   - Re-run after changing the slider and after switching modes.

7. Verify similarity metric display.

   - For distance metrics, user-facing similarity must be non-negative and use the agreed transform.
   - Inner ring labels and inspector score must agree.
   - Tiny negative cosine-distance values from floating-point precision, for example `-1.19209289551e-07`, should be clamped/displayed as zero distance / near-1 similarity, not shown as negative similarity.

8. Verify density and chart reset behavior.

   - Density map must still work after switching Atlas -> Neighbors -> Atlas.
   - Initial sampling should fit the visible plot similarly to compare mode.

9. Run PR gates.

   - Focused Vector Visualizer package Jest.
   - Native page Jest.
   - Vector Search submenu/list tests.
   - E2E/product UI tests that are active and desktop-only.
   - `npm run lint:ui` from repo root.
   - `NODE_OPTIONS="--max-old-space-size=8192" npm run type-check --prefix redisinsight/ui`.
   - If UI type-check fails only because the baseline is stale and no Vector Visualizer diagnostics remain, run `npm run tscheck --prefix redisinsight/ui` and commit the baseline update. Do not use `tscheck:force` to hide new errors.

10. Rebase onto latest `main`.

    - Re-run the focused gates after rebase.
    - Do not force-push without explicit approval.

11. Document the actual PR boundaries in the PR description.
    - Fixture/browser proof versus live Redis proof.
    - Supported desktop minimum and no mobile acceptance.
    - Feature flag state and promotion criteria.
    - Deferred adoption work listed below.

## Must have for capability completeness / adoption

These are not all mandatory for the first PR, but they matter before broad promotion or a strong product launch.

1. Live Redis coverage beyond the bikes demo.

   - HNSW search index with omitted optional parameters.
   - HNSW with explicit `M`, `EF_CONSTRUCTION`, `EF_RUNTIME`, `EPSILON`.
   - SVS-VAMANA index with omitted defaults.
   - SVS-VAMANA with explicit `GRAPH_MAX_DEGREE`, `CONSTRUCTION_WINDOW_SIZE`, `SEARCH_WINDOW_SIZE`, `COMPRESSION`.
   - Vector Set route.

2. Packaged Electron test.

   - Build/install the desktop app.
   - Verify Vector Visualizer route and rendering in the packaged shell.

3. Workbench host integration.

   - The plugin/Workbench Query Lab proof has been fixture-heavy historically.
   - Run the actual Workbench host with a real Redis database before promotion.

4. Visual regression baseline decision.

   - Either approve screenshot baselines or explicitly keep semantic/browser assertions only.
   - Do not let unapproved screenshots appear as PR-blocking truth.

5. Product documentation and tutorial.

   - Explain what Atlas, Neighbors, Selection, Query Lab, Health, Compare & Tune are for.
   - Explain that UMAP positions are approximate and Redis similarity evidence comes from query responses.
   - Provide example datasets and commands for HNSW and SVS-VAMANA.

6. UX polish for adoption.

   - Reduce wasted vertical space: remove low-value subtitles and warning panels that repeat obvious context.
   - Make Health tiles compact and readable.
   - Remove or redesign `Health candidate selection`; raw selected IDs add little value.
   - Make Aggregate output explain what is counted or maximized, for example `max similarity by type`, not `max_value`.
   - Make recommendations explain whether current values are from FT.INFO, Redis defaults, or query-time overrides.
   - Keep selected tabs/documents using the same bright RedisInsight selected color treatment as Query page tabs.
   - Keep the title/navigation compact: breadcrumb and title in one line, context in the smaller line below.

7. Feature flag promotion plan.
   - Keep `dev-vectorVisualizer` until live Redis, Electron, and PR gates are clean.
   - Promote only with explicit product decision.

## Current product questions to settle before broad adoption

- Should PCA/UMAP compare mode stay in v1, or should v1 remain UMAP-only with Compare & Tune deferred?
- Should Query Lab expose Hybrid/Aggregate as user-facing v1 workflows, or keep them under Advanced until their command/result model is easier to explain?
- Should Copy Query copy only replayable Workbench queries, or is a parameterized/template mode acceptable?
- Should Export visible documents always fetch stored Redis documents, or should there be two explicit exports: `Export documents` and `Export evidence rows`?
- Should Health candidate workflows remain in v1 after removing raw selected-ID lists, or be deferred until actions on selected candidates are defined?

## Must not do

- Do not pop or apply stashes wholesale. Use them only for forensic diffs.
- Do not reapply `6fe901323` wholesale.
- Do not overwrite from `6fe901323`:
  - `redisinsight/ui/src/packages/vector-visualizer/src/searchAdapter.ts`
  - `redisinsight/ui/src/packages/vector-visualizer/src/searchAdapter.spec.ts`
  - `redisinsight/ui/src/pages/vector-visualizer/nativeOrchestration.ts`
  - `redisinsight/ui/src/pages/vector-visualizer/components/HybridScoreChart/**`
- Do not reintroduce mobile-screen acceptance for this desktop app.
- Do not change `ActionsCell` again unless a current live bug points there. The earlier menu issue was mostly icon visibility / feature exposure, not the `MenuItem.Compose` API.
- Do not run `git reset --hard`, `git clean -fd`, or stash-pop in the shared checkout without explicitly proving all work is committed or intentionally disposable.
- Do not commit local feature-flag flips or environment-only changes by accident.
- Do not claim PR-ready from focused unit tests alone.
- Do not hide type-check regressions with `tscheck:force`.

## Suggested next-session order

1. Confirm clean state:

   ```bash
   cd /Users/pierre/Documents/Work/RedisInsight
   git branch --show-current
   git status --short
   git log --oneline -12
   ```

2. Start the local app and prove the UI is running `46477e80c` or newer.

3. Run the live smoke against `idx:bikes_vss`.

4. Triage only reproducible live defects, one feature group at a time:

   - Query Lab modes.
   - Additional evidence bottom panel / scroll.
   - Chart sizing/density/neighbor-limit behavior.
   - Export/copy-query semantics.
   - Health / Tune clarity.

5. Commit each group separately with Conventional Commit messages.

6. Run the PR-readiness gates.

7. Rebase onto latest `main`.

8. Prepare a PR description that separates:
   - Delivered product capabilities.
   - Focused proof.
   - Known boundaries.
   - Deferred adoption work.

## Current resume signal

If returning from holiday, start from this file, not from the older `Plan state: promoted` claim.

The branch is useful and substantial, but the honest state is:

- implementation: mostly recovered, repeatedly polished from live feedback, and committed through `46477e80c`;
- local focused tests: partially green and recently updated;
- live route: needs one final deliberate pass after the latest commits;
- PR: not yet opened;
- broad promotion: not yet justified.
