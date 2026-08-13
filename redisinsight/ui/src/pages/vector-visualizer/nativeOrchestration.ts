import {
  asNumber,
  asText,
  CommandPlan,
  RedisArgument,
  recordValue,
  toRecord,
  VectorDataSourceRef,
  VectorMetric,
} from 'uiSrc/packages/vector-visualizer/src/contracts'
import type {
  AggregateResult,
  HybridQueryResult,
} from 'uiSrc/packages/vector-visualizer/src/contracts'
import {
  parseSearchNeighbors,
  parseSearchProfile,
  planProfileSearchNeighbors,
  planProfileRangeQuery,
  parseSearchInfo,
  parseAllowListedSearchMetadata,
  parseSearchSample,
  planSearchDiscovery,
  planSearchSample,
  planHybridQuery,
  parseHybridResponse,
  planAggregateQuery,
  parseAggregateResponse,
  SEARCH_CAPABILITIES,
} from 'uiSrc/packages/vector-visualizer/src/searchAdapter'
import {
  combineVectorSetDiscovery,
  listVectorSetAttributeFields,
  parseVectorSetAttributes,
  planVectorSetAttributes,
  planVectorSetDiscovery,
  planVectorSetSample,
  parseVectorSetNeighbors,
  planVectorSetNeighbors,
  VECTOR_SET_CAPABILITIES,
  type VectorSetGraphFacts,
} from 'uiSrc/packages/vector-visualizer/src/vectorSetAdapter'

const MIN_SAMPLE_LIMIT = 500
const MAX_SAMPLE_LIMIT = 20_000
const DEFAULT_MAX_BYTES = 64 * 1024 * 1024
const DEFAULT_MAX_COMMAND_COUNT = MAX_SAMPLE_LIMIT * 2 + 6

type SamplingMetric = VectorMetric | 'unknown'
type SamplingKind =
  | 'success'
  | 'partial'
  | 'empty'
  | 'unsupported'
  | 'cancelled'
  | 'stale'

export interface NativeSampleResult {
  kind: SamplingKind
  source: VectorDataSourceRef
  capabilities: typeof SEARCH_CAPABILITIES | typeof VECTOR_SET_CAPABILITIES
  ids: string[]
  records: Array<{
    id: string
    metadata?: Record<string, string | number | boolean>
  }>
  availableMetadataFields?: string[]
  metadataField?: string
  vectors: Float32Array
  dimensions: number
  metric: SamplingMetric
  algorithm?: string
  compression?: string
  graphMaxDegree?: number
  quantization?: string
  graphFacts?: VectorSetGraphFacts
  sourceCount: number
  sampleCount: number
  method: 'ft-search' | 'vrange' | 'vrandmember' | 'unavailable'
  seed: number | 'unavailable'
  freshness: 'fresh' | 'changed-while-sampled' | 'unknown'
  partialReason?:
    | 'invalid-or-missing-vectors'
    | 'dimension-mismatch'
    | 'selected-vector-field-unavailable'
  reconstruction: 'stored-raw' | 'vemb-reconstructed' | 'unavailable'
  commandCount: number
  memberArguments?: Map<string, RedisArgument>
}

export interface NativeSamplingInput {
  source: VectorDataSourceRef
  filter?: string
  limit: number
  execute: (plan: CommandPlan, signal?: AbortSignal) => Promise<unknown>
  signal?: AbortSignal
  generation?: number
  accept?: (generation: number, value: null) => boolean | { accepted: boolean }
  maxBytes?: number
  maxCommandCount?: number
  seed?: number
  allowListedFields?: string[]
}

type SearchSamplingInput = NativeSamplingInput & {
  source: Extract<VectorDataSourceRef, { kind: 'search-index' }>
}

type VectorSetSamplingInput = NativeSamplingInput & {
  source: Extract<VectorDataSourceRef, { kind: 'vector-set' }>
}

class Cancelled extends Error {}
class Stale extends Error {}

const isAccepted = (input: NativeSamplingInput) => {
  if (input.signal?.aborted) throw new Cancelled()
  if (!input.accept || input.generation === undefined) return
  const accepted = input.accept(input.generation, null)
  if (typeof accepted === 'boolean' ? !accepted : !accepted.accepted)
    throw new Stale()
}

const validateLimit = (limit: number) => {
  if (
    !Number.isInteger(limit) ||
    limit < MIN_SAMPLE_LIMIT ||
    limit > MAX_SAMPLE_LIMIT
  )
    throw new Error(
      `Sample limit must be an integer in ${MIN_SAMPLE_LIMIT}..${MAX_SAMPLE_LIMIT}.`,
    )
}

const validateBudget = (
  dimensions: number,
  itemBytes: number,
  commandCount: number,
  input: NativeSamplingInput,
) => {
  if (
    dimensions * itemBytes * input.limit >
    (input.maxBytes ?? DEFAULT_MAX_BYTES)
  )
    throw new Error('Sample exceeds the byte budget.')
  if (commandCount > (input.maxCommandCount ?? DEFAULT_MAX_COMMAND_COUNT))
    throw new Error('Sample exceeds the command budget.')
}

const stackVectors = (vectors: Float32Array[]) => {
  const stacked = new Float32Array(
    vectors.reduce((total, vector) => total + vector.length, 0),
  )
  let offset = 0
  vectors.forEach((vector) => {
    stacked.set(vector, offset)
    offset += vector.length
  })
  return stacked
}

const searchRowCount = (reply: unknown) => {
  const resp3Rows = recordValue(toRecord(reply), 'results')
  if (Array.isArray(resp3Rows)) return resp3Rows.length
  if (!Array.isArray(reply)) return 0
  return Math.max(0, Math.floor((reply.length - 1) / 2))
}

const decodeEscapedRedisArgument = (value: string): Uint8Array | string => {
  if (!value.includes('\\')) return value
  const bytes: number[] = []
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index)
    if (code !== 92) {
      if (code > 255) return value
      bytes.push(code)
      continue
    }
    if (value[index + 1] !== 'x') return value
    const hex = value.slice(index + 2, index + 4)
    if (!/^[0-9a-f]{2}$/i.test(hex)) return value
    bytes.push(Number.parseInt(hex, 16))
    index += 3
  }
  return new Uint8Array(bytes)
}

const vectorSetMembers = (reply: unknown) =>
  (Array.isArray(reply) ? reply : []).flatMap((value) => {
    if (value instanceof Uint8Array) {
      const id = Array.from(value, (byte) =>
        byte >= 32 && byte <= 126 && byte !== 92
          ? String.fromCharCode(byte)
          : `\\x${byte.toString(16).padStart(2, '0')}`,
      ).join('')
      return [{ id, argument: value }]
    }
    const id = asText(value)
    return id ? [{ id, argument: decodeEscapedRedisArgument(id) }] : []
  })

const parseVectorSetEmbedding = (reply: unknown, dimensions: number) => {
  if (!Array.isArray(reply) || reply.length !== dimensions) return undefined
  const values = reply.map(asNumber)
  if (values.some((value) => value === undefined)) return undefined
  return new Float32Array(values as number[])
}

const result = (
  input: NativeSamplingInput,
  capabilities: NativeSampleResult['capabilities'],
  partial: Partial<NativeSampleResult>,
): NativeSampleResult => ({
  kind: 'unsupported',
  source: input.source,
  capabilities,
  ids: [],
  records: [],
  vectors: new Float32Array(),
  dimensions: 0,
  metric: 'unknown',
  sourceCount: 0,
  sampleCount: 0,
  method: 'unavailable',
  seed: 'unavailable',
  freshness: 'unknown',
  reconstruction: 'unavailable',
  commandCount: 0,
  ...partial,
})

const sampleSearch = async (input: SearchSamplingInput) => {
  let commandCount = 0
  const run = async (plan: CommandPlan) => {
    isAccepted(input)
    commandCount += 1
    const reply = await input.execute(plan, input.signal)
    isAccepted(input)
    return reply
  }
  const before = await run(planSearchDiscovery(input.source.index))
  const discovery = parseSearchInfo(before)
  const field = discovery.vectorFields.find(
    (candidate) => candidate.name === input.source.vectorField,
  )
  const VECTOR_ELEMENT_BYTES: Record<string, number> = {
    FLOAT64: 8,
    FLOAT32: 4,
    FLOAT16: 2,
    BFLOAT16: 2,
    INT8: 1,
    UINT8: 1,
  }
  const elementBytes = VECTOR_ELEMENT_BYTES[field?.dataType ?? '']
  if (!field || !field.dimensions || !field.metric || !elementBytes)
    return result(input, SEARCH_CAPABILITIES, {
      partialReason: 'selected-vector-field-unavailable',
      commandCount,
    })

  validateBudget(field.dimensions, elementBytes, 3, input)
  const selectedMetadataFields = [
    ...new Set([
      ...discovery.metadataFields,
      ...(input.allowListedFields ?? []),
    ]),
  ].filter((candidate) => discovery.metadataFields.includes(candidate))
  const sampleReply = await run(
    planSearchSample({
      index: input.source.index,
      vectorField: input.source.vectorField,
      filter: input.filter,
      limit: input.limit,
      allowListedFields: selectedMetadataFields,
    }),
  )
  const sample = parseSearchSample(sampleReply, {
    vectorField: input.source.vectorField,
    dimensions: field.dimensions,
    dataType: field.dataType,
  })
  const metadata = parseAllowListedSearchMetadata(
    sampleReply,
    selectedMetadataFields,
  )
  const after = parseSearchInfo(
    await run(planSearchDiscovery(input.source.index)),
  )
  const candidates = searchRowCount(sampleReply)
  const kind: SamplingKind =
    candidates === 0
      ? 'empty'
      : sample.length === candidates
        ? 'success'
        : 'partial'

  return result(input, SEARCH_CAPABILITIES, {
    kind,
    ids: sample.map(({ id }) => id),
    records: sample.map(({ id }) => ({
      id,
      ...(Object.keys(metadata.get(id) ?? {}).length
        ? { metadata: metadata.get(id) }
        : {}),
    })),
    availableMetadataFields: discovery.metadataFields,
    metadataField: selectedMetadataFields[0],
    vectors: stackVectors(sample.map(({ vector }) => vector)),
    dimensions: field.dimensions,
    metric: field.metric,
    algorithm: field.algorithm,
    compression: field.compression,
    graphMaxDegree: field.graphMaxDegree,
    sourceCount: discovery.indexedCount,
    sampleCount: sample.length,
    method: 'ft-search',
    seed: 'unavailable',
    freshness:
      discovery.indexedCount === after.indexedCount
        ? 'fresh'
        : 'changed-while-sampled',
    partialReason:
      kind === 'partial' ? 'invalid-or-missing-vectors' : undefined,
    reconstruction: 'stored-raw',
    commandCount,
  })
}

const sampleVectorSet = async (input: VectorSetSamplingInput) => {
  let commandCount = 0
  const run = async (plan: CommandPlan) => {
    isAccepted(input)
    commandCount += 1
    const reply = await input.execute(plan, input.signal)
    isAccepted(input)
    return reply
  }
  const [vcardPlan, vdimPlan, vinfoPlan] = planVectorSetDiscovery(
    input.source.key,
  )
  const discovery = combineVectorSetDiscovery({
    vcardReply: await run(vcardPlan),
    vdimReply: await run(vdimPlan),
    vinfoReply: await run(vinfoPlan),
  })
  if (discovery.kind === 'unavailable')
    return result(input, VECTOR_SET_CAPABILITIES, {
      partialReason:
        discovery.reason === 'dimension-mismatch'
          ? 'dimension-mismatch'
          : 'selected-vector-field-unavailable',
      commandCount,
    })

  // Include the one-command unsupported VRANGE fallback before any VEMB work.
  validateBudget(discovery.dimensions, 4, input.limit * 2 + 6, input)
  let method: NativeSampleResult['method'] = 'vrange'
  let membersReply: unknown
  try {
    membersReply = await run(
      planVectorSetSample({
        key: input.source.key,
        limit: input.limit,
        supportsRange: true,
      }),
    )
  } catch (error) {
    if (!(error instanceof Error) || error.message !== 'unsupported-command')
      throw error
    method = 'vrandmember'
    membersReply = await run(
      planVectorSetSample({
        key: input.source.key,
        limit: input.limit,
        supportsRange: false,
      }),
    )
  }
  const members = vectorSetMembers(membersReply)
  const vectors: Float32Array[] = []
  const ids: string[] = []
  const sampledMembers: typeof members = []
  for (const member of members) {
    const embedding = parseVectorSetEmbedding(
      await run({
        command: 'VEMB',
        arguments: [input.source.key, member.argument],
        readOnly: true,
        provenance: { kind: 'measured', exactness: 'unknown' },
      }),
      discovery.dimensions,
    )
    if (!embedding) continue
    ids.push(member.id)
    vectors.push(embedding)
    sampledMembers.push(member)
  }
  let availableMetadataFields: string[] = []
  let metadataField = input.allowListedFields?.find(Boolean)
  const metadata = new Map<string, Record<string, string | number | boolean>>()
  for (const [index, member] of sampledMembers.entries()) {
    const attributesReply = await run(
      planVectorSetAttributes(input.source.key, member.argument),
    )
    if (index === 0) {
      availableMetadataFields = listVectorSetAttributeFields(attributesReply)
      if (!metadataField) metadataField = availableMetadataFields[0]
    }
    if (availableMetadataFields.length) {
      metadata.set(
        member.id,
        parseVectorSetAttributes(attributesReply, availableMetadataFields),
      )
    }
  }
  const cardinalityAfter = asNumber(
    await run({
      command: 'VCARD',
      arguments: [input.source.key],
      readOnly: true,
      provenance: { kind: 'measured', exactness: 'unknown' },
    }),
  )
  const kind: SamplingKind =
    members.length === 0
      ? 'empty'
      : ids.length === members.length
        ? 'success'
        : 'partial'

  return result(input, VECTOR_SET_CAPABILITIES, {
    kind,
    ids,
    records: ids.map((id) => ({
      id,
      ...(Object.keys(metadata.get(id) ?? {}).length
        ? { metadata: metadata.get(id) }
        : {}),
    })),
    availableMetadataFields,
    metadataField,
    vectors: stackVectors(vectors),
    dimensions: discovery.dimensions,
    // Redis Vector Sets use cosine similarity by source contract. This is not
    // inferred from VINFO and must never be applied to Search indexes.
    metric: 'cosine',
    quantization: discovery.quantization,
    graphFacts: discovery.graphFacts,
    sourceCount: discovery.cardinality,
    sampleCount: ids.length,
    method,
    seed: 'unavailable',
    freshness:
      cardinalityAfter === discovery.cardinality
        ? 'fresh'
        : 'changed-while-sampled',
    partialReason:
      kind === 'partial' ? 'invalid-or-missing-vectors' : undefined,
    reconstruction: 'vemb-reconstructed',
    commandCount,
    memberArguments: new Map(
      members.map(({ id, argument }) => [id, argument] as const),
    ),
  })
}

/**
 * Executes only injected read-only command plans. Returned vectors are a
 * memory-only Float32Array; this module neither stores nor logs raw values.
 */
export const orchestrateNativeSample = async (
  input: NativeSamplingInput,
): Promise<NativeSampleResult> => {
  validateLimit(input.limit)
  try {
    return input.source.kind === 'search-index'
      ? await sampleSearch(input as SearchSamplingInput)
      : await sampleVectorSet(input as VectorSetSamplingInput)
  } catch (error) {
    if (input.signal?.aborted)
      return result(
        input,
        input.source.kind === 'search-index'
          ? SEARCH_CAPABILITIES
          : VECTOR_SET_CAPABILITIES,
        { kind: 'cancelled' },
      )
    if (error instanceof Cancelled)
      return result(
        input,
        input.source.kind === 'search-index'
          ? SEARCH_CAPABILITIES
          : VECTOR_SET_CAPABILITIES,
        { kind: 'cancelled' },
      )
    if (error instanceof Stale)
      return result(
        input,
        input.source.kind === 'search-index'
          ? SEARCH_CAPABILITIES
          : VECTOR_SET_CAPABILITIES,
        { kind: 'stale' },
      )
    throw error
  }
}

export type NativeQueryResult =
  | {
      kind: 'ready'
      exactness: 'exact' | 'approximate' | 'unknown'
      neighbors: Array<{
        id: string
        rank: number
        metric: 'distance' | 'similarity' | 'score'
        value: number
        plotted: boolean
        provenance: 'FT.SEARCH' | 'VSIM'
      }>
      profile:
        | { kind: 'none'; facts: Record<string, never> }
        | {
            kind: 'full'
            facts: Record<string, string | undefined>
            stages?: Array<{ name: string; count?: string; mode?: string }>
          }
    }
  | {
      kind: 'hybrid-ready'
      documents: HybridQueryResult['documents']
      totalResults: number
      profile: { kind: 'none'; facts: Record<string, never> }
    }
  | {
      kind: 'aggregate-ready'
      groups: AggregateResult['groups']
      totalGroups: number
      profile: { kind: 'none'; facts: Record<string, never> }
    }
  | { kind: 'cancelled' | 'stale' | 'unsupported' }

export interface NativeQueryInput {
  source: VectorDataSourceRef
  anchorId: string
  anchorVector: Float32Array
  sampleIds: string[]
  metric: SamplingMetric
  algorithm?: string
  limit: number
  execute: (plan: CommandPlan, signal?: AbortSignal) => Promise<unknown>
  signal?: AbortSignal
  generation?: number
  accept?: (generation: number, value: null) => boolean | { accepted: boolean }
  queryMode?: 'knn' | 'range' | 'hybrid' | 'aggregate'
  radius?: number
  epsilon?: number
  efRuntime?: number
  hybridPolicy?: 'AUTO' | 'BATCHES' | 'ADHOC_BF'
  batchSize?: number
  searchWindowSize?: number
  shardKRatio?: number
  useSearchHistory?: 'OFF' | 'ON' | 'AUTO'
  searchBufferCapacity?: number
  textQuery?: string
  fusionMethod?: 'rrf' | 'linear'
  rrfConstant?: number
  rrfWindow?: number
  linearAlpha?: number
  linearBeta?: number
  hybridVsimMode?: 'knn' | 'range'
  filter?: string
  aggregateGroupByFields?: string[]
  aggregateReduceOps?: Array<{
    function: string
    field?: string
    args?: string[]
    alias: string
  }>
  aggregateSortBy?: { field: string; order: 'ASC' | 'DESC' }
  aggregateLoadFields?: string[]
  aggregateLimit?: number
}

const queryAccepted = (input: NativeQueryInput) => {
  if (input.signal?.aborted) throw new Cancelled()
  if (!input.accept || input.generation === undefined) return
  const accepted = input.accept(input.generation, null)
  if (typeof accepted === 'boolean' ? !accepted : !accepted.accepted)
    throw new Stale()
}

const normalizeProfile = (
  raw: ReturnType<typeof parseSearchProfile>,
): Extract<NativeQueryResult, { kind: 'ready' }>['profile'] => {
  const facts: Record<string, string | undefined> = {}
  for (const [key, value] of Object.entries(raw.facts)) {
    facts[key] =
      typeof value === 'string'
        ? value
        : value === undefined
          ? undefined
          : String(value)
  }
  const stages = raw.stages
    .map((stage) => {
      const name =
        asText(stage.Type) ?? asText(stage.Name) ?? asText(stage.Iterator)
      if (!name) return undefined
      const count =
        stage.Counter ?? stage.Count ?? stage['Number of reading operations']
      return {
        name,
        count: count !== undefined ? String(count) : undefined,
        mode: asText(stage.Mode) ?? undefined,
      }
    })
    .filter(
      (
        s,
      ): s is {
        name: string
        count: string | undefined
        mode: string | undefined
      } => s !== undefined,
    )
  return { kind: 'full', facts, stages }
}

const asQueryResult = (
  neighbors: Array<{
    id: string
    metric: 'distance' | 'similarity' | 'score'
    value: number
    provenance: 'FT.SEARCH' | 'VSIM'
  }>,
  sampleIds: string[],
  exactness: 'exact' | 'approximate' | 'unknown',
  profile?: Extract<NativeQueryResult, { kind: 'ready' }>['profile'],
): Extract<NativeQueryResult, { kind: 'ready' }> => ({
  kind: 'ready',
  exactness,
  neighbors: neighbors.map((neighbor, index) => ({
    ...neighbor,
    rank: index + 1,
    plotted: sampleIds.includes(neighbor.id),
  })),
  profile: profile ?? { kind: 'none', facts: {} },
})

/**
 * Query execution is deliberately separate from sampling: the caller must hold
 * an explicitly selected anchor in the session-only vector memory store.
 */
export const orchestrateNativeQuery = async (
  input: NativeQueryInput,
): Promise<NativeQueryResult> => {
  if (
    !input.anchorId ||
    !input.anchorVector.length ||
    !Number.isInteger(input.limit) ||
    input.limit < 1
  )
    return { kind: 'unsupported' }
  try {
    queryAccepted(input)
    if (input.source.kind === 'search-index') {
      if (input.metric === 'unknown') return { kind: 'unsupported' }
      const vectorBytes = new Uint8Array(
        input.anchorVector.buffer,
        input.anchorVector.byteOffset,
        input.anchorVector.byteLength,
      )

      if (input.queryMode === 'aggregate') {
        if (
          !input.aggregateGroupByFields?.length ||
          !input.aggregateReduceOps?.length
        )
          return { kind: 'unsupported' }
        const aggReply = await input.execute(
          planAggregateQuery({
            index: input.source.index,
            baseQuery: `*=>[KNN ${input.limit} @${input.source.vectorField} $vv_anchor]`,
            queryParameter: 'vv_anchor',
            vector: vectorBytes,
            loadFields: input.aggregateLoadFields,
            groupByFields: input.aggregateGroupByFields,
            reduceOps: input.aggregateReduceOps,
            sortBy: input.aggregateSortBy,
            limit: input.aggregateLimit,
          }),
          input.signal,
        )
        queryAccepted(input)
        const aggResult = parseAggregateResponse(aggReply)
        return {
          kind: 'aggregate-ready',
          groups: aggResult.groups,
          totalGroups: aggResult.totalGroups,
          profile: {
            kind: 'none' as const,
            facts: {} as Record<string, never>,
          },
        }
      }

      if (input.queryMode === 'hybrid') {
        if (!input.textQuery) return { kind: 'unsupported' }
        const reply = await input.execute(
          planHybridQuery({
            index: input.source.index,
            textQuery: input.textQuery,
            vectorField: input.source.vectorField,
            queryParameter: 'vv_anchor',
            vector: vectorBytes,
            vsimMode: input.hybridVsimMode ?? 'knn',
            limit: input.limit,
            fusionMethod: input.fusionMethod ?? 'rrf',
            rrfConstant: input.rrfConstant,
            rrfWindow: input.rrfWindow,
            linearAlpha: input.linearAlpha,
            linearBeta: input.linearBeta,
            radius: input.radius,
            epsilon: input.epsilon,
            efRuntime: input.efRuntime,
            searchWindowSize: input.searchWindowSize,
            shardKRatio: input.shardKRatio,
            filter: input.filter,
          }),
          input.signal,
        )
        queryAccepted(input)
        const parsed = parseHybridResponse(reply)
        return {
          kind: 'hybrid-ready',
          documents: parsed.documents,
          totalResults: parsed.totalResults,
          profile: { kind: 'none', facts: {} },
        }
      }

      if (input.queryMode === 'range') {
        if (!input.radius || input.radius <= 0) return { kind: 'unsupported' }
        const rangeReply = await input.execute(
          planProfileRangeQuery({
            index: input.source.index,
            vectorField: input.source.vectorField,
            queryParameter: 'vv_anchor',
            vector: vectorBytes,
            radius: input.radius,
            epsilon: input.epsilon,
            limit: input.limit,
            runtimeParams: {
              searchWindowSize: input.searchWindowSize,
              shardKRatio: input.shardKRatio,
              useSearchHistory: input.useSearchHistory,
              searchBufferCapacity: input.searchBufferCapacity,
            },
          }),
          input.signal,
        )
        queryAccepted(input)
        const rangeProfileReply = Array.isArray(rangeReply)
          ? rangeReply
          : [rangeReply]
        const rangeSearchResults = rangeProfileReply[0]
        const rangeParsed = parseSearchNeighbors(rangeSearchResults, {
          metric: input.metric,
          algorithm: input.algorithm,
        })
        let rangeProfile: Extract<
          NativeQueryResult,
          { kind: 'ready' }
        >['profile'] = {
          kind: 'none',
          facts: {},
        }
        try {
          rangeProfile = normalizeProfile(parseSearchProfile(rangeProfileReply))
        } catch {
          // profile parsing is best-effort
        }
        return asQueryResult(
          rangeParsed.map((neighbor) => ({
            id: neighbor.id,
            metric: neighbor.metric,
            value: neighbor.value,
            provenance: 'FT.SEARCH' as const,
          })),
          input.sampleIds,
          rangeParsed.some(
            (neighbor) => neighbor.provenance.exactness === 'approximate',
          )
            ? 'approximate'
            : rangeParsed.some(
                  (neighbor) => neighbor.provenance.exactness === 'exact',
                )
              ? 'exact'
              : 'unknown',
          rangeProfile,
        )
      }

      const reply = await input.execute(
        planProfileSearchNeighbors({
          index: input.source.index,
          vectorField: input.source.vectorField,
          queryParameter: 'vv_anchor',
          vector: vectorBytes,
          limit: input.limit,
          runtimeParams: {
            efRuntime: input.efRuntime,
            hybridPolicy: input.hybridPolicy,
            batchSize: input.batchSize,
            searchWindowSize: input.searchWindowSize,
            shardKRatio: input.shardKRatio,
            useSearchHistory: input.useSearchHistory,
            searchBufferCapacity: input.searchBufferCapacity,
          },
        }),
        input.signal,
      )
      queryAccepted(input)
      const profileReply = Array.isArray(reply) ? reply : [reply]
      const searchResults = profileReply[0]
      const parsed = parseSearchNeighbors(searchResults, {
        metric: input.metric,
        algorithm: input.algorithm,
      })
      let profile: Extract<NativeQueryResult, { kind: 'ready' }>['profile'] = {
        kind: 'none',
        facts: {},
      }
      try {
        profile = normalizeProfile(parseSearchProfile(profileReply))
      } catch {
        // profile parsing is best-effort
      }
      return asQueryResult(
        parsed.map((neighbor) => ({
          id: neighbor.id,
          metric: neighbor.metric,
          value: neighbor.value,
          provenance: 'FT.SEARCH' as const,
        })),
        input.sampleIds,
        parsed.some(
          (neighbor) => neighbor.provenance.exactness === 'approximate',
        )
          ? 'approximate'
          : parsed.some((neighbor) => neighbor.provenance.exactness === 'exact')
            ? 'exact'
            : 'unknown',
        profile,
      )
    }

    const reply = await input.execute(
      planVectorSetNeighbors({
        key: input.source.key,
        vector: [...input.anchorVector],
        limit: input.limit,
      }),
      input.signal,
    )
    queryAccepted(input)
    const parsed = parseVectorSetNeighbors(reply, input.metric)
    return asQueryResult(
      parsed.map((neighbor) => ({
        id: neighbor.id,
        metric: neighbor.metric,
        value: neighbor.value,
        provenance: 'VSIM' as const,
      })),
      input.sampleIds,
      parsed.some((neighbor) => neighbor.provenance.exactness === 'approximate')
        ? 'approximate'
        : 'unknown',
    )
  } catch (error) {
    if (input.signal?.aborted || error instanceof Cancelled)
      return { kind: 'cancelled' }
    if (error instanceof Stale) return { kind: 'stale' }
    throw error
  }
}
