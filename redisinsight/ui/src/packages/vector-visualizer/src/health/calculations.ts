import type { VectorMetric } from '../contracts'

export interface HealthSampleRecord {
  id: string
  metadata?: Record<string, unknown>
  clusterId?: string
}

export const DEFAULT_DUPLICATE_CANDIDATE_CONFIG = {
  similarityThreshold: 0.995,
} as const
export const DEFAULT_DUPLICATE_THRESHOLDS: Record<VectorMetric, number> = {
  cosine: 0.995,
  l2: 0.05,
  ip: 0.995,
}
export const defaultDuplicateThresholdForMetric = (metric: VectorMetric) =>
  DEFAULT_DUPLICATE_THRESHOLDS[metric]
export const DEFAULT_OUTLIER_CANDIDATE_CONFIG = {
  k: 10,
  robustDeviationThreshold: 3.5,
} as const

export type UnknownHealthEvidence = {
  kind: 'unknown'
  reason:
    | 'missing-original-space-neighbor-evidence'
    | 'invalid-original-space-neighbor-evidence'
    | 'sample-too-small-for-k'
    | 'zero-mad'
    | 'k-mismatch'
    | 'coverage-threshold-mismatch'
}

export interface OriginalSpaceCosineEdge {
  sourceId: string
  targetId: string
  cosineSimilarity: number
}
export interface OriginalSpaceCosineEvidence {
  metric: 'cosine'
  sampleIds: string[]
  freshness: 'fresh' | 'stale' | 'changed-while-sampled'
  coverage: 'threshold-complete' | 'partial-neighbor-graph'
  coverageSimilarityThreshold?: number
  edges: OriginalSpaceCosineEdge[]
}
export type PairMeasure = 'cosine similarity' | 'L2 distance' | 'inner product'
export interface OriginalSpaceMetricEvidence {
  metric: VectorMetric
  sampleIds: string[]
  freshness: 'fresh' | 'stale' | 'changed-while-sampled'
  coverage: 'sample-pair-complete' | 'partial-neighbor-graph'
  pairMeasure: PairMeasure
  duplicateDirection: 'at-least' | 'at-most'
  edges: { sourceId: string; targetId: string; value: number }[]
}
export interface KthNeighborCosineEvidence {
  metric: 'cosine-distance'
  sampleIds: string[]
  freshness: 'fresh' | 'stale' | 'changed-while-sampled'
  exactness: 'sample-exact' | 'approximate' | 'unknown'
  k: number
  distances: { id: string; kthNeighborCosineDistance: number }[]
}
export type NeighborDistanceMeasure =
  | 'cosine distance'
  | 'L2 distance'
  | 'inner-product dissimilarity'
export interface KthNeighborMetricEvidence {
  metric: VectorMetric
  distanceMeasure: NeighborDistanceMeasure
  sampleIds: string[]
  freshness: 'fresh' | 'stale' | 'changed-while-sampled'
  exactness: 'sample-exact' | 'approximate' | 'unknown'
  k: number
  distances: { id: string; kthNeighborDistance: number }[]
}

export interface DuplicateCandidateEvidence {
  kind: 'known'
  groups: { ids: string[] }[]
  sampleCount: number
  similarityThreshold: number
  threshold?: number
  metric?: VectorMetric
  pairMeasure?: PairMeasure
  duplicateDirection?: 'at-least' | 'at-most'
  freshness: OriginalSpaceCosineEvidence['freshness']
  coverage:
    | OriginalSpaceCosineEvidence['coverage']
    | OriginalSpaceMetricEvidence['coverage']
  formula: string
}
export interface OutlierCandidateEvidence {
  kind: 'known'
  ids: string[]
  sampleCount: number
  k: number
  robustDeviationThreshold: number
  medianDistance: number
  mad: number
  freshness: KthNeighborCosineEvidence['freshness']
  exactness: KthNeighborCosineEvidence['exactness']
  metric?: VectorMetric
  distanceMeasure?: NeighborDistanceMeasure
  formula: string
}
export interface MetadataCoverageEvidence {
  kind: 'known'
  field: string
  presentCount: number
  sampleCount: number
  formula: 'present/non-empty allow-listed metadata values over bounded sample'
}

const unique = (ids: string[]) => new Set(ids).size === ids.length
const sameIds = (left: string[], right: string[]) =>
  left.length === right.length && left.every((id) => right.includes(id))
const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2
}
const duplicateThreshold = (config: {
  similarityThreshold?: number
  threshold?: number
}) => config.threshold ?? config.similarityThreshold
const validDuplicateConfig = (config: {
  similarityThreshold?: number
  threshold?: number
}) => Number.isFinite(duplicateThreshold(config))
const validOutlierConfig = (config: {
  k: number
  robustDeviationThreshold: number
}) =>
  Number.isInteger(config.k) &&
  config.k >= 1 &&
  Number.isFinite(config.robustDeviationThreshold) &&
  config.robustDeviationThreshold > 0

export const calculateMetadataCoverage = (
  records: HealthSampleRecord[],
  field: string,
): MetadataCoverageEvidence => ({
  kind: 'known',
  field,
  presentCount: records.filter(({ metadata }) => {
    const value = metadata?.[field]
    return (
      value !== undefined && value !== null && String(value).trim().length > 0
    )
  }).length,
  sampleCount: records.length,
  formula: 'present/non-empty allow-listed metadata values over bounded sample',
})

export const calculateDuplicateCandidates = (
  records: HealthSampleRecord[],
  evidence?: OriginalSpaceCosineEvidence | OriginalSpaceMetricEvidence,
  config: {
    similarityThreshold?: number
    threshold?: number
  } = DEFAULT_DUPLICATE_CANDIDATE_CONFIG,
): DuplicateCandidateEvidence | UnknownHealthEvidence => {
  if (!evidence)
    return {
      kind: 'unknown',
      reason: 'missing-original-space-neighbor-evidence',
    }
  const ids = records.map(({ id }) => id)
  const threshold = duplicateThreshold(config)!
  const metricEvidence = 'pairMeasure' in evidence ? evidence : undefined
  const metric = metricEvidence?.metric ?? 'cosine'
  const pairMeasure = metricEvidence?.pairMeasure ?? 'cosine similarity'
  const duplicateDirection =
    metricEvidence?.duplicateDirection ?? ('at-least' as const)
  const edges = evidence.edges.map((edge) =>
    'value' in edge
      ? edge
      : {
          sourceId: edge.sourceId,
          targetId: edge.targetId,
          value: edge.cosineSimilarity,
        },
  )
  if (
    !validDuplicateConfig(config) ||
    !unique(ids) ||
    !ids.length ||
    !unique(evidence.sampleIds) ||
    !sameIds(ids, evidence.sampleIds) ||
    !['cosine', 'l2', 'ip'].includes(metric) ||
    !['fresh', 'stale', 'changed-while-sampled'].includes(evidence.freshness) ||
    ![
      'threshold-complete',
      'sample-pair-complete',
      'partial-neighbor-graph',
    ].includes(evidence.coverage) ||
    (evidence.coverage === 'threshold-complete' &&
      (!Number.isFinite(evidence.coverageSimilarityThreshold) ||
        evidence.coverageSimilarityThreshold! < -1 ||
        evidence.coverageSimilarityThreshold! > 1)) ||
    edges.some(
      ({ sourceId, targetId, value }) =>
        !ids.includes(sourceId) ||
        !ids.includes(targetId) ||
        sourceId === targetId ||
        !Number.isFinite(value),
    )
  )
    return {
      kind: 'unknown',
      reason: 'invalid-original-space-neighbor-evidence',
    }
  if (
    evidence.coverage === 'threshold-complete' &&
    threshold < evidence.coverageSimilarityThreshold!
  )
    return { kind: 'unknown', reason: 'coverage-threshold-mismatch' }
  const parent = ids.map((_, index) => index)
  const indexById = new Map(ids.map((id, index) => [id, index]))
  const root = (initialIndex: number): number => {
    let index = initialIndex
    while (parent[index] !== index) {
      parent[index] = parent[parent[index]]
      index = parent[index]
    }
    return index
  }
  edges.forEach(({ sourceId, targetId, value }) => {
    const matches =
      duplicateDirection === 'at-least'
        ? value >= threshold
        : value <= threshold
    if (matches)
      parent[root(indexById.get(sourceId)!)] = root(indexById.get(targetId)!)
  })
  const groups = new Map<number, string[]>()
  ids.forEach((id, index) => {
    const group = groups.get(root(index)) ?? []
    group.push(id)
    groups.set(root(index), group)
  })
  return {
    kind: 'known',
    groups: [...groups.values()]
      .filter(({ length }) => length > 1)
      .map((group) => ({ ids: group })),
    sampleCount: ids.length,
    similarityThreshold: threshold,
    threshold,
    metric,
    pairMeasure,
    duplicateDirection,
    freshness: evidence.freshness,
    coverage: evidence.coverage,
    formula: `connected components over original-space ${pairMeasure}`,
  }
}

export const calculateOutlierCandidates = (
  evidence?: KthNeighborCosineEvidence | KthNeighborMetricEvidence,
  config: {
    k: number
    robustDeviationThreshold: number
  } = DEFAULT_OUTLIER_CANDIDATE_CONFIG,
): OutlierCandidateEvidence | UnknownHealthEvidence => {
  if (!evidence)
    return {
      kind: 'unknown',
      reason: 'missing-original-space-neighbor-evidence',
    }
  const metricEvidence =
    evidence.metric === 'cosine-distance' ? undefined : evidence
  const metric = metricEvidence?.metric ?? 'cosine'
  const distanceMeasure =
    metricEvidence?.distanceMeasure ?? ('cosine distance' as const)
  const distances = evidence.distances.map((distance) => ({
    id: distance.id,
    kthNeighborDistance:
      'kthNeighborDistance' in distance
        ? distance.kthNeighborDistance
        : distance.kthNeighborCosineDistance,
  }))
  if (
    !validOutlierConfig(config) ||
    !['cosine', 'l2', 'ip'].includes(metric) ||
    !Number.isInteger(evidence.k) ||
    evidence.k < 1 ||
    !unique(evidence.sampleIds) ||
    !evidence.sampleIds.length ||
    !unique(distances.map(({ id }) => id)) ||
    !sameIds(
      evidence.sampleIds,
      distances.map(({ id }) => id),
    ) ||
    !['fresh', 'stale', 'changed-while-sampled'].includes(evidence.freshness) ||
    !['sample-exact', 'approximate', 'unknown'].includes(evidence.exactness) ||
    distances.some(
      ({ kthNeighborDistance }) =>
        !Number.isFinite(kthNeighborDistance) || kthNeighborDistance < 0,
    )
  )
    return {
      kind: 'unknown',
      reason: 'invalid-original-space-neighbor-evidence',
    }
  if (evidence.k !== config.k) return { kind: 'unknown', reason: 'k-mismatch' }
  if (distances.length <= config.k)
    return { kind: 'unknown', reason: 'sample-too-small-for-k' }
  const values = distances.map(({ kthNeighborDistance }) => kthNeighborDistance)
  const medianDistance = median(values)
  const mad = median(values.map((value) => Math.abs(value - medianDistance)))
  if (!mad) return { kind: 'unknown', reason: 'zero-mad' }
  return {
    kind: 'known',
    ids: distances
      .filter(
        ({ kthNeighborDistance }) =>
          kthNeighborDistance >
          medianDistance + config.robustDeviationThreshold * mad,
      )
      .map(({ id }) => id),
    sampleCount: values.length,
    k: evidence.k,
    robustDeviationThreshold: config.robustDeviationThreshold,
    medianDistance,
    mad,
    freshness: evidence.freshness,
    exactness: evidence.exactness,
    metric,
    distanceMeasure,
    formula:
      distanceMeasure === 'cosine distance'
        ? 'median/MAD over kth-neighbor cosine distances'
        : `median/MAD over kth-neighbor ${distanceMeasure}`,
  }
}
