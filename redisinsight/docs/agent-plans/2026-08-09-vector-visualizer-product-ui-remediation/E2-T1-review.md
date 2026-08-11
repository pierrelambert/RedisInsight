# E2.T1 — Independent controls review

Date: 2026-08-10  
Reviewer role: independent Verifier/Auditor (read-only)

## Scope and evidence

- Reviewed the E2.T1 task, charter/index/components/decisions/tracker, visual contract and product/technical specification requirements, all preserved PNG references, E1 accepted RED harness, E2.T1 report, repository frontend/testing guidance, and all five files in `VectorVisualizerControls/**`.
- Inspected the actual internal wrappers: `RiSelect`, `NumericInput`, `SwitchInput`, `TextInput`, `FormField`, and the existing native page state/capability context.
- Ownership is intact: the controls directory is untracked/new and `VectorVisualizerPage.tsx` is likewise untracked as part of pre-existing work; no tracked diff or staged change attributes a page edit to E2.T1. No source, test, plan, ref, staging, or commit mutation was made by this review.
- Fresh focused evidence:
  - `rtk proxy node node_modules/.bin/jest redisinsight/ui/src/pages/vector-visualizer/components/VectorVisualizerControls/VectorVisualizerControls.spec.tsx -c jest.config.cjs` — exit 0; 6/6 passed.
  - `rtk proxy npx eslint <the five owned controls files>` — exit 0.
  - `git diff --no-index --check /dev/null <each owned file>` — exit 0 for all five files.
- No broad aggregate gate was rerun.

## SPEC_COMPLIANCE

### Findings

1. **P1 — enabled controls can be inert because the typed controlled contract makes their callbacks optional.** `VectorVisualizerControlSelect.onChange`, `VectorVisualizerFilterControl.onChange`, `VectorVisualizerSampleBudget.onChange`, and `VectorVisualizerVisibilityControl.onChange` are all optional in `VectorVisualizerControls.types.ts:5-46`. The corresponding controls are only disabled from their separate `disabled` fields and are passed those optional callbacks directly at `VectorVisualizerControls.tsx:95-102`, `108-115`, `144-151`, `175-182`, and `40-45`. Thus an E3 caller can supply an enabled value/options model with no callback, yielding a control that presents as supported but cannot change state. This violates the E2.T1 typed controlled-props and supported/disabled truthfulness contract; it cannot be left to an integration convention.

2. **P2 — the filter contract has no syntax-help representation.** The normative visual contract requires a filter input, syntax help, and removable chips. The exposed filter type contains value, placeholder, callbacks, chips, and state only (`VectorVisualizerControls.types.ts:20-29`); rendering provides only the field and chip list (`VectorVisualizerControls.tsx:105-133`). This is evidence-honest for the current planned unfiltered integration (E2.T1 report says E3 should omit or disable filtering), but the reusable API cannot satisfy the required syntax-help treatment if/when a response-backed filter is passed. Add a text/link/tooltip-capable syntax-help field before enabling a filter.

3. **P2 — the required both-theme semantic test is not a semantic assertion.** The dark test merely asserts that the landmark exists after mounting (`VectorVisualizerControls.spec.tsx:158-162`). It neither verifies a theme-dependent semantic color/token nor an accessible contrast/state difference. The style implementation does use semantic tokens (`VectorVisualizerControls.styles.ts:8-12`, `33-40`), so this is an evidence gap rather than a claim that dark rendering is broken.

### Positive checks

- Presentational scope is preserved: there is no Redis command, sampling, or orchestration call in the component; the existing page retains the bounded 500–20,000 state and UMAP seed 42 (`VectorVisualizerPage.tsx:71-75`, `594-603`, `692-728`).
- Stable desktop landmark and accessible name are present (`VectorVisualizerControls.tsx:244-253`); the mobile trigger/body exposes `aria-controls`, `aria-expanded`, and a caller-owned panel id (`255-280`).
- Source/context, optional filter/chips/color, UMAP-only disclosure, bounded budget, optional cluster/outlier controls, and summary fields are implemented. Unsupported filter behavior is represented by `disabledReason`, consistent with the present native manifest's fixed search expression and absent Vector Set filter (`nativeManifest.ts:97-100`).
- No PCA/t-SNE or over-20,000 budget claim is introduced. The production component uses internal `uiSrc` wrappers, semantic theme tokens, layout primitives, no `!important`, and no hardcoded pixel dimensions.

## CODE_QUALITY

### Findings

1. **P2 — direct Redis UI package import in an owned file.** `VectorVisualizerControls.spec.tsx:3` imports `themesDefault` directly from `@redis-ui/styles`, contrary to the E2.T1 “no direct `@redis-ui/*`” boundary. Use the project test/render theme facility or an internal theme wrapper instead.

2. **P2 — callback coverage is narrower than the reported control contract.** The focused suite exercises only chip removal and the panel trigger (`VectorVisualizerControls.spec.tsx:120-156`), not source, filter typing, color-by, sample budget, or visibility-toggle callback forwarding. That makes the report's generic callback claim incomplete. Add focused interaction assertions for each distinct wrapped callback shape when repairing P1.

## Residual integration requirements

- Repair P1 before E3: either require callbacks whenever a control is enabled, or derive `disabled` plus a useful reason when no callback exists. Preserve explicit disabled reasons for unsupported native behavior.
- E3 must continue to connect only existing response-backed state: bounded 500–20,000 sample budget, UMAP seed 42, unfiltered sampling/filter unsupported explanation, discovered color options only, and no generic cluster/outlier visibility claim without response-backed behavior.
- E3/E4 own actual drawer focus return. The exported trigger/body contract is a composable starting point, not proof of mobile close/return behavior.
- Add filter syntax help before a supported filter is wired; strengthen light/dark semantic evidence and callback tests; replace the direct `@redis-ui/styles` test import.

## VERDICT

**NOT APPROVED.** One P1 contract defect allows enabled controls to be inert, so the presentational surface cannot yet guarantee the evidence-honest supported/disabled behavior required for integration. The component's layout/semantic direction and focused gate results are otherwise sound; repair the listed findings and request a fresh independent review before E3 consumes the API.
