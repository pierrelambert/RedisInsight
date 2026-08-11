import {
  asNumber,
  asText,
  CommandPlan,
  metricValue,
  NormalizedNeighbor,
  RedisArgument,
  toRecord,
  VectorMetric,
  VectorSourceCapabilities,
} from './contracts'

export const VECTOR_SET_CAPABILITIES: VectorSourceCapabilities = {
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

const plan = (
  command: string,
  arguments_: CommandPlan['arguments'],
): CommandPlan => ({
  command,
  arguments: arguments_,
  readOnly: true,
  provenance: { kind: 'measured', exactness: 'unknown' },
})

export const planVectorSetDiscovery = (key: RedisArgument): CommandPlan[] => [
  plan('VCARD', [key]),
  plan('VDIM', [key]),
  plan('VINFO', [key]),
]

export const planVectorSetSample = ({
  key,
  limit,
  supportsRange,
}: {
  key: RedisArgument
  limit: number
  supportsRange: boolean
}): CommandPlan =>
  supportsRange
    ? {
        ...plan('VRANGE', [key, '-', '+', String(limit)]),
        sampleMethod: 'range',
      }
    : {
        ...plan('VRANDMEMBER', [key, String(limit)]),
        sampleMethod: 'unseeded-random',
        visibleWarning: 'VRANDMEMBER fallback is unseeded.',
      }

export const planVectorSetEmbeddings = (
  key: RedisArgument,
  members: RedisArgument[],
) => members.map((member) => plan('VEMB', [key, member]))

export const planVectorSetAttributes = (
  key: RedisArgument,
  member: RedisArgument,
) => plan('VGETATTR', [key, member])

const isScalarAttribute = (
  value: unknown,
): value is string | number | boolean =>
  typeof value === 'string' ||
  typeof value === 'number' ||
  typeof value === 'boolean'

const vectorSetAttributeRecord = (reply: unknown): Record<string, unknown> => {
  const text = asText(reply)
  if (!text) return {}
  try {
    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      const decoded: unknown = JSON.parse(`"${text}"`)
      parsed = typeof decoded === 'string' ? JSON.parse(decoded) : undefined
    }
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {}
  } catch {
    return {}
  }
}

export const listVectorSetAttributeFields = (reply: unknown): string[] =>
  Object.entries(vectorSetAttributeRecord(reply))
    .filter(([, value]) => isScalarAttribute(value))
    .map(([field]) => field)
    .sort()

export const parseVectorSetAttributes = (
  reply: unknown,
  allowListedFields: string[],
): Record<string, string | number | boolean> => {
  const attributes = vectorSetAttributeRecord(reply)
  return Object.fromEntries(
    allowListedFields.flatMap((field) => {
      const value = attributes[field]
      return isScalarAttribute(value) ? [[field, value]] : []
    }),
  )
}

const binaryMemberId = (bytes: Uint8Array) =>
  `bytes:${Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('')}`

const binaryMember = (value: unknown): Uint8Array | undefined => {
  if (
    !ArrayBuffer.isView(value) ||
    !('BYTES_PER_ELEMENT' in value) ||
    value.BYTES_PER_ELEMENT !== 1
  )
    return undefined
  return new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
}

/**
 * Keep the original bulk-string argument alongside its display ID. Callers
 * use `argument` for a later Redis command; `id` is never re-encoded.
 */
export const parseVectorSetMember = (
  value: unknown,
): { id: string; argument: RedisArgument } | undefined => {
  if (typeof value === 'string') return { id: value, argument: value }
  const bytes = binaryMember(value)
  if (!bytes) return undefined
  const argument = new Uint8Array(bytes)
  try {
    const id = new TextDecoder('utf-8', { fatal: true }).decode(argument)
    if (/[\u0000-\u001f\u007f]/.test(id))
      return { id: binaryMemberId(argument), argument }
    return {
      id,
      argument,
    }
  } catch {
    return { id: binaryMemberId(argument), argument }
  }
}

/** Reconstructed VEMB values are for the in-memory layout path only. */
export const parseVectorSetEmbeddings = (
  replies: Array<{ member: RedisArgument; reply: unknown }>,
) => {
  const embeddings: Array<{
    id: string
    vector: Float32Array
    reconstructed: true
    provenance: { kind: 'measured'; exactness: 'unknown' }
  }> = []
  for (const { member, reply } of replies) {
    const id = parseVectorSetMember(member)?.id
    const rawValues = reply
    if (!id || !Array.isArray(rawValues)) continue
    const vectorValues = rawValues.map(asNumber)
    if (vectorValues.some((value) => value === undefined)) continue
    embeddings.push({
      id,
      vector: new Float32Array(vectorValues as number[]),
      reconstructed: true,
      provenance: { kind: 'measured', exactness: 'unknown' },
    })
  }
  return embeddings
}

export const planVectorSetNeighbors = ({
  key,
  vector,
  limit,
  filter,
  ef,
  filterEf,
}: {
  key: RedisArgument
  vector: number[]
  limit: number
  filter?: string
  ef?: number
  filterEf?: number
}): CommandPlan =>
  plan('VSIM', [
    key,
    'VALUES',
    String(vector.length),
    ...vector.map(String),
    'COUNT',
    String(limit),
    'WITHSCORES',
    ...(filter === undefined ? [] : ['FILTER', filter]),
    ...(ef === undefined ? [] : ['EF', String(ef)]),
    ...(filterEf === undefined ? [] : ['FILTER-EF', String(filterEf)]),
  ])

export const planVectorSetTruth = ({
  key,
  vector,
  limit,
}: {
  key: RedisArgument
  vector: number[]
  limit: number
}): CommandPlan => ({
  ...plan('VSIM', [
    key,
    'VALUES',
    String(vector.length),
    ...vector.map(String),
    'COUNT',
    String(limit),
    'WITHSCORES',
    'TRUTH',
  ]),
  requiresConfirmation: true,
  operation: 'VSIM TRUTH',
})

export const planVectorSetTopology = (
  key: RedisArgument,
  member: RedisArgument,
) => plan('VLINKS', [key, member])

export interface VectorSetGraphFacts {
  maxLevel: number
  provenance: {
    command: 'VINFO'
    kind: 'measured'
    exactness: 'unknown'
  }
}

export interface VectorSetInfoFacts {
  dimensions?: number
  quantization?: string
  graphFacts?: VectorSetGraphFacts
}

/**
 * Retain only documented VINFO fields. `max-level` describes the returned
 * Vector Set graph; it does not expose traversal or imply Search HNSW parity.
 */
export const parseVectorSetInfo = (reply: unknown): VectorSetInfoFacts => {
  const info = toRecord(reply)
  const dimensions = asNumber(info['vector-dim'])
  const quantization = asText(info['quant-type'])
  const maxLevel = asNumber(info['max-level'])
  const hasMaxLevel =
    maxLevel !== undefined && Number.isInteger(maxLevel) && maxLevel >= 0
  return {
    ...(dimensions === undefined ? {} : { dimensions }),
    ...(quantization === undefined ? {} : { quantization }),
    ...(hasMaxLevel
      ? {
          graphFacts: {
            maxLevel,
            provenance: {
              command: 'VINFO' as const,
              kind: 'measured' as const,
              exactness: 'unknown' as const,
            },
          },
        }
      : {}),
  }
}

export type VectorSetDiscovery =
  | {
      kind: 'available'
      cardinality: number
      dimensions: number
      quantization?: string
      graphFacts?: VectorSetGraphFacts
      capabilities: VectorSourceCapabilities
    }
  | {
      kind: 'unavailable'
      reason:
        | 'invalid-cardinality'
        | 'invalid-dimensions'
        | 'dimension-mismatch'
    }

/**
 * VCARD, VDIM, and VINFO are separate native replies. Keep them separate
 * until all numeric facts agree, rather than treating a partial reply as a
 * usable source description.
 */
export const combineVectorSetDiscovery = ({
  vcardReply,
  vdimReply,
  vinfoReply,
}: {
  vcardReply: unknown
  vdimReply: unknown
  vinfoReply: unknown
}): VectorSetDiscovery => {
  const cardinality = asNumber(vcardReply)
  if (cardinality === undefined || cardinality < 0)
    return { kind: 'unavailable', reason: 'invalid-cardinality' }

  const dimensions = asNumber(vdimReply)
  if (dimensions === undefined || dimensions <= 0)
    return { kind: 'unavailable', reason: 'invalid-dimensions' }

  const vinfo = parseVectorSetInfo(vinfoReply)
  const vinfoDimensions = vinfo.dimensions
  if (vinfoDimensions !== undefined && vinfoDimensions !== dimensions)
    return { kind: 'unavailable', reason: 'dimension-mismatch' }

  return {
    kind: 'available',
    cardinality,
    dimensions,
    quantization: vinfo.quantization,
    graphFacts: vinfo.graphFacts,
    capabilities: VECTOR_SET_CAPABILITIES,
  }
}

export interface VectorSetNeighborReply {
  neighbors: NormalizedNeighbor[]
  /** Maps display IDs to the original Redis bulk-string arguments. */
  members: Map<string, RedisArgument>
}

export const parseVectorSetNeighborReply = (
  reply: unknown,
  metric: VectorMetric | 'unknown',
): VectorSetNeighborReply => {
  const pairs: Array<[unknown, unknown]> = Array.isArray(reply)
    ? Array.from({ length: Math.floor(reply.length / 2) }, (_, index) => [
        reply[index * 2],
        reply[index * 2 + 1],
      ])
    : reply instanceof Map
      ? [...reply.entries()]
      : []
  const members = new Map<string, RedisArgument>()
  const neighbors = pairs.flatMap(([memberValue, scoreValue]) => {
    const member = parseVectorSetMember(memberValue)
    const rawValue = asNumber(scoreValue)
    if (!member || rawValue === undefined) return []
    members.set(member.id, member.argument)
    return [
      {
        id: member.id,
        rawValue,
        ...(metric === 'unknown'
          ? { metric: 'score' as const, value: rawValue }
          : metricValue(metric, rawValue)),
        provenance: {
          kind: 'measured' as const,
          exactness: 'approximate' as const,
        },
      },
    ]
  })
  return { neighbors, members }
}

export const parseVectorSetNeighbors = (
  reply: unknown,
  metric: VectorMetric | 'unknown',
): NormalizedNeighbor[] => parseVectorSetNeighborReply(reply, metric).neighbors

export const parseVectorSetProfile = (input: {
  count?: number
  ef?: number
  filterEf?: number
  elapsedMs?: number
}) => ({ kind: 'reduced' as const, ...input })
