# E1.T1 Independent Rereview — Visual Acceptance Harness

STATUS: NOT APPROVED

SPEC_COMPLIANCE: NOT APPROVED

CODE_QUALITY: NOT APPROVED

VERDICT: NOT APPROVED

CONFIDENCE: High

ROLE: Independent Reviewer / Auditor

ROUTING: Direct high-risk review. `agent-delegation-routing` selects the Auditor/Verifier role for acceptance-contract and browser-seam claims; no worker was dispatched, no inherited-worker ambiguity was introduced, and no implementation was performed. RTK-prefixed read-only Git, ripgrep, and file-inspection commands were used. Fallback was raw read-only shell inspection if RTK changed command semantics; no fallback was needed.

OWNERSHIP: This review created only this file. No source, test, fixture, plan anchor, index, tracker, capability ledger, Git index, ref, commit, or remote state was changed.

ANCHORS AND CONTRACTS READ:

- `charter.md`, `00-index.md`, `components.md`, `decisions.md`, `capability-ledger.md`, `tracker.md`, `reverification-report.md`, and `tasks/E1-T1-visual-acceptance.md`;
- `E1-T1-report.md` and the first independent `E1-T1-review.md`;
- the full visual contract, visual-fidelity delta, amended 2026-08-07 product and technical specifications, and reference-assets README;
- repository `AGENTS.md`, E2E README/test plan, repository E2E-testing guidance, and `$playwright-test`; and
- every current file in `tests/e2e-playwright/tests/vector-visualizer/product-ui/**`, plus the existing native E5 fixture/page required to assess the owned local state seam.

## Worktree and evidence boundary

The worktree is on `codex/redis-vector-visualizer`, behind `origin/main` by three commits, with broad protected modified/untracked Vector Visualizer work and no staged files. The five E1 harness files are untracked and confined to `tests/e2e-playwright/tests/vector-visualizer/product-ui/**`; no E1 screenshot/baseline artifact exists. The pre-existing E5 fixture is also untracked, but the E1 state seam aliases only E1-owned mock modules and does not edit that fixture. Current Git state cannot establish historical authorship of other protected untracked files; this rereview found no E1 change outside the reported test allowlist.

`git diff --check -- tests/e2e-playwright/tests/vector-visualizer/product-ui redisinsight/docs/agent-plans/2026-08-09-vector-visualizer-product-ui-remediation/E1-T1-report.md` was clean. The reported static gates and six expected-red browser cases were assessed as worker evidence and were not rerun: static inspection found no contradiction to their reported process result, and this review is not permitted to turn fixture-only expected-red evidence into green/full-route proof.

## Findings

1. P1 — REQ-VV-013 does not select `doc:1` through the future results surface, so it does not prove the required future product-control/result linkage. `prepareLinkedContext` selects the document through the legacy fixture button (`e1-t1.product-ui.playwright.spec.ts:114-120`). After the future controls re-sample, `configureFutureContext` first requires the future row already be selected and only then clicks it (`e1-t1.product-ui.playwright.spec.ts:122-132`). The current native sampling implementation clears selection on every sample (`redisinsight/ui/src/pages/vector-visualizer/VectorVisualizerPage.tsx:705-710`), confirming that the required flow is not encoded as “set filter, color-by, sample, select `doc:1` in the future result, then preserve that selection.” A future implementation could make the row preselected or preserve a stale legacy selection and pass without proving result-row-to-plot/inspector synchronization. Repair by selecting `doc:1` from the future result row after the future filter/color sample, then assert the selected row, canvas/plot selection, inspector detail, source/filter/color values, and active-mode title after Atlas, Neighbors, and Selection transitions. Closure requires failure when the future result-row selection does not drive each linked surface.

2. P1 — The clean console/page/network gate is not exercised by any expected-red case. `observePage` records console errors, page errors, outbound origins, `requestfailed`, and same-origin HTTP failures (`e1-t1.product-ui.playwright.spec.ts:25-57`), but its returned assertions are invoked only at the end of each test (`:157`, `:181`, `:207`, `:217`, `:228`, `:244`). Each intentional missing-landmark assertion throws before that line, and `test.fail` merely classifies the thrown failure; it does not resume execution. Consequently the six reported expected-red passes do not fail for an unexpected console/page/network failure that occurs before the product-fidelity RED. Repair by making observer verification run in a `finally`/after-each path that preserves the expected-red classification, or by separately asserting clean signals before the deliberate missing-landmark assertion. Closure requires an injected observer failure to fail the expected-red test rather than be masked by the intended contract failure.

No P0 or P2 findings.

## Closure assessment

- The state seam is now valid and independent: the E1-owned mock reads `state=loading|empty|error` and drives normal native sample requests, while each test proves the native status before its future-fidelity assertion (`e1-t1-fixture/mocks/services.mock.ts:58-82`; `e1-t1.product-ui.playwright.spec.ts:95-112`, `:220-229`).
- Missing future tabs and mobile triggers are asserted visible before clicks (`e1-t1.product-ui.playwright.spec.ts:167-178`, `:189-205`), so the repaired expected-red controls no longer rely on 60-second actionability timeouts.
- Screenshot names are declarations only. No snapshot is present in the E1 directory, and the suite reaches screenshot assertions only after the intentionally absent fidelity landmarks. No baseline is approved.
- The full RedisInsight route remains dynamically skipped unless both `E1_REAL_APP_BASE_URL` and `E1_REAL_APP_INSTANCE_ID` are supplied (`e1-t1.product-ui.playwright.spec.ts:232-245`). It is environment-gated and unproven, not passing evidence.
- The local Vite config’s state aliases and all added test/mocks are within E1 ownership; this rereview found no E1 production or pre-existing-fixture edit.

## Residual proof boundaries

The harness is fixture-only RED evidence until E2–E4 implement the product landmarks and E5 runs the real application route with a reproducible instance. Approved visual baselines, reference-image comparison, real-route geometry/overflow, clean browser signals on a green product flow, real Redis/Electron behavior, and final independent visual audit remain unproven. The two P1 repairs are required before E1 can serve as a reliable RED acceptance harness.

NEXT ACTION: Repair the two P1 findings only within `tests/e2e-playwright/tests/vector-visualizer/product-ui/**`, rerun the specified scoped list/format/lint/E2E-TypeScript and expected-red classification gates, then request another fresh independent review. Do not approve baselines or promote the fixture leg to full-route evidence.
