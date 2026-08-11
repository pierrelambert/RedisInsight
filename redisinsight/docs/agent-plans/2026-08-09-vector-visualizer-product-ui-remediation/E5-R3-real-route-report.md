# E5.R3 real RedisInsight route report

Date: 2026-08-10  
Status: DONE  
Commit, stage, push, or ref changes: none

## Environment

- RedisInsight UI: `http://localhost:8080`
- RedisInsight API: `http://localhost:5540`
- Isolated Redis 8.6 Vector Set: `127.0.0.1:6399`, key `vv:knowledge`
- RedisInsight database id: `0203000f-8025-40ab-be0c-07cf3a4c1837`
- Native route: `/0203000f-8025-40ab-be0c-07cf3a4c1837/vector-visualizer`

## Fresh proof

The browser flow used RedisInsight itself: Browser list view, exact `vv:knowledge` key selection, the Vector Set `Visualize` action, and the native Vector Visualizer route. It then sampled 81 live vectors, selected a sampled row, ran one response-backed VSIM neighbor query, verified the radial Neighbors view, switched to Selection while preserving the Atlas and selection, and returned to Atlas.

- Strengthened real-route Playwright: 1/1 passed.
- Complete product UI Playwright with live environment: 9/9 passed.
- Electron renderer production build: `npm run build:renderer` passed after transforming 9,704 modules; existing circular-chunk and chunk-size advisories remain warnings.
- Browser observer allowed only the exact UI and API origins and found no console errors, failed requests, or HTTP error responses on the Vector Visualizer flow.
- Non-baseline screenshot: `/tmp/e5-r3-real-route-1440x900.png`.
- Manual in-app browser proof: Atlas `data-point-count=81`; Neighbors `data-active-mode=neighbors`; Selection `data-selected-count=1` and retained 81 Atlas points.
- Final-audit repair: sampled records with no response-backed score now render `Distance: Unavailable` rather than `Distance: NaN`; the focused inspector Jest suite passed 3/3 and the real-route screenshot was refreshed.

## Boundary

This is the real RedisInsight web development route backed by a real local Redis Vector Set. It proves the product route and live Redis execution. It does not claim a packaged Electron installer or deployment artifact.
