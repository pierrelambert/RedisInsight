# E1.R1 — Product-UI promotion repair report

STATUS: DONE_WITH_CONCERNS

ROLE: Test Engineer / Implementor

REQUESTED_MODEL: Current task execution context

REQUESTED_REASONING: Current task execution context

ACTUAL_MODEL: unknown

ACTUAL_REASONING: unknown

INHERITED_FROM_COORDINATOR: unknown

ROUTING_REASON: Direct serial repair is the smallest safe route because the
owned Playwright fixture, local Vite server, mock response, and report are
tightly coupled. No subagent was dispatched. RTK was used first for
non-interactive repository commands; raw package-local commands were the
fallback when RTK's filtered output and the root Playwright binary obscured the
required runner/result details.

## Scope

Changed only:

- `tests/e2e-playwright/tests/vector-visualizer/product-ui/e1-t1.product-ui.playwright.spec.ts`
- `tests/e2e-playwright/tests/vector-visualizer/product-ui/e1-t1-fixture.vite.config.mjs`
- this report

No production source, native component, E2/E3 file, plan control, specification,
baseline/snapshot, dependency, index, ref, commit, or remote state was changed.

## Repair

- REQ-VV-012 is a normal green desktop geometry/overflow gate. It proves all
  three stable pane landmarks, exact common top edge, the 200–280 px controls
  band, 280–360 px results band, center width of at least 55%, and no ready-page
  overflow. It does not call `toHaveScreenshot`.
- REQ-VV-013 is a normal green supported-semantics flow. It proves the disabled
  `Filter sampled documents` control and its bounded-unfiltered reason, the
  absence of `Color by`, sample-row selection of `doc:1`, Atlas selection seams,
  Neighbors pre-query truth, the response-backed `doc:neighbor` / `0.13` /
  `FT.SEARCH` result, and Selection row/Canvas/inspector linkage after
  re-establishing a compatible sampled row. Assertions use `data-active-mode`,
  `data-selected-id`, selected-row IDs, and the selected-record inspector; they
  do not rely on the removed visible duplicate mode title.
- REQ-VV-014 and all four REQ-VV-015 cases remain independent expected-product-
  red gates for E4 responsive, theme, state, and baseline approval work. No
  screenshot comparator or baseline was created.
- Both green and expected-red paths run the same observer after the test action.
  It always fails on console/page errors, unexpected outbound origins,
  `requestfailed`, and same-origin `>=400` responses. If a product assertion and
  a signal gate fail together, the harness retains both failures in an
  `AggregateError`; neither masks the other. Vite warnings are collected but do
  not fail the owned-code error gate.
- The E1-owned Vite preview fixture now serves `/favicon.ico` with local HTTP 204. This removes the prior same-origin 404 without broadening an allowlist.

## Verification

The repository root's `npx playwright` selected a different root Playwright
installation than the spec's E2E package import and failed `--list` with the
standard duplicate-runner `test.describe()` diagnostic. The package-local
runner below is the correct runner and was used for every browser result.

- Exit 0 — `node tests/e2e-playwright/node_modules/.bin/playwright test --config tests/e2e-playwright/tests/vector-visualizer/product-ui/e1-t1.product-ui.playwright.config.ts --list`: 8 tests listed, with 7 fixture cases and 1 environment-gated full-app case.
- Exit 0 — `node node_modules/.bin/prettier --check tests/e2e-playwright/tests/vector-visualizer/product-ui/e1-t1.product-ui.playwright.spec.ts tests/e2e-playwright/tests/vector-visualizer/product-ui/e1-t1-fixture.vite.config.mjs redisinsight/docs/agent-plans/2026-08-09-vector-visualizer-product-ui-remediation/E1-R1-report.md`: exact owned test/config/report formatting pass.
- Exit 0 — `node node_modules/.bin/eslint tests/vector-visualizer/product-ui/e1-t1.product-ui.playwright.spec.ts --no-ignore` from `tests/e2e-playwright`: exact E2E harness-spec ESLint pass.
- Exit 0 — `node node_modules/.bin/tsc --noEmit` from `tests/e2e-playwright`: E2E TypeScript pass.
- Exit 0 — `node tests/e2e-playwright/node_modules/.bin/playwright test --config tests/e2e-playwright/tests/vector-visualizer/product-ui/e1-t1.product-ui.playwright.config.ts --grep 'REQ-VV-012|REQ-VV-013'`: 2 normal-green passes in 9.6s.
- Exit 0 — `node tests/e2e-playwright/node_modules/.bin/playwright test --config tests/e2e-playwright/tests/vector-visualizer/product-ui/e1-t1.product-ui.playwright.config.ts --grep 'REQ-VV-014|REQ-VV-015'`: 5 expected-product-red passes in 20.8s.
- Exit 0 — `node tests/e2e-playwright/node_modules/.bin/playwright test --config tests/e2e-playwright/tests/vector-visualizer/product-ui/e1-t1.product-ui.playwright.config.ts --grep 'REQ-VV-012|REQ-VV-013|REQ-VV-014|REQ-VV-015'`: 7 fixture cases, with 2 normal green and 5 expected-product-red, in 22.9s.

The initial sandboxed browser run could not bind the local fixture port
(`listen EPERM`); the scoped elevated reruns above supplied the needed local
listener permission and reached terminal exits. The Vite build reported its
existing chunk-size advisory and Node `NO_COLOR` warning. These are recorded
build/runtime warnings, not clean-browser-product claims.

The E2E package's ESLint project intentionally covers TypeScript files, so its
exact harness-spec check is green. A direct MJS invocation for the Vite fixture
config is not a valid E2E parser-project member and errors before linting; no
lint-config change was made outside this packet. The config itself is included
in the exact Prettier pass above.

## Residual boundaries

- The full RedisInsight route remains skipped unless `E1_REAL_APP_BASE_URL` and
  `E1_REAL_APP_INSTANCE_ID` are supplied; it is environment-gated and unproven.
- REQ-VV-014 and REQ-VV-015 are intentionally not green. Mobile responsive
  access/focus, dark-theme/state fidelity, screenshot-baseline approval, and E4
  implementation remain required.
- Fixture green evidence is not real RedisInsight, Redis, Electron, screenshot
  baseline, or independent visual-audit approval.

FINAL_COUNTS: 2 normal-green fixture cases; 5 expected-product-red fixture
cases; 1 skipped environment-gated full-app case.
