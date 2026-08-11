# Wave 3 — dispatch T7 and T8 in parallel

No dependency on Wave 2 (T2). Can start as soon as Wave 1 completes.
T7 and T8 are file-disjoint.

---

## WORKER T7: Deduplicate capabilityProof types + parseColor fallback

```
Role: Implementor
Requested model: gpt-5.4
Requested reasoning effort: medium
Actual model: unknown until completion
Actual reasoning effort: unknown until completion
Inherited from coordinator: unknown until completion
Routing reason: Bounded type dedup + try/catch addition in 2 files; gpt-5.4 medium is sufficient
Repo: /private/tmp/redisinsight-vector-visualizer
Branch: codex/redis-vector-visualizer
Source of truth: redisinsight/ui/src/packages/vector-visualizer/src/contracts.ts is the canonical type source

You own:
- redisinsight/ui/src/packages/vector-visualizer/src/capabilityProof.ts
- redisinsight/ui/src/packages/vector-visualizer/src/capabilityProof.spec.ts
- redisinsight/ui/src/packages/vector-visualizer/src/renderer/AtlasRenderer.ts (parseColor function only)
- Any new spec file for parseColor if one doesn't exist

Do not touch:
- redisinsight/ui/src/packages/vector-visualizer/src/contracts.ts (import from it, do NOT modify)
- redisinsight/ui/src/pages/vector-visualizer/**
- Files owned by T4, T5, T6, T2

Other agents active: yes (T8 runs in parallel on disjoint spec files)

Task: Two issues.

ISSUE I4 — Duplicate types in capabilityProof.ts:

capabilityProof.ts (193 lines) starts with:
  import { asText } from './contracts'

  export type VectorSourceKind = 'search-index' | 'vector-set'
  export interface VectorSourceCapabilities {
    describe: boolean
    enumerate: boolean
    deterministicSample: boolean
    rawVectors: boolean
  }
  ... and also defines LayoutJobV1, VectorVisualizerHostAdapter locally

contracts.ts also defines these types.

Steps:
1. Read contracts.ts — find VectorSourceCapabilities, LayoutJobV1, VectorVisualizerHostAdapter definitions
   grep -n 'VectorSourceCapabilities\|LayoutJobV1\|VectorVisualizerHostAdapter' redisinsight/ui/src/packages/vector-visualizer/src/contracts.ts

2. Read capabilityProof.ts — find the same type definitions
   grep -n 'VectorSourceCapabilities\|LayoutJobV1\|VectorVisualizerHostAdapter' redisinsight/ui/src/packages/vector-visualizer/src/capabilityProof.ts

3. Compare them field by field. Three outcomes:
   a) IDENTICAL → remove local definition, add to the import from './contracts'
   b) SUBSET (capabilityProof has fewer fields) → import the superset from contracts.ts
   c) DIFFERENT (fields diverge) → reconcile: keep contracts.ts as source of truth, update capabilityProof to import it, adjust any capabilityProof-specific usage

4. Also check VectorSourceKind: does contracts.ts have it?
   grep -n 'VectorSourceKind' redisinsight/ui/src/packages/vector-visualizer/src/contracts.ts

5. After changes, run the existing capabilityProof.spec.ts to verify nothing breaks.

6. Verify no other file imports these types FROM capabilityProof.ts:
   grep -rn "from.*capabilityProof" redisinsight/ui/src/ | grep -v '.spec.' | head -10
   If other files import from capabilityProof.ts, re-export from contracts.ts or update their imports.

ISSUE I5 — parseColor fallback in AtlasRenderer.ts:

Find parseColor in AtlasRenderer.ts:
  grep -n 'parseColor\|function parseColor\|const parseColor' redisinsight/ui/src/packages/vector-visualizer/src/renderer/AtlasRenderer.ts

The function throws on unsupported CSS color formats like oklch(...), var(--x), or malformed strings.

Steps:
1. Read the parseColor function to understand its current implementation
2. Wrap the parsing logic in try/catch
3. On catch, return a default fallback: [0.5, 0.5, 0.5, 1.0] (RGBA normalized float gray)
4. Define the fallback as a named constant: const FALLBACK_COLOR: [number, number, number, number] = [0.5, 0.5, 0.5, 1.0]
5. Check if parseColor has an existing test file:
   find redisinsight/ui/src/packages/vector-visualizer/src/renderer -name '*.spec.*' | head -5
6. If a spec file exists for AtlasRenderer, add tests. If not, create AtlasRenderer.spec.ts or parseColor.spec.ts:
   - parseColor('#ff0000') → [1, 0, 0, 1] (or however the function normalizes)
   - parseColor('rgb(255, 0, 0)') → same
   - parseColor('oklch(0.5 0.2 240)') → FALLBACK_COLOR (no throw)
   - parseColor('var(--my-color)') → FALLBACK_COLOR (no throw)
   - parseColor('not-a-color') → FALLBACK_COLOR (no throw)

Verify with:
- npm run type-check 2>&1 | grep -c 'capabilityProof\|AtlasRenderer' → 0 new errors
- npm test --prefix redisinsight/ui/src/packages/vector-visualizer -- --runInBand → PASS
- grep -c 'interface.*Capabilities\|interface.*LayoutJob\|interface.*HostAdapter' redisinsight/ui/src/packages/vector-visualizer/src/capabilityProof.ts → 0

Output format:
STATUS: DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED
FILES_CHANGED: <exact paths>
VERIFICATION_RUN: <exact commands with exit codes>
VERIFICATION_RESULT: <PASS/FAIL per command>
BLOCKERS: <none or description>
ASSUMPTIONS: <type reconciliation decisions; which types differed if any>
NEXT_ACTION: <none>
Commit allowed: no
```

---

## WORKER T8: queryLabEvidence tests + renderComponent in 4 specs

```
Role: Implementor
Requested model: gpt-5.5
Requested reasoning effort: medium
Actual model: unknown until completion
Actual reasoning effort: unknown until completion
Inherited from coordinator: unknown until completion
Routing reason: Test writing needing code comprehension across 5 files; gpt-5.5 medium for broader spec analysis
Repo: /private/tmp/redisinsight-vector-visualizer
Branch: codex/redis-vector-visualizer
Source of truth: .ai/skills/testing/SKILL.md for test conventions

You own (spec files only — do NOT edit component source):
- redisinsight/ui/src/packages/vector-visualizer/src/query-lab/QueryLab/queryLabEvidence.spec.ts (CREATE NEW)
- redisinsight/ui/src/packages/vector-visualizer/src/atlas/Atlas/Atlas.spec.tsx
- redisinsight/ui/src/packages/vector-visualizer/src/explore/MetadataMatrix/MetadataMatrix.spec.tsx
- redisinsight/ui/src/packages/vector-visualizer/src/health/HealthExplorers/HealthExplorers.spec.tsx
- redisinsight/ui/src/packages/vector-visualizer/src/selection/SelectionInspector/SelectionInspector.spec.tsx

Read-only (understand but do not modify):
- redisinsight/ui/src/packages/vector-visualizer/src/query-lab/QueryLab/queryLabEvidence.ts (93 lines — the source to test)
- The 4 component source files (.tsx) for understanding props
- redisinsight/ui/src/packages/vector-visualizer/src/advanced/AdvancedView/AdvancedView.spec.tsx (reference pattern for renderComponent)

Do not touch:
- Any component source file (.tsx)
- redisinsight/ui/src/pages/vector-visualizer/**
- Files owned by T4, T5, T6, T7, T2

Other agents active: yes (T7 runs in parallel on disjoint files)

Task: Two issues.

ISSUE I7 — Missing queryLabEvidence tests:

queryLabEvidence.ts (93 lines) contains computation/transformation logic with no test file.

Steps:
1. Read queryLabEvidence.ts thoroughly:
   cat redisinsight/ui/src/packages/vector-visualizer/src/query-lab/QueryLab/queryLabEvidence.ts

2. Identify all exported functions and their signatures.

3. Read .ai/skills/testing/SKILL.md for test conventions (describe/it nesting, faker usage, assertion patterns).

4. Create queryLabEvidence.spec.ts with:
   - Import the exported functions
   - describe block per exported function
   - Happy-path test: representative valid input → expected output
   - Edge cases: empty input, missing/undefined fields, zero values, boundary values
   - Use faker for generating test data if appropriate (per skill)
   - Verify return types match expected shapes

5. Follow the existing test style in the package (look at adjacent spec files for import patterns, describe/it style).

ISSUE I8 — renderComponent helper missing in 4 specs:

Reference pattern (from AdvancedView.spec.tsx — read this file first):
```tsx
import React from 'react'
import { render, screen } from '@testing-library/react'
import { Advanced } from './AdvancedView'

type Props = React.ComponentProps<typeof Advanced>

const renderComponent = (props: Partial<Props> = {}) => {
  render(
    <Advanced status="idle" topology={{ kind: 'unsupported' }} {...props} />,
  )
}

describe('AdvancedView', () => {
  it('renders', () => {
    renderComponent()
    expect(screen.getByTestId('...')).toBeInTheDocument()
  })
})
```

For each of the 4 spec files:
1. Read the existing spec file
2. Identify the component being tested and its required props
3. Create a renderComponent helper that:
   - Accepts Partial<Props> with sensible defaults for required props
   - Calls render(<Component {...defaults} {...props} />)
4. Replace ALL bare render() calls with renderComponent() calls
5. If props were passed to render(), move them to renderComponent() args
6. Ensure the test behavior doesn't change — just the wrapper

Files to update:
- Atlas.spec.tsx: find the component import and render calls
- MetadataMatrix.spec.tsx: same
- HealthExplorers.spec.tsx: same
- SelectionInspector.spec.tsx: same

Verify with:
- node 'node_modules/.bin/jest' --testPathPattern='queryLabEvidence' -c jest.config.cjs → PASS (new tests)
- npm test --prefix redisinsight/ui/src/packages/vector-visualizer -- --runInBand → ALL PASS
- grep -l 'renderComponent' redisinsight/ui/src/packages/vector-visualizer/src/atlas/Atlas/Atlas.spec.tsx redisinsight/ui/src/packages/vector-visualizer/src/explore/MetadataMatrix/MetadataMatrix.spec.tsx redisinsight/ui/src/packages/vector-visualizer/src/health/HealthExplorers/HealthExplorers.spec.tsx redisinsight/ui/src/packages/vector-visualizer/src/selection/SelectionInspector/SelectionInspector.spec.tsx → 4 files listed

Output format:
STATUS: DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED
FILES_CHANGED: <exact paths, noting which are NEW vs MODIFIED>
VERIFICATION_RUN: <exact commands with exit codes>
VERIFICATION_RESULT: <PASS/FAIL per command>
BLOCKERS: <none or description>
ASSUMPTIONS: <test design decisions>
NEXT_ACTION: <none>
Commit allowed: no
```

---

**Coordinator notes for Waves 2+3:**
- Wave 2 (T2) and Wave 3 (T7, T8) can run in parallel if the coordinator confirms file disjointness.
- T2 touches VectorSetDetails.tsx (browser/key-details). T7 touches capabilityProof.ts + AtlasRenderer.ts (plugin package). T8 touches 5 spec files (plugin package). No overlap.
- After all three waves complete, verify no merge conflicts, then proceed to Wave 4 (T9 audit).
