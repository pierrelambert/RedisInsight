import type {
  CommandPlan,
  RedisArgument,
} from 'uiSrc/packages/vector-visualizer/src/contracts'
import type {
  BenchmarkRunV1,
  LocalManifestV1,
} from 'uiSrc/packages/vector-visualizer/src/compare/compare'
import {
  parseVectorSetNeighbors,
  planVectorSetNeighbors,
  planVectorSetTruth,
} from 'uiSrc/packages/vector-visualizer/src/vectorSetAdapter'

export const runNativeVectorSetBenchmark = async ({
  key,
  anchorVector,
  limit,
  manifest,
  execute,
  signal,
  now = () => performance.now(),
  completedAt = new Date().toISOString(),
}: {
  key: RedisArgument
  anchorVector: Float32Array
  limit: number
  manifest: LocalManifestV1
  execute(plan: CommandPlan, signal?: AbortSignal): Promise<unknown>
  signal?: AbortSignal
  now?: () => number
  completedAt?: string
}): Promise<BenchmarkRunV1> => {
  const startedAt = now()
  const approximateReply = await execute(
    planVectorSetNeighbors({
      key,
      vector: [...anchorVector],
      limit,
    }),
    signal,
  )
  const latencyMs = now() - startedAt
  const truthReply = await execute(
    planVectorSetTruth({ key, vector: [...anchorVector], limit }),
    signal,
  )
  const approximateIds = new Set(
    parseVectorSetNeighbors(approximateReply, 'unknown').map(({ id }) => id),
  )
  const truthIds = parseVectorSetNeighbors(truthReply, 'unknown').map(
    ({ id }) => id,
  )
  if (!truthIds.length) throw new Error('benchmark-truth-unavailable')
  const recall =
    truthIds.filter((id) => approximateIds.has(id)).length / truthIds.length
  return {
    version: 1,
    id: `vector-set-truth-${completedAt}`,
    manifest,
    recall: {
      value: recall,
      evidence: 'measured',
      detail: `Measured overlap with explicit VSIM TRUTH at k=${limit}`,
    },
    latencyMs: {
      value: latencyMs,
      evidence: 'measured',
      detail:
        'Measured client-observed latency for the bounded non-TRUTH VSIM request',
    },
    memoryMb: {
      evidence: 'unavailable',
      detail:
        'Comparable Redis/index memory was not observed for this benchmark run',
    },
    completedAt,
  }
}
