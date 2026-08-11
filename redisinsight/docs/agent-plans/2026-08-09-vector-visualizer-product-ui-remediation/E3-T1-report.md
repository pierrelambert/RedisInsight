# E3-T1 native integration report

## Scope and outcome

Integrated the accepted E2 controls, canvas, and results components into the
native Vector Visualizer page as a desktop three-pane workspace. The page keeps
the native source action, bounded sampling, progress/cancel flow, provenance
truth banner, privacy language, and supported non-ready states. Atlas,
Neighbors, and Selection are controlled center modes sharing source, sample,
selection, and inspector state. Health, Compare & Tune, and Advanced remain
available under an explicit subordinate evidence-workflows disclosure.

The desktop geometry uses theme spacing token calculations, rather than bare
pixel literals: controls resolve to 216px and results to 296px at the fixture's
10px root font size. The center resolves to 904px at 1440px viewport width
(63.8% of the 1416px workspace width). Page scroll height was 900px at the
900px viewport height.

## Files changed

- `ui/src/pages/vector-visualizer/VectorVisualizerPage.tsx`
- `ui/src/pages/vector-visualizer/VectorVisualizerPage.spec.tsx`
- `ui/src/pages/vector-visualizer/components/VectorVisualizerWorkspace/VectorVisualizerWorkspace.tsx`
- `ui/src/pages/vector-visualizer/components/VectorVisualizerWorkspace/VectorVisualizerWorkspace.styles.ts`
- `ui/src/pages/vector-visualizer/components/VectorVisualizerWorkspace/VectorVisualizerWorkspace.types.ts`
- `ui/src/pages/vector-visualizer/components/VectorVisualizerWorkspace/VectorVisualizerWorkspace.spec.tsx`
- `ui/src/pages/vector-visualizer/components/VectorVisualizerWorkspace/index.ts`
- `ui/src/packages/vector-visualizer/src/selection/SelectionTable/SelectionTable.tsx`
- `ui/src/packages/vector-visualizer/src/selection/SelectionTable/SelectionTable.spec.tsx`

The Selection table gets a stable `vector-visualizer-selected-row-<id>` test
seam while retaining `react-window`, keyboard navigation, and real click-to-
focus selection. Non-response-backed score values display as `Unavailable`, not
as fabricated numeric evidence.

## Semantic boundaries preserved

- Sampling remains explicit, bounded (500--20,000), read-only, and currently
  unfiltered.
- Filter is disabled with the truthful current limitation. Color by is omitted:
  native responses do not supply a metadata-option inventory.
- UMAP is seeded (`42`); PCA, t-SNE, oversized unbounded samples, and
  unsupported evidence are not introduced.
- Selection, Canvas, and Results use shared compatible sample/selection state;
  the inspector persists across center-mode changes.

## Verification

| Command                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Result                                                                                                                                                                                                                   |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `rtk proxy node node_modules/.bin/jest --runTestsByPath ui/src/pages/vector-visualizer/VectorVisualizerPage.spec.tsx ui/src/pages/vector-visualizer/components/VectorVisualizerWorkspace/VectorVisualizerWorkspace.spec.tsx ui/src/pages/vector-visualizer/components/VectorVisualizerControls/VectorVisualizerControls.spec.tsx ui/src/pages/vector-visualizer/components/VectorVisualizerResults/VectorVisualizerResults.spec.tsx ui/src/pages/vector-visualizer/components/VectorVisualizerCanvas/VectorVisualizerCanvas.spec.tsx ui/src/packages/vector-visualizer/src/selection/SelectionTable/SelectionTable.spec.tsx -c jest.config.cjs --runInBand` | PASS: 6 suites, 45 tests, 11.687s.                                                                                                                                                                                       |
| `rtk proxy node node_modules/.bin/jest --runTestsByPath ui/src/packages/vector-visualizer/src/selection/SelectionTable/SelectionTable.spec.tsx ui/src/pages/vector-visualizer/VectorVisualizerPage.spec.tsx -c jest.config.cjs --runInBand`                                                                                                                                                                                                                                                                                                                                                                                                                 | PASS: 2 suites, 17 tests, 9.827s, including the final unavailable-score regression.                                                                                                                                      |
| `rtk proxy npx prettier --check ...owned E3 paths...`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | PASS: all matched files use Prettier style.                                                                                                                                                                              |
| `rtk proxy npx eslint ...owned E3 paths... --no-ignore`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | PASS: no ESLint diagnostic output; command completed successfully.                                                                                                                                                       |
| `rtk proxy npm run type-check --prefix redisinsight/ui`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Unproven: sandbox run failed with `listen EPERM` creating the tsx IPC pipe; the elevated rerun started the baseline-aware type pipeline but its transport returned no final comparator/exit. No type success is claimed. |

`git diff --check` was clean. The index is empty. `git status --short` confirms
the protected checkout contains many pre-existing unrelated changes and
untracked areas; none were altered by this task.

## Browser and visual evidence (non-baseline)

Fixture URL:
`http://127.0.0.1:4185/src/pages/vector-visualizer/e5-t1-fixture/e5-t1.html?source=search`

At 1440x900, captured artifacts already present in the protected local
Playwright CLI folder include:

- `.playwright-cli/page-2026-08-10T10-08-39-485Z.png`
- `.playwright-cli/page-2026-08-10T10-09-24-357Z.png`

The latter is the ready-state after capture. It was manually compared with the
Atlas normative reference: the native page now has the intended aligned
controls / large central visual / persistent results row and visible native
truth/source context. Observed deltas are intentional/remaining native
constraints: unsupported filter and absent Color by controls are represented
truthfully, evidence scores may be `Unavailable`, and the production content
is denser than the static normative mock. This is not screenshot-baseline
approval.

Measured ready geometry: controls `x=12 y=146.78125 width=216
height=708.921875`; visualization `x=228 y=146.78125 width=904
height=713.625`; results `x=1132 y=146.78125 width=296 height=507.96875`;
document `scrollHeight=900`. Thus all three panes share their top edge, both
side widths meet contract, the center exceeds 55%, and there is no ready-page
vertical overflow.

The fixture reported one console error, a missing `/favicon.ico` (404), plus
Vite/React development warnings. No unexpected application request was
recorded. These captures are local non-baseline evidence only. The interactive
CLI/server session was stopped after capture.

## E1 Playwright result and coordinator-owned contradiction

The focused E1 run was attempted with:

`rtk proxy npx playwright test --config tests/vector-visualizer/product-ui/e1-t1.product-ui.playwright.config.ts --grep 'REQ-VV-012|REQ-VV-013|REQ-VV-014|REQ-VV-015'`

The sandboxed attempt failed to bind `127.0.0.1:4196` (`listen EPERM`). The
elevated run built the local fixture and began its seven cases, but the command
transport ended before a final suite comparator. The first case's recorded
error context proves its geometry assertions passed: the wrapper failed only
because it explicitly expected product-fidelity RED and emitted
`Expected product-fidelity RED did not occur: Expected RED: current native page has no three-pane landmarks.`
That is an obsolete expected-red harness outcome, not a native layout failure.

REQ-VV-013 remains a deliberate semantic-red contradiction: the unchanged E1
harness attempts to fill enabled Filter and Color by fields after legacy
metadata setup. The accepted native semantics are unfiltered sampling and no
response-backed Color by option inventory. Making that test green would require
fabricating or silently ignoring unsupported input, or retaining obsolete
primary UI. E3 therefore does not alter E1. A coordinator-owned bounded E1
repair should move now-green geometry cases out of the expected-red wrapper and
assert Filter-disabled-with-reason / Color-by-absent behavior for REQ-VV-013,
then obtain fresh independent review.

## Residuals / blockers

- Full UI type-check has no terminal result because of the IPC/sandbox transport
  boundary above.
- E1 has no final aggregate exit and cannot honestly be marked green until its
  obsolete expected-red/Filter/Color contract is repaired by its owner.
- No E3 mobile drawer/responsive redesign is claimed; that remains outside this
  desktop three-pane integration scope.
- The Canvas packet's accepted state contract is loading/error/ready; the
  existing Results component carries empty-state truth. Extending the accepted
  E2 component API merely to satisfy stale E1 empty-state instrumentation is
  out of E3 ownership.

## 2026-08-10 review-repair addendum

### Review findings closed in E3 ownership

1. **Inactive Canvas panels are mounted and explicitly non-visible.**
   `VectorVisualizerCanvas` now gives every mounted tabpanel `data-active` and
   styles inactive panels with authored `display: none`, in addition to their
   accessibility-hidden state. The visible duplicate active-mode label was
   removed; `data-active-mode` and the display-none
   `vector-visualizer-active-mode-title` seam keep the E1 repair surface
   available without duplicating the child heading. The Canvas regression
   asserts inactive mounted content, inactive `data-active`, and non-visibility.

2. **Neighbors inspector uses response-backed query rows.**
   In Neighbors mode the right inspector now derives IDs, rank, metric, score,
   plotted state, selected state, exactness, status, and command provenance
   directly from `query.neighbors`. Before a query it renders the truthful
   non-ready inspector message rather than sampled `NaN` rows. Atlas and
   Selection retain sampled rows and their explicit unavailable-score wording.
   The page regression samples, selects an anchor, runs the mocked query,
   selects `doc:neighbor` from the result inspector, and proves the Canvas
   selected ID, selected row state, score, detail inspector identity, title,
   and `FT.SEARCH` provenance together.

3. **296px inspector has an explicit compact table variant.**
   `SelectionTable` preserves its five-column default for existing consumers,
   virtualization, keyboard navigation, row activation, stable IDs, and full
   action path. `VectorVisualizerResults` selects a compact two-column variant
   with a viable code ID column and a short visible `Score` label whose
   accessible name remains `Score/distance`; rank is retained in the row's
   accessible ID label and plotted/action details remain in the inspector.

4. **The right region fills and scrolls internally.** Results now flex to the
   full workspace row height and its table/detail region owns overflow. This
   repairs the desktop height mismatch without changing source, sampling,
   privacy, unsupported-control, route, adapter, or workflow semantics.

### Fresh verification

| Command                                                                                                                                                                                                                                                                                                          | Result                                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rtk proxy node node_modules/.bin/jest --runTestsByPath ...VectorVisualizerPage.spec.tsx ...VectorVisualizerWorkspace.spec.tsx ...VectorVisualizerControls.spec.tsx ...VectorVisualizerCanvas.spec.tsx ...VectorVisualizerResults.spec.tsx ...SelectionTable.spec.tsx -c jest.config.cjs --runInBand --no-cache` | PASS: 6 suites, 47 tests, 23.663s. The prior test-first RED run failed in exactly the repaired areas: Neighbors rendered sampled unavailable rows, the compact table retained five columns, and Canvas had no explicit inactive-state seam.                                                                                            |
| `rtk proxy npx prettier --check ...owned E3 paths...`                                                                                                                                                                                                                                                            | PASS before the final compact-header wording adjustment; formatting was applied to the named owned files.                                                                                                                                                                                                                              |
| `rtk proxy npx eslint ...owned E3 paths... --no-ignore`                                                                                                                                                                                                                                                          | PASS after deleting the Canvas local made unused by the nonvisual seam.                                                                                                                                                                                                                                                                |
| `rtk proxy npm run type-check --prefix redisinsight/ui`                                                                                                                                                                                                                                                          | NOT PASS / unproven. Sandboxed run failed with `listen EPERM` for tsx IPC. Elevated retry reached terminal exit 1 after Node heap OOM near 4.08GB; comparator printed `Remaining errors: 0` but rejected the existing baseline as outdated and requested forbidden `.tscheck.rec.json` regeneration. No type-check success is claimed. |

`git diff --check` was clean before this addendum; the preserved broad dirty
worktree and empty index remain protected. No screenshot baseline, E1/E2E
harness, adapter, contract, backend, route, flag, build, CI, staged file, ref,
commit, or remote state was changed.

### Local browser evidence (non-baseline)

URL: `http://127.0.0.1:4185/src/pages/vector-visualizer/e5-t1-fixture/e5-t1.html?source=search&theme=light`

- 1440x900 Atlas capture:
  `.playwright-cli/page-2026-08-10T10-32-17-833Z.png`.
- 1440x900 response-backed Neighbors capture after selecting `doc:neighbor`:
  `.playwright-cli/page-2026-08-10T10-34-16-555Z.png`.
- Geometry: controls `x=12 y=146.78125 width=216 height=708.921875`;
  Canvas `x=228 y=146.78125 width=904 height=713.625`; results
  `x=1132 y=146.78125 width=296 height=713.625`. This is the requested
  216/904/296 composition with the Results region now matching Canvas height.
- Browser visibility evaluation in Atlas reported Atlas `display=flex`,
  inactive Neighbors `display=none`, and inactive Selection `display=none`,
  while their text stayed mounted. The Atlas capture contains no visible
  Neighbors or Selection payload.
- At exact 296px Results width, compact table headers were `ID/member`
  `left=1154 right=1355 width=201` and accessible `Score/distance`
  `left=1359 right=1407 width=48`; `nonOverlapping=true`.
- The response-backed Neighbors DOM showed `Nearest documents`, approximate
  exactness, `Bounded read-only FT.SEARCH response`, `doc:neighbor`, score
  `0.13`, and the selected record inspector after row activation.
- Console/network are **not clean**: one same-origin `/favicon.ico` 404 and
  two Vite `rawproto.js` browser-externalized `fs.readFile` warnings, plus the
  React DevTools development information. CLI network listing returned no
  captured request rows. These local dev diagnostics are classified, not
  represented as clean-console or clean-network proof.

### Coordinator-owned residual

Finding 4 remains an **E1 owner packet**: repair the stale expected-RED
acceptance wrapper, split actually-green desktop geometry/mode assertions from
historical RED checks, assert disabled Filter's useful reason and Color by's
absence, and rerun its final browser suite. E3 deliberately did not edit that
harness.
