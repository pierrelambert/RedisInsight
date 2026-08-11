# E4.T2 — Workbench Query Lab refinement report

STATUS: DONE

## Scope and routing

- Role: UI Designer / Implementor
- Requested route: `gpt-5.6-terra`, high reasoning
- Actual route: `gpt-5.6-terra`, high reasoning
- Fallback: `gpt-5.6-sol` high only after coordinator approval; not used.
- Command shape: focused package Jest and Vite commands, plus a local-only
  Playwright fixture. The existing nested Playwright dependency is supplied to
  the fixture runner through a command-only `NODE_PATH`; no dependency,
  symlink, manifest, or test-tree change was made.

Only these owned paths changed:

- `ui/src/packages/vector-visualizer/src/main.tsx`
- `ui/src/packages/vector-visualizer/src/main.spec.tsx`
- `ui/src/packages/vector-visualizer/src/query-lab/QueryLab/**`
- this report

No native page/component, adapter, contract, SDK, integration, manifest,
build-config, route, feature-flag, backend, CI, baseline, staged file, ref,
commit, or remote state changed.

## Delivered hierarchy

- Workbench now has a compact product frame: source/status header, redacted
  executed-command provenance, and a truthful response-only capability note.
  It explicitly says that Atlas cannot run in Workbench because the SDK does
  not prove bounded cancellable sampling; it does not offer or imply a native
  handoff or issue an additional Redis command.
- Ready Query Lab content is a fixed desktop evidence-and-inspector grid. The
  left region is the dominant response-backed, metric-aware radial evidence
  view; the persistent right region has compact result selection, a linked
  inspector, and returned profile facts. Neighbor placement is deterministic
  and its angle remains explicitly layout-only.
- Provenance derives only from returned neighbor evidence. Selection remains
  linked between radial controls, distribution/rank-gap controls, the compact
  table, and the inspector.
- Loading/discovery/unsupported/ACL/cancelled/error/empty Query Lab props use a
  coherent state panel. Workbench empty and failed command outcomes use the
  same compact shell and status frame instead of a blank iframe.
- The supported desktop layout has no mobile breakpoint, mobile drawer,
  overlay, stacked fallback, or 390px contract. Its fixed grid is
  `minmax(0, 1.6fr) minmax(18rem, 1fr)`: at 960px the canvas remains wider than
  the visible result inspector without horizontal document overflow.

Intentional native/plugin difference: the native page is the full UMAP/sample
workspace. This plugin is an internal Workbench response-inspection surface;
it renders only response-backed query evidence and deliberately has no native
Atlas, sample controls, unsupported filters, PCA, t-SNE, or greater-than-20k
sampling claim.

## TDD evidence

| Phase | Command                                                                                                                                                                         | Result                                                                                                                                                  |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RED   | `node node_modules/.bin/jest --runTestsByPath .../QueryLab.spec.tsx .../main.spec.tsx -c jest.config.cjs --runInBand --no-cache`                                                | Expected failures: new workspace and state-panel assertions were absent. The direct root config also cannot resolve the package-local plugin SDK alias. |
| GREEN | `node node_modules/.bin/jest --runTestsByPath .../QueryLab.spec.tsx .../main.spec.tsx -c redisinsight/ui/src/packages/vector-visualizer/jest.config.cjs --runInBand --no-cache` | Exit 0: 2 suites, 33 tests.                                                                                                                             |

## Verification

| Command                                                                                                                                                | Result                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm test --prefix redisinsight/ui/src/packages/vector-visualizer -- --runInBand`                                                                      | Exit 0: 25 suites, 177 tests. The focused browser runner is `.cjs`, so package Jest does not collect it.                                                                                                                                                                                                                                                                       |
| `node node_modules/.bin/vite build --config .../QueryLab/vite.e4-t2.config.mjs`                                                                        | Exit 0: 3,409 modules, 5.19s; standard Vite chunk-size advisory only.                                                                                                                                                                                                                                                                                                          |
| `NODE_PATH=tests/e2e-playwright/node_modules tests/e2e-playwright/node_modules/.bin/playwright test --config .../QueryLab/e4-t2.playwright.config.cjs` | Exit 0: 3 passed, 3.8s. Actual `main.tsx` fixture at 1440x900 light and 960x680 dark proved both panes visible, evidence wider than inspector, workspace within viewport, no horizontal document overflow, keyboard ArrowDown selection of `doc:987`, both theme classes, empty/failed state panels, and zero console error/pageerror/requestfailed/HTTP 4xx/5xx observations. |
| `node_modules/.bin/eslint --config .eslintrc.js --no-ignore --max-warnings=0 ...owned paths...`                                                        | Exit 0.                                                                                                                                                                                                                                                                                                                                                                        |
| `node_modules/.bin/prettier --check ...owned paths...`                                                                                                 | Exit 0.                                                                                                                                                                                                                                                                                                                                                                        |
| `git diff --check`; staged-index check; no-mobile/no-native-Atlas scan                                                                                 | Exit 0. The index is empty; no prohibited mobile/drawer/responsive/Atlas-sampling/PCA/t-SNE token appears in owned presentation code.                                                                                                                                                                                                                                          |
| `node node_modules/.bin/tsc --project redisinsight/ui/src/packages/vector-visualizer/tsconfig.json --noEmit`                                           | Aggregate non-pass: 280 existing diagnostics in 52 files. A final owned-location query produced no `main` or `query-lab/QueryLab` diagnostic output. No aggregate type-check success is claimed.                                                                                                                                                                               |
| `npm run build --prefix redisinsight/ui/src/packages`                                                                                                  | Non-pass outside this task: the existing multi-plugin build stops in protected Geodata because `leaflet/dist/leaflet.css` cannot resolve. No Geodata or shared build change was made.                                                                                                                                                                                          |

## Manual non-baseline review

- `/tmp/vector-visualizer-e4-t2-light-1440x900.png`: light desktop evidence
  region is visually dominant and the persistent inspector remains readable.
- `/tmp/vector-visualizer-e4-t2-dark-960x680.png`: dark supported-minimum
  desktop iframe keeps both regions visible without a mobile collapse.

These images are local review artifacts only. No screenshot baseline was
created, updated, approved, or added to the repository. The Playwright-owned
listener on `127.0.0.1:4192` exited with the test command; no browser/session
was intentionally left running.

## Boundaries and residual risk

- The proof is a local actual-plugin fixture, not a live Workbench frame, real
  Redis query, Electron window, deployment, or native product route. Those
  remain E5 evidence boundaries.
- Aggregate UI/package TypeScript and multi-plugin build are not green for the
  unrelated existing reasons stated above.
- No baseline is approved; final visual comparison and promotion remain E5.

## Fresh P1 repair — desktop iframe height containment

Fresh review found one P1 in the prior result: the document height was 1,075px
at both supported desktop viewports, and scrolling the outer document could move
the inspector offscreen. This repair keeps the desktop two-column model; it
does not add a breakpoint, drawer, stacked layout, or one-off viewport offset.

- The plugin shell is a `100vh` bounded flex composition with `min-block-size:
0` and hidden outer overflow. Header, executed-command panel, and capability
  note remain compact fixed content; the ready region and Query Lab consume the
  remaining block space.
- `Workspace` no longer asks for the full Query Lab height in addition to its
  header/status siblings. It flexes into the remaining grid row with
  `min-block-size: 0` while preserving
  `minmax(0, 1.6fr) minmax(18rem, 1fr)`.
- `EvidencePanel` and `InspectorPanel` explicitly retain column-flex behavior
  when rendered as semantic `section`/`aside` elements. The evidence panel has
  the deliberate `query-lab-evidence-scrollport`; returned distribution and
  rank-gap material scroll inside it, while the inspector panel stays bounded
  and visible.

### Repair TDD and fresh proof

| Phase                    | Command                                                                                                                                       | Result                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RED                      | `NODE_PATH=tests/e2e-playwright/node_modules tests/e2e-playwright/node_modules/.bin/playwright test --config .../e4-t2.playwright.config.cjs` | Expected 2/3 failures: ready document height was exactly `1075`, exceeding both `900` and `680`; empty/failed passed.                                                                                                                                                                                                                                                                                               |
| GREEN                    | Same bounded fixture command                                                                                                                  | Exit 0: 3 passed. The test now asserts document height, workspace/evidence/inspector bounds, horizontal containment, a real internal evidence scroll range, focused material evidence, unchanged inspector bounds after internal scroll, keyboard-linked selection, empty/failed fit, both themes, and console/network/page-error observations. Screenshots are viewport-only (`fullPage: false`) and non-baseline. |
| Package regression       | `npm test --prefix redisinsight/ui/src/packages/vector-visualizer -- --runInBand`                                                             | Exit 0: 25 suites, 177 tests.                                                                                                                                                                                                                                                                                                                                                                                       |
| Fixture production build | `node node_modules/.bin/vite build --config .../QueryLab/vite.e4-t2.config.mjs`                                                               | Exit 0: 3,409 modules; Vite chunk-size advisory only.                                                                                                                                                                                                                                                                                                                                                               |
| Formatting/diff          | `node node_modules/.bin/prettier --check ...owned paths...`; `git diff --check`                                                               | Exit 0.                                                                                                                                                                                                                                                                                                                                                                                                             |
| Scoped type locations    | `npm run typecheck --prefix redisinsight/ui/src/packages/vector-visualizer 2>&1                                                               | rg -c 'src/(main                                                                                                                                                                                                                                                                                                                                                                                                    | query-lab/QueryLab)(/ | \\.)'` | No owned-location output after the repair. The aggregate command still has the existing 280 diagnostics in 52 unrelated/dependency files, so it remains an honest aggregate non-pass. |

Passing non-baseline geometry captured from the fixture assertion run:

| Viewport/theme | Document | Workspace / evidence / inspector bounds | Internal evidence scroll range |
| -------------- | -------- | --------------------------------------- | ------------------------------ |
| 1440×900 light | `900`    | each `y=274.375..868`                   | `187/187` after scroll         |
| 960×680 dark   | `680`    | each `y=274.375..648`                   | `407/407` after scroll         |

The local fixture listener exits with Playwright. No listener, baseline,
dependency, manifest, source outside E4.T2 ownership, staged file, commit, or
branch/ref change was introduced. This proof is still local-fixture-only; live
Workbench, Redis, Electron, deployment, aggregate type-check, and protected
multi-plugin build boundaries remain as stated above. A new fresh review is
required before acceptance.

## Fresh fixture-only repair — deterministic clean-browser evidence

The subsequent fresh review accepted the desktop layout but found that the
fixture lacked a favicon and the network observer asserted before late browser
requests had settled. This repair touches only the existing E4 fixture HTML,
fixture Playwright runner, and this report; no production source, package,
SDK, adapter, native page, dependency, baseline, or build configuration was
changed.

- `e4-t2.html` now declares a self-contained one-pixel data favicon. The local
  browser therefore has no same-origin `/favicon.ico` request to resolve as a 404.
- Every fixture case installs observers before navigation, waits for
  `networkidle` and the next animation frame before its final signal gate, and
  then checks console errors, page errors, failed requests, same-origin HTTP
  errors, and outbound HTTP errors independently. If a `/favicon.ico` response
  is ever requested, the test explicitly requires it to be non-error. There is
  no error allowlist.
- The observer remains active through the keyboard interaction, internal
  evidence scrolling, viewport screenshot, and empty/failed state transitions;
  final assertions occur only after that quiescence point.

| Phase               | Command                                                                                                                                                                              | Result                                                                                                                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RED                 | `NODE_PATH=tests/e2e-playwright/node_modules tests/e2e-playwright/node_modules/.bin/playwright test --config .../e4-t2.playwright.config.cjs` after adding the favicon contract only | Expected 2/3 failures: the two ready cases found no `link[rel="icon"]`; empty/failed passed.                                                                                                    |
| GREEN               | Same bounded fixture command after the local data favicon and settled-signal gate                                                                                                    | Exit 0: 3/3 passed in 5.7s. Both ready cases prove the favicon contract plus clean settled same-origin and outbound response arrays; empty and failed states use the same settled-signal proof. |
| Fixture build       | `node node_modules/.bin/vite build --config .../QueryLab/vite.e4-t2.config.mjs`                                                                                                      | Exit 0: 3,409 modules in 5.03s; standard Vite chunk-size advisory only.                                                                                                                         |
| Fixture lint        | `node node_modules/.bin/eslint --config .eslintrc.js --no-ignore --max-warnings=0 ...e4 fixture/config paths...`                                                                     | Exit 0.                                                                                                                                                                                         |
| Formatting and diff | `node node_modules/.bin/prettier --check ...fixture paths... E4-T2-report.md`; `git diff --check`; staged-index check                                                                | Exit 0. The report is now Prettier-formatted.                                                                                                                                                   |

The Playwright web server is fixture-local (`127.0.0.1:4192`) and exits with
the command. No listener remains, no screenshot baseline enters the repository,
and no package Jest rerun was needed because only fixture HTML/config/runner
and report files changed. Fresh independent review is requested.
