# E5.VERIFY — Fresh product-UI verification report

Date: 2026-08-10  
Status: **NOT READY**  
Role: Verifier (fresh read-only context)  
Requested route: `gpt-5.6-terra`, high reasoning  
Actual model/reasoning: unknown / unknown (host did not expose worker metadata)  
Inheritance: unknown  
Fallback: `gpt-5.6-sol` high only after coordinator approval; not used.  
Commit/stage/push/ref changes: none.

## Anchors, route, and scope

Read the E5 task, charter, status board, tracker, capability ledger, components,
decisions, E1--E4 reports/reviews, visual contract/delta, amended product and
technical specifications/deltas, assets README/references, current source/tests,
and current Git state. `desktop/config.json` sets the Electron minimum to
`960x680`; the current correction excludes mobile acceptance. The active residual
is final product evidence, not re-approval of the historical technical audits.

This is a direct, serial verifier run: no safe independent subtask was needed and
only this report was added. RTK `0.39.0` was available. Its optional `rtk gain`
database failed to initialize (`unable to open database file: Error code 14`), so
that telemetry is unavailable; RTK command wrappers remained usable.

Initial and final worktree state was dirty and intentionally preserved. The
branch was `codex/redis-vector-visualizer` at `0b53c6c2f`; the staged index was
empty; `git diff --check` exited 0. The only intentional repository edit is this
report. The existing fixture harness refreshes ignored/untracked output under
`artifacts/` during its Vite build; no baseline or source/spec/test file was
changed by the verifier.

## Gate summary

| Requirement | Fresh evidence | Result |
| --- | --- | --- |
| REQ-VV-011 | Asset README and all three reference PNGs exist; preserved HTML inventory exists; semantic precedence is documented. | PASS |
| REQ-VV-012 | Native fixture geometry is numerically three-pane/no-overflow, but current Atlas comparison is materially less dense and less semantically expressive than the normative capture; no real route was available. | FAIL (P1) |
| REQ-VV-013 | Native fixture browser test and focused tests prove linked Atlas/Neighbors/Selection state; real-route interaction remains absent. | PARTIAL / not final proof |
| REQ-VV-014 | Fixture geometry and keyboard tests pass at 1440, 1100 and 960x680, but runnable current test inventory still contains 390x844 mobile acceptance. | FAIL (P1) |
| REQ-VV-015 | Seven native fixture cases and three Workbench cases pass with clean production-fixture signals, but the required real RedisInsight route, approved comparison/baseline evidence, and reference fidelity are absent. | FAIL (P1) |

`READY` requires fresh evidence for every row and zero P0/P1. That condition is
not met.

## Fresh automated evidence

| Command | Exit / result |
| --- | --- |
| `node node_modules/.bin/jest …VectorVisualizerPage/Workspace/Controls/Canvas/Results… -c jest.config.cjs --runInBand` | 0; 5 suites, 41 tests |
| `node node_modules/.bin/jest …SelectionTable.spec.tsx -c …/vector-visualizer/jest.config.cjs --runInBand` | 0; 1 suite, 8 tests; together the current E3/E4 six-suite set is **49/49** |
| `node node_modules/.bin/jest -c …/vector-visualizer/jest.config.cjs --runInBand` | 0; 25 suites, 177 tests |
| Package `main.spec.tsx` + `QueryLab.spec.tsx` | 0; 2 suites, 33 tests |
| Relevant native entry/plugin/vector-set/vector-search command | 0; 5 suites, 82 tests |
| Scoped native ESLint + Prettier | 0 |
| Scoped E2E ESLint + Prettier + `tsc --noEmit` | 0 |
| Vector-visualizer package `tsc --noEmit` | non-zero; existing aggregate/transitive TypeScript diagnostics (including `@tanstack/table-core` and general UI paths), none attributed by the output to Vector Visualizer-owned paths |
| Aggregate UI `tsc --noEmit` attempt | non-zero baseline/transitive diagnostic set; not a repository-wide pass |
| Native fixture Vite build, explicit `/tmp/e5-native-fixture-vite` output | 0; 3,460 modules; only Vite >500 kB advisory |
| Workbench fixture Vite build, explicit `/tmp/e5-workbench-fixture-vite` output | 0; 3,409 modules; only Vite >500 kB advisory |
| Shared packages Vite build, explicit `/tmp/e5-shared-package-build` output | 1 in 38 ms: protected Geodata cannot resolve `leaflet/dist/leaflet.css`; not fixed or modified |
| Native E1 product-ui Playwright | 7 passed (13.4s), 1 skipped only because no `E1_REAL_APP_BASE_URL`/`E1_REAL_APP_INSTANCE_ID` was supplied |
| Workbench Query Lab Playwright | 3 passed (5.8s), light 1440x900, dark 960x680, empty/failed states |
| `git diff --check` and staged-index inspection | 0; no staged files |

The first native-suite invocation using the package Jest config selected only
`SelectionTable` (8/8), because that config's roots exclude native-page tests.
The root-config native run above is the corrected result; it is reported rather
than counted as six suites by itself.

## Browser, geometry, screenshots, and comparison

The requested full-app candidate was probed before fixture work:

- `http://localhost:8080/89370e78-80ce-40bd-b05a-03c75c86a9dc/vector-visualizer`:
  connection refused (HTTP `000`).
- `http://127.0.0.1:8080/89370e78-80ce-40bd-b05a-03c75c86a9dc/vector-visualizer`:
  connection refused (HTTP `000`).
- Listener inspection found no port-8080 process. No full app, Redis state,
  authentication, Electron process, or fixture substitution was attempted.

For bounded fixture inspection only, a temporary loopback Vite process served
`127.0.0.1:4185`; it was stopped after capture and final listener checks found
no process on 4185, 4192, 4196, or 8080. Current non-baseline screenshots are:

| Screenshot | Size / observation |
| --- | --- |
| `/tmp/e5-vector-visualizer-shots/atlas-light-1440x900.png` | 1440x900; Controls/Canvas/Results = 216/904/296; document height 900 |
| `/tmp/e5-vector-visualizer-shots/neighbors-light-1440x900.png` | 1440x900; 216/904/296; document height 900 |
| `/tmp/e5-vector-visualizer-shots/selection-dark-1440x900.png` | 1440x900; 216/904/296; document height 900 |
| `/tmp/e5-vector-visualizer-shots/atlas-dark-1100x800.png` | 1100x800; 216/564/296; document height 800 |
| `/tmp/e5-vector-visualizer-shots/atlas-light-960x680.png` | 960x680; 216/424/296; document height 680 |
| `/tmp/e5-vector-visualizer-shots/loading-dark-960x680.png` | 960x680; contained three regions |
| `/tmp/e5-vector-visualizer-shots/empty-light-960x680.png` | 960x680; contained three regions |
| `/tmp/e5-vector-visualizer-shots/error-dark-960x680.png` | 960x680; contained three regions |
| `/tmp/vector-visualizer-e4-t2-light-1440x900.png` and `/tmp/vector-visualizer-e4-t2-dark-960x680.png` | Workbench fixture captures made by its 3/3 passing suite |

The native production fixture suite itself observed clean console/page-error,
failed-request, same-origin-error, and unexpected-network gates. The manual
development-server capture observed no console/page errors or failed requests,
but did see Google Fonts development requests. Those are recorded as a
development-fixture signal and are not substituted for the passing production
fixture signal gate.

Manual side-by-side review against `atlas-reference.png` (1325x541),
`neighbors-reference.png` (1325x540), and `selection-reference.png` (1324x536)
found the following material differences:

| Difference | Classification |
| --- | --- |
| 216/904/296 three-pane geometry, contained minimum desktop layout, dark theme, loading/empty/error states | Intentional desktop adaptation / implemented semantics |
| UMAP-only control and 500--20,000 limit where early references show PCA or 50,000 | Intentional semantic correction required by later product/technical specs |
| Current Atlas is a sparse monochrome point field with substantially plainer controls/results, while the normative Atlas uses dense semantically colored groups, richer persistent filter/color controls, table density, and compact operator hierarchy | **Defect (P1)**: REQ-VV-012/015 visual-fidelity target is not met by the current fixture rendering |
| Current Neighbors and Selection simplify the reference hierarchy and visual density into mostly text/panel layouts rather than the connected metric/selection visual workspace | **Defect (P1)**: material reference-composition mismatch |

No screenshot was approved, replaced, committed, or used as a baseline.

## Findings

### P0

None.

### P1-1 — No real RedisInsight route proof; final visual gate cannot be met

Both supplied current candidate addresses refuse connections and no 8080 listener
exists. The E1 real-route test is correctly environment-gated and skipped, so
fixture success cannot satisfy the charter/REQ-VV-015 requirement for real-route
geometry, screenshot, keyboard, console/network, and reference comparison.

Repair closure: provide a running, authenticated local/dev RedisInsight route
that demonstrably serves this worktree's full application; rerun the real-route
flow at 1440x900, intermediate desktop, and 960x680, then capture/approve
reference comparisons without updating baselines automatically.

### P1-2 — Active runnable mobile acceptance contradicts the desktop-only correction

The current runnable E5 native-host test uses a Vector Set scenario at `390x844`
and writes `e5-t1-vector-set-benchmark-dark-390x844.png`. The test lists as a
runnable three-test suite. Current E2/E3 test inventory also retains a named
mobile viewport test and `390x844` outputs. This conflicts directly with the
newest Electron-only contract (desktop reference, intermediate desktop, and
configured 960x680 minimum only).

Repair closure: remove or replace every active 390x844/mobile acceptance and
generated-evidence branch with supported desktop coverage; retain only the
corrected desktop windows. Do not add a mobile/drawer/overlay substitute.

### P1-3 — Current fixture screenshots materially miss normative visual fidelity

The three-pane geometry is valid, but the fresh Atlas/Neighbors/Selection
screenshots materially diverge from the preserved reference composition,
semantic color density, control/inspector richness, and connected visual
hierarchy. This is not an allowed semantic correction: the later specifications
preserve visual composition while only superseding PCA and the 50,000 range.

Repair closure: bring the native rendering to the preserved desktop reference
quality bar, then perform a fresh manual/reference review and real-route proof.

### P2 / residual non-passes

- Shared multi-plugin build remains blocked at protected Geodata's missing
  Leaflet CSS import. It was neither changed nor worked around.
- Aggregate package/UI TypeScript remains a non-pass due known baseline and
  transitive diagnostics; focused owned tests/lint/type evidence must not be
  described as an aggregate pass.
- Live Redis, Electron window, deployment, production performance, and actual
  Workbench host frame remain unproven.

## Capability and semantic boundary checks

Source and test inspection found the Workbench text explicitly states that Atlas
is unavailable there and that no additional Redis command is issued; the
fixture Workbench browser suite confirms that capability-reduced response-only
hierarchy. Searches found no new PCA/t-SNE implementation (only typed
unsupported-contract coverage), no sample range above 20,000, and no Workbench
Atlas-parity claim. The mobile findings above are the exception to the requested
desktop-only inventory check.

## Disposition

**NOT READY.** Do not dispatch E5.AUDIT. First repair P1-2 and P1-3, provide
the real-route environment for P1-1, then rerun E5.VERIFY in a fresh context.
