# E5.R1 — Remove obsolete mobile acceptance

Status: ready  
Role: Implementor / Test Engineer  
Route: `gpt-5.4`, medium reasoning  
Commit: prohibited

## Goal

Make every active Vector Visualizer Playwright scenario honor RedisInsight's Electron desktop contract: reference desktop, intermediate desktop, and configured minimum `960x680`. Remove all runnable `390x844` and mobile acceptance; do not replace it with drawers, overlays, or mobile behavior.

## Ownership

- `tests/e2e-playwright/tests/vector-visualizer/e2-t3.playwright.spec.ts`
- `tests/e2e-playwright/tests/vector-visualizer/e3-t1.playwright.spec.ts`
- `tests/e2e-playwright/tests/vector-visualizer/e5-t1-native-host.playwright.spec.ts`
- Matching Vector Visualizer Playwright config files only if necessary
- `E5-R1-desktop-test-inventory-report.md`

Do not touch native or plugin product source, current `product-ui/**`, specs, tracker, ledger, decisions, build files, dependencies, or baselines.

## Acceptance

- Replace mobile labels, viewports, and artifact names with supported desktop evidence, using `960x680` for minimum-window cases.
- Preserve the scenario's semantic coverage and clean browser-signal assertions.
- `rg -n -i "390x844|390×844|mobile|drawer|overlay" tests/e2e-playwright/tests/vector-visualizer -g '*.{ts,tsx,cjs,mjs,html}'` has no active test match.
- Relevant Playwright `--list`, nested E2E TypeScript, ESLint, Prettier, and focused browser scenarios pass.
- No staging, commit, push, ref, dependency, baseline, or unrelated dirty-tree change.

