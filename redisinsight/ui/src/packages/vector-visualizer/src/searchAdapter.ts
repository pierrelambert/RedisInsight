import {
  AggregateQueryInput,
  AggregateResult,
  AggregateResultGroup,
  asNumber,
  asText,
  CommandPlan,
  EvidenceProvenance,
  HybridQueryInput,
  HybridQueryResult,
  HybridScoreDocument,
  NormalizedNeighbor,
  RedisArgument,
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

/** Query-time runtime tuning knobs threaded into the FT.SEARCH PARAMS section. */
interface RuntimeQueryParams {
  efRuntime?: number
  hybridPolicy?: 'AUTO' | 'BATCHES' | 'ADHOC_BF'
  batchSize?: number
  searchWindowSize?: number
  shardKRatio?: number
  useSearchHistory?: 'OFF' | 'ON' | 'AUTO'
  searchBufferCapacity?: number
}

/** Builds the extra PARAMS name/value token pairs for runtime query tuning. */
const buildRuntimeParamTokens = (
  runtimeParams?: RuntimeQueryParams,
): RedisArgument[] => {
  if (!runtimeParams) return []
  const {
    efRuntime,
    hybridPolicy,
    batchSize,
    searchWindowSize,
    shardKRatio,
    useSearchHistory,
    searchBufferCapacity,
  } = runtimeParams
  const extraParams: [string, string][] = []
  if (efRuntime !== undefined)
    extraParams.push(['EF_RUNTIME', String(efRuntime)])
  if (hybridPolicy) extraParams.push(['HYBRID_POLICY', hybridPolicy])
  if (batchSize !== undefined)
    extraParams.push(['BATCH_SIZE', String(batchSize)])
  if (searchWindowSize !== undefined)
    extraParams.push(['SEARCH_WINDOW_SIZE', String(searchWindowSize)])
  if (shardKRatio !== undefined)
    extraParams.push(['$SHARD_K_RATIO', String(shardKRatio)])
  if (useSearchHistory)
    extraParams.push(['USE_SEARCH_HISTORY', useSearchHistory])
  if (searchBufferCapacity !== undefined)
    extraParams.push(['SEARCH_BUFFER_CAPACITY', String(searchBufferCapacity)])
  return extraParams.flat()
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
  runtimeParams,
}: {
  index: string
  vectorField: string
  filter?: string
  queryParameter: string
  vector: Uint8Array
  limit: number
  runtimeParams?: RuntimeQueryParams
}): CommandPlan => {
  const query = `${filter ? `(${filter})` : '*'}=>[KNN ${limit} @${vectorField} $${queryParameter} AS __vv_metric]`
  const extraParamTokens = buildRuntimeParamTokens(runtimeParams)
  return plan('FT.SEARCH', [
    index,
    query,
    'PARAMS',
    String(2 + extraParamTokens.length),
    queryParameter,
    vector,
    ...extraParamTokens,
    'SORTBY',
    '__vv_metric',
    'ASC',
    'LIMIT',
    '0',
    String(limit),
    'RETURN',
    '1',
    '__vv_metric',
    'DIALECT',
    '2',
  ])
}

const buildRangeQuery = ({
  vectorField,
  filter,
  queryParameter,
  radius,
  epsilon,
}: {
  vectorField: string
  filter?: string
  queryParameter: string
  radius: number
  epsilon?: number
}): string => {
  const attributes = [
    '$YIELD_DISTANCE_AS: __vv_metric',
    ...(epsilon !== undefined ? [`$EPSILON: ${epsilon}`] : []),
  ].join('; ')
  const rangeClause = `@${vectorField}:[VECTOR_RANGE ${radius} $${queryParameter}]=>{${attributes}}`
  return filter ? `(${filter}) ${rangeClause}` : rangeClause
}

export const planRangeQuery = ({
  index,
  vectorField,
  filter,
  queryParameter,
  vector,
  radius,
  epsilon,
  limit = 200,
  runtimeParams,
}: {
  index: string
  vectorField: string
  filter?: string
  queryParameter: string
  vector: Uint8Array
  radius: number
  epsilon?: number
  limit?: number
  runtimeParams?: RuntimeQueryParams
}): CommandPlan => {
  const query = buildRangeQuery({
    vectorField,
    filter,
    queryParameter,
    radius,
    epsilon,
  })
  const extraParamTokens = buildRuntimeParamTokens(runtimeParams)
  return plan('FT.SEARCH', [
    index,
    query,
    'PARAMS',
    String(2 + extraParamTokens.length),
    queryParameter,
    vector,
    ...extraParamTokens,
    'SORTBY',
    '__vv_metric',
    'ASC',
    'LIMIT',
    '0',
    String(limit),
    'DIALECT',
    '2',
  ])
}

export const planProfileRangeQuery = ({
  index,
  vectorField,
  filter,
  queryParameter,
  vector,
  radius,
  epsilon,
  limit = 200,
  runtimeParams,
}: {
  index: string
  vectorField: string
  filter?: string
  queryParameter: string
  vector: Uint8Array
  radius: number
  epsilon?: number
  limit?: number
  runtimeParams?: RuntimeQueryParams
}): CommandPlan => {
  const query = buildRangeQuery({
    vectorField,
    filter,
    queryParameter,
    radius,
    epsilon,
  })
  const extraParamTokens = buildRuntimeParamTokens(runtimeParams)
  return plan('FT.PROFILE', [
    index,
    'SEARCH',
    'LIMITED',
    'QUERY',
    query,
    'PARAMS',
    String(2 + extraParamTokens.length),
    queryParameter,
    vector,
    ...extraParamTokens,
    'SORTBY',
    '__vv_metric',
    'ASC',
    'LIMIT',
    '0',
    String(limit),
    'DIALECT',
    '2',
  ])
}

export const planSearchProfile = (index: string, query: string) =>
  plan('FT.PROFILE', [index, 'SEARCH', 'QUERY', query, 'LIMITED'])

export const planProfileSearchNeighbors = ({
  index,
  vectorField,
  filter,
  queryParameter,
  vector,
  limit,
  runtimeParams,
}: {
  index: string
  vectorField: string
  filter?: string
  queryParameter: string
  vector: Uint8Array
  limit: number
  runtimeParams?: RuntimeQueryParams
}): CommandPlan => {
  const query = `${filter ? `(${filter})` : '*'}=>[KNN ${limit} @${vectorField} $${queryParameter} AS __vv_metric]`
  const extraParamTokens = buildRuntimeParamTokens(runtimeParams)
  return plan('FT.PROFILE', [
    index,
    'SEARCH',
    'LIMITED',
    'QUERY',
    query,
    'PARAMS',
    String(2 + extraParamTokens.length),
    queryParameter,
    vector,
    ...extraParamTokens,
    'SORTBY',
    '__vv_metric',
    'ASC',
    'LIMIT',
    '0',
    String(limit),
    'RETURN',
    '1',
    '__vv_metric',
    'DIALECT',
    '2',
  ])
}

export interface SearchVectorField {
  name: string
  dimensions?: number
  metric?: VectorMetric
  algorithm?: string
  dataType?: string
  /** HNSW M graph connectivity. */
  m?: number
  /** HNSW EF_CONSTRUCTION build-time graph quality. */
  efConstruction?: number
  /** HNSW EF_RUNTIME query-time default. */
  efRuntime?: number
  /** SVS-VAMANA compression type (LVQ8, LVQ4, LVQ4x4, LVQ4x8, LeanVec4x8, LeanVec8x8). */
  compression?: string
  /** SVS-VAMANA GRAPH_MAX_DEGREE. */
  graphMaxDegree?: number
  /** SVS-VAMANA SEARCH_WINDOW_SIZE (query-time default). */
  searchWindowSize?: number
  /** SVS-VAMANA TRAINING_THRESHOLD. */
  trainingThreshold?: number
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

const VECTOR_ELEMENT_BYTES: Record<string, number> = {
  FLOAT64: 8,
  FLOAT32: 4,
  FLOAT16: 2,
  BFLOAT16: 2,
  INT8: 1,
  UINT8: 1,
}

const decodeBFloat16 = (bits: number): number => {
  const sign = (bits >> 15) & 1
  const exponent = (bits >> 7) & 0xff
  const mantissa = bits & 0x7f
  const float32Bits = (sign << 31) | (exponent << 23) | (mantissa << 16)
  const buf = new ArrayBuffer(4)
  new DataView(buf).setUint32(0, float32Bits, false)
  return new DataView(buf).getFloat32(0, false)
}

const decodeFloat16 = (bits: number): number => {
  const sign = (bits >> 15) & 1
  const exponent = (bits >> 10) & 0x1f
  const mantissa = bits & 0x3ff
  if (exponent === 0) {
    return (sign ? -1 : 1) * 2 ** -14 * (mantissa / 1024)
  }
  if (exponent === 0x1f) {
    return mantissa === 0 ? (sign ? -Infinity : Infinity) : NaN
  }
  return (sign ? -1 : 1) * 2 ** (exponent - 15) * (1 + mantissa / 1024)
}

const readElement = (
  view: DataView,
  offset: number,
  dataType: string,
): number => {
  switch (dataType) {
    case 'FLOAT64':
      return view.getFloat64(offset, true)
    case 'FLOAT32':
      return view.getFloat32(offset, true)
    case 'FLOAT16':
      return decodeFloat16(view.getUint16(offset, true))
    case 'BFLOAT16':
      return decodeBFloat16(view.getUint16(offset, true))
    case 'INT8':
      return view.getInt8(offset)
    case 'UINT8':
      return view.getUint8(offset)
    default:
      return NaN
  }
}

const decodeSearchVector = (
  value: unknown,
  field: SearchSampleField,
): Float32Array | undefined => {
  if (field.dimensions === undefined || field.dimensions <= 0) return undefined
  const width = VECTOR_ELEMENT_BYTES[field.dataType ?? '']
  if (!width) return undefined
  const bytes = decodeRawVectorBytes(value)
  if (!bytes || bytes.byteLength !== field.dimensions * width) return undefined
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const values = new Float32Array(field.dimensions)
  for (let index = 0; index < field.dimensions; index += 1) {
    const valueAtIndex = readElement(view, index * width, field.dataType!)
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
          m: asNumber(recordValue(data, 'm')),
          efConstruction: asNumber(recordValue(data, 'ef_construction')),
          efRuntime: asNumber(recordValue(data, 'ef_runtime')),
          compression:
            asText(recordValue(data, 'compression'))?.toUpperCase() ??
            undefined,
          graphMaxDegree: asNumber(recordValue(data, 'graph_max_degree')),
          searchWindowSize: asNumber(recordValue(data, 'search_window_size')),
          trainingThreshold: asNumber(recordValue(data, 'training_threshold')),
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

export const planAggregateQuery = (input: AggregateQueryInput): CommandPlan => {
  const args: RedisArgument[] = [input.index, input.baseQuery]

  // LOAD - expose fields needed for GROUPBY
  if (input.loadFields && input.loadFields.length > 0) {
    args.push('LOAD', String(input.loadFields.length))
    input.loadFields.forEach((field) => args.push(`@${field}`))
  }

  // GROUPBY
  args.push('GROUPBY', String(input.groupByFields.length))
  input.groupByFields.forEach((field) => args.push(`@${field}`))

  // REDUCE ops
  for (const op of input.reduceOps) {
    args.push('REDUCE', op.function)
    const extraArgs = op.args ?? []
    if (op.field) {
      args.push(String(1 + extraArgs.length), `@${op.field}`, ...extraArgs)
    } else {
      args.push(String(extraArgs.length), ...extraArgs)
    }
    args.push('AS', op.alias)
  }

  // SORTBY (FT.AGGREGATE uses SORTBY nargs convention: SORTBY 2 @field ASC)
  if (input.sortBy) {
    args.push('SORTBY', '2', `@${input.sortBy.field}`, input.sortBy.order)
  }

  // LIMIT
  if (input.limit !== undefined) {
    args.push('LIMIT', '0', String(input.limit))
  }

  // PARAMS for vector blob
  args.push('PARAMS', '2', input.queryParameter, input.vector)

  // DIALECT
  args.push('DIALECT', '2')

  return plan('FT.AGGREGATE', args)
}

export const planProfileAggregateQuery = (
  input: AggregateQueryInput,
): CommandPlan => {
  const aggregatePlan = planAggregateQuery(input)
  const [, query, ...aggregateArgs] = aggregatePlan.arguments

  return plan('FT.PROFILE', [
    input.index,
    'AGGREGATE',
    'LIMITED',
    'QUERY',
    query,
    ...aggregateArgs,
  ])
}

const coerceGroupValue = (
  group: AggregateResultGroup,
  key: string,
  value: unknown,
) => {
  const num = asNumber(value)
  if (num !== undefined) {
    group[key] = num
    return
  }
  const text = asText(value)
  if (text !== undefined) group[key] = text
}

export const parseAggregateResponse = (reply: unknown): AggregateResult => {
  // Try RESP3 format first
  const resp3 = toRecord(reply)
  const results = recordValue(resp3, 'results')
  if (Array.isArray(results)) {
    const groups: AggregateResultGroup[] = results.map((result) => {
      const row = toRecord(result)
      const attributes = toRecord(
        recordValue(row, 'extra_attributes') ??
          recordValue(row, 'attributes') ??
          result,
      )
      const group: AggregateResultGroup = {}
      for (const [key, value] of Object.entries(attributes)) {
        coerceGroupValue(group, key, value)
      }
      return group
    })
    const totalGroups =
      asNumber(recordValue(resp3, 'total_results')) ?? groups.length
    return { groups, totalGroups }
  }

  // RESP2 format: [count, [f, v, f, v, ...], ...]
  const rows = Array.isArray(reply) ? reply : []
  const totalGroups = asNumber(rows[0]) ?? 0
  const groups: AggregateResultGroup[] = []
  for (let index = 1; index < rows.length; index += 1) {
    const record = toRecord(rows[index])
    const group: AggregateResultGroup = {}
    for (const [key, value] of Object.entries(record)) {
      coerceGroupValue(group, key, value)
    }
    groups.push(group)
  }
  return { groups, totalGroups }
}

const HYBRID_TEXT_SCORE_FIELD = 'text_score'
const HYBRID_VECTOR_SCORE_FIELD = 'vector_score'
const HYBRID_SCORE_FIELD = 'hybrid_score'
const HYBRID_SCORE_FIELDS = [
  HYBRID_TEXT_SCORE_FIELD,
  HYBRID_VECTOR_SCORE_FIELD,
  HYBRID_SCORE_FIELD,
]

export const planHybridQuery = (input: HybridQueryInput): CommandPlan => {
  const args: RedisArgument[] = [input.index]

  // SEARCH clause
  args.push(
    'SEARCH',
    input.textQuery,
    'YIELD_SCORE_AS',
    HYBRID_TEXT_SCORE_FIELD,
  )

  // VSIM clause
  args.push('VSIM', `@${input.vectorField}`, `$${input.queryParameter}`)

  if (input.vsimMode === 'knn') {
    const knnArgs: string[] = ['K', String(input.limit)]
    if (input.efRuntime !== undefined)
      knnArgs.push('EF_RUNTIME', String(input.efRuntime))
    if (input.shardKRatio !== undefined)
      knnArgs.push('SHARD_K_RATIO', String(input.shardKRatio))
    knnArgs.push('YIELD_SCORE_AS', HYBRID_VECTOR_SCORE_FIELD)
    args.push('KNN', String(knnArgs.length), ...knnArgs)
  } else {
    const rangeArgs: string[] = ['RADIUS', String(input.radius ?? 0.5)]
    if (input.epsilon !== undefined)
      rangeArgs.push('EPSILON', String(input.epsilon))
    rangeArgs.push('YIELD_SCORE_AS', HYBRID_VECTOR_SCORE_FIELD)
    args.push('RANGE', String(rangeArgs.length), ...rangeArgs)
  }

  // COMBINE clause
  if (input.fusionMethod === 'rrf') {
    const rrfArgs: string[] = []
    if (input.rrfConstant !== undefined)
      rrfArgs.push('CONSTANT', String(input.rrfConstant))
    if (input.rrfWindow !== undefined)
      rrfArgs.push('WINDOW', String(input.rrfWindow))
    rrfArgs.push('YIELD_SCORE_AS', HYBRID_SCORE_FIELD)
    args.push('COMBINE', 'RRF', String(rrfArgs.length), ...rrfArgs)
  } else {
    const linearArgs: string[] = []
    if (input.linearAlpha !== undefined)
      linearArgs.push('ALPHA', String(input.linearAlpha))
    if (input.linearBeta !== undefined)
      linearArgs.push('BETA', String(input.linearBeta))
    linearArgs.push('YIELD_SCORE_AS', HYBRID_SCORE_FIELD)
    args.push('COMBINE', 'LINEAR', String(linearArgs.length), ...linearArgs)
  }

  // FILTER
  if (input.filter) args.push('FILTER', input.filter)

  // LOAD the score aliases explicitly; they are required by the evidence chart.
  const loadFields = [
    ...HYBRID_SCORE_FIELDS,
    ...(input.loadFields ?? []).filter(
      (field) => !HYBRID_SCORE_FIELDS.includes(field.toLowerCase()),
    ),
  ]
  args.push('LOAD', String(loadFields.length), ...loadFields)

  // SORTBY
  args.push('SORTBY', '2', HYBRID_SCORE_FIELD, 'ASC')

  // LIMIT
  args.push('LIMIT', '0', String(input.limit))

  // PARAMS for vector blob
  args.push('PARAMS', '2', input.queryParameter, input.vector)

  return plan('FT.HYBRID', args)
}

export const planProfileHybridQuery = (
  input: HybridQueryInput,
): CommandPlan => {
  const hybridPlan = planHybridQuery(input)
  const [, ...hybridArgs] = hybridPlan.arguments

  return plan('FT.PROFILE', [
    input.index,
    'HYBRID',
    'LIMITED',
    'QUERY',
    ...hybridArgs,
  ])
}

const extractHybridFields = (
  record: Record<string, unknown>,
): Record<string, string> | undefined => {
  const fields: Record<string, string> = {}
  for (const [key, value] of Object.entries(record)) {
    if (HYBRID_SCORE_FIELDS.includes(key.toLowerCase())) continue
    const text = asText(value)
    if (text !== undefined) fields[key] = text
  }
  return Object.keys(fields).length > 0 ? fields : undefined
}

const toHybridDocument = (
  id: string | undefined,
  record: Record<string, unknown>,
): HybridScoreDocument | undefined => {
  const textScore = asNumber(recordValue(record, HYBRID_TEXT_SCORE_FIELD))
  const vectorScore = asNumber(recordValue(record, HYBRID_VECTOR_SCORE_FIELD))
  const hybridScore = asNumber(recordValue(record, HYBRID_SCORE_FIELD))
  if (
    !id ||
    textScore === undefined ||
    vectorScore === undefined ||
    hybridScore === undefined
  )
    return undefined
  return {
    id,
    textScore,
    vectorScore,
    hybridScore,
    fields: extractHybridFields(record),
  }
}

export const parseHybridResponse = (reply: unknown): HybridQueryResult => {
  const documents: HybridScoreDocument[] = []

  // Try RESP3 format
  const resp3 = toRecord(reply)
  const results = recordValue(resp3, 'results')
  if (Array.isArray(results)) {
    for (const result of results) {
      const row = toRecord(result)
      const attributes = toRecord(
        recordValue(row, 'extra_attributes') ?? recordValue(row, 'attributes'),
      )
      const document = toHybridDocument(
        asText(recordValue(row, 'id')),
        attributes,
      )
      if (document) documents.push(document)
    }
    const totalResults =
      asNumber(recordValue(resp3, 'total_results')) ?? documents.length
    return { documents, totalResults }
  }

  // RESP2 format: [count, id, [f, v, f, v, ...], id, [f, v, ...], ...]
  const rows = Array.isArray(reply) ? reply : []
  const totalResults = asNumber(rows[0]) ?? 0
  for (let index = 1; index + 1 < rows.length; index += 2) {
    const id = asText(rows[index])
    const record = toRecord(rows[index + 1])
    const document = toHybridDocument(id, record)
    if (document) documents.push(document)
  }
  return { documents, totalResults }
}
