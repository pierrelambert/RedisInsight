# E4.T2 Final Independent Review — Workbench Query Lab refinement

STATUS: DONE_WITH_FINDINGS

SPEC_COMPLIANCE: NOT APPROVED

CODE_QUALITY: APPROVED_WITH_BOUNDARIES

VISUAL_FIDELITY: NOT APPROVED

VERDICT: NOT APPROVED

CONFIDENCE: High

## Scope and routing

ROLE: Fresh independent Reviewer / Auditor

REQUESTED_MODEL: `gpt-5.6-terra`

REQUESTED_REASONING: high

ACTUAL_MODEL: `gpt-5.6-terra`

ACTUAL_REASONING: high

INHERITED_FROM_COORDINATOR: no

ROUTING: A fresh high-reasoning UI audit is appropriate because this task
combines plugin capability limits, desktop geometry, browser behavior, and
product-fidelity evidence. I used read-only source/spec inspection, focused
Jest and Vite commands, and local fixture Playwright/Chromium measurement. The
fallback was raw local inspection when the sandbox prohibited a loopback Vite
listener; the listener commands were elevated solely for the local fixture.

OWNERSHIP: This reviewer created only this report. No source, test, spec,
tracker, ledger, baseline, staged content, commit, ref, or remote state was
changed. The checkout is intentionally broad-dirty; unrelated tracked and
untracked work was preserved.

## Contract applied

RedisInsight is a desktop Electron application. `desktop/config.json` declares
the supported minimum window as `960x680`; mobile drawers, overlays, mobile
navigation, and a mobile acceptance size are out of scope. This review does
not require or suggest a mobile layout.

The Workbench view is intentionally capability-reduced. It must remain a
response-backed Query Lab rather than imply native Atlas/UMAP sampling,
unsupported PCA/t-SNE, a sample greater than 20,000, a new host command, or
native-page parity. It still must provide compact desktop product hierarchy:
dominant usable response evidence and a persistent linked result inspector in
the actual iframe viewport, not merely in a full-page capture.

## Evidence reviewed

- Charter, index, tracker, decisions, capability ledger, re-verification
  report, visual/product/technical specifications and deltas, E3/E4 reports
  and reviews, E4.T2 task/report, desktop config, and reference asset README.
- Current Workbench source, tests, fixture, Vite config, package boundary,
  Query Lab evidence/selection components, SDK binding, and current Git state.
- The supplied non-baseline worker screenshots at original size:
  `/tmp/vector-visualizer-e4-t2-light-1440x900.png` and
  `/tmp/vector-visualizer-e4-t2-dark-960x680.png`.

Both images are full-page images, not viewport images: respectively
`1440x1075` and `960x1075`. They make below-the-fold content appear present
and cannot establish compact supported-desktop iframe fidelity.

## Fresh verification

| Check                                                                                                                                                                           | Result                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `node node_modules/.bin/jest --runTestsByPath .../QueryLab.spec.tsx .../main.spec.tsx -c redisinsight/ui/src/packages/vector-visualizer/jest.config.cjs --runInBand --no-cache` | Exit 0: 2 suites, 33 tests.                                                                                                                                                                                                    |
| `npm test --prefix redisinsight/ui/src/packages/vector-visualizer -- --runInBand`                                                                                               | Exit 0: 25 suites, 177 tests.                                                                                                                                                                                                  |
| `node node_modules/.bin/vite build --config .../QueryLab/vite.e4-t2.config.mjs`                                                                                                 | Exit 0: 3,409 modules in 5.21s. The only output concern is Vite's standard chunk-size advisory.                                                                                                                                |
| Local fixture Playwright with its nested dependency and E4.T2 config                                                                                                            | Exit 0: 3 passed in 3.8s (1440x900 light, 960x680 dark, empty/failed). It proves clean happy/state paths, but its geometry covers only horizontal fit and it saves `fullPage: true` screenshots.                               |
| Scoped ESLint and Prettier over owned source/tests/fixture/config                                                                                                               | Exit 0.                                                                                                                                                                                                                        |
| Package `npm run typecheck`                                                                                                                                                     | Exit 2: 279 diagnostics in 51 existing dependency/shared files. A fresh owned-location query found zero diagnostics in `main` or `query-lab/QueryLab`; this is not an aggregate green claim.                                   |
| Source scans                                                                                                                                                                    | No direct `@redis-ui/*` import, mobile/drawer/overlay implementation, PCA/t-SNE, greater-than-20k sampling claim, native Atlas/sampling implementation, or screenshot-baseline approval token in the owned presentation paths. |
| SDK/read-only inspection                                                                                                                                                        | `main.tsx` only obtains the existing host binding. Query Lab renders the executed response; it does not invoke `executeRedisCommand` or issue an additional Redis command.                                                     |
| `git diff --check`; staged-index check                                                                                                                                          | Exit 0; index empty.                                                                                                                                                                                                           |

Fresh Chromium signal collection at both desktop viewport sizes observed zero
console errors, page errors, failed requests, and HTTP 4xx/5xx responses. The
exact temporary fixture listener on `127.0.0.1:4192` was stopped after review;
no review listener remains.

## Fresh viewport geometry

The desktop horizontal hierarchy is correct:

| Viewport       | Workspace | Evidence | Inspector | Horizontal overflow |
| -------------- | --------: | -------: | --------: | ------------------- |
| 1440x900 light |    1376px | 836.92px |  523.08px | none                |
| 960x680 dark   |     896px | 541.53px |  338.47px | none                |

Vertical geometry is not acceptable for this compact desktop iframe:

| Viewport       | Document height / viewport | Workspace and evidence bounds | Material distribution bounds |
| -------------- | -------------------------- | ----------------------------- | ---------------------------- |
| 1440x900 light | 1075px / 900px             | y=286.38–1042.94              | y=721.16–1025.94             |
| 960x680 dark   | 1075px / 680px             | y=286.38–1042.94              | y=721.16–1025.94             |

At the minimum desktop size, scrolling to the distribution moves the inspector
to y=-108.63–216.94. The linked table/inspector is therefore no longer fully
present while material response evidence is read. The browser test's
`toBeVisible()` assertions and `fullPage: true` screenshots mask this rather
than prove viewport usability.

## Findings

### P1 — Ready Query Lab is a vertically overflowing document, not a compact persistent desktop workspace

`QueryLab.styles.ts:7-36` gives the shell and grid no available-block-size
contract or bounded internal scrollport. `QueryLab.tsx:199-374` places the
radial evidence, distribution, and rank-gap controls into one unbounded
evidence column, while the inspector is a normal adjacent grid item at
`:375-425`. Consequently the ready fixture produces a 1075px document at both
supported heights. At `960x680`, the material distribution begins at y=721.16,
below the iframe viewport; the rank-gap controls are farther below. The
full-page screenshot in `e4-t2.playwright.cjs:64-67` conceals the failure, and
its assertions at `:39-57` inspect only widths and horizontal overflow.

This violates the visual contract's compact, desktop operator hierarchy and
the task's requirement for dominant evidence with a persistent linked results
inspector. It is not a request for a mobile adaptation. The repair should keep
the existing two-column desktop grid, reserve the available iframe block size,
and use intentional internal scrolling/compaction so the active evidence and
complete inspector/table remain usable in the 1440x900 and 960x680 viewport.
The repair test must use viewport screenshots (`fullPage: false`) plus numeric
vertical containment/scroll assertions for the radial evidence, material
distribution or its focused control, table, and inspector; it must also prove
keyboard focus scrolls the appropriate internal region without losing the
linked inspector.

P0: None.

P2: None.

## Semantics and code-quality assessment

- The response hierarchy is materially improved: the radial evidence is
  response-backed, selected rows synchronize with the virtualized table and
  inspector, metric distance/score values and exactness remain labelled, and
  angle is explicitly layout-only.
- Search provenance and the reduced Vector Set profile stay honest. Missing
  threshold/source-sample facts render as unavailable instead of fabricated
  evidence.
- `main.tsx` explicitly explains why Atlas is unavailable in Workbench and
  states that the response-only view issues no additional Redis commands.
  Activation/SDK, safe redaction, error boundary, and read-only boundaries are
  preserved.
- Light/dark rendering, keyboard table selection, and empty/failed main
  states pass in the local actual-plugin fixture. No screenshot baseline was
  created, updated, or approved.

## Residual boundaries

- This was a local actual-plugin fixture, not a live Workbench frame, a real
  Redis query, Electron window, deployment, native route, or final approved
  screenshot comparison. Those remain E5 proof boundaries.
- The package aggregate type-check is non-green for the recorded unrelated
  diagnostics; scoped owned paths are clean but do not supersede that result.
- The focused Vite fixture build passes, while the shared multi-plugin build
  remains outside this task and historically stops in protected Geodata.

E4.T2 needs the single bounded desktop-vertical repair above, followed by a
fresh independent review with zero P0/P1, before E5 verification can begin.
