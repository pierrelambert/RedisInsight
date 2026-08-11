# E5.T2 independent verification report

Date: 2026-08-08

## Scope and disposition

Requested runtime: Codex / gpt-5.6-terra / medium; runtime exposes no actual provider, model, or reasoning value; inherited: no. Role: fresh read-only verifier. Routing reason: broad command-driven evidence collection; fallback is exact blocker evidence only. Ownership was this report and generated verification artifacts. No implementation, tracker, memory, Redis, dependency, staging, commit, push, or deployment write occurred.

Re-anchored residual: E5.T1 is done, and independently fresh E5 verification is required before E5.AUDIT. **Disposition: READY FOR E5.AUDIT.** The narrow fixture repair has independent closure evidence below; no E5.T2 P0/P1 remains. This is evidence sufficiency for a fresh audit, not a delivery-approval verdict.

Environment: `/private/tmp/redisinsight-vector-visualizer`, branch `codex/redis-vector-visualizer`, base `0b53c6c2f`; Node v25.9.0; Chromium HeadlessChrome/148.0.7778.96. RTK 0.39.0 was available but its gain database could not open; raw commands were used where direct exit/error evidence was mandatory.

## Fresh command matrix

| Gate                          | Exact command / result                                                                                                     | Duration / evidence                                                                                                                                                                                                                                                                               |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| All VV Jest files             | `rg --files ...                                                                                                            | xargs node node_modules/.bin/jest -c jest.config.cjs --runInBand --runTestsByPath`                                                                                                                                                                                                                | **FAIL**, 1/24 suite failed, 23 passed; 140 passed tests. `main.spec.tsx` cannot resolve `redisinsight-plugin-sdk` from `workbenchSdk.ts`; 18.583 s. |
| Native-only subset            | `node node_modules/.bin/jest redisinsight/ui/src/pages/vector-visualizer -c jest.config.cjs --runInBand`                   | PASS, 4 suites/28 tests, 5.612 s.                                                                                                                                                                                                                                                                 |
| Historical native/feature-off | explicit seven Search list, Vector Set detail, plugin/route/feature suites                                                 | PASS, 7 suites/80 tests, 11.325 s; pre-existing React DOM warnings printed.                                                                                                                                                                                                                       |
| API feature flags             | `npm test --prefix redisinsight/api -- <two feature specs>`                                                                | PASS, 2 suites/15 tests, 5.365 s; expected logger output and Jest open-handle warning.                                                                                                                                                                                                            |
| UI typecheck                  | `npm run type-check --prefix redisinsight/ui`                                                                              | Sandbox attempt blocked at tsx IPC socket. Elevated rerun completed with no emitted diagnostics, but raw exit was not exposed by the wrapper; coordinator must retain its known baseline-red classification and re-run with an exit-preserving shell before audit. No VV diagnostic was observed. |
| VV production ESLint          | explicit non-test TS/TSX file list with `eslint --no-ignore --no-cache`                                                    | PASS, 7.175 s. Default ESLint ignores package files; test-inclusive `--no-ignore` is invalid because package test files are outside UI tsconfig.                                                                                                                                                  |
| Prettier                      | `prettier --check` on VV paths                                                                                             | PASS, 1.078 s.                                                                                                                                                                                                                                                                                    |
| Focused E5 Vite               | `node node_modules/.bin/vite build --config .../vite.e5-t1.config.mjs`                                                     | PASS, 3,417 modules, 5.45 s; real `layout.worker-5-U7jR9_.js` (109.22 kB), standard large chunk warning.                                                                                                                                                                                          |
| Shared plugin Vite            | `npm run build --prefix redisinsight/ui/src/packages`                                                                      | BLOCKED/expected baseline: fails in 34 ms resolving protected canonical geodata `leaflet/dist/leaflet.css`, before VV build. No geodata change made.                                                                                                                                              |
| E2E TypeScript                | `npm run type-check --prefix tests/e2e-playwright`                                                                         | PASS, 1.140 s.                                                                                                                                                                                                                                                                                    |
| E5 native Chromium            | from `tests/e2e-playwright`: `npx playwright test --config tests/vector-visualizer/e5-t1-native-host.playwright.config.ts` | PASS, 3/3, 9.9 s: Search light 1440x900, Vector Set dark 390x844, cancel/ACL.                                                                                                                                                                                                                     |
| E2.T2 native Chromium         | matching local config                                                                                                      | PASS, 5/5, 7.3 s.                                                                                                                                                                                                                                                                                 |
| E3 renderer/Health Chromium   | E3.T1 then E3.T2 local configs                                                                                             | PASS, 3/3 (12.2 s), 1/1 (4.1 s); fresh UMAP artifacts report 2k layout 1606.70 ms and 20k layout 8696.40 ms.                                                                                                                                                                                      |
| E4 Compare Chromium           | E4.T1 local config                                                                                                         | PASS, 2/2, 2.0 s.                                                                                                                                                                                                                                                                                 |
| Workbench Chromium            | E2.T3 local config                                                                                                         | **FAIL**, 1/2 failed, 1 passed, 4.1 s: `504 (Outdated Optimize Dep)` and `Failed to fetch dynamically imported module: http://127.0.0.1:4179/src/main.tsx`.                                                                                                                                       |
| Advanced Chromium             | E4.T2 local config                                                                                                         | BLOCKED after Vite reported unresolved `redisinsight-plugin-sdk` from `workbenchSdk.ts`; no passing result was produced in this fresh correctly-invoked run.                                                                                                                                      |
| Diff / geodata                | `git diff --check`; geodata-name scan                                                                                      | PASS: no whitespace errors; geodata scan empty. Worktree remains intentionally dirty with feature files and generated artifacts.                                                                                                                                                                  |

## Findings

### P1 — package plugin import is not resolvable by the repository Jest harness

Reproduction: run the all-VV Jest command above. `ui/src/packages/vector-visualizer/src/main.spec.tsx` fails before its three assertions because `jest.config.cjs` ignores package paths and has no `redisinsight-plugin-sdk` mapper. The E5.T1 report’s declared `jest.query-lab.config.cjs` focused harness must be re-run and its exact passing configuration preserved; this report does not treat the repository-harness failure as masked.

### P1 — Workbench ready-state browser proof fails

Reproduction: from `tests/e2e-playwright`, run `npx playwright test --config tests/vector-visualizer/e2-t3.playwright.config.ts`. The ready test observes six Vite errors including 504 stale optimized dependencies and a failed dynamic import. The empty/failure mobile test passes. Closure requires a fresh 2/2 browser result with no console/network error evidence.

### P1 — Advanced browser proof is incomplete

The correct local E4.T2 run reached Vite import analysis failure for `redisinsight-plugin-sdk` in `workbenchSdk.ts`; it did not produce a fresh passing result. This overlaps the unresolved plugin-resolution boundary but remains a separately missing required proof.

## Privacy, network, dependency, and visual review

Static scans found no feature-source direct `@redis-ui` import, `console.log`/`console.debug`, `fetch`, `XMLHttpRequest`, or `WebSocket`. Write verbs occur only in rejection tests and the explicit Workbench read-only rejection regex (`DEL|UNLINK|SET|HSET|JSON.SET|VADD|VSETATTR`), not executable accepted paths. No source/metric/topology/profile parity inference was found in this scan. Local manifest storage remains explicitly local-only; report must not infer a fully complete privacy proof while blocked browser/plugin gates remain.

Dependency inventory is restricted to approved `umap-js@1.4.0` in `ui/src/packages/package.json` and its lockfile transitive ML packages (`is-any-array`, `ml-array-max`, `ml-array-min`, `ml-array-rescale`, `ml-levenberg-marquardt`); no installation was run. License verification needs the lockfile/package metadata audit in the repair/audit task.

Fresh screenshots were visually inspected: `artifacts/playwright/e5-t1-search-light-1440x900.png` shows an honest Search unavailable topology/profile disclosure; `artifacts/playwright/e5-t1-vector-set-dark-390x844.png` shows dark mobile layout, VLINKS labelled HNSW adjacency rather than semantic neighbors, and reduced Vector Set profile. Both are non-blank and readable.

## Requirement evidence gap

REQ-VV-001 through REQ-VV-010 retain E5.T1 mapping, but REQ-VV-002, REQ-VV-007, REQ-VV-008, and REQ-VV-010 lack a fully fresh Workbench/Advanced no-error proof. The E5.AUDIT must not approve those requirements until the P1s close and raw typecheck exit/residual classification is preserved.

## Repair verification — 2026-08-08

The preceding red evidence is retained as historical evidence from the first E5.T2 pass. This section supersedes its three P1 dispositions after a narrow fixture-only repair; it does not erase the original reproductions.

### Routing and ownership

- Role: fresh independent Verifier.
- Requested provider/model/reasoning: Codex / gpt-5.6-terra / medium.
- Actual provider/model/reasoning: not exposed by the runtime.
- Inherited: no.
- Command shape: direct raw-exit verification; Playwright commands serialized because each owns a strict local preview port.
- Ownership: this report plus normal generated evidence only.
- Fallback: exact failed gate and evidence; no implementation repair authority.

### Closure command matrix

| Gate                               | Exact command                                                                                                                                                                                                                                         | Raw result                                                                                                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Authoritative all-VV Jest          | `rg --files redisinsight/ui/src/packages/vector-visualizer redisinsight/ui/src/pages/vector-visualizer                                                                                                                                                | rg '\.spec\.(ts                                                                                                                                                     | tsx)$' | sort | xargs node node_modules/.bin/jest -c redisinsight/ui/src/packages/vector-visualizer/jest.query-lab.config.cjs --runTestsByPath --runInBand --silent` | **PASS**, exit 0; 24/24 suites, 143/143 tests, 0 snapshots; 19.398 s. |
| Workbench repaired browser fixture | From `tests/e2e-playwright`: `npx playwright test --config tests/vector-visualizer/e2-t3.playwright.config.ts`                                                                                                                                        | **PASS**, exit 0; 2/2 Chromium, 9.1 s. Phase 3 linked selection plus mobile empty/failure states passed.                                                            |
| Advanced repaired browser fixture  | From `tests/e2e-playwright`: `npx playwright test --config tests/vector-visualizer/e4-t2.playwright.config.ts`                                                                                                                                        | **PASS**, exit 0; 2/2 Chromium, 7.6 s; light 1440x900 and dark 390x844.                                                                                             |
| E2E TypeScript                     | `npm run type-check --prefix tests/e2e-playwright`                                                                                                                                                                                                    | **PASS**, exit 0.                                                                                                                                                   |
| Repair-file Prettier               | `npx prettier --check redisinsight/ui/src/packages/vector-visualizer/vite.e2-t3.config.mjs redisinsight/ui/src/packages/vector-visualizer/src/advanced/vite.e4-t2.config.mjs tests/e2e-playwright/tests/vector-visualizer/e2-t3.playwright.config.ts` | **PASS**, exit 0.                                                                                                                                                   |
| Diff whitespace                    | `git diff --check`                                                                                                                                                                                                                                    | **PASS**, exit 0.                                                                                                                                                   |
| Protected geodata diff             | `git diff --name-only -- redisinsight/ui/src/packages/geodata`                                                                                                                                                                                        | **PASS**, exit 0 and empty output.                                                                                                                                  |
| Official UI typecheck              | Unwrapped `npm run type-check --prefix redisinsight/ui` in a resumable elevated terminal                                                                                                                                                              | **BASELINE FAIL**, raw exit 1. Comparator reports 1,311 residual errors; zero path references to `src/pages/vector-visualizer` or `src/packages/vector-visualizer`. |

### Typecheck residual classification

The official typecheck remains red only on repository baseline/package dependency paths reported by the comparator:

- `src/packages/clients-list/**`: unresolved `redisinsight-plugin-sdk`.
- `src/packages/geodata/**`: unresolved Leaflet types and consequent implicit-any diagnostics.
- `src/packages/redisearch/**`: unresolved `redisinsight-plugin-sdk`.
- `src/packages/redisgraph/**`: unresolved `react-json-tree` and `redisinsight-plugin-sdk`, with consequent implicit-any diagnostics.
- `src/packages/redistimeseries-app/**`: unresolved Plotly and `redisinsight-plugin-sdk` types.
- `src/packages/ri-explain/**`: unresolved AntV and `redisinsight-plugin-sdk` types, with consequent implicit-any diagnostics.

The comparator terminates with `Error: There are more TS errors than previously recorded`; no reported diagnostic belongs to either Vector Visualizer production path. This is a known unrelated repository baseline and is not reclassified as a feature pass.

### Repaired harness inspection

- Both Playwright configs use `vite build` followed by `vite preview`, readiness URLs, `reuseExistingServer: false`, and fixed loopback ports with `--strictPort`.
- Workbench readiness is `http://127.0.0.1:4179/e2-t3.html`; Advanced readiness is `http://127.0.0.1:4184/src/advanced/e4-t2.html`.
- Both focused Vite configs alias `redisinsight-plugin-sdk` to the real internal package `ui/src/packages/redisinsight-plugin-sdk/index.js`; no SDK stub was introduced.
- No `waitForTimeout`, fixed sleep, or timer-based readiness workaround exists in the repaired config/Vite files.

### Supersession and final E5.T2 disposition

- The prior generic-root Jest 23/24 result is **invalid non-authoritative package-harness evidence**, not a product P1. The required package-aware 24-path command passes 24/24 and 143/143.
- The prior Workbench Vite optimized-dependency failure is **superseded** by the independent build-preview 2/2 pass.
- The prior Advanced missing-SDK-alias blocker is **superseded** by the independent 2/2 pass using the real internal SDK alias.
- No P0/P1 remains from E5.T2. Evidence is sufficient to dispatch a fresh E5.AUDIT; only that auditor may issue the delivery verdict.
