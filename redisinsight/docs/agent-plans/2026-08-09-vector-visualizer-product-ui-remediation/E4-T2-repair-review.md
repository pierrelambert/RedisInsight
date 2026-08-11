# E4.T2 Repair Review — Workbench Query Lab

STATUS: DONE_WITH_FINDINGS

SPEC_COMPLIANCE: NOT APPROVED

CODE_QUALITY: NOT APPROVED

VISUAL_FIDELITY: APPROVED_WITH_BOUNDARIES

VERDICT: NOT APPROVED

CONFIDENCE: High

## Scope and contract

ROLE: Fresh independent Reviewer / Auditor

REQUESTED_MODEL: `gpt-5.6-terra`

REQUESTED_REASONING: high

ACTUAL_MODEL: `gpt-5.6-terra`

ACTUAL_REASONING: high

INHERITED_FROM_COORDINATOR: no

ROUTING: A fresh high-reasoning review is appropriate because this is a
desktop product-fidelity and browser-signal gate over a capability-reduced
internal plugin. I performed read-only contract/source review, focused tests,
Vite build, actual local-fixture Playwright/Chromium checks, and a manual
Playwright CLI review. The sandbox cannot bind loopback listeners; I used an
elevated, loopback-only `127.0.0.1:4192` fixture and then stopped it.

OWNERSHIP: This reviewer created only this report. No source, test, spec,
tracker, ledger, baseline, staged content, commit, ref, or remote state was
changed. The protected broad-dirty checkout was preserved.

RedisInsight is a desktop Electron application. `desktop/config.json` sets the
supported minimum to `960x680`; mobile drawers, overlays, mobile navigation,
and mobile visual acceptance are out of scope. This review neither requires
nor proposes mobile behavior.

The Workbench plugin remains intentionally capability-reduced: a
response-backed Query Lab, not native Atlas/UMAP sampling. Atlas, PCA, t-SNE,
sampling above 20,000, new Redis commands, duplicate domain state, and a
Workbench/native parity claim remain absent.

## Evidence reviewed

- Charter, index, tracker, decisions, capability ledger, re-verification,
  product/technical/visual specs and delta, reference asset README, E3/E4
  reports and reviews, E4.T2 task/report, and desktop configuration.
- Current Workbench `main`, Query Lab presentation/evidence/selection source,
  fixture, Playwright configuration, package tests, Vite configuration, SDK
  boundary, Git index/status, and the supplied non-baseline screenshots.
- Current local review images:
  `/tmp/vector-visualizer-e4-t2-light-1440x900.png` and
  `/tmp/vector-visualizer-e4-t2-dark-960x680.png`.

## Fresh verification

| Check                                                             | Result                                                                                                                                                                                                                                                                               |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Focused Jest: `QueryLab.spec.tsx` + `main.spec.tsx`               | Exit 0: 2 suites, 33 tests.                                                                                                                                                                                                                                                          |
| Package Jest                                                      | Exit 0: 25 suites, 177 tests.                                                                                                                                                                                                                                                        |
| Focused Vite fixture build                                        | Exit 0: 3,409 modules in 5.32s. Only Vite's standard chunk-size advisory.                                                                                                                                                                                                            |
| Local fixture Playwright                                          | Exit 0: 3 tests in 3.8s: `1440x900` light, `960x680` dark, and empty/failed states. It asserts vertical/horizontal containment, internal evidence scrolling, fixed inspector bounds, keyboard selection, and viewport-only non-baseline screenshots.                                 |
| Manual Playwright CLI at `960x680` dark, initial unscrolled state | Workspace `x=32`, `y=274.375`, `896x373.625`; evidence `507.531x306.438`; inspector `338.469x373.625`; document height exactly `680`; evidence scroll range `713/306`, `scrollTop=0`. Initial radial evidence and the persistent returned-results table are both visibly accessible. |
| Scoped ESLint over owned source/tests/fixture/config              | Exit 0.                                                                                                                                                                                                                                                                              |
| Scoped Prettier over owned source/tests/fixture/config            | Exit 0.                                                                                                                                                                                                                                                                              |
| Package typecheck                                                 | Exit 2 with 279 diagnostics in 51 existing dependency/shared files. Fresh owned-location query returned none for `src/main` or `src/query-lab/QueryLab`; this is not an aggregate green claim.                                                                                       |
| Static capability scan                                            | No owned presentation hit for mobile/drawer/overlay, PCA/t-SNE, `>20k` sampling, `sample(`, `executeRedisCommand(`, screenshot-baseline approval, or direct `@redis-ui/*` import. `prefers-reduced-motion` remains an accessibility preference, not mobile behavior.                 |
| Diff/index                                                        | `git diff --check` exit 0; staged index empty.                                                                                                                                                                                                                                       |

The temporary Vite listener and the manual Playwright CLI browser were both
closed after review.

## Visual assessment

The original P1 is closed. The revised shell uses the viewport as its bounded
desktop block, and both evidence and inspector stay within it. The initial
`960x680` dark view is a compact, readable two-column operator surface: radial
response evidence is visible at the top, results remain persistent at right,
and detailed distribution/rank-gap material has intentional evidence-column
scrolling. The light `1440x900` review image retains the same hierarchy.

The result does not imply unsupported Atlas sampling or native-page equivalence.
The persistent explicit message correctly says that Workbench Atlas is
unavailable because the SDK cannot provide bounded cancellable sampling and
that this response-only view sends no additional Redis commands.

## Findings

### P1 — The fixture's claimed clean-browser proof is false: `/favicon.ico` returns 404

The current fixture document at `e4-t2.html:1-21` declares no local favicon,
and the Vite configuration at `vite.e4-t2.config.mjs:9-59` does not provide
one. Fresh manual Chromium/Playwright CLI at the actual local fixture URL
observed:

```text
ERROR Failed to load resource: the server responded with a status of 404
http://127.0.0.1:4192/favicon.ico
```

The same manual browser also reports two Vite `rawproto` externalized-`fs`
warnings; they are an existing dependency/browser-bundling boundary rather
than an E4.T2 product-source error, but cannot be represented as a clean
warning-free browser in this fixture.

`e4-t2.playwright.cjs:57-64` begins signal collection correctly, but its final
`expect(unexpectedResponses).toEqual([])` at `:131-133` occurs without waiting
for the asynchronous favicon request. Thus its three passing tests do not
prove the stated clean browser/network condition. This is a P1 against the
explicit E4.T2 clean-browser acceptance gate, not a request for a mobile
adaptation. Repair it in owned fixture/config/test scope (for example, supply
the fixture's local favicon and make the observer deterministically wait for
settled same-origin browser responses); then re-run a fresh desktop review.

### P2 — The worker report is not formatted

`node_modules/.bin/prettier --check .../E4-T2-report.md` exits 1. This does not
affect the delivered runtime, but contradicts the report's claimed formatting
evidence. Keep the repair limited to the report when correcting it.

P0: None.

## Residual boundaries

- The proof is a local actual-plugin fixture, not a live Workbench frame,
  real Redis query, Electron window, deployment, native product route, or
  approved final screenshot comparison. Those remain E5 boundaries.
- Aggregate package TypeScript remains non-green only for the recorded
  non-owned diagnostics. The shared multi-plugin build remains outside this
  task and historically stops in protected Geodata.
- No screenshot baseline was created, updated, approved, or added to the
  repository.

The compact desktop layout repair is accepted visually, but the clean-browser
signal P1 must be repaired and freshly re-reviewed before E4.T2 can be
accepted and E5 can begin.
