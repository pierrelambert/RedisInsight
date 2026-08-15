import {
  createVectorMemoryStore,
  type VectorDataSourceRef,
} from 'uiSrc/packages/vector-visualizer/src/contracts'

/**
 * Binary Vector Set keys still use process-local handoff only. Search-index
 * sources are also encoded in URL query params so the route can be restored
 * after top-level navigation.
 */
export type { VectorDataSourceRef }

const SEARCH_INDEX_PARAM = 'index'
const SEARCH_VECTOR_FIELD_PARAM = 'vectorField'

let pendingSource: VectorDataSourceRef | undefined

export const setVectorVisualizerSource = (source: VectorDataSourceRef) => {
  pendingSource = source
}

export const consumeVectorVisualizerSource = () => {
  const source = pendingSource
  pendingSource = undefined
  return source
}

export const buildVectorVisualizerSourceSearch = (
  source: VectorDataSourceRef,
): string => {
  if (source.kind !== 'search-index') return ''

  const params = new URLSearchParams()
  params.set(SEARCH_INDEX_PARAM, source.index)
  params.set(SEARCH_VECTOR_FIELD_PARAM, source.vectorField)
  return params.toString()
}

export const parseVectorVisualizerSourceSearch = (
  search: string,
): VectorDataSourceRef | undefined => {
  const params = new URLSearchParams(search)
  const index = params.get(SEARCH_INDEX_PARAM)
  const vectorField = params.get(SEARCH_VECTOR_FIELD_PARAM)

  if (index == null || !vectorField) return undefined

  return {
    kind: 'search-index',
    index,
    vectorField,
  }
}

export const vectorVisualizerSourceKey = (
  source: VectorDataSourceRef,
): string =>
  source.kind === 'search-index'
    ? `search-index:${source.index}:${source.vectorField}`
    : `vector-set:${Array.from(source.key).join(',')}`

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
