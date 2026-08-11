# Vector Visualizer PR Readiness — Codex Coordinator Prompt

You are a coordinator. Execute the remaining tasks of the Vector Visualizer PR readiness plan. T1 and T3 are already done and audited. You must dispatch T4, T5, T6, T2, T7, T8, and T9.

## Context

**Repo:** RedisInsight  
**Branch:** `codex/redis-vector-visualizer`  
**Commit policy:** Do NOT commit, push, or change the branch. All changes are unstaged working-tree edits.

**Architecture:**
- Plugin package: `redisinsight/ui/src/packages/vector-visualizer/` (iframe Workbench plugin)
- Native host page: `redisinsight/ui/src/pages/vector-visualizer/` (React page with UMAP/WebGL)
- Integration: vector-set key details at `redisinsight/ui/src/pages/browser/modules/key-details/components/vector-set-details/`
- Integration: vector search list at `redisinsight/ui/src/pages/vector-search/`
- Route config: `redisinsight/ui/src/components/main-router/constants/defaultRoutes.ts`
- Feature flag: `FeatureFlags.devVectorVisualizer` / `KnownFeatures.DevVectorVisualizer`
- Conventions: read `.ai/skills/i18n/SKILL.md`, `.ai/skills/testing/SKILL.md`, `.ai/skills/code-quality/SKILL.md` before dispatching workers

**Already done:**
- T1 (strip scope creep): AUDITED — no delta needed, owned files already match main
- T3 (lazy loading): AUDITED — added LazyVectorVisualizerPage in defaultRoutes.ts

**Aggregate type-check:** has 1,312 pre-existing diagnostics. Do NOT try to fix them. Only verify no NEW diagnostics from owned files.

## Execution Plan

### Round 1: dispatch T4 + T5 + T6 in parallel (file-disjoint)

### Round 2: dispatch T2 + T7 + T8 in parallel (file-disjoint, T2/T7/T8 touch completely separate files)

### Round 3: dispatch T9 as a fresh-context auditor

---

## T4: Add i18n for VectorFieldPicker + VectorSetKeySubheader

**Model:** `gpt-5.4` medium  
**Owns:** `VectorFieldPicker.tsx`, `VectorSetKeySubheader.tsx`, locale JSON (add keys only)

Read `.ai/skills/i18n/SKILL.md` first.

File 1: `redisinsight/ui/src/pages/vector-search/pages/VectorSearchListPage/components/list-content/VectorFieldPicker.tsx`

This file has NO i18n. Current code:

```tsx
import React from 'react'
import { Button } from 'uiSrc/components/base/forms/buttons'
import { Text } from 'uiSrc/components/base/text'
import { FieldTypes } from 'uiSrc/pages/browser/components/create-redisearch-index/constants'
import { useIndexInfo } from 'uiSrc/pages/vector-search/hooks/useIndexInfo/useIndexInfo'
import * as S from './ListContent.styles'

interface Props {
  indexName: string
  onCancel: () => void
  onSelect: (field: string) => void
}

export const VectorFieldPicker = ({ indexName, onCancel, onSelect }: Props) => {
  const { indexInfo, loading, error } = useIndexInfo({ indexName })
  const vectorFields =
    indexInfo?.attributes.filter(({ type }) => type === FieldTypes.VECTOR) ?? []

  return (
    <S.VectorFieldPicker data-testid="vector-search-vector-field-picker">
      <Text>Select a vector field to visualize</Text>
      {loading && (
        <Text data-testid="vector-search-vector-field-loading">
          Loading vector fields…
        </Text>
      )}
      {error && (
        <Text data-testid="vector-search-vector-field-error">
          Unable to load vector fields. Try again from the index list.
        </Text>
      )}
      {!loading && !error && vectorFields.length === 0 && (
        <Text data-testid="vector-search-vector-field-empty">
          This index has no vector fields to visualize.
        </Text>
      )}
      {!loading &&
        !error &&
        vectorFields.map(({ attribute }) => (
          <Button key={attribute} onClick={() => onSelect(attribute)}
            data-testid={`vector-search-visualize-field-${attribute}`}>
            {attribute}
          </Button>
        ))}
      <Button onClick={onCancel}>Cancel</Button>
    </S.VectorFieldPicker>
  )
}
```

Changes:
1. Add `import { useTranslation } from 'react-i18next'`
2. Add `const { t } = useTranslation()` inside the component
3. Replace 5 strings with `t()` calls using keys like `vectorVisualizer.fieldPicker.selectField`, etc.

File 2: `redisinsight/ui/src/pages/browser/modules/key-details/components/vector-set-details/vector-set-key-subheader/VectorSetKeySubheader.tsx`

Already has useTranslation. Around line 74, replace:
```tsx
<Button size="small" data-testid="vector-set-visualize-btn" onClick={onVisualize}>
  Visualize
</Button>
```
with `{t('vectorVisualizer.actions.visualize')}`.

Locale: add all 6 keys to the English locale JSON. Find it with:
```bash
find redisinsight/ui/src -name 'en.json' -path '*/locales/*' | head -5
```

**Verify:**
```bash
npm run lint
npm run type-check
```

**Do not touch:** `redisinsight/ui/src/packages/vector-visualizer/**`, `redisinsight/ui/src/pages/vector-visualizer/**`, `defaultRoutes.ts`

---

## T5: Complete action properties in useListContent

**Model:** `gpt-5.4` low  
**Owns:** `useListContent.ts`, locale JSON (add 1 key)

File: `redisinsight/ui/src/pages/vector-search/hooks/useListContent/useListContent.ts`

Current code around line 198:
```ts
...(vectorVisualizerEnabled
  ? [{ name: 'Visualize vectors', callback: handleVisualize }]
  : []),
```

Every other action has `name`, `label` (i18n), `icon`, `callback`. The incomplete entry needs `label` and `icon`.

Steps:
1. Check available icons: `grep -n 'import.*Icon' useListContent.ts` and `grep 'export.*Icon' redisinsight/ui/src/components/base/icons/index.ts | head -30`
2. Pick an appropriate visualization icon
3. Add `label: t('vectorSearch.list.action.visualizeVectors')` and `icon: <ChosenIcon>`
4. Add the import for the icon if needed
5. Add locale key to en.json under the existing `vectorSearch.list.action` path

**Verify:**
```bash
npm run type-check
node 'node_modules/.bin/jest' --testPathPattern='useListContent' -c jest.config.cjs
```

**Do not touch:** `VectorFieldPicker.tsx`, `VectorSetKeySubheader.tsx` (owned by T4), `vector-visualizer/**`

---

## T6: Code quality batch

**Model:** `gpt-5.5` medium  
**Owns:** AtlasRenderer.ts, compare.ts, layout.ts, workbenchIntegration.ts, workbenchSdk.ts, known-features.ts, other VV src files for boolean/import fixes

Read `.ai/skills/code-quality/SKILL.md` first.

5 issues to fix:

**I1 — Magic numbers:** Scan owned files for bare numeric literals used as thresholds/sizes/constants. Extract to `UPPER_SNAKE_CASE` constants. Skip 0, 1, -1, standard math, RGBA values.

**I2 — Boolean naming:** Find booleans without `is/has/should/can` prefix. Rename with prefix. Check ALL call sites with grep before renaming.

**I3 — Type-only imports:** Convert imports used only as type annotations to `import type { ... }`.

**I6 — @ts-ignore:** In `workbenchSdk.ts` line 5, change `// @ts-ignore` to `// @ts-expect-error` (keep the comment text).

**I10 — Feature ordering:** In `redisinsight/api/src/modules/feature/constants/known-features.ts`, `DevVectorVisualizer` is the first entry. Check if other dev-* flags exist and group together, or move to alphabetical position.

**Verify:**
```bash
npm run lint
npm run type-check
npm test --prefix redisinsight/ui/src/packages/vector-visualizer -- --runInBand
npm run test:api
```

**Do not touch:** `contracts.ts`, `VectorFieldPicker.tsx`, `VectorSetKeySubheader.tsx`, `useListContent.ts`, `defaultRoutes.ts`, `VectorSetDetails.tsx`, any file under `pages/vector-visualizer/`

---

## T2: Fix VectorSetDetails type mismatch

**Model:** `gpt-5.4` medium  
**Owns:** `VectorSetDetails.tsx` only

File: `redisinsight/ui/src/pages/browser/modules/key-details/components/vector-set-details/VectorSetDetails.tsx`

Line 116 has a type bug:
```ts
setVectorVisualizerSource({ kind: 'vector-set', key: selectedKeyData.name })
```

`selectedKeyData.name` is `RedisString` (string | RedisResponseBuffer). The contract requires `key: Uint8Array`.

The contract (in contracts.ts, DO NOT MODIFY):
```ts
export type VectorDataSourceRef =
  | { kind: 'search-index'; index: string; vectorField: string }
  | { kind: 'vector-set'; key: Uint8Array }
```

Steps:
1. Discover the actual RedisString type: `grep -rn 'type RedisString\|RedisResponseBuffer' redisinsight/ui/src/ | head -10`
2. Check for existing conversion: `grep -rn 'Uint8Array' redisinsight/ui/src/utils/ | grep -i buffer | head -10`
3. Convert selectedKeyData.name to Uint8Array before passing. Handle both string and buffer cases.
4. If a test exists for handleVisualize, update it. If not, add one.

**Verify:**
```bash
npm run type-check
node 'node_modules/.bin/jest' --testPathPattern='VectorSetDetails\|vector-set-details' -c jest.config.cjs
```

**Do not touch:** `contracts.ts`, `nativeHandoff.ts`, any locale file, `defaultRoutes.ts`

---

## T7: Deduplicate capabilityProof types + parseColor fallback

**Model:** `gpt-5.4` medium  
**Owns:** `capabilityProof.ts`, `capabilityProof.spec.ts`, `AtlasRenderer.ts` (parseColor only)

**I4 — Type dedup:** `capabilityProof.ts` (193 lines) redefines `VectorSourceCapabilities`, `LayoutJobV1`, `VectorVisualizerHostAdapter` that exist in `contracts.ts`. Remove local definitions and import from `contracts.ts` instead. Check if types are identical first. If other files import from capabilityProof.ts, update their imports or re-export.

**I5 — parseColor fallback:** `AtlasRenderer.ts` has a `parseColor` function that throws on unsupported color formats. Wrap in try/catch, return fallback `[0.5, 0.5, 0.5, 1.0]`. Add tests for `oklch(...)` and `var(--x)` inputs.

**Verify:**
```bash
npm run type-check
npm test --prefix redisinsight/ui/src/packages/vector-visualizer -- --runInBand
grep -c 'interface.*Capabilities\|interface.*LayoutJob\|interface.*HostAdapter' redisinsight/ui/src/packages/vector-visualizer/src/capabilityProof.ts
# ↑ must be 0
```

**Do not touch:** `contracts.ts` (import from, don't modify), any file outside the plugin package

---

## T8: queryLabEvidence tests + renderComponent in 4 specs

**Model:** `gpt-5.5` medium  
**Owns:** 5 spec files (4 existing + 1 new)

Read `.ai/skills/testing/SKILL.md` first.

**I7 — New test file:** Create `redisinsight/ui/src/packages/vector-visualizer/src/query-lab/QueryLab/queryLabEvidence.spec.ts`. Read the source file (93 lines), identify exported functions, write tests with happy-path and edge cases.

**I8 — renderComponent:** These 4 specs use bare `render()` instead of the project `renderComponent()` helper:
- `atlas/Atlas/Atlas.spec.tsx`
- `explore/MetadataMatrix/MetadataMatrix.spec.tsx`
- `health/HealthExplorers/HealthExplorers.spec.tsx`
- `selection/SelectionInspector/SelectionInspector.spec.tsx`

Reference pattern (from `advanced/AdvancedView/AdvancedView.spec.tsx`):
```tsx
const renderComponent = (props: Partial<Props> = {}) => {
  render(<Advanced status="idle" topology={{ kind: 'unsupported' }} {...props} />)
}
```

For each: create `renderComponent` with sensible defaults, replace bare `render()` calls.

**Verify:**
```bash
node 'node_modules/.bin/jest' --testPathPattern='queryLabEvidence' -c jest.config.cjs
npm test --prefix redisinsight/ui/src/packages/vector-visualizer -- --runInBand
```

**Do not touch:** any component source file (.tsx), any file outside the plugin package spec files

---

## T9: Final audit (fresh context, after ALL tasks)

**Model:** `gpt-5.6-sol` high  
**Role:** Auditor — read-only, no edits

Run every check independently:

```bash
# B1: scope creep
git diff main...HEAD -- package.json electron-builder.json .github/workflows/ | wc -l

# B2: type mismatch
grep -A5 'handleVisualize' redisinsight/ui/src/pages/browser/modules/key-details/components/vector-set-details/VectorSetDetails.tsx

# B3: lazy loading
grep -c 'LazyVectorVisualizerPage' redisinsight/ui/src/components/main-router/constants/defaultRoutes.ts

# B4: i18n
grep "Select a vector\|Loading vector\|Unable to load\|no vector fields\|>Cancel<\|>Visualize<" redisinsight/ui/src/pages/vector-search/pages/VectorSearchListPage/components/list-content/VectorFieldPicker.tsx redisinsight/ui/src/pages/browser/modules/key-details/components/vector-set-details/vector-set-key-subheader/VectorSetKeySubheader.tsx

# B5: action properties
grep -A6 'Visualize vectors' redisinsight/ui/src/pages/vector-search/hooks/useListContent/useListContent.ts

# I4: type dedup
grep -c 'interface.*Capabilities\|interface.*LayoutJob\|interface.*HostAdapter' redisinsight/ui/src/packages/vector-visualizer/src/capabilityProof.ts

# I6: ts-ignore
grep '@ts-ignore' redisinsight/ui/src/packages/vector-visualizer/src/workbenchSdk.ts

# I7: queryLabEvidence tests
ls redisinsight/ui/src/packages/vector-visualizer/src/query-lab/QueryLab/queryLabEvidence.spec.ts

# I8: renderComponent
grep -l 'renderComponent' redisinsight/ui/src/packages/vector-visualizer/src/atlas/Atlas/Atlas.spec.tsx redisinsight/ui/src/packages/vector-visualizer/src/explore/MetadataMatrix/MetadataMatrix.spec.tsx redisinsight/ui/src/packages/vector-visualizer/src/health/HealthExplorers/HealthExplorers.spec.tsx redisinsight/ui/src/packages/vector-visualizer/src/selection/SelectionInspector/SelectionInspector.spec.tsx

# Gates
npm run lint
npm run type-check
npm test --prefix redisinsight/ui/src/packages/vector-visualizer -- --runInBand
node node_modules/.bin/jest redisinsight/ui/src/pages/vector-visualizer -c jest.config.cjs --runInBand
node node_modules/.bin/jest redisinsight/ui/src/utils/tests/plugins.spec.ts -c jest.config.cjs --runInBand
```

Write `audit-final-report.md` with VERDICT: APPROVED or NOT APPROVED, findings, gate results, and residual risks.

**Do not touch:** any source file. Write only the audit report.

---

## Coordinator Rules

1. Dispatch Round 1 (T4 + T5 + T6) in parallel
2. Wait for all three to complete
3. If T4 and T5 both touched en.json, merge their additions (different key paths, should not conflict)
4. Dispatch Round 2 (T2 + T7 + T8) in parallel — completely file-disjoint
5. Wait for all three to complete
6. Dispatch Round 3 (T9) as a fresh-context auditor
7. If T9 reports NOT APPROVED, dispatch repair tasks for findings
8. Update `docs/agent-plans/2026-08-09-vector-visualizer-pr-readiness/tracker.md` after each task completes
9. Do NOT commit, push, or modify the branch ref
