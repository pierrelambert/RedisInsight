# T8 — Query evidence and renderComponent tests

Role/provider: Implementor / Codex. Requested `gpt-5.5` medium; dispatch `gpt-5.6-terra` medium, non-inherited. Commit allowed: no.

Own exactly five spec files: new `query-lab/QueryLab/queryLabEvidence.spec.ts` plus `Atlas.spec.tsx`, `MetadataMatrix.spec.tsx`, `HealthExplorers.spec.tsx`, and `SelectionInspector.spec.tsx`. Read testing rules. Test all exported queryLabEvidence functions across happy paths and edge cases. Add a local `renderComponent` helper with sensible defaults to each existing spec and replace bare `render()` calls without changing component sources. Verify focused queryLabEvidence Jest and the full package suite. Report to `T8-report.md` only.
