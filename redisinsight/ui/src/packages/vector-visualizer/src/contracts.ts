export type RedisReply = unknown
export type RedisArgument = string | Uint8Array
export type VectorVisualizerHost =
  | 'workbench'
  | 'vector-search'
  | 'vector-set-browser'
export type EvidenceKind =
  | 'measured'
  | 'sampled'
  | 'derived'
  | 'estimated'
  | 'unavailable'
export type Exactness = 'exact' | 'approximate' | 'sample-exact' | 'unknown'
export type VectorMetric = 'cosine' | 'l2' | 'ip'

export type VectorDataSourceRef =
  | { kind: 'search-index'; index: string; vectorField: string }
  | { kind: 'vector-set'; key: Uint8Array }

export interface EvidenceProvenance {
  kind: EvidenceKind
  exactness: Exactness
}

export interface VectorSourceCapabilities {
  describe: boolean
  enumerate: boolean
  deterministicSample: boolean
  rawVectors: boolean
  reconstructedVectors: boolean
  filteredNeighbors: boolean
  exactNeighbors: 'native' | 'controlled-comparison' | 'none'
  queryProfile: 'full' | 'reduced' | 'none'
  topology: 'hnsw-adjacency' | 'none'
}

export interface VectorVisualizerHostAdapter {
  host: VectorVisualizerHost
  executeReadOnly(command: string, signal?: AbortSignal): Promise<RedisReply>
  loadState<T>(): Promise<T | undefined>
  saveState<T>(state: T): Promise<void>
  openNativeWorkspace?(source: VectorDataSourceRef): void
}

export interface VectorSourceDescription {
  source: VectorDataSourceRef
  capabilities: VectorSourceCapabilities
  provenance: EvidenceProvenance
}

export interface SampleRequest {
  limit: number
  filter?: string
}

export interface VectorSample {
  ids: string[]
  provenance: EvidenceProvenance
}

export interface NeighborRequest {
  limit: number
  filter?: string
}

export interface NeighborResult {
  neighbors: NormalizedNeighbor[]
  provenance: EvidenceProvenance
}

export interface ProfileRequest {
  query: string
}

export interface QueryProfile {
  kind: 'full' | 'reduced'
  provenance: EvidenceProvenance
}

export interface TopologyRequest {
  member: string
}

export interface TopologyResult {
  provenance: EvidenceProvenance
}

export interface AggregateReduceOp {
  function: string
  field?: string
  args?: string[]
  alias: string
}

export interface AggregateQueryInput {
  index: string
  baseQuery: string
  queryParameter: string
  vector: Uint8Array
  loadFields?: string[]
  groupByFields: string[]
  reduceOps: AggregateReduceOp[]
  sortBy?: { field: string; order: 'ASC' | 'DESC' }
  limit?: number
}

export interface AggregateResultGroup {
  [field: string]: string | number
}

export interface AggregateResult {
  groups: AggregateResultGroup[]
  totalGroups: number
}

export interface HybridQueryInput {
  index: string
  textQuery: string
  vectorField: string
  queryParameter: string
  vector: Uint8Array
  vsimMode: 'knn' | 'range'
  limit: number
  fusionMethod: 'rrf' | 'linear'
  rrfConstant?: number
  rrfWindow?: number
  linearAlpha?: number
  linearBeta?: number
  radius?: number
  epsilon?: number
  efRuntime?: number
  searchWindowSize?: number
  shardKRatio?: number
  filter?: string
  loadFields?: string[]
}

export interface HybridScoreDocument {
  id: string
  textScore?: number
  vectorScore?: number
  hybridScore?: number
  fields?: Record<string, string>
}

export interface HybridQueryResult {
  documents: HybridScoreDocument[]
  totalResults: number
}

export interface VectorSourceAdapter {
  readonly source: VectorDataSourceRef
  readonly capabilities: VectorSourceCapabilities
  discover(signal?: AbortSignal): Promise<VectorSourceDescription>
  sample(request: SampleRequest, signal?: AbortSignal): Promise<VectorSample>
  neighbors(
    request: NeighborRequest,
    signal?: AbortSignal,
  ): Promise<NeighborResult>
  profile?(request: ProfileRequest, signal?: AbortSignal): Promise<QueryProfile>
  topology?(
    request: TopologyRequest,
    signal?: AbortSignal,
  ): Promise<TopologyResult>
}

export type VisualizerStatus =
  | 'source-not-selected'
  | 'discovering'
  | 'ready-not-sampled'
  | 'ready'
  | 'fetching'
  | 'layouting'
  | 'partial'
  | 'stale'
  | 'empty'
  | 'unsupported'
  | 'acl-unavailable'
  | 'cancelled'
  | 'recoverable-error'
  | 'fatal-error'

export interface VectorVisualizerState {
  source?: VectorDataSourceRef
  capabilities?: VectorSourceCapabilities
  selectedIds: string[]
  focusedId?: string
  status: VisualizerStatus
}

export interface LayoutJobV1 {
  version: 1
  jobId: string
  algorithm: 'umap' | 'pca' | 'tsne'
  metric: VectorMetric
  count: number
  dimensions?: number
  vectors?: Float32Array
  edgeOffsets?: Uint32Array
  edgeTargets?: Uint32Array
  edgeDistances?: Float32Array
  seed: number
  parameters: Record<string, number>
}

export interface CommandPlan {
  command: string
  arguments: RedisArgument[]
  readOnly: true
  provenance: EvidenceProvenance
  order?: 'deterministic' | 'nondeterministic'
  caveat?: string
  sampleMethod?: 'range' | 'unseeded-random'
  visibleWarning?: string
  requiresConfirmation?: boolean
  operation?: string
}

export interface NormalizedNeighbor {
  id: string
  rawValue: number
  metric: 'similarity' | 'distance' | 'score'
  value: number
  sourceMetric?: VectorMetric
  provenance: EvidenceProvenance
}

const textDecoder = new TextDecoder()

const asRedisTaggedScalar = (value: unknown): string | undefined => {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return undefined
  const record = value as Record<string, unknown>
  if (String(record.type).toLowerCase() !== 'integer') return undefined
  return typeof record.value === 'string' || typeof record.value === 'number'
    ? String(record.value)
    : undefined
}

export const asText = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  const taggedScalar = asRedisTaggedScalar(value)
  if (taggedScalar !== undefined) return taggedScalar
  if (
    ArrayBuffer.isView(value) &&
    'BYTES_PER_ELEMENT' in value &&
    value.BYTES_PER_ELEMENT === 1
  ) {
    return textDecoder.decode(
      new Uint8Array(value.buffer, value.byteOffset, value.byteLength),
    )
  }
  return undefined
}

export const asNumber = (value: unknown): number | undefined => {
  const numberValue = typeof value === 'number' ? value : Number(asText(value))
  return Number.isFinite(numberValue) ? numberValue : undefined
}

export const toRecord = (value: unknown): Record<string, unknown> => {
  if (value instanceof Map) {
    return Object.fromEntries(
      [...value.entries()].flatMap(([key, item]) => {
        const name = asText(key)
        return name ? [[name, item]] : []
      }),
    )
  }
  if (Array.isArray(value)) {
    const record: Record<string, unknown> = {}
    for (let index = 0; index + 1 < value.length; index += 2) {
      const key = asText(value[index])
      if (key) record[key] = value[index + 1]
    }
    return record
  }
  if (value && typeof value === 'object')
    return value as Record<string, unknown>
  return {}
}

export const recordValue = (record: Record<string, unknown>, key: string) =>
  Object.entries(record).find(
    ([candidate]) => candidate.toLowerCase() === key.toLowerCase(),
  )?.[1]

export const metricValue = (metric: VectorMetric, rawValue: number) =>
  metric === 'l2'
    ? { metric: 'distance' as const, value: rawValue }
    : { metric: 'similarity' as const, value: rawValue }

export const normalizeSelection = (ids: string[], plottedIds: Set<string>) =>
  ids.map((id) => ({ id, plotted: plottedIds.has(id) }))

export interface ViewManifestInput {
  sourceKind: VectorDataSourceRef['kind']
  sourceId: string
  sampleIds: string[]
  rawVectors?: ReadonlyMap<string, Float32Array>
}

export interface ViewManifestV1 {
  version: 1
  sourceKind: VectorDataSourceRef['kind']
  sourceId: string
  sampleIdDigest: string
}

/** Raw vectors are intentionally accepted but never represented in the output. */
export const toViewManifest = ({
  sourceKind,
  sourceId,
  sampleIds,
}: ViewManifestInput): ViewManifestV1 => ({
  version: 1,
  sourceKind,
  sourceId,
  sampleIdDigest: `hash31:${hash31(sampleIds.join('\u0000'))}`,
})

const hash31 = (value: string) => {
  let hash = 7
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 2147483647
  }
  return hash.toString(16).padStart(8, '0')
}

export interface VectorMemoryStore {
  set(id: string, vector: Float32Array): void
  get(id: string): Float32Array | undefined
  clear(): void
  size(): number
  snapshot(): ReadonlyMap<string, Float32Array>
}

export const createVectorMemoryStore = (): VectorMemoryStore => {
  const values = new Map<string, Float32Array>()
  return {
    set: (id, vector) => values.set(id, vector),
    get: (id) => values.get(id),
    clear: () => values.clear(),
    size: () => values.size,
    snapshot: () => new Map(values),
  }
}

export const createResultGuard = () => {
  let currentGeneration = 0
  return {
    begin: () => ++currentGeneration,
    accept: <T>(generation: number, value: T) =>
      generation === currentGeneration
        ? { accepted: true as const, value }
        : { accepted: false as const, value: undefined },
  }
}

/** Only category and operation labels are safe for diagnostics. */
export const redactDiagnostic = (value: unknown): unknown => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const record = value as Record<string, unknown>
  return Object.fromEntries(
    ['category', 'operation'].flatMap((key) =>
      typeof record[key] === 'string' ? [[key, record[key]]] : [],
    ),
  )
}
