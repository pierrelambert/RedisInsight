import type { ViewManifestV1 } from '../contracts'

export type DriftProvenance = 'measured' | 'sampled' | 'unavailable'
export interface DriftValueV1 {
  value?: number
  provenance: DriftProvenance
  reason?: string
  unit?: string
}
export interface DriftEvidenceV1 {
  clusterPopulation?: DriftValueV1
  vectorNorm?: DriftValueV1
  neighborOverlap?: DriftValueV1
  duplicateRate?: DriftValueV1
  outlierRate?: DriftValueV1
  metadataCoverage?: DriftValueV1
  sourceConfiguration?: DriftValueV1
}

/** Local v1 augments the shared vector-free ViewManifestV1 with comparison facts. */
export type LocalManifestV1 = ViewManifestV1 & {
  version: 1
  sourceKind: 'search-index' | 'vector-set'
  sourceId: string
  dimensions: number
  metric: 'cosine' | 'l2' | 'ip'
  vectorField?: string
  sampleCount: number
  sourceCount: number
  sampleIdDigest?: string
  sampling?: {
    method:
      | 'deterministic-id-hash'
      | 'bounded-random'
      | 'ft-search-limit'
      | 'vrange'
      | 'vrandmember'
    sourceCommand?: 'FT.SEARCH' | 'VRANGE' | 'VRANDMEMBER'
    seed?: number | 'unavailable'
    determinism?:
      | 'ordering-unspecified'
      | 'deterministic-stable-order'
      | 'unseeded-random'
    exactness?: 'sample-exact' | 'unknown'
  }
  algorithm?: string
  quantization?: string
  createdAt?: string
  freshness?: 'fresh' | 'stale' | 'changed-while-sampled'
  databaseId?: string
  schemaDigest?: string
  metricConversion?: 'distance' | 'similarity' | 'one-minus-similarity'
  filter?: {
    syntax: 'search' | 'vector-set'
    expression: string
  }
  graph?: {
    exactness: 'exact' | 'approximate' | 'unknown'
    k?: number
    evidence?: DriftProvenance
  }
  redisVersion?: string
  redisInsightVersion?: string
  projection?: {
    algorithm: string
    version?: string
    dimensions?: 2
    seed?: number
    parameters?: Record<string, string | number | boolean>
    quality?: number
  }
  queryCommandDigest?: string
  profileEvidenceRef?: string
  driftEvidence?: DriftEvidenceV1
}

const toRecord = (value: unknown): Record<string, unknown> | undefined =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined

const optionalString = (value: unknown) =>
  typeof value === 'string' ? value : undefined

const optionalFiniteNumber = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined

const isProjectionParameter = (
  value: unknown,
): value is string | number | boolean =>
  typeof value === 'string' ||
  typeof value === 'number' ||
  typeof value === 'boolean'

const sanitizeDriftValue = (value: unknown): DriftValueV1 | undefined => {
  const record = toRecord(value)
  if (
    !record ||
    (record.provenance !== 'measured' &&
      record.provenance !== 'sampled' &&
      record.provenance !== 'unavailable')
  )
    return undefined
  return {
    provenance: record.provenance,
    value: optionalFiniteNumber(record.value),
    reason: optionalString(record.reason),
    unit: optionalString(record.unit),
  }
}

const sanitizeDriftEvidence = (value: unknown): DriftEvidenceV1 | undefined => {
  const record = toRecord(value)
  if (!record) return undefined
  return {
    clusterPopulation: sanitizeDriftValue(record.clusterPopulation),
    vectorNorm: sanitizeDriftValue(record.vectorNorm),
    neighborOverlap: sanitizeDriftValue(record.neighborOverlap),
    duplicateRate: sanitizeDriftValue(record.duplicateRate),
    outlierRate: sanitizeDriftValue(record.outlierRate),
    metadataCoverage: sanitizeDriftValue(record.metadataCoverage),
    sourceConfiguration: sanitizeDriftValue(record.sourceConfiguration),
  }
}

const sanitizeProjection = (value: unknown): LocalManifestV1['projection'] => {
  const record = toRecord(value)
  if (!record || typeof record.algorithm !== 'string') return undefined
  const rawParameters = toRecord(record.parameters)
  const parameters = rawParameters
    ? Object.entries(rawParameters).reduce<
        Record<string, string | number | boolean>
      >((sanitized, [key, entry]) => {
        if (isProjectionParameter(entry)) sanitized[key] = entry
        return sanitized
      }, {})
    : undefined
  return {
    algorithm: record.algorithm,
    version: optionalString(record.version),
    dimensions: record.dimensions === 2 ? 2 : undefined,
    seed: optionalFiniteNumber(record.seed),
    parameters,
    quality: optionalFiniteNumber(record.quality),
  }
}

const sanitizeSampling = (value: unknown): LocalManifestV1['sampling'] => {
  const record = toRecord(value)
  if (
    !record ||
    ![
      'deterministic-id-hash',
      'bounded-random',
      'ft-search-limit',
      'vrange',
      'vrandmember',
    ].includes(String(record.method))
  )
    return undefined
  const sourceCommand = ['FT.SEARCH', 'VRANGE', 'VRANDMEMBER'].includes(
    String(record.sourceCommand),
  )
    ? (record.sourceCommand as NonNullable<
        LocalManifestV1['sampling']
      >['sourceCommand'])
    : undefined
  const determinism = [
    'ordering-unspecified',
    'deterministic-stable-order',
    'unseeded-random',
  ].includes(String(record.determinism))
    ? (record.determinism as NonNullable<
        LocalManifestV1['sampling']
      >['determinism'])
    : undefined
  const exactness = ['sample-exact', 'unknown'].includes(
    String(record.exactness),
  )
    ? (record.exactness as NonNullable<
        LocalManifestV1['sampling']
      >['exactness'])
    : undefined
  return {
    method: record.method as NonNullable<LocalManifestV1['sampling']>['method'],
    sourceCommand,
    seed:
      record.seed === 'unavailable'
        ? 'unavailable'
        : optionalFiniteNumber(record.seed),
    determinism,
    exactness,
  }
}

export type BenchmarkEvidenceKind =
  | 'measured'
  | 'sampled'
  | 'estimated'
  | 'unavailable'

export interface BenchmarkMetricV1 {
  value?: number
  evidence: BenchmarkEvidenceKind
  detail?: string
}

/** Benchmark runs contain evidence only; no query vectors, payloads, or commands. */
export interface BenchmarkRunV1 {
  version: 1
  id: string
  manifest: LocalManifestV1
  recall: BenchmarkMetricV1
  latencyMs: BenchmarkMetricV1
  memoryMb: BenchmarkMetricV1
  completedAt?: string
}

export const toLocalManifest = (
  input: LocalManifestV1 & { rawVectors?: Float32Array; payload?: unknown },
): LocalManifestV1 => ({
  version: 1,
  sourceKind: input.sourceKind,
  sourceId: input.sourceId,
  dimensions: input.dimensions,
  metric: input.metric,
  vectorField: input.vectorField,
  sampleCount: input.sampleCount,
  sourceCount: input.sourceCount,
  sampleIdDigest: input.sampleIdDigest,
  sampling: sanitizeSampling(input.sampling),
  algorithm: input.algorithm,
  quantization: input.quantization,
  createdAt: input.createdAt,
  freshness: input.freshness,
  databaseId: optionalString(input.databaseId),
  schemaDigest: optionalString(input.schemaDigest),
  metricConversion: input.metricConversion,
  filter:
    input.filter?.syntax === 'search' || input.filter?.syntax === 'vector-set'
      ? {
          syntax: input.filter.syntax,
          expression: optionalString(input.filter.expression) ?? '',
        }
      : undefined,
  graph:
    input.graph?.exactness === 'exact' ||
    input.graph?.exactness === 'approximate' ||
    input.graph?.exactness === 'unknown'
      ? {
          exactness: input.graph.exactness,
          k: optionalFiniteNumber(input.graph.k),
          evidence: input.graph.evidence,
        }
      : undefined,
  redisVersion: input.redisVersion,
  redisInsightVersion: input.redisInsightVersion,
  projection: sanitizeProjection(input.projection),
  queryCommandDigest: input.queryCommandDigest,
  profileEvidenceRef: input.profileEvidenceRef,
  driftEvidence: sanitizeDriftEvidence(input.driftEvidence),
})

const isLocalManifestV1 = (
  value: Partial<LocalManifestV1>,
): value is LocalManifestV1 =>
  (value.sourceKind === 'search-index' || value.sourceKind === 'vector-set') &&
  typeof value.sourceId === 'string' &&
  value.sourceId.length > 0 &&
  Number.isFinite(value.dimensions) &&
  value.dimensions! > 0 &&
  (value.metric === 'cosine' ||
    value.metric === 'l2' ||
    value.metric === 'ip') &&
  Number.isFinite(value.sampleCount) &&
  value.sampleCount! >= 0 &&
  Number.isFinite(value.sourceCount) &&
  value.sourceCount! >= 0

export const loadLocalManifest = (
  serialized: string,
):
  | { kind: 'ready'; manifest: LocalManifestV1 }
  | { kind: 'invalid' | 'unsupported-version' } => {
  try {
    const value = JSON.parse(serialized) as Partial<LocalManifestV1>
    if (value.version !== 1) return { kind: 'unsupported-version' }
    return isLocalManifestV1(value)
      ? { kind: 'ready', manifest: toLocalManifest(value) }
      : { kind: 'invalid' }
  } catch {
    return { kind: 'invalid' }
  }
}

export interface LocalManifestStorage {
  save(id: string, manifest: LocalManifestV1): void
  load(id: string): ReturnType<typeof loadLocalManifest> | { kind: 'missing' }
  remove(id: string): void
}

/** Deliberately local-only storage: no import/export or sync surface exists. */
export const createLocalManifestStorage = (
  storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>,
  prefix = 'vector-visualizer:manifest:v1:',
): LocalManifestStorage => ({
  save: (id, manifest) =>
    storage.setItem(
      `${prefix}${id}`,
      JSON.stringify(toLocalManifest(manifest)),
    ),
  load: (id) => {
    const value = storage.getItem(`${prefix}${id}`)
    return value === null ? { kind: 'missing' } : loadLocalManifest(value)
  },
  remove: (id) => storage.removeItem(`${prefix}${id}`),
})

export const compareManifests = (
  left: LocalManifestV1,
  right: LocalManifestV1,
) => {
  const reasons = [
    left.version !== right.version && 'manifest versions differ',
    left.sourceKind !== right.sourceKind && 'source kinds differ',
    left.dimensions !== right.dimensions && 'dimensions differ',
    left.metric !== right.metric && 'metrics differ',
    left.vectorField !== right.vectorField && 'vector fields differ',
  ].filter(Boolean) as string[]
  const drift = (
    Object.entries({
      'cluster population': [
        left.driftEvidence?.clusterPopulation,
        right.driftEvidence?.clusterPopulation,
      ],
      'vector norm': [
        left.driftEvidence?.vectorNorm,
        right.driftEvidence?.vectorNorm,
      ],
      'neighbor overlap': [
        left.driftEvidence?.neighborOverlap,
        right.driftEvidence?.neighborOverlap,
      ],
      'duplicate rate': [
        left.driftEvidence?.duplicateRate,
        right.driftEvidence?.duplicateRate,
      ],
      'outlier rate': [
        left.driftEvidence?.outlierRate,
        right.driftEvidence?.outlierRate,
      ],
      'metadata coverage': [
        left.driftEvidence?.metadataCoverage,
        right.driftEvidence?.metadataCoverage,
      ],
      'source configuration': [
        left.driftEvidence?.sourceConfiguration,
        right.driftEvidence?.sourceConfiguration,
      ],
    }) as [string, [DriftValueV1 | undefined, DriftValueV1 | undefined]][]
  ).map(([metric, [before, after]]) => {
    if (
      !before ||
      !after ||
      before.provenance === 'unavailable' ||
      after.provenance === 'unavailable' ||
      !Number.isFinite(before.value) ||
      !Number.isFinite(after.value)
    )
      return {
        metric,
        provenance: 'unavailable' as const,
        reason: after?.reason ?? before?.reason ?? 'not-comparable',
      }
    if (before.unit !== after.unit)
      return {
        metric,
        provenance: 'unavailable' as const,
        reason: 'unit-mismatch',
      }
    return {
      metric,
      before: before.value!,
      after: after.value!,
      delta: after.value! - before.value!,
      unit: before.unit,
      provenance:
        before.provenance === 'measured' && after.provenance === 'measured'
          ? ('measured' as const)
          : ('sampled' as const),
    }
  })
  return reasons.length
    ? { compatible: false as const, reasons }
    : {
        compatible: true as const,
        sampleDelta: right.sampleCount - left.sampleCount,
        sourceDelta: right.sourceCount - left.sourceCount,
        drift,
      }
}

export interface BenchmarkPreviewInput {
  sourceKind: LocalManifestV1['sourceKind']
  truth: boolean
  sampleCount: number
}

export const buildBenchmarkPreview = ({
  sourceKind,
  truth,
  sampleCount,
}: BenchmarkPreviewInput) => ({
  commands: truth
    ? sourceKind === 'vector-set'
      ? ['VSIM', 'TRUTH']
      : ['FT.SEARCH KNN']
    : [],
  requiresConfirmation: truth,
  estimatedWork: `${sampleCount} bounded comparisons`,
  readOnly: true as const,
})

export const getComparableMeasuredRuns = (runs: BenchmarkRunV1[]) =>
  runs.filter((run) =>
    [run.recall, run.latencyMs].every(
      (metric) =>
        metric.evidence === 'measured' && Number.isFinite(metric.value),
    ),
  )

const scale = (
  value: number,
  minimum: number,
  maximum: number,
  outputMinimum: number,
  outputMaximum: number,
) =>
  minimum === maximum
    ? (outputMinimum + outputMaximum) / 2
    : outputMinimum +
      ((value - minimum) / (maximum - minimum)) *
        (outputMaximum - outputMinimum)

const PARETO_CHART = {
  x: { minimum: 44, maximum: 304 },
  y: { minimum: 12, maximum: 142 },
  radius: { minimum: 5, maximum: 18, fallback: 7 },
} as const

export const toParetoPoints = (runs: BenchmarkRunV1[]) => {
  const measured = getComparableMeasuredRuns(runs)
  const latencies = measured.map((run) => run.latencyMs.value ?? 0)
  const recalls = measured.map((run) => run.recall.value ?? 0)
  const minimumLatency = Math.min(...latencies)
  const maximumLatency = Math.max(...latencies)
  const minimumRecall = Math.min(...recalls)
  const maximumRecall = Math.max(...recalls)

  return measured.map((run) => ({
    id: run.id,
    x: scale(
      run.latencyMs.value ?? 0,
      minimumLatency,
      maximumLatency,
      PARETO_CHART.x.minimum,
      PARETO_CHART.x.maximum,
    ),
    y: scale(
      run.recall.value ?? 0,
      minimumRecall,
      maximumRecall,
      PARETO_CHART.y.maximum,
      PARETO_CHART.y.minimum,
    ),
    radius:
      run.memoryMb.evidence === 'measured' &&
      Number.isFinite(run.memoryMb.value)
        ? Math.max(
            PARETO_CHART.radius.minimum,
            Math.min(PARETO_CHART.radius.maximum, run.memoryMb.value! / 2),
          )
        : PARETO_CHART.radius.fallback,
  }))
}
