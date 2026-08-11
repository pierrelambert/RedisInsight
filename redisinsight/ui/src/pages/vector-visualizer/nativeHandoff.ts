import {
  createVectorMemoryStore,
  type VectorDataSourceRef,
} from 'uiSrc/packages/vector-visualizer/src/contracts'

/**
 * The native route deliberately carries no source data in its URL/history.
 * This module is process-local and consumes the reference exactly once.
 */
export type { VectorDataSourceRef }

let pendingSource: VectorDataSourceRef | undefined

export const setVectorVisualizerSource = (source: VectorDataSourceRef) => {
  pendingSource = source
}

export const consumeVectorVisualizerSource = () => {
  const source = pendingSource
  pendingSource = undefined
  return source
}

export type NativeVisualizerWorkflow =
  | 'explore'
  | 'query-lab'
  | 'health'
  | 'compare-tune'
  | 'advanced'

export interface NativeVisualizerPreferences {
  workflow: NativeVisualizerWorkflow
}

/**
 * Owns the native host's cancellation and memory boundary. Preferences are
 * deliberately vector-free; source changes always invalidate prior work.
 */
export const createNativeVisualizerSession = (
  initialPreferences: Partial<NativeVisualizerPreferences> = {},
) => {
  const vectors = createVectorMemoryStore()
  let source: VectorDataSourceRef | undefined
  let generation = 0
  let controller: AbortController | undefined
  let preferences: NativeVisualizerPreferences = {
    workflow: initialPreferences.workflow ?? 'explore',
  }

  const invalidate = () => {
    controller?.abort()
    controller = undefined
    generation += 1
    vectors.clear()
  }

  return {
    setSource: (nextSource: VectorDataSourceRef) => {
      invalidate()
      source = nextSource
    },
    getSource: () => source,
    beginWork: () => {
      controller?.abort()
      controller = new AbortController()
      generation += 1
      return { generation, signal: controller.signal }
    },
    accept: <T>(workGeneration: number, value: T) =>
      workGeneration === generation && !controller?.signal.aborted
        ? { accepted: true as const, value }
        : { accepted: false as const, value: undefined },
    cancel: () => invalidate(),
    dispose: () => {
      invalidate()
      source = undefined
    },
    storeRawVector: (id: string, vector: Float32Array) =>
      vectors.set(id, new Float32Array(vector)),
    getRawVector: (id: string) => {
      const vector = vectors.get(id)
      return vector ? new Float32Array(vector) : undefined
    },
    rawVectorCount: () => vectors.size(),
    getPreferences: () => preferences,
    setPreferences: (nextPreferences: NativeVisualizerPreferences) => {
      preferences = { workflow: nextPreferences.workflow }
    },
  }
}
