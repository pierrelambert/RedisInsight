import { asText } from './contracts'
import type { VectorSourceCapabilities } from './contracts'

export type {
  LayoutJobV1,
  VectorSourceCapabilities,
  VectorVisualizerHostAdapter,
} from './contracts'

export type VectorSourceKind = 'search-index' | 'vector-set'

export interface VectorSourceAdapter {
  readonly source: VectorSourceKind
  readonly capabilities: VectorSourceCapabilities
}

export const getSourceCapabilities = (
  source: VectorSourceKind,
): VectorSourceCapabilities =>
  source === 'search-index'
    ? {
        describe: true,
        enumerate: true,
        deterministicSample: false,
        rawVectors: true,
        reconstructedVectors: false,
        filteredNeighbors: true,
        exactNeighbors: 'controlled-comparison',
        queryProfile: 'full',
        topology: 'none',
      }
    : {
        describe: true,
        enumerate: true,
        deterministicSample: false,
        rawVectors: false,
        reconstructedVectors: true,
        filteredNeighbors: true,
        exactNeighbors: 'native',
        queryProfile: 'reduced',
        topology: 'hnsw-adjacency',
      }

type SearchFieldValue = string | number | boolean | null

export interface DecodedSearchRow {
  id: string
  storage: 'hash' | 'json'
  fields: Record<string, SearchFieldValue>
}

const VECTOR_FIELD_NAMES = new Set(['embedding', 'vector'])

const toText = (value: unknown): string => {
  return asText(value) ?? String(value)
}

const nonVectorFields = (
  values: unknown[],
): Record<string, SearchFieldValue> => {
  const fields: Record<string, SearchFieldValue> = {}
  for (let index = 0; index + 1 < values.length; index += 2) {
    const name = toText(values[index])
    if (!VECTOR_FIELD_NAMES.has(name.toLowerCase())) {
      const value = values[index + 1]
      if (
        value === null ||
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
      ) {
        fields[name] = value
      }
    }
  }
  return fields
}

export const decodeSearchReply = (reply: unknown[]): DecodedSearchRow[] => {
  const rows: DecodedSearchRow[] = []
  for (let index = 1; index + 1 < reply.length; index += 2) {
    const id = toText(reply[index])
    const replyValues = reply[index + 1]
    const values: unknown[] = Array.isArray(replyValues) ? replyValues : []
    const json = values.length === 2 && toText(values[0]) === '$'
    const parsedJson = json ? safeObject(toText(values[1])) : undefined
    rows.push({
      id,
      storage: json ? 'json' : 'hash',
      fields: parsedJson ?? nonVectorFields(values),
    })
  }
  return rows
}

const safeObject = (
  value: string,
): Record<string, SearchFieldValue> | undefined => {
  try {
    const parsed = JSON.parse(value)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
      return undefined
    return Object.entries(parsed).reduce<Record<string, SearchFieldValue>>(
      (fields, [name, fieldValue]) => {
        if (
          !VECTOR_FIELD_NAMES.has(name.toLowerCase()) &&
          (fieldValue === null ||
            typeof fieldValue === 'string' ||
            typeof fieldValue === 'number' ||
            typeof fieldValue === 'boolean')
        ) {
          fields[name] = fieldValue
        }
        return fields
      },
      {},
    )
  } catch {
    return undefined
  }
}

export interface VectorSetReply {
  elements: Array<{
    name: Uint8Array | string
    score: number
    attributes?: string
  }>
  reconstructedVectors?: Float32Array[]
}

export const decodeVectorSetReply = (reply: VectorSetReply) => ({
  members: reply.elements.map((element) => ({
    id: toText(element.name),
    score: element.score,
    attributes: safeObject(element.attributes ?? '') ?? {},
  })),
  vectorCount: reply.reconstructedVectors?.length ?? 0,
})

export const createAbortableReadOnlyExecutor =
  <T>(execute: (command: string) => Promise<T>) =>
  (command: string, signal?: AbortSignal): Promise<T> =>
    new Promise((resolve, reject) => {
      const cancelled = () => reject(new Error('Read-only command cancelled'))
      if (signal?.aborted) {
        cancelled()
        return
      }
      signal?.addEventListener('abort', cancelled, { once: true })
      execute(command)
        .then(resolve, reject)
        .finally(() => {
          signal?.removeEventListener('abort', cancelled)
        })
    })

export const WORKBENCH_SAMPLE_LIMITS = {
  responseBytes: 1024 * 1024,
  pluginStateBytes: 1024 * 1024,
  defaultSampleItems: 2000,
  atlas: {
    available: false,
    reason: 'plugin SDK execution has no AbortSignal contract',
  },
} as const
