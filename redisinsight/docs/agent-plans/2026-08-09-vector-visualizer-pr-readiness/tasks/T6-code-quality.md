# T6 — Code-quality batch

Role/provider: Implementor / Codex. Requested `gpt-5.5` medium; actual dispatch `gpt-5.6-terra` medium, non-inherited. Commit allowed: no.

Own `AtlasRenderer.ts`, `compare.ts`, `layout.ts`, `workbenchIntegration.ts`, `workbenchSdk.ts`, `redisinsight/api/src/modules/feature/constants/known-features.ts`, and other plugin `src` files only for the specified boolean/type-import cleanup. Report only to `T6-report.md`.

Read code-quality rules. Extract meaningful threshold/size magic numbers to named constants, excluding 0/1/-1, standard math, and RGBA values. Rename booleans lacking is/has/should/can prefixes after checking all call sites. Convert type-only imports. In `workbenchSdk.ts`, replace `@ts-ignore` with `@ts-expect-error` while preserving comment text. Reposition `DevVectorVisualizer` consistently with existing feature ordering/dev flags. Do not touch `contracts.ts`, T4/T5/T2-owned files, route config, native page files, or tests.

Verify `npm run lint`, `npm run type-check` with owned-path classification, package Jest, and `npm run test:api`. Do not repair unrelated baseline diagnostics. Record exact files, renames/constants, commands/exits, blockers, and no-stage/no-commit statement.
