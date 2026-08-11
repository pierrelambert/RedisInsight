# E1.T1 Independent Review — Visual Acceptance Harness

STATUS: NOT APPROVED

SPEC_COMPLIANCE: NOT APPROVED

CODE_QUALITY: NOT APPROVED

CONFIDENCE: High

REQUESTED_MODEL: gpt-5.6-terra

REQUESTED_REASONING: medium

ACTUAL_MODEL: unknown

ACTUAL_REASONING: unknown

INHERITED_FROM_COORDINATOR: no

ROUTING_REASON: Bounded independent review of a two-file Playwright harness. The requested explicit Terra/medium route is acceptable for multi-file, repository-specific acceptance-contract judgment; no implementation was performed. Command shape: RTK-wrapped read-only Git, ripgrep, and file inspection. Fallback: same model at high reasoning only if specification ambiguity prevented a verdict; not needed.

ANCHORS_READ:

- `tasks/E1-T1-visual-acceptance.md`
- `E1-T1-report.md`
- `charter.md`
- `00-index.md`
- `components.md`
- `decisions.md`
- `capability-ledger.md`
- `docs/specs/2026-08-09-redis-vector-visualizer-visual-contract.md`
- `docs/specs/2026-08-09-redis-vector-visualizer-visual-fidelity-delta.md`
- amended `docs/specs/2026-08-07-redis-vector-visualizer-{product,technical}-spec.md`
- repository Playwright configuration, existing Vector Visualizer Playwright fixtures, and `$playwright-test`

ACTIVE_RESIDUAL: Product visual fidelity remains unaccepted. E1 must provide a valid RED harness only; it does not establish product implementation, full-route proof, approved visual baselines, or a final visual verdict.

EVIDENCE:

- Reviewed the two owned untracked harness files and the implementer report. The worktree has no staged E1 files; the only E1 implementation files are under the task allowlist, and the only plan artifact is the required report.
- Read-only `git diff --check -- tests/e2e-playwright/tests/vector-visualizer/product-ui` was clean. The implementer-recorded list/config, formatting, lint, E2E TypeScript, and focused expected-RED results were not rerun because no contradiction required rerun.
- The fixture processes only `source` and `theme` query parameters (`e5-t1.fixture.tsx:15-20`), while the harness requests `state=loading|empty|error` (`e1-t1.product-ui.playwright.spec.ts:139-142`).

FINDINGS:

1. P1 | `tests/e2e-playwright/tests/vector-visualizer/product-ui/e1-t1.product-ui.playwright.spec.ts:96-109` | REQ-VV-013 requires preserved source, filter, color field, and selection plus synchronized plot/table/inspector/active-mode title. This test only clicks Neighbors and Selection and checks two inspector strings. It can turn green while selection/context is discarded on every mode switch. | Add a deterministic context-and-selection setup, switch across all three modes, and assert the same source/filter/color/selected ID in the canvas, linked row/inspector, and active-mode title. | The test must fail if a mode switch clears any compatible context or breaks bidirectional selection linkage, and pass only when all three modes preserve it.
2. P1 | `tests/e2e-playwright/tests/vector-visualizer/product-ui/e1-t1.product-ui.playwright.spec.ts:132-143`; `redisinsight/ui/src/pages/vector-visualizer/e5-t1-fixture/e5-t1.fixture.tsx:15-20` | The loading/empty/error URL setup has no fixture implementation. Once the first missing landmark is added, these assertions will fail because the fixture never consumes `state`, making the failure a harness/fixture defect rather than the intended product-fidelity RED. | Use a valid product interaction/state seam, or obtain explicit ownership to extend the deterministic fixture with a state protocol and prove each state reaches its requested condition before the landmark/screenshot assertions. | Each named state must be demonstrably entered through valid setup, then produce only a contract-fidelity RED until the product implementation exists.
3. P2 | `tests/e2e-playwright/tests/vector-visualizer/product-ui/e1-t1.product-ui.playwright.spec.ts:25-40` | `observePage` records console errors, page errors, and cross-origin requests, but never records `requestfailed` or failed same-origin responses. A failed native asset/API request can therefore pass the claimed clean browser/network gate. | Record `requestfailed` and relevant unsuccessful responses (or document an intentional status allowlist) alongside outbound-origin checking. | The observer must fail for a failed required request and for an unexpected outbound request, while keeping documented benign requests explicit.

FAILED_GATES:

- REQ-VV-013 full context/selection-linkage encoding is absent.
- REQ-VV-015 representative non-ready-state setup is not valid for the fixture.
- Required network-failure observation is incomplete.

BLOCKER_DISPOSITION: No external blocker. Dispatch a bounded E1 repair within the test allowlist; if fixture state injection is needed, the coordinator must explicitly extend ownership before that separate change. Do not treat fixture-only evidence as real-route proof and do not approve screenshot baselines.

NEXT_ACTION: Repair the three findings, rerun the task's focused list/config, formatting, lint, TypeScript, expected-RED classification, and diff-check gates, then request a fresh independent E1 review. Preserve the full-app route as environment-gated and unproven.

NO_WRITE_PROOF: No source, test, spec, plan-control, configuration, or Git-state changes were made by this review. The sole write is this required review report: `redisinsight/docs/agent-plans/2026-08-09-vector-visualizer-product-ui-remediation/E1-T1-review.md`.
