# T7 report — deduplicate capability types and safe color fallback

## Outcome

- Compared the three local declarations with `contracts.ts`: `VectorSourceCapabilities` and `LayoutJobV1` are identical; `VectorVisualizerHostAdapter` is structurally compatible with the canonical contract, which additionally exposes optional native-workspace handoff.
- Removed the duplicate declarations, imported the canonical types for local use, and re-exported them from `capabilityProof.ts` to preserve package-local import compatibility.
- `parseColor` now returns `[0.5, 0.5, 0.5, 1.0]` for unsupported formats. RGB vertex buffers deliberately retain only the first three channels, preserving the existing shader input contract.
- Added focused `oklch(...)` and `var(--x)` assertions for the exact fallback.

## Files changed

- `ui/src/packages/vector-visualizer/src/capabilityProof.ts`
- `ui/src/packages/vector-visualizer/src/renderer/AtlasRenderer.ts`
- `ui/src/packages/vector-visualizer/src/renderer/AtlasRenderer.spec.ts`

## Verification

| Command | Exit | Classification |
| --- | ---: | --- |
| `npm run type-check` from `redisinsight/ui` | 0 | Passed with no emitted diagnostics; zero owned-path diagnostics and no baseline diagnostics were emitted. |
| `npm test --prefix ui/src/packages/vector-visualizer -- --runInBand` | 0 | Passed: 24 suites, 165 tests, including the new unsupported-color coverage. |
| `rg -c '^export (interface|type) (VectorSourceCapabilities|LayoutJobV1|VectorVisualizerHostAdapter)' ui/src/packages/vector-visualizer/src/capabilityProof.ts` | 0 | No matching duplicate exported interface/type declarations. |

The initial `npm run type-check` at the nested repository root exited 1 because that package has no `type-check` script; the required UI type-check above is the applicable gate and passed. No staging, commit, push, fetch, rebase, deployment, or Redis command occurred.

## Blockers

None.
