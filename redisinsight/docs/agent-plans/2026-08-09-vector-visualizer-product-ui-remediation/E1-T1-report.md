# E1.T1 Visual Acceptance Harness Report

STATUS: DONE_WITH_CONCERNS

ROLE: Implementor / Test Engineer

REQUESTED_MODEL: gpt-5.6-terra

REQUESTED_REASONING: medium

ACTUAL_MODEL: unknown

ACTUAL_REASONING: unknown

INHERITED_FROM_COORDINATOR: no

ROUTING_REASON: This is a multi-file real-route acceptance harness with repo-specific Vite startup, visual-contract classification, and evidence boundaries. The requested Terra-medium route was the explicit available route; execution occurred directly as a single file-disjoint packet after routing review, with RTK for non-interactive commands.

ANCHORS_READ:

- `charter.md`
- `00-index.md`
- `components.md`
- `decisions.md`
- `capability-ledger.md`
- `tracker.md`
- `reverification-report.md`
- `tasks/E1-T1-visual-acceptance.md`
- visual contract, visual-fidelity delta, amended product and technical specifications, reference-assets README, and existing Vector Visualizer Playwright harnesses

ACTIVE_RESIDUAL: Technical/capability and bounded PR-readiness approvals remain historical and scoped. Product visual fidelity is not accepted: the native surface lacks proof of the normative compact three-pane workspace, connected product modes, responsive panel access, and approved visual regression baselines.

FILES_CHANGED:

- `tests/e2e-playwright/tests/vector-visualizer/product-ui/e1-t1.product-ui.playwright.config.ts`
- `tests/e2e-playwright/tests/vector-visualizer/product-ui/e1-t1.product-ui.playwright.spec.ts`
- `redisinsight/docs/agent-plans/2026-08-09-vector-visualizer-product-ui-remediation/E1-T1-report.md`

## Harness coverage

- A dedicated config builds and starts the existing E5 native-component Vite fixture on `127.0.0.1:4196`, without changing the global Playwright configuration.
- Fixture tests use stable, future integration landmarks: `vector-visualizer-controls`, `vector-visualizer-visualization`, and `vector-visualizer-results-inspector`.
- REQ-VV-012 asserts the 1440x900 one-row geometry, 200–280 px controls, 280–360 px inspector, 55% center width, and no ready-state document overflow.
- REQ-VV-013 encodes linked Atlas, Neighbors, and Selection inspector context.
- REQ-VV-014 encodes 390x844 controls/results access and focus restoration after each close.
- REQ-VV-015 declares named screenshot assertions for desktop themes, modes, mobile panels, and loading/empty/error states. No baseline was created or approved: current RED assertions stop before a screenshot could be compared.
- Every route test installs console, page-error, and unexpected-network observation. Those clean-signal assertions are a future green gate; they are not claimed as completed while the current fidelity preconditions are RED.

## Full-app route boundary

The deterministic E5 fixture mounts the real `VectorVisualizerPage`, but it is **fixture evidence only**, not final real RedisInsight route proof. The suite separately encodes `/:instanceId/vector-visualizer` and requires both `E1_REAL_APP_BASE_URL` and `E1_REAL_APP_INSTANCE_ID`. Neither environment variable was supplied, so the full-app leg is intentionally skipped and remains **unproven/environment-gated**, not passing evidence. E5 must run it against a reproducible application/instance context.

## Expected RED classification

The focused run reaches the mounted native page and its sample flow, then fails at the absent `vector-visualizer-controls` landmark. Playwright records this intentional `test.fail` case as a passing expected failure (exit 0). This is REQ-VV-012 product-fidelity RED evidence, not a harness/startup/route/fixture defect. The adjacent expected-RED cases map as follows:

| Requirement | Current missing contract surface | Disposition |
| --- | --- | --- |
| REQ-VV-012 | Named three-pane landmarks, bounded desktop row, and overflow proof | Expected product-fidelity RED |
| REQ-VV-013 | Connected Atlas/Neighbors/Selection product-mode tabs and persistent inspector context | Expected product-fidelity RED |
| REQ-VV-014 | Mobile controls/results entry points and focus-return behavior | Expected product-fidelity RED |
| REQ-VV-015 | Stable visual-state landmarks and deliberately reviewed screenshot baselines | Expected product-fidelity RED |

VERIFICATION_RUN:

1. `rtk proxy lsof -nP -iTCP:4196 -sTCP:LISTEN` (exit 0; no listener before verification)
2. `rtk proxy npx playwright test --config tests/vector-visualizer/product-ui/e1-t1.product-ui.playwright.config.ts --list` (exit 0; five tests listed)
3. `rtk proxy npx prettier --check tests/vector-visualizer/product-ui/e1-t1.product-ui.playwright.config.ts tests/vector-visualizer/product-ui/e1-t1.product-ui.playwright.spec.ts` (exit 0)
4. `rtk proxy npx eslint tests/vector-visualizer/product-ui/e1-t1.product-ui.playwright.config.ts tests/vector-visualizer/product-ui/e1-t1.product-ui.playwright.spec.ts` (exit 0)
5. `rtk proxy npx tsc --noEmit` from `tests/e2e-playwright` (exit 0)
6. `rtk proxy npx playwright test --config tests/vector-visualizer/product-ui/e1-t1.product-ui.playwright.config.ts --grep REQ-VV-012` (exit 0; one expected failure, reported by Playwright as `1 passed`)
7. `rtk proxy git diff --check -- tests/e2e-playwright/tests/vector-visualizer/product-ui` (exit 0)

VERIFICATION_RESULT: Configuration/list parsing, scoped Prettier, ESLint, E2E TypeScript, focused fixture startup/navigation/sample flow, and owned-file whitespace checks pass. The single RED run correctly reaches the intended absent fidelity landmark and is classified as an expected failure. Full-app route proof, screenshot baseline approval, clean console/network proof past RED preconditions, and the remaining three expected-RED flows are not green and must not be promoted as accepted visual fidelity.

BLOCKERS: No implementation blocker. The only evidence blocker is absent reproducible full-app RedisInsight route context (`E1_REAL_APP_BASE_URL` and `E1_REAL_APP_INSTANCE_ID`), plus the intentionally unimplemented visual-contract surfaces.

BLOCKER_DISPOSITION: blocked for environment

ASSUMPTIONS:

- The E5 native fixture remains a valid deterministic mount for pre-integration RED acceptance coverage but is not final real-route evidence.
- E2–E4 will add the named landmark and responsive/product-mode contracts without changing the E1 suite's ownership boundary.
- No screenshot baseline may be generated or approved until a human reviews an implementation matching the preserved reference assets.

NEXT_ACTION: Dispatch E2.T1–E2.T3 after independent E1 review. E3/E4 should turn these known RED cases green; E5 must supply a reproducible full-app URL and instance, execute the environment-gated route leg, review screenshot baselines, and independently verify all REQ-VV-011 through REQ-VV-015.

Commit allowed: no

## 2026-08-10 independent-review repair evidence

STATUS: DONE_WITH_CONCERNS

### Review closure 1 — REQ-VV-013 context and selection linkage

`e1-t1.product-ui.playwright.spec.ts` now prepares deterministic native-page state before it reaches an intentionally missing product landmark: it samples the Search source, assigns the existing metadata/color-equivalent field to `region`, samples again, selects `doc:1`, and proves the current linked selection status contains that ID. The future product assertions then switch `Atlas -> Neighbors -> Selection` and require, for every mode, the same Search source, `region:eu` filter, `region` color field, selected ID, selected linked result row, inspector content, and active-mode title. Any compatible-context reset or broken row/inspector linkage therefore fails the test.

### Review closure 2 — REQ-VV-015 valid non-ready-state seam

The E5 fixture itself remains untouched. An owned product-ui Vite configuration remounts that same real `VectorVisualizerPage` entry while aliasing only the test-local `apiService` and slice hooks. The mock consumes the supported test query seam `state=loading|empty|error` through the normal native sample requests:

- `loading`: the request remains pending, and the test first proves `Sampling vectors...` is rendered;
- `empty`: the fixture returns an empty `FT.SEARCH` response, and the test first proves `No vectors were returned...` is rendered;
- `error`: the fixture rejects the request, and the test first proves `Sampling could not complete...` is rendered.

Only after each valid state proof does the test request the future visual-state landmark and screenshot assertion. No screenshot baseline was generated or approved.

### Review closure 3 — network-quality observation

`observePage` now fails on console/page errors, outbound requests, `requestfailed` events, and same-origin responses with status `>=400`. The benign same-origin status allowlist is explicit and currently empty; adding a benign exception requires an intentional, reviewable entry. This retains the original unexpected-outbound-origin gate.

### Repair verification

1. `rtk proxy npx prettier --write tests/vector-visualizer/product-ui/e1-t1.product-ui.playwright.config.ts tests/vector-visualizer/product-ui/e1-t1.product-ui.playwright.spec.ts tests/vector-visualizer/product-ui/e1-t1-fixture.vite.config.mjs tests/vector-visualizer/product-ui/e1-t1-fixture/mocks/slicesHooks.mock.ts tests/vector-visualizer/product-ui/e1-t1-fixture/mocks/services.mock.ts` (exit 0)
2. `rtk proxy npx playwright test --config tests/vector-visualizer/product-ui/e1-t1.product-ui.playwright.config.ts --list` (exit 0; five tests listed)
3. Scoped `rtk proxy npx prettier --check ...`, `rtk proxy npx eslint ...`, and `rtk proxy npx tsc --noEmit` from `tests/e2e-playwright` (all exit 0)
4. First focused `--grep REQ-VV-013` attempt (exit 1): the new owned Vite config had an incorrect relative import; corrected directly within the allowlist.
5. One bounded post-repair `--grep REQ-VV-013` attempt: Vite build and preview startup succeeded, and Playwright launched one Chromium worker. The execution transport returned before a test result and left only the identified test-owned preview listener (`node` PID 52057 on `127.0.0.1:4196`); it was stopped with `rtk proxy kill 52057`. No retry was performed.
6. After the repair, repeated list/config parsing, scoped Prettier, scoped ESLint, and E2E TypeScript all exited 0. `rtk proxy git diff --check -- tests/e2e-playwright/tests/vector-visualizer/product-ui redisinsight/docs/agent-plans/2026-08-09-vector-visualizer-product-ui-remediation/E1-T1-report.md` was clean for tracked paths; the owned files remain untracked and show no whitespace diagnostics.

### Repair proof boundary

The repaired source encodes all three review closures and the Vite build reaches browser launch, but the final expected-RED result for REQ-VV-013 and the focused REQ-VV-015 state run are **not proven in this session** because the browser execution transport ended without a result and was bounded without retry. This is an environment/tooling verification concern, not a green result. The full-app route remains separately environment-gated and unproven.

BLOCKERS: Browser-run result collection is unavailable after a successful local build/start/worker launch; the exact test-owned listener was stopped. No product, fixture, global-config, or Git-state boundary was crossed.

BLOCKER_DISPOSITION: blocked for environment

NEXT_ACTION: A fresh reviewer should inspect the three repair closures and rerun `REQ-VV-013` plus `REQ-VV-015` once in a stable local Playwright execution environment, then request a new independent E1 review. Do not approve baselines or promote fixture-only evidence to full-route proof.

## 2026-08-10 final bounded harness repair

### Coordinator evidence incorporated

The coordinator reran the repaired focused suite in a stable elevated session. That command exited 1 because REQ-VV-013 waited for 60 seconds at a future-tab `locator.click`; this was a true harness failure. The same run established that the REQ-VV-015 state seam was valid: its expected failure was reported as `1 passed`.

### Final repair closures

1. **Fast expected-red controls:** REQ-VV-013 now explicitly asserts future `Atlas`, `Neighbors`, and `Selection` tab visibility before each click; REQ-VV-014 does the same for each open/close panel trigger. Missing future controls therefore fail through the normal expectation timeout and are recognized by `test.fail`, rather than timing out in Playwright actionability polling.
2. **Actual future filter setup:** the context flow now waits for the future controls landmark, fills `Filter` with Redis Search syntax `@region:{eu}`, fills `Color by` with `region`, performs sampling, selects `doc:1` from the future linked result row, and then asserts those exact filter/color/source/selection values after every mode switch. The existing allow-listed metadata field is retained only to create a deterministic current-fixture sample and is not represented as a filter.
3. **Independent REQ-VV-015 cases:** dark-theme Atlas, loading, empty, and error are four standalone expected-red tests. Each state test proves the normal native status first (`Sampling vectors`, `No vectors were returned`, or `Sampling could not complete`) before it reaches the absent future visual-state landmark. One missing landmark can no longer prevent the other valid state seams from executing. No baseline was generated or approved.
4. **Origin comparison:** request/response quality checks now compare parsed URL origins rather than prefix strings, while still recording failed requests and same-origin `>=400` responses.

### Final verification

1. `rtk proxy npx playwright test --config tests/vector-visualizer/product-ui/e1-t1.product-ui.playwright.config.ts --list` (exit 0; eight tests listed)
2. Scoped `rtk proxy npx prettier --check ...`, `rtk proxy npx eslint ...`, and `rtk proxy npx tsc --noEmit` from `tests/e2e-playwright` (all exit 0)
3. `rtk proxy npx playwright test --config tests/vector-visualizer/product-ui/e1-t1.product-ui.playwright.config.ts --grep 'REQ-VV-013|REQ-VV-014|REQ-VV-015'` (exit 0; six selected expected-red cases; Playwright reported `6 passed (27.2s)`). The context, responsive-trigger, dark-theme, loading, empty, and error cases all reached intentional product-contract RED assertions without a harness timeout.
4. `rtk proxy lsof -nP -iTCP:4196 -sTCP:LISTEN` after the run (exit 0; no listener)
5. `rtk proxy git diff --check -- tests/e2e-playwright/tests/vector-visualizer/product-ui redisinsight/docs/agent-plans/2026-08-09-vector-visualizer-product-ui-remediation/E1-T1-report.md` (exit 0)

VERIFICATION_RESULT: The reviewed harness defects are closed with fresh static and focused-browser evidence. The six final browser cases are expected product-fidelity RED evidence, not harness failures. The full application route still has no supplied URL/instance context, and approved screenshot baselines remain intentionally absent; neither is represented as passing proof.

BLOCKERS: Only the pre-existing full-app environment gate remains (`E1_REAL_APP_BASE_URL` and `E1_REAL_APP_INSTANCE_ID`).

BLOCKER_DISPOSITION: blocked for environment

NEXT_ACTION: Request a fresh independent E1 review. E2–E4 may consume this valid RED acceptance harness; E5 must later run the full-app leg and approve baselines through deliberate visual review.

## 2026-08-10 rereview P1 repair

### Closure 1 — future selection establishes the linked context

`prepareLinkedContext` no longer clicks the legacy fixture `Select doc:1` control or asserts the legacy `Selected IDs` status. It now performs only deterministic sampling and metadata setup. `configureFutureContext` waits for the future controls landmark, fills `Filter` with `@region:{eu}` and `Color by` with `region`, samples, waits for the future result row, clicks that row, and proves its selected state. This is the only test action that establishes `doc:1` before the Atlas/Neighbors/Selection persistence checks.

### Closure 2 — browser-signal gates cannot be masked by expected RED

All expected-red tests, including the dynamically enabled full-app route, now run through `expectProductFidelityRed`. The wrapper captures a product-fidelity assertion failure, runs the console/pageerror/outbound/requestfailed/same-origin-response gate unconditionally, and calls `test.fail` only when that gate is clean. A signal failure is therefore thrown without expected-failure annotation; if both failures occur, an `AggregateError` preserves both. A fidelity assertion that unexpectedly passes also fails without expected-red annotation.

The observer still compares parsed origins and uses an explicit empty benign same-origin status allowlist. The duplicate controls-trigger visibility assertion is absent.

### Final repair verification

1. `rtk proxy npx playwright test --config tests/vector-visualizer/product-ui/e1-t1.product-ui.playwright.config.ts --list` (exit 0; eight tests listed, including seven fixture expected-red cases)
2. Scoped `rtk proxy npx prettier --check ...`, `rtk proxy npx eslint ...`, and `rtk proxy npx tsc --noEmit` from `tests/e2e-playwright` (all exit 0)
3. One required combined command: `rtk proxy npx playwright test --config tests/vector-visualizer/product-ui/e1-t1.product-ui.playwright.config.ts --grep 'REQ-VV-012|REQ-VV-013|REQ-VV-014|REQ-VV-015'`. It launched seven tests and the captured output shows REQ-VV-012, REQ-VV-013, and REQ-VV-014 each failing rapidly at the intended expected-red assertion (5.8–5.9 seconds, not a 60-second actionability timeout). The execution transport returned before the final runner summary, so this report does **not** claim unseen REQ-VV-015 results or a final exit code. No listener remained on `127.0.0.1:4196` after the command.

### Proof boundary

The two rereview P1 code-paths are repaired and the first three combined-run cases demonstrate the intended no-action-timeout classification. The final transport did not provide completion evidence for all seven selected tests; a fresh independent reviewer must run the same single command in a stable result-collection session before approving that exact execution gate. No screenshot baseline was generated or approved, and the full-app route remains environment-gated and unproven.

BLOCKERS: Focused-run result collection ended before a final summary despite the preview listener being cleaned up.

BLOCKER_DISPOSITION: blocked for environment

NEXT_ACTION: Fresh independent rereview should inspect the future-row selection and unconditional observer wrapper, then rerun the specified seven-case command once with stable result collection. Do not promote fixture-only evidence or approve baselines.

## 2026-08-10 final P3 cleanup check

The current owned `configureFutureContext` contains exactly one `Color by` assignment (`fill('region')`), followed by the distinct `Color by` persistence assertion in `expectLinkedContext`; there is no consecutive duplicate assignment to remove. The required setup was preserved unchanged rather than deleting the sole assignment.

- `rtk rg -n -C 3 "Color by" tests/e2e-playwright/tests/vector-visualizer/product-ui/e1-t1.product-ui.playwright.spec.ts` confirmed one fill and one assertion.
- `rtk proxy npx prettier --check tests/vector-visualizer/product-ui/e1-t1.product-ui.playwright.spec.ts` (exit 0)
- `rtk proxy npx eslint tests/vector-visualizer/product-ui/e1-t1.product-ui.playwright.spec.ts` (exit 0)
- `rtk proxy git diff --check -- tests/e2e-playwright/tests/vector-visualizer/product-ui redisinsight/docs/agent-plans/2026-08-09-vector-visualizer-product-ui-remediation/E1-T1-report.md` (exit 0)

No Playwright command was run for this P3-only check.

## 2026-08-10 coordinator seven-case proof

The coordinator independently ran the complete focused acceptance command from
`tests/e2e-playwright` after the two rereview repairs:

`npx playwright test --config tests/vector-visualizer/product-ui/e1-t1.product-ui.playwright.config.ts --grep 'REQ-VV-012|REQ-VV-013|REQ-VV-014|REQ-VV-015'`

The command exited 0. Playwright executed all seven fixture cases and reported
`7 passed (32.6s)` as expected product-fidelity failures. REQ-VV-012,
REQ-VV-013, REQ-VV-014, and the dark-theme REQ-VV-015 case each failed at the
intended missing future assertion in 5.7–5.9 seconds; the loading, empty, and
error cases each completed in 597–625 ms. This closes the earlier incomplete
runner-output concern without creating or approving screenshot baselines.
