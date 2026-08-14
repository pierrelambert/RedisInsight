import {
  asText,
  CommandPlan,
  RedisArgument,
  toRecord,
  VectorDataSourceRef,
} from 'uiSrc/packages/vector-visualizer/src/contracts'

export type SearchDocumentStorage = 'hash' | 'json'

export type NativeDocumentExport =
  | {
      id: string
      source: {
        kind: 'search-index'
        index: string
        storage: SearchDocumentStorage
      }
      document: unknown
    }
  | {
      id: string
      source: {
        kind: 'vector-set'
      }
      attributes: Record<string, unknown>
    }

const measuredUnknown = {
  kind: 'measured',
  exactness: 'unknown',
} as const

const plan = (
  command: string,
  arguments_: CommandPlan['arguments'],
): CommandPlan => ({
  command,
  arguments: arguments_,
  readOnly: true,
  provenance: measuredUnknown,
})

export const planSearchDocumentExport = ({
  id,
  storage,
}: {
  id: string
  storage: SearchDocumentStorage
}): CommandPlan =>
  storage === 'json' ? plan('JSON.GET', [id]) : plan('HGETALL', [id])

export const planVectorSetDocumentExport = ({
  key,
  member,
}: {
  key: RedisArgument
  member: RedisArgument
}): CommandPlan => plan('VGETATTR', [key, member])

const parseJsonDocument = (reply: unknown) => {
  const text = asText(reply)
  if (!text) return reply
  try {
    const parsed: unknown = JSON.parse(text)
    return parsed
  } catch {
    return text
  }
}

const parseHashDocument = (reply: unknown) => toRecord(reply)

const parseVectorSetAttributes = (reply: unknown) => {
  const text = asText(reply)
  if (!text) return {}
  try {
    const parsed: unknown = JSON.parse(text)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {}
  } catch {
    return {}
  }
}

export const parseNativeDocumentExport = ({
  id,
  reply,
  source,
  storage,
}: {
  id: string
  reply: unknown
  source: VectorDataSourceRef
  storage?: SearchDocumentStorage
}): NativeDocumentExport => {
  if (source.kind === 'search-index') {
    const searchStorage = storage ?? 'hash'
    return {
      id,
      source: {
        kind: 'search-index',
        index: source.index,
        storage: searchStorage,
      },
      document:
        searchStorage === 'json'
          ? parseJsonDocument(reply)
          : parseHashDocument(reply),
    }
  }

  return {
    id,
    source: {
      kind: 'vector-set',
    },
    attributes: parseVectorSetAttributes(reply),
  }
}
