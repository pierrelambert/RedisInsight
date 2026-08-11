# T7 — Deduplicate capabilityProof types and add parseColor fallback

Role/provider: Implementor / Codex. Requested `gpt-5.4` medium; dispatch `gpt-5.6-terra` medium, non-inherited. Commit allowed: no.

Own `capabilityProof.ts`, `capabilityProof.spec.ts`, and only the `parseColor` implementation/tests in `AtlasRenderer.ts` and its existing focused spec. Compare local capability interfaces with `contracts.ts`, remove duplicates, import canonical types, and preserve compatibility through re-exports or updated package-local imports as required. Do not modify `contracts.ts`. Make unsupported color parsing return `[0.5, 0.5, 0.5, 1.0]`; add `oklch(...)` and `var(--x)` tests. Verify root type-check with owned-path classification, package Jest, and zero matching interface declarations in `capabilityProof.ts`. Report to `T7-report.md` only.
