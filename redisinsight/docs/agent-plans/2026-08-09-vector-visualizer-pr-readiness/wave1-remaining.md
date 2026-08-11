# Wave 1 remaining — dispatch T4, T5, T6 in parallel

These three tasks are file-disjoint and have no dependency on each other or on T1/T3.

---

## WORKER T4: Add i18n for VectorFieldPicker + VectorSetKeySubheader

```
Role: Implementor
Requested model: gpt-5.4
Requested reasoning effort: medium
Actual model: unknown until completion
Actual reasoning effort: unknown until completion
Inherited from coordinator: unknown until completion
Routing reason: Straightforward i18n migration following existing patterns; gpt-5.4 medium is sufficient for convention lookup and string replacement
Repo: /private/tmp/redisinsight-vector-visualizer
Branch: codex/redis-vector-visualizer
Source of truth: .ai/skills/i18n/SKILL.md for key naming conventions; existing t() calls in adjacent files for pattern

You own:
- redisinsight/ui/src/pages/vector-search/pages/VectorSearchListPage/components/list-content/VectorFieldPicker.tsx
- redisinsight/ui/src/pages/browser/modules/key-details/components/vector-set-details/vector-set-key-subheader/VectorSetKeySubheader.tsx
- Locale JSON file(s) under redisinsight/ui/src/assets/locales/ (add keys only, do not remove or rename existing keys)

Do not touch:
- redisinsight/ui/src/packages/vector-visualizer/**
- redisinsight/ui/src/pages/vector-visualizer/**
- redisinsight/ui/src/components/main-router/**
- Any file not listed above

Other agents active: yes (T5 and T6 run in parallel on disjoint files)

Task:
6 hardcoded English strings must use i18n t() calls.

FILE 1 — VectorFieldPicker.tsx

Current imports (no i18n):
  import React from 'react'
  import { Button } from 'uiSrc/components/base/forms/buttons'
  import { Text } from 'uiSrc/components/base/text'
  import { FieldTypes } from 'uiSrc/pages/browser/components/create-redisearch-index/constants'
  import { useIndexInfo } from 'uiSrc/pages/vector-search/hooks/useIndexInfo/useIndexInfo'
  import * as S from './ListContent.styles'

Current component body:
  export const VectorFieldPicker = ({ indexName, onCancel, onSelect }: Props) => {
    const { indexInfo, loading, error } = useIndexInfo({ indexName })
    const vectorFields =
      indexInfo?.attributes.filter(({ type }) => type === FieldTypes.VECTOR) ?? []

    return (
      <S.VectorFieldPicker data-testid="vector-search-vector-field-picker">
        <Text>Select a vector field to visualize</Text>             ← REPLACE
        {loading && (
          <Text data-testid="vector-search-vector-field-loading">
            Loading vector fields…                                   ← REPLACE
          </Text>
        )}
        {error && (
          <Text data-testid="vector-search-vector-field-error">
            Unable to load vector fields. Try again from the index list.  ← REPLACE
          </Text>
        )}
        {!loading && !error && vectorFields.length === 0 && (
          <Text data-testid="vector-search-vector-field-empty">
            This index has no vector fields to visualize.            ← REPLACE
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
        <Button onClick={onCancel}>Cancel</Button>                  ← REPLACE
      </S.VectorFieldPicker>
    )
  }

Steps for VectorFieldPicker.tsx:
1. Add import: import { useTranslation } from 'react-i18next'
2. Add inside component: const { t } = useTranslation()
3. Replace 5 strings with t() calls. Use these keys:
   - t('vectorVisualizer.fieldPicker.selectField')
   - t('vectorVisualizer.fieldPicker.loading')
   - t('vectorVisualizer.fieldPicker.error')
   - t('vectorVisualizer.fieldPicker.empty')
   - t('vectorVisualizer.fieldPicker.cancel')

FILE 2 — VectorSetKeySubheader.tsx

This component already imports useTranslation. Find the "Visualize" button (around line 74):
  <Button size="small" data-testid="vector-set-visualize-btn" onClick={onVisualize}>
    Visualize                                                        ← REPLACE
  </Button>

Step: Replace "Visualize" with t('vectorVisualizer.actions.visualize')

LOCALE FILE:
1. Find the English locale JSON: look for redisinsight/ui/src/assets/locales/en.json or similar
   Run: find redisinsight/ui/src -name 'en.json' -path '*/locales/*' | head -5
2. Check existing structure — look for 'vectorSearch' or 'vectorVisualizer' top-level keys
3. Add nested keys:
   "vectorVisualizer": {
     "fieldPicker": {
       "selectField": "Select a vector field to visualize",
       "loading": "Loading vector fields…",
       "error": "Unable to load vector fields. Try again from the index list.",
       "empty": "This index has no vector fields to visualize.",
       "cancel": "Cancel"
     },
     "actions": {
       "visualize": "Visualize"
     }
   }
4. If a 'vectorVisualizer' key already exists, merge into it rather than overwriting.

Quality gates:
- Read .ai/skills/i18n/SKILL.md first for naming rules. Adjust key names if the skill prescribes a different convention.
- If the skill says to use a different namespace (e.g., flat keys or different nesting), follow the skill.

Verify with:
- npm run lint → 0 warnings for owned files
- npm run type-check → PASS (or no NEW diagnostics from owned files)
- node 'node_modules/.bin/jest' --testPathPattern='VectorFieldPicker' -c jest.config.cjs → PASS (if spec exists)
- grep for bare English in JSX: grep -n ">[A-Z]" ...VectorFieldPicker.tsx → no hits for replaced strings

Output format:
STATUS: DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED
FILES_CHANGED: <exact paths>
VERIFICATION_RUN: <exact commands with exit codes>
VERIFICATION_RESULT: <PASS/FAIL per command>
BLOCKERS: <none or description>
BLOCKER_DISPOSITION: <N/A or fixed/escalated>
ASSUMPTIONS: <locale key naming decisions>
NEXT_ACTION: <none or what remains>
Commit allowed: no
```

---

## WORKER T5: Complete action properties in useListContent

```
Role: Implementor
Requested model: gpt-5.4
Requested reasoning effort: low
Actual model: unknown until completion
Actual reasoning effort: unknown until completion
Inherited from coordinator: unknown until completion
Routing reason: Add 2-3 properties matching adjacent pattern; gpt-5.4 low is sufficient for mechanical property addition
Repo: /private/tmp/redisinsight-vector-visualizer
Branch: codex/redis-vector-visualizer
Source of truth: Adjacent action entries in the same array for pattern

You own:
- redisinsight/ui/src/pages/vector-search/hooks/useListContent/useListContent.ts
- Locale JSON file(s) under redisinsight/ui/src/assets/locales/ (add one key only)

Do not touch:
- redisinsight/ui/src/packages/vector-visualizer/**
- redisinsight/ui/src/pages/vector-visualizer/**
- redisinsight/ui/src/components/main-router/**
- VectorFieldPicker.tsx or VectorSetKeySubheader.tsx (owned by T4)

Other agents active: yes (T4 and T6 run in parallel on disjoint files)

Task:
The "Visualize vectors" action at useListContent.ts line 199 is incomplete.

Current code context (lines 183-207):
  The actions array contains 4 entries. Three have full properties:
    { name: 'View index',    label: t('vectorSearch.list.action.viewIndex'),    icon: ShowIcon,             callback: handleViewIndex }
    { name: 'Browse dataset', label: t('vectorSearch.list.action.browseDataset'), icon: VectorSearchKeyIcon, callback: handleBrowseDataset }
    { name: 'Delete',         label: t('vectorSearch.list.action.delete'),        icon: DeleteIcon,          variant: 'destructive', callback: handleDelete }

  The Vector Visualizer entry is INCOMPLETE:
    ...(vectorVisualizerEnabled
      ? [{ name: 'Visualize vectors', callback: handleVisualize }]
      : []),

Steps:
1. Check available icons already imported at the top of the file:
   grep -n 'import.*Icon' redisinsight/ui/src/pages/vector-search/hooks/useListContent/useListContent.ts
   Also check what's available:
   grep -rn 'export.*Icon' redisinsight/ui/src/components/base/icons/index.ts | head -30

2. Choose a vector/visualization icon. Good candidates (check availability):
   - VectorIcon, VisualizationIcon, ChartIcon, AnalyzeIcon, ScatterIcon
   - If none fit, use a general icon that conveys "visualize" (e.g., EyeIcon, ViewIcon)

3. Add the icon import if not already imported.

4. Replace the incomplete entry:
   ...(vectorVisualizerEnabled
     ? [{
         name: 'Visualize vectors',
         label: t('vectorSearch.list.action.visualizeVectors'),
         icon: <ChosenIcon>,
         callback: handleVisualize,
       }]
     : []),

5. Add locale key to en.json:
   Under "vectorSearch.list.action": add "visualizeVectors": "Visualize vectors"
   Find the existing locale structure first:
   grep -A2 'viewIndex\|browseDataset' redisinsight/ui/src/assets/locales/en.json | head -10

Verify with:
- npm run type-check → PASS (or no NEW diagnostics)
- node 'node_modules/.bin/jest' --testPathPattern='useListContent' -c jest.config.cjs → PASS

Output format:
STATUS: DONE | NEEDS_CONTEXT
FILES_CHANGED: <exact paths>
VERIFICATION_RUN: <exact commands with exit codes>
VERIFICATION_RESULT: <PASS/FAIL>
ASSUMPTIONS: <which icon was chosen and why>
NEXT_ACTION: <none>
Commit allowed: no
```

---

## WORKER T6: Code quality batch (magic numbers, booleans, imports, ts-ignore, feature ordering)

```
Role: Implementor
Requested model: gpt-5.5
Requested reasoning effort: medium
Actual model: unknown until completion
Actual reasoning effort: unknown until completion
Inherited from coordinator: unknown until completion
Routing reason: Multi-file refactor requiring judgment on naming conventions; gpt-5.5 medium for broader repo analysis across ~6 files
Repo: /private/tmp/redisinsight-vector-visualizer
Branch: codex/redis-vector-visualizer
Source of truth: .ai/skills/code-quality/SKILL.md, CLAUDE.md rules

You own:
- redisinsight/ui/src/packages/vector-visualizer/src/renderer/AtlasRenderer.ts
- redisinsight/ui/src/packages/vector-visualizer/src/compare/compare.ts
- redisinsight/ui/src/packages/vector-visualizer/src/worker/layout.ts
- redisinsight/ui/src/packages/vector-visualizer/src/workbenchIntegration.ts
- redisinsight/ui/src/packages/vector-visualizer/src/workbenchSdk.ts
- redisinsight/api/src/modules/feature/constants/known-features.ts
- Other vector-visualizer files with boolean naming or type-only import issues (under redisinsight/ui/src/packages/vector-visualizer/src/**)

Do not touch:
- redisinsight/ui/src/packages/vector-visualizer/src/contracts.ts (public API)
- redisinsight/ui/src/pages/vector-visualizer/** (owned by other tasks or deferred)
- redisinsight/ui/src/components/main-router/** (owned by T3, already done)
- useListContent.ts, VectorFieldPicker.tsx, VectorSetKeySubheader.tsx (owned by T4/T5)
- Any non-VV file except known-features.ts

Other agents active: yes (T4 and T5 run in parallel on disjoint files)

Task: Fix 5 code quality issues.

Read first: .ai/skills/code-quality/SKILL.md

ISSUE I1 — Magic numbers:
Scan AtlasRenderer.ts, compare.ts, layout.ts, workbenchIntegration.ts for bare numeric
literals used as thresholds, grid sizes, buffer sizes, ratios, or timeout values.
Do NOT extract: 0, 1, -1 (sentinels), array indices, standard math (2 * Math.PI),
RGBA channel values that are self-documenting (e.g., 255).

Extract each meaningful number to a named UPPER_SNAKE_CASE constant at module scope.
Example:
  BEFORE: if (points.length > 50000) { ...
  AFTER:  const MAX_POINTS_FOR_FULL_RENDER = 50_000
          if (points.length > MAX_POINTS_FOR_FULL_RENDER) { ...

ISSUE I2 — Boolean naming:
Search VV files for boolean-typed variables, props, and parameters that don't start
with is/has/should/can/was/will/needs/allows.

Commands to find candidates:
  grep -rn 'boolean' redisinsight/ui/src/packages/vector-visualizer/src/ | grep -v node_modules | grep -v '.spec.' | head -30
  grep -rn ': boolean' redisinsight/ui/src/packages/vector-visualizer/src/ | head -30

For each boolean found without proper prefix:
1. Determine the best prefix (is for state, has for possession, should for conditionals, can for capability)
2. grep ALL usages across the codebase before renaming: grep -rn '<oldName>' redisinsight/ui/src/ | head -20
3. Rename in definition AND all call sites
4. Do NOT rename if the boolean is part of a public API in contracts.ts or if external consumers exist

ISSUE I3 — Type-only imports:
Find imports used ONLY as TypeScript type annotations (not as runtime values).
Convert to import type { ... } syntax.

How to check: for each imported symbol, grep for its runtime usage (not just type position).
If it only appears in type annotations, parameter types, return types, or generic constraints → import type.
If it's used as a value (function call, constructor, comparison, assignment) → keep as value import.

ISSUE I6 — @ts-ignore → @ts-expect-error:
File: workbenchSdk.ts line 5
  BEFORE: // @ts-ignore Vite resolves the internal plugin SDK alias; aggregate CJS tsc cannot resolve it
  AFTER:  // @ts-expect-error Vite resolves the internal plugin SDK alias; aggregate CJS tsc cannot resolve it

Single-line change. @ts-expect-error is preferred because TypeScript errors if the suppression becomes unnecessary, unlike @ts-ignore which silently swallows future fixes.

ISSUE I10 — Feature flag ordering in known-features.ts:
File: redisinsight/api/src/modules/feature/constants/known-features.ts
DevVectorVisualizer is currently the FIRST entry (line 13) in the knownFeatures record.

Steps:
1. Read the full file to understand ordering convention
2. Check if other dev-* flags exist: grep 'Dev[A-Z]\|dev[A-Z]' known-features.ts
3. If other dev flags exist → group DevVectorVisualizer with them
4. If list is alphabetical → move to correct alpha position
5. If no clear convention → leave it and report DONE_WITH_CONCERNS noting the ambiguity

Verify with:
- npm run lint → 0 warnings
- npm run type-check → PASS (or no NEW diagnostics from owned files; the aggregate 1,312 baseline is pre-existing)
- npm test --prefix redisinsight/ui/src/packages/vector-visualizer -- --runInBand → PASS
- npm run test:api → PASS (for known-features.ts change)

Important: The aggregate type-check has 1,312 pre-existing diagnostics. Your changes must not ADD new diagnostics. Filter with:
  npm run type-check 2>&1 | grep -c 'error TS' (compare before and after your changes)

Output format:
STATUS: DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED
FILES_CHANGED: <exact paths with approximate line counts changed>
VERIFICATION_RUN: <exact commands with exit codes>
VERIFICATION_RESULT: <PASS/FAIL per command>
BLOCKERS: <none or description>
BLOCKER_DISPOSITION: <N/A or fixed/escalated>
ASSUMPTIONS: <naming decisions for I2, ordering convention for I10>
NEXT_ACTION: <none or what remains>
Commit allowed: no
```

---

**Coordinator notes for Wave 1 remaining:**
- Dispatch T4, T5, T6 in parallel — file ownership is disjoint.
- T4 and T5 both touch locale JSON but at different key paths (`vectorVisualizer.fieldPicker.*` vs `vectorSearch.list.action.visualizeVectors`). If the JSON edits conflict, the integrator resolves by merging both additions.
- After all three complete, verify no merge conflicts, then proceed to Wave 2.
