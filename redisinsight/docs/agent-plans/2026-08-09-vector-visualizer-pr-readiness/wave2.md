# Wave 2 — dispatch T2 after Wave 1 completes

T2 depends on T4 completing (locale pattern established) and needs the type conversion context.

---

## WORKER T2: Fix VectorSetDetails type mismatch

```
Role: Implementor
Requested model: gpt-5.4
Requested reasoning effort: medium
Actual model: unknown until completion
Actual reasoning effort: unknown until completion
Inherited from coordinator: unknown until completion
Routing reason: Single-file type conversion fix with clear contract; gpt-5.4 medium is sufficient for type analysis
Repo: /private/tmp/redisinsight-vector-visualizer
Branch: codex/redis-vector-visualizer
Source of truth: redisinsight/ui/src/packages/vector-visualizer/src/contracts.ts for the VectorDataSourceRef type contract

You own:
- redisinsight/ui/src/pages/browser/modules/key-details/components/vector-set-details/VectorSetDetails.tsx

Do not touch:
- redisinsight/ui/src/packages/vector-visualizer/src/contracts.ts (the contract is correct; fix the caller)
- redisinsight/ui/src/pages/vector-visualizer/nativeHandoff.ts (the setVectorVisualizerSource signature is correct)
- Any locale files (owned by T4/T5)
- redisinsight/ui/src/components/main-router/** (owned by T3, already done)

Other agents active: no (Wave 2 is serial)

Task:
Fix type mismatch at VectorSetDetails.tsx line 116 where RedisString is passed
where Uint8Array is required.

CONTRACT (contracts.ts lines 16-18):
  export type VectorDataSourceRef =
    | { kind: 'search-index'; index: string; vectorField: string }
    | { kind: 'vector-set'; key: Uint8Array }

HANDOFF (nativeHandoff.ts line 14):
  export const setVectorVisualizerSource = (source: VectorDataSourceRef) => {
    pendingSource = source
  }

CURRENT BUGGY CODE (VectorSetDetails.tsx lines 114-118):
  const handleVisualize = useCallback(() => {
    if (!selectedKeyData?.name) return
    setVectorVisualizerSource({ kind: 'vector-set', key: selectedKeyData.name })
    history.push(Pages.vectorVisualizer(instanceId))
  }, [history, instanceId, selectedKeyData?.name])

PROBLEM:
selectedKeyData.name has type RedisString.
RedisString is typically defined as: string | Buffer | { type: 'Buffer'; data: number[] }
The contract requires key: Uint8Array.

DISCOVERY STEPS:
1. Find the exact RedisString type:
   grep -rn 'type RedisString\|RedisString =' redisinsight/ui/src/ | head -10
   grep -rn 'type RedisResponseBuffer\|RedisResponseBuffer =' redisinsight/ui/src/ | head -10

2. Check what selectedKeyData.name actually is at runtime:
   grep -n 'name' redisinsight/ui/src/slices/browser/keys.ts | head -20

3. Check for existing conversion utilities:
   grep -rn 'Uint8Array' redisinsight/ui/src/utils/ | grep -i 'buffer\|convert\|string' | head -10
   grep -rn 'bufferToUint8Array\|stringToUint8Array\|toUint8Array\|redisStringToUint8Array' redisinsight/ui/src/ | head -10

4. Check how the vector-search path does the same thing (it creates a search-index ref, not vector-set, but may show the pattern):
   grep -rn 'setVectorVisualizerSource' redisinsight/ui/src/ | head -10

FIX APPROACH (choose based on discovery):

Option A — If RedisResponseBuffer has a .data property (Buffer-like):
  const key = selectedKeyData.name
  const keyBytes = typeof key === 'string'
    ? new TextEncoder().encode(key)
    : key instanceof Uint8Array
      ? key
      : new Uint8Array(key.data ?? [])
  setVectorVisualizerSource({ kind: 'vector-set', key: keyBytes })

Option B — If there's an existing utility:
  import { bufferToUint8Array } from 'uiSrc/utils'
  setVectorVisualizerSource({ kind: 'vector-set', key: bufferToUint8Array(selectedKeyData.name) })

Option C — If RedisString is already Buffer (which extends Uint8Array):
  setVectorVisualizerSource({ kind: 'vector-set', key: new Uint8Array(selectedKeyData.name as ArrayBufferLike) })

Choose whichever approach matches the actual types. The goal is: the value passed as `key` must be a Uint8Array at runtime, not a string or Buffer-like wrapper.

TESTING:
If VectorSetDetails.spec.tsx exists:
- Check if handleVisualize is tested
- If yes, verify the test still passes with the new conversion
- If no test exists for handleVisualize, add one that verifies setVectorVisualizerSource is called with { kind: 'vector-set', key: <Uint8Array instance> }

Verify with:
- npm run type-check 2>&1 | grep 'VectorSetDetails' → 0 error lines (or no NEW errors)
- node 'node_modules/.bin/jest' --testPathPattern='VectorSetDetails\|vector-set-details' -c jest.config.cjs → PASS

Output format:
STATUS: DONE | NEEDS_CONTEXT
FILES_CHANGED: VectorSetDetails.tsx [, VectorSetDetails.spec.tsx]
VERIFICATION_RUN: <exact commands with exit codes>
VERIFICATION_RESULT: <PASS/FAIL>
ASSUMPTIONS: <which conversion approach was used and why; what RedisString actually is>
NEXT_ACTION: <none>
Commit allowed: no
```
