import {
  asNumber,
  asText,
  CommandPlan,
  EvidenceProvenance,
  NormalizedNeighbor,
  recordValue,
  toRecord,
  VectorMetric,
  VectorSourceCapabilities,
} from './contracts'

export const SEARCH_CAPABILITIES: VectorSourceCapabilities = {
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

const measuredUnknown: EvidenceProvenance = {
  kind: 'measured',
  exactness: 'unknown',
}
const plan = (
  command: string,
  arguments_: CommandPlan['arguments'],
): CommandPlan => ({
  command,
  arguments: arguments_,
  readOnly: true,
  provenance: measuredUnknown,
})

export const planSearchDiscovery = (index: string) => plan('FT.INFO', [index])

export const planSearchSample = ({
  index,
  vectorField,
  filter,
  limit,
  allowListedFields = [],
}: {
  index: string
  vectorField: string
  filter?: string
  limit: number
  allowListedFields?: string[]
}): CommandPlan => ({
  ...plan('FT.SEARCH', [
    index,
    filter?.trim() || '*',
    'LIMIT',
    '0',
    String(limit),
    'RETURN',
    String(1 + allowListedFields.length),
    vectorField,
    ...allowListedFields,
    'DIALECT',
    '2',
  ]),
  order: 'nondeterministic',
  caveat:
    'FT.SEARCH LIMIT ordering is nondeterministic without an explicit SORTBY.',
})

export const planSearchNeighbors = ({
  index,
  vectorField,
  filter,
  queryParameter,
  vector,
  limit,
}: {
  index: string
  vectorField: string
  filter?: string
  queryParameter: string
  vector: Uint8Array
  limit: number
}): CommandPlan => {
  const query = `${filter ? `(${filter})` : '*'}=>[KNN ${limit} @${vectorField} $${queryParameter} AS __vv_metric]`
  return plan('FT.SEARCH', [
    index,
    query,
    'PARAMS',
    '2',
    queryParameter,
    vector,
    'SORTBY',
    '__vv_metric',
    'ASC',
    'RETURN',
    '1',
    '__vv_metric',
    'DIALECT',
    '2',
  ])
}

export const planSearchProfile = (index: string, query: string) =>
  plan('FT.PROFILE', [index, 'SEARCH', 'QUERY', query, 'LIMITED'])

export interface SearchVectorField {
  name: string
  dimensions?: number
  metric?: VectorMetric
  algorithm?: string
  dataType?: string
}

export interface SearchSampleField {
  vectorField: string
  dimensions?: number
  dataType?: string
}

/**
 * The native CLI RAW formatter represents Redis buffers with the same ASCII
 * escaping used by the key-value UI. This inverse is deliberately scoped to
 * a field already proven VECTOR by FT.INFO; it must never be applied to
 * arbitrary metadata or text fields.
 */
const decodeRawVectorBytes = (raw: unknown): Uint8Array | undefined => {
  if (typeof raw !== 'string') return undefined
  const bytes: number[] = []
  for (let index = 0; index < raw.length; index += 1) {
    const code = raw.charCodeAt(index)
    if (code !== 92) {
      if (code < 32 || code > 126) return undefined
      bytes.push(code)
      continue
    }
    const escape = raw[++index]
    if (escape === 'x') {
      const hex = raw.slice(index + 1, index + 3)
      if (!/^[0-9a-f]{2}$/i.test(hex)) return undefined
      bytes.push(Number.parseInt(hex, 16))
      index += 2
      continue
    }
    const escapedBytes: Record<string, number> = {
      a: 7,
      b: 8,
      t: 9,
      n: 10,
      r: 13,
      '"': 34,
      '\\': 92,
    }
    if (escape === undefined || escapedBytes[escape] === undefined)
      return undefined
    bytes.push(escapedBytes[escape])
  }
  return new Uint8Array(bytes)
}

const decodeSearchVector = (
  value: unknown,
  field: SearchSampleField,
): Float32Array | undefined => {
  if (
    field.dimensions === undefined ||
    field.dimensions <= 0 ||
    (field.dataType !== 'FLOAT32' && field.dataType !== 'FLOAT64')
  )
    return undefined
  const bytes = decodeRawVectorBytes(value)
  const width = field.dataType === 'FLOAT32' ? 4 : 8
  if (!bytes || bytes.byteLength !== field.dimensions * width) return undefined
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const values = new Float32Array(field.dimensions)
  for (let index = 0; index < field.dimensions; index += 1) {
    const valueAtIndex =
      field.dataType === 'FLOAT32'
        ? view.getFloat32(index * width, true)
        : view.getFloat64(index * width, true)
    if (!Number.isFinite(valueAtIndex)) return undefined
    values[index] = valueAtIndex
  }
  return values
}

/** Parses bounded RESP2 FT.SEARCH sample rows after FT.INFO schema validation. */
export const parseSearchSample = (
  reply: unknown,
  field: SearchSampleField,
): Array<{ id: string; vector: Float32Array }> => {
  const sample: Array<{ id: string; vector: Float32Array }> = []
  const resp3 = toRecord(reply)
  const results = recordValue(resp3, 'results')
  if (Array.isArray(results)) {
    for (const result of results) {
      const row = toRecord(result)
      const attributes = toRecord(
        recordValue(row, 'extra_attributes') ?? recordValue(row, 'attributes'),
      )
      const id = asText(recordValue(row, 'id'))
      const vector = decodeSearchVector(
        recordValue(attributes, field.vectorField),
        field,
      )
      if (id && vector) sample.push({ id, vector })
    }
    return sample
  }
  const rows = Array.isArray(reply) ? reply : []
  for (let index = 1; index + 1 < rows.length; index += 2) {
    const id = asText(rows[index])
    const fields = toRecord(rows[index + 1])
    const vector = decodeSearchVector(
      recordValue(fields, field.vectorField),
      field,
    )
    if (id && vector) sample.push({ id, vector })
  }
  return sample
}

/** Only explicitly requested scalar fields may cross the sampling boundary. */
export const parseAllowListedSearchMetadata = (
  reply: unknown,
  allowListedFields: string[],
): Map<string, Record<string, string | number | boolean>> => {
  const allowed = new Set(allowListedFields)
  const metadata = new Map<string, Record<string, string | number | boolean>>()
  const read = (
    id: string | undefined,
    attributes: Record<string, unknown>,
  ) => {
    if (!id) return
    const values = Object.fromEntries(
      allowListedFields.flatMap((field) => {
        const value = recordValue(attributes, field)
        return allowed.has(field) &&
          (typeof value === 'string' ||
            typeof value === 'number' ||
            typeof value === 'boolean')
          ? [[field, value]]
          : []
      }),
    )
    metadata.set(id, values)
  }
  const resp3 = toRecord(reply)
  const results = recordValue(resp3, 'results')
  if (Array.isArray(results)) {
    results.forEach((result) => {
      const row = toRecord(result)
      read(
        asText(recordValue(row, 'id')),
        toRecord(
          recordValue(row, 'extra_attributes') ??
            recordValue(row, 'attributes'),
        ),
      )
    })
    return metadata
  }
  const rows = Array.isArray(reply) ? reply : []
  for (let index = 1; index + 1 < rows.length; index += 2)
    read(asText(rows[index]), toRecord(rows[index + 1]))
  return metadata
}

export const parseSearchInfo = (reply: unknown) => {
  const info = toRecord(reply)
  const definition = toRecord(recordValue(info, 'index_definition'))
  const attributes = recordValue(info, 'attributes')
  const fieldRows = Array.isArray(attributes) ? attributes : []
  const vectorFields = fieldRows
    .flatMap((field) => {
      const data = toRecord(field)
      if (asText(recordValue(data, 'type'))?.toUpperCase() !== 'VECTOR')
        return []
      const metric = asText(recordValue(data, 'distance_metric'))?.toLowerCase()
      return [
        {
          name:
            asText(recordValue(data, 'attribute')) ??
            asText(recordValue(data, 'identifier')) ??
            '',
          dimensions: asNumber(recordValue(data, 'dim')),
          metric:
            metric === 'cosine' || metric === 'l2' || metric === 'ip'
              ? metric
              : undefined,
          algorithm: asText(recordValue(data, 'algorithm'))?.toLowerCase(),
          dataType: asText(recordValue(data, 'data_type')),
        } satisfies SearchVectorField,
      ]
    })
    .filter((field) => field.name)
  const metadataFields = fieldRows.flatMap((field) => {
    const data = toRecord(field)
    const type = asText(recordValue(data, 'type'))?.toUpperCase()
    if (type !== 'TEXT' && type !== 'TAG' && type !== 'NUMERIC') return []
    const name =
      asText(recordValue(data, 'attribute')) ??
      asText(recordValue(data, 'identifier'))
    return name ? [name] : []
  })
  const storage =
    asText(recordValue(definition, 'key_type'))?.toLowerCase() === 'json'
      ? 'json'
      : 'hash'
  return {
    storage,
    indexedCount: asNumber(recordValue(info, 'num_docs')) ?? 0,
    vectorFields,
    metadataFields,
  }
}

export interface SearchNeighborEvidence {
  metric: VectorMetric
  algorithm?: string
  exactness?: EvidenceProvenance['exactness']
}

const normalizeSearchNeighbor = (
  id: string | undefined,
  rawValue: number | undefined,
  source: SearchNeighborEvidence,
): NormalizedNeighbor | undefined => {
  if (!id || rawValue === undefined) return undefined
  return {
    id,
    rawValue,
    metric: 'distance',
    value: rawValue,
    sourceMetric: source.metric,
    provenance: {
      kind: 'measured',
      exactness:
        source.exactness ??
        (source.algorithm?.toLowerCase() === 'flat'
          ? 'exact'
          : source.algorithm
            ? 'approximate'
            : 'unknown'),
    },
  }
}

export const parseSearchNeighbors = (
  reply: unknown,
  source: SearchNeighborEvidence,
): NormalizedNeighbor[] => {
  const resp3 = toRecord(reply)
  const resultRows = recordValue(resp3, 'results')
  if (Array.isArray(resultRows)) {
    return resultRows.flatMap((result) => {
      const row = toRecord(result)
      const attributes = toRecord(
        recordValue(row, 'extra_attributes') ?? recordValue(row, 'attributes'),
      )
      const neighbor = normalizeSearchNeighbor(
        asText(recordValue(row, 'id')),
        asNumber(recordValue(attributes, '__vv_metric')),
        source,
      )
      return neighbor ? [neighbor] : []
    })
  }
  const rows = Array.isArray(reply) ? reply : []
  const neighbors: NormalizedNeighbor[] = []
  for (let index = 1; index + 1 < rows.length; index += 2) {
    const id = asText(rows[index])
    const fields = toRecord(rows[index + 1])
    const rawValue = asNumber(recordValue(fields, '__vv_metric'))
    const neighbor = normalizeSearchNeighbor(id, rawValue, source)
    if (neighbor) neighbors.push(neighbor)
  }
  return neighbors
}

type FlatProfile = [unknown, unknown, ...unknown[]]

const isFlatProfile = (value: unknown): value is FlatProfile => {
  if (!Array.isArray(value) || value.length < 2 || value.length % 2 !== 0)
    return false
  for (let index = 0; index + 1 < value.length; index += 2) {
    if (!asText(value[index])) return false
  }
  return true
}

const profileRecord = (value: unknown): Record<string, unknown> => {
  if (!Array.isArray(value) || isFlatProfile(value)) return toRecord(value)
  const pairs = value.flatMap((entry) => {
    if (!Array.isArray(entry) || entry.length < 2) return []
    const key = asText(entry[0])
    return key ? [[key, entry[1]]] : []
  })
  return pairs.length > 0 ? Object.fromEntries(pairs) : toRecord(value)
}

const normalizeProfileStage = (value: unknown) => {
  const record = profileRecord(value)
  const stage: Record<string, unknown> = {}
  for (const key of ['Type', 'Name', 'Iterator']) {
    const name = asText(recordValue(record, key))
    if (name) {
      stage[key] = name
      break
    }
  }
  for (const key of ['Counter', 'Count', 'Number of reading operations']) {
    const count = recordValue(record, key)
    if (asNumber(count) !== undefined) {
      stage[key] = count
      break
    }
  }
  const mode = asText(recordValue(record, 'Mode'))
  if (mode) stage.Mode = mode
  return Object.keys(stage).length > 0 ? stage : undefined
}

const normalizeIteratorStages = (value: unknown) => {
  if (isFlatProfile(value)) return [normalizeProfileStage(value)]
  if (!Array.isArray(value)) return [normalizeProfileStage(value)]
  const isFieldPairArray = value.every(
    (entry) => Array.isArray(entry) && entry.length === 2 && asText(entry[0]),
  )
  return isFieldPairArray
    ? [normalizeProfileStage(value)]
    : value.map((stage) => normalizeProfileStage(stage))
}

const profileEntries = (value: unknown): Array<[string, unknown]> => {
  if (value instanceof Map)
    return [...value.entries()].flatMap(([key, item]) => {
      const name = asText(key)
      return name ? [[name, item]] : []
    })
  if (isFlatProfile(value)) {
    const entries: Array<[string, unknown]> = []
    for (let index = 0; index + 1 < value.length; index += 2)
      entries.push([asText(value[index])!, value[index + 1]])
    return entries
  }
  if (Array.isArray(value) && value.some((entry) => isFlatProfile(entry)))
    return []
  if (Array.isArray(value))
    return value.flatMap((entry) => {
      if (!Array.isArray(entry) || entry.length < 2) return []
      const key = asText(entry[0])
      return key ? [[key, entry[1]]] : []
    })
  if (value && typeof value === 'object') return Object.entries(value)
  return []
}

export const parseSearchProfile = (reply: unknown) => {
  const replyRecord = toRecord(reply)
  const keyedProfile = recordValue(replyRecord, 'Profile')
  const rawProfile =
    keyedProfile ??
    (Array.isArray(reply) && reply.length === 2 ? reply[1] : undefined)
  const facts = profileRecord(rawProfile)
  const stages: Record<string, unknown>[] = []
  const stageSignatures = new Set<string>()
  const visited = new Set<unknown>()

  const visit = (value: unknown) => {
    if (!value || typeof value !== 'object' || visited.has(value)) return
    visited.add(value)
    const record = profileRecord(value)
    const iteratorStages = recordValue(record, 'Iterators profile')
    if (iteratorStages !== undefined) {
      normalizeIteratorStages(iteratorStages).forEach((stage) => {
        if (!stage) return
        const signature = JSON.stringify(stage)
        if (!stageSignatures.has(signature)) {
          stageSignatures.add(signature)
          stages.push(stage)
        }
      })
    }
    const entries = profileEntries(value)
    if (entries.length > 0) {
      entries.forEach(([key, item]) => {
        if (key.toLowerCase() !== 'result processors profile') visit(item)
      })
      return
    }
    if (Array.isArray(value)) value.forEach((item) => visit(item))
  }

  visit(rawProfile)
  const factEntries = Object.fromEntries(
    Object.entries(facts).filter(([key, value]) => {
      return (
        key.toLowerCase() !== 'iterators profile' &&
        (typeof value === 'string' ||
          typeof value === 'number' ||
          typeof value === 'boolean')
      )
    }),
  )
  return { kind: 'full' as const, stages, facts: factEntries }
}
