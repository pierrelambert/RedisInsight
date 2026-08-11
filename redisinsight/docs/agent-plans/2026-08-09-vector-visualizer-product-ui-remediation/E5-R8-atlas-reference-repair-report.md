# E5.R8 Atlas reference repair report

Date: 2026-08-10

Status: DONE - locally verified, fresh independent audit pending

## User correction

The live Atlas still missed the preserved brainstorm/reference quality bar:

- `Color by` needed to list available response-backed scalar fields instead of using the temporary free-text workaround.
- Atlas points needed response-backed semantic colours and cluster labels like the reference.
- UMAP is the only supported projection in v1, so a Projection menu must not appear.
- Sampled rows must follow the compact RedisInsight inspector pattern and must not show meaningless repeated scores before a query supplies response-backed scores.

## Implementation scope

- Search-index sampling now discovers scalar metadata fields from `FT.INFO` and exposes them to the native page.
- Vector Set sampling preserves live response-backed metadata fields, including the extra JSON escaping returned by the RedisInsight RAW CLI path.
- Native controls now render `Color by` as a field selector populated from discovered scalar fields. Before sampling it is disabled with the truthful discovery reason.
- Atlas renders response-backed semantic colours, UMAP axis labels, and bounded cluster labels when a selected metadata field has categorical values.
- The UMAP-only Projection menu is absent; UMAP and seed remain evidence in the sampling summary.
- The right inspector keeps the compact sampled-elements table and omits non-query scores.
- Native-host and product UI acceptance tests were updated to the current selector/list contract.
- Typed styled-component wrappers were repaired so the Vector Visualizer-owned paths no longer add aggregate TypeScript diagnostics.

## Fresh evidence

- Product UI Playwright with live RedisInsight route:
  `E1_REAL_APP_BASE_URL=http://localhost:8080 E1_REAL_APP_API_ORIGIN=http://localhost:5540 E1_REAL_APP_INSTANCE_ID=0203000f-8025-40ab-be0c-07cf3a4c1837 E1_REAL_APP_VECTOR_SET_KEY=vv:knowledge rtk proxy node tests/e2e-playwright/node_modules/.bin/playwright test --config tests/e2e-playwright/tests/vector-visualizer/product-ui/e1-t1.product-ui.playwright.config.ts`
  -> 9 passed.
- Native-host Playwright:
  `rtk proxy node tests/e2e-playwright/node_modules/.bin/playwright test --config tests/e2e-playwright/tests/vector-visualizer/e5-t1-native-host.playwright.config.ts`
  -> 3 passed.
- Native Jest:
  `rtk proxy node node_modules/.bin/jest redisinsight/ui/src/pages/vector-visualizer -c jest.config.cjs --runInBand`
  -> 13 suites / 84 tests passed.
- Vector Visualizer package Jest:
  `rtk proxy npm test --prefix redisinsight/ui/src/packages/vector-visualizer -- --runInBand`
  -> 25 suites / 182 tests passed.
- Scoped ESLint and Prettier passed for the changed native, package, and E2E files.
- E2E TypeScript passed from `tests/e2e-playwright`.
- Aggregate `npm run type-check` remains a non-pass with 1,311 existing diagnostics in non-Vector-Visualizer package dependency/baseline areas. The final diagnostic output contains no Vector Visualizer-owned path.

## Screenshot evidence

- `/tmp/e5-r8-atlas-reference-repair-1440x900.png`
- `/tmp/e5-r8-atlas-reference-repair-960x680.png`
- `/tmp/e5-r8-atlas-real-route-1440x900.png`

## Boundaries

- No screenshot baseline was approved or updated.
- No commit, push, PR, deployment, dependency, backend contract, CI, or build-config change was made.
- Shared package build remains bounded by the protected Geodata `leaflet` dependency issue and is not claimed green.
- Packaged Electron/deployment proof remains outside this repair.
- A fresh independent audit is required before restoring an audited promotion claim.
