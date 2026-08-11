# T5 — Complete Vector Search action properties

Role/provider: Implementor / Codex. Requested `gpt-5.4` low; actual dispatch `gpt-5.6-terra` low, non-inherited. Commit allowed: no.

Own `redisinsight/ui/src/pages/vector-search/hooks/useListContent/useListContent.ts` and additive locale entries for `vectorSearch.list.action.visualizeVectors` only. T4 concurrently edits locales; preserve its additions. Report only to `T5-report.md`.

Inspect existing icon imports and the internal icon barrel. Add an appropriate visualization icon, `label: t('vectorSearch.list.action.visualizeVectors')`, and the icon property to the existing Visualize vectors action without changing its callback/flag behavior. Add English and matching Bulgarian locale entries. Do not touch T4 files, visualizer package/native files, or route configuration.

Verify `npm run type-check` with owned-path classification and focused `useListContent` Jest. Record exact commands/exits and no-stage/no-commit statement.
