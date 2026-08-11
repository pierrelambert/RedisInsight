# E5.VERIFY2 — fresh independent repair verification

**Verdict: NOT READY — 0 P0, 1 P1.**

Date: 2026-08-08  
Repository: `/private/tmp/redisinsight-vector-visualizer/redisinsight`  
Branch / HEAD: `codex/redis-vector-visualizer` / `0b53c6c2fac260ab2d1b439ee23ea6554d9ce8f4`

## Role, authority, and active residual

- Role: fresh independent verifier; implementation was inspected but never edited.
- Requested provider/model/reasoning: Codex / `gpt-5.6-terra` / medium.
- Actual provider/model/reasoning: runtime exposes Codex but not an exact model or reasoning value; recorded as unknown, not inferred. Inheritance status: inherited execution context; no explicit child override was exposed.
- Routing: verifier is the correct role for a bounded cross-surface repair closure. `gpt-5.6-terra`/medium was requested for this multi-gate repository audit; fallback is this exact finding report, never a repair.
- Ownership: read-only implementation. This report and generated verification artifacts only. No production/test/config/spec/tracker/index/decision/memory/geodata implementation file, dependency, Redis command, commit, stage, push, or deploy was changed.
- Active residual re-anchored to `charter.md`, `00-index.md`, `tracker.md`, `components.md`, `decisions.md`, E5 audit, E5 epic, and the three product/technical/change-delta specifications: independently close F1–F10 and every non-deferred REQ-VV scenario.
- Memory: the required repo anchor/tracker was the source of truth. No agent-memory write was made. RTK `0.39.0` is installed but `rtk gain` fails with database error 14, so raw scoped commands were used.

## Repair and requirement disposition

| Repair / non-deferred requirement surface | Fresh evidence | Result |
| --- | --- | --- |
| F1 documented RESP2 flat-pair and RESP3 Map `VSIM`, binary member preservation, Vector Set facts | `contracts.spec.ts`, native tests, E5 native browser fixture; authoritative Jest | PASS |
| F2 documented layered `VLINKS`, binary source/targets, topology-only label | `advanced.spec.ts`, E4 Advanced browser | PASS |
| F3 `FT.AGGREGATE`/`FT.HYBRID` Workbench activation and executed-result parsing | Workbench Jest and E2.T3 browser test including aggregate/hybrid/profile evidence | PASS |
| F4 radial neighbors, linked distribution/rank/table/inspector, responsive readiness | Query Lab Jest and E2.T3 desktop/mobile browser | PASS |
| F5 response-backed `FT.PROFILE` stages | Workbench Jest and E2.T3 browser profile fixture | PASS |
| F6 linked Atlas, metadata matrix, accessible selection colors | Atlas/Metadata/selection Jest; E3 browser evidence | PASS |
| F7 bounded UMAP neighborhood-quality provenance | worker/provenance Jest; E3 real Worker 2k/20k browser | PASS |
| F8 Health X-ray and shared inspection | Health Jest and E3.T2 browser | PASS |
| F9 manifest drift evidence and explicit measured `VSIM TRUTH` run | Compare/native benchmark Jest, E4.T1 browser, E5 vector-set benchmark screenshot | PASS |
| F10 no third-party font network path and UMAP notice in every focused emitted bundle | E2.T3/E3.T1/E5 emitted assets clean and E5 notices/worker present; E3.T2/E4.T1/E4.T2 emitted CSS remains red | **FAIL-P1** |

The feature continues to distinguish Search from Vector Set: aggregate/hybrid/profile evidence is response-backed; VSIM remains reduced evidence; VLINKS is HNSW adjacency rather than semantic-neighbor truth; Search traversal is unavailable; Atlas calls itself a 2D sampled projection; and native TRUTH is confirmation-gated. No Redis command was executed during this verification.

## P1 finding

### P1 — emitted E3.T2/E4 fixture bundles still make third-party Google font requests

Fresh builds passed, but these emitted CSS bundles still contain `@import` references to `https://fonts.googleapis.com`:

- `../artifacts/playwright/e3-t2-vite/assets/e3t2-BAYbZU8i.css`
- `../artifacts/playwright/e4-t1-vite/assets/e4-t1-BAYbZU8i.css`
- `../artifacts/playwright/e4-t2-vite/assets/e4t2-BAYbZU8i.css`

The builds use the focused configs `vite.e3-t2.config.mjs`, `src/compare/vite.e4-t1.config.mjs`, and `src/advanced/vite.e4-t2.config.mjs`; unlike E2.T3/E3.T1/E5 they do not apply the `sanitizeVectorVisualizerCssAsset` plugin. This violates the F10 closure contract and REQ-VV-008's no-hidden-network-calls condition for the focused emitted artifacts. It is not the protected geodata baseline.

Required closure: apply the existing safe CSS sanitizer (or another reviewed local-font mechanism) to each affected focused artifact, rebuild all E2/E3/E4/E5 configs, and prove zero `fonts.googleapis.com`/`fonts.gstatic.com` references in every emitted `css/js/html` asset while retaining existing output and notices.

## Fresh gate matrix

| Gate | Exact result |
| --- | --- |
| Authoritative all-VV Jest | PASS: package-aware `jest.query-lab.config.cjs`, **27/27 suites, 164/164 tests**, 20.868s |
| Native / feature-off regression | PASS: 7/7 suites, 84/84 tests, 26.758s |
| API feature regression | PASS: 2/2 suites, 15/15 tests, 5.142s; expected logger/open-handle warning |
| E5 native Playwright | PASS: 3/3, 10.1s |
| E2 native Playwright | PASS: 5/5, 7.2s |
| E2 Workbench Playwright | PASS: 3/3, 10.9s (linked selection, aggregate, hybrid, profile, mobile states) |
| E3 renderer Playwright | PASS: 3/3, 11.5s (real Worker and 20,000-point path) |
| E3 Health Playwright | PASS: 1/1, 3.9s |
| E4 Compare Playwright | PASS: 2/2, 1.9s |
| E4 Advanced Playwright | PASS: 2/2, 7.4s |
| Focused E2/E3/E4/E5 Vite builds | PASS: six configs built; real E5 layout worker `layout.worker-BlqvaADz.js` 110.34kB |
| Worker/license/network scans | E5 has `notices/UMAP-JS-LICENSE`, `UMAP-JS-NOTICE.md`, and the Worker; E2.T3/E3.T1/E5 clean; P1 on E3.T2/E4 assets above |
| VV production ESLint | PASS exit 0 |
| VV source-only Prettier | PASS exit 0 |
| E2E TypeScript | PASS exit 0 |
| `git diff --check` / geodata / stage | PASS; no geodata diff and no staged files |
| UI typecheck | Official wrapper reaches comparator baseline failure `There are more TS errors than previously recorded`; its captured log contains **zero** Vector Visualizer path diagnostics. Initial sandbox run was blocked by `tsx` IPC `EPERM`; escalated reruns did not preserve an exit marker in this harness. Therefore baseline-red / zero-VV-path classification is evidence-backed, but raw wrapper exit is environment-harness inconclusive. |

## Superseded/non-product red attempts

- Root-local `node_modules/.bin/jest` does not exist; the worktree's active Jest binary is `../node_modules/.bin/jest`. The corrected authoritative command passed.
- An API Jest attempt added `--runInBand` to a script that already sets `-w 1`; Jest rejected the conflicting worker options. The corrected package script passed.
- A broad Prettier directory command included generated `dist/index.js` and `dist/styles.css` and failed only on those artifacts. The scoped source/config/test-format command passed.
- Shared multi-plugin build remains deliberately unpassed only at protected canonical geodata Leaflet resolution; this verifier preserved that baseline and made no geodata change.

## Visual review

`../artifacts/playwright/e5-t1-vector-set-benchmark-dark-390x844.png` is non-blank and readable at 390x844: dark theme, compatible-manifest drift disclosures, measured Pareto evidence, and explicit `Preview truth benchmark` are visible. It does not show raw embeddings or a default execution action. Browser matrices above supplied the desktop/mobile, light/dark, Workbench, native, renderer, Health, Compare, and Advanced screenshots; no console/network failure was reported by the passing test suites.

## Final status

**NOT READY.** The sole remaining P1 is emitted third-party font references in three focused E3/E4 outputs. All other F1–F9 repairs and the requested executable, browser, scale, safety, source-semantics, native/feature/API, diff, geodata, and privacy checks are freshly evidenced above. No implementation edit was made.
