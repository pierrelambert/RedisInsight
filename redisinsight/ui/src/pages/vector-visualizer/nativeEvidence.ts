import type { DriftEvidenceV1 } from 'uiSrc/packages/vector-visualizer/src/compare/compare'
import type {
  XRayFact,
  XRayFactSeverity,
} from 'uiSrc/packages/vector-visualizer/src/types'

interface NativeEvidenceSample {
  dimensions: number
  metric: 'cosine' | 'l2' | 'ip' | 'unknown'
  algorithm?: string
  quantization?: string
  sourceCount: number
  sampleCount: number
  freshness: 'fresh' | 'changed-while-sampled' | 'unknown'
  records: Array<{
    id: string
    metadata?: Record<string, string | number | boolean>
  }>
}

const DUPLICATE_ATTENTION_THRESHOLD = 0.1
const DUPLICATE_NOTICE_THRESHOLD = 0.05
const OUTLIER_ATTENTION_THRESHOLD = 0.15
const OUTLIER_NOTICE_THRESHOLD = 0.08
const COVERAGE_ATTENTION_THRESHOLD = 0.5
const COVERAGE_NOTICE_THRESHOLD = 0.8

const rateSeverity = (
  value: number,
  attentionAbove: number,
  noticeAbove: number,
): XRayFactSeverity =>
  value >= attentionAbove
    ? 'attention'
    : value >= noticeAbove
      ? 'notice'
      : 'success'

const coverageSeverity = (value: number): XRayFactSeverity =>
  value < COVERAGE_ATTENTION_THRESHOLD
    ? 'attention'
    : value < COVERAGE_NOTICE_THRESHOLD
      ? 'notice'
      : 'success'

const percent = (value: number) => `${Number((value * 100).toFixed(2))}%`

const rate = (ids: string[], sampleCount: number) =>
  sampleCount ? new Set(ids).size / sampleCount : 0

const coverage = (sample: NativeEvidenceSample, field: string) =>
  sample.sampleCount
    ? sample.records.filter(({ metadata }) => {
        const value = metadata?.[field]
        return value !== undefined && value !== ''
      }).length / sample.sampleCount
    : 0

const freshness = (sample: NativeEvidenceSample) =>
  sample.freshness === 'fresh' ? 'fresh' : 'changed-while-sampled'

export const buildNativeXRayFacts = ({
  sample,
  metadataField,
  duplicateIds = [],
  outlierIds = [],
  queryValues = [],
  evidenceSampleCount,
  evidenceK,
  evidenceExactness,
}: {
  sample: NativeEvidenceSample
  metadataField?: string
  duplicateIds?: string[]
  outlierIds?: string[]
  queryValues?: number[]
  evidenceSampleCount?: number
  evidenceK?: number
  evidenceExactness?: 'sample-exact' | 'approximate' | 'unknown'
}): XRayFact[] => {
  const sampleFreshness = freshness(sample)
  const boundedCount = evidenceSampleCount ?? sample.sampleCount
  const algorithm = sample.algorithm ?? sample.quantization
  const minimum = queryValues.length ? Math.min(...queryValues) : undefined
  const maximum = queryValues.length ? Math.max(...queryValues) : undefined
  return [
    {
      label: 'Dimensions',
      value: String(sample.dimensions),
      formula: 'Source discovery response',
      sampleCount: sample.sampleCount,
      freshness: sampleFreshness,
      status: 'candidate',
    },
    {
      label: 'Redis source metric',
      value: sample.metric === 'unknown' ? 'Unknown' : sample.metric,
      formula: 'Source discovery response; no cross-source metric inference',
      sampleCount: sample.sampleCount,
      freshness: sampleFreshness,
      status: sample.metric === 'unknown' ? 'unknown' : 'candidate',
    },
    {
      label: 'Algorithm / quantization',
      value: algorithm ?? 'Unknown',
      formula: 'Source discovery response',
      sampleCount: sample.sampleCount,
      freshness: sampleFreshness,
      status: algorithm ? 'candidate' : 'unknown',
    },
    {
      label: 'Indexed count',
      value: String(sample.sourceCount),
      formula: 'Source count before bounded sampling',
      sampleCount: sample.sampleCount,
      freshness: sampleFreshness,
      status: 'candidate',
    },
    {
      label: 'Sample freshness',
      value:
        sample.freshness === 'fresh'
          ? 'Fresh bounded sample'
          : sample.freshness.replaceAll('-', ' '),
      formula: 'Source count before and after bounded sampling',
      sampleCount: sample.sampleCount,
      freshness: sampleFreshness,
      status: sample.freshness === 'unknown' ? 'unknown' : 'candidate',
      severity:
        sample.freshness === 'fresh'
          ? 'success'
          : sample.freshness === 'unknown'
            ? undefined
            : 'attention',
    },
    {
      label: 'Duplicate candidate rate',
      value:
        evidenceSampleCount === undefined
          ? 'Unknown'
          : percent(rate(duplicateIds, boundedCount)),
      formula: `Members in threshold-complete duplicate groups / ${boundedCount} bounded records`,
      sampleCount: boundedCount,
      freshness: sampleFreshness,
      status: evidenceSampleCount === undefined ? 'unknown' : 'candidate',
      severity:
        evidenceSampleCount === undefined
          ? undefined
          : rateSeverity(
              rate(duplicateIds, boundedCount),
              DUPLICATE_ATTENTION_THRESHOLD,
              DUPLICATE_NOTICE_THRESHOLD,
            ),
    },
    {
      label: 'Outlier candidate rate',
      value:
        evidenceSampleCount === undefined
          ? 'Unknown'
          : percent(rate(outlierIds, boundedCount)),
      formula: `Robust kth-neighbor candidate rule; k=${evidenceK ?? 'unknown'}; exactness=${evidenceExactness ?? 'unknown'}`,
      sampleCount: boundedCount,
      freshness: sampleFreshness,
      status: evidenceSampleCount === undefined ? 'unknown' : 'candidate',
      severity:
        evidenceSampleCount === undefined
          ? undefined
          : rateSeverity(
              rate(outlierIds, boundedCount),
              OUTLIER_ATTENTION_THRESHOLD,
              OUTLIER_NOTICE_THRESHOLD,
            ),
    },
    {
      label: 'Metadata coverage',
      value: metadataField
        ? percent(coverage(sample, metadataField))
        : 'Unknown',
      formula: metadataField
        ? `Non-empty allow-listed ${metadataField} values / bounded sample`
        : 'No allow-listed metadata field selected',
      sampleCount: sample.sampleCount,
      freshness: sampleFreshness,
      status: metadataField ? 'candidate' : 'unknown',
      severity: metadataField
        ? coverageSeverity(coverage(sample, metadataField))
        : undefined,
    },
    {
      label: 'Query score distribution',
      value:
        minimum === undefined || maximum === undefined
          ? 'Unknown'
          : `${minimum} – ${maximum} (${queryValues.length} results)`,
      formula:
        'Minimum and maximum response-backed values from the explicit bounded query',
      sampleCount: queryValues.length,
      freshness: sampleFreshness,
      status: queryValues.length ? 'candidate' : 'unknown',
    },
  ]
}

export const buildNativeDriftEvidence = ({
  sample,
  vectors,
  clusterField,
  metadataField,
  duplicateIds,
  outlierIds,
  queryNeighbors = [],
}: {
  sample: NativeEvidenceSample
  vectors: Float32Array
  clusterField?: string
  metadataField?: string
  duplicateIds?: string[]
  outlierIds?: string[]
  queryNeighbors?: Array<{ id: string; plotted: boolean }>
}): DriftEvidenceV1 => {
  const clusterCount = clusterField
    ? new Set(
        sample.records.flatMap(({ metadata }) => {
          const value = metadata?.[clusterField]
          return value === undefined || value === '' ? [] : [String(value)]
        }),
      ).size
    : undefined
  let normTotal = 0
  for (let record = 0; record < sample.sampleCount; record += 1) {
    let squared = 0
    for (let dimension = 0; dimension < sample.dimensions; dimension += 1)
      squared += vectors[record * sample.dimensions + dimension] ** 2
    normTotal += Math.sqrt(squared)
  }
  const sampled = (value: number, unit: string) => ({
    value,
    provenance: 'sampled' as const,
    unit,
  })
  return {
    clusterPopulation:
      clusterCount === undefined
        ? { provenance: 'unavailable', reason: 'cluster-field-not-selected' }
        : sampled(clusterCount, 'clusters'),
    vectorNorm: sampled(
      sample.sampleCount ? normTotal / sample.sampleCount : 0,
      'mean-l2-norm',
    ),
    neighborOverlap: queryNeighbors.length
      ? sampled(
          queryNeighbors.filter(({ plotted }) => plotted).length /
            queryNeighbors.length,
          'ratio',
        )
      : { provenance: 'unavailable', reason: 'query-not-run' },
    duplicateRate:
      duplicateIds === undefined
        ? {
            provenance: 'unavailable',
            reason: 'duplicate-evidence-unavailable',
          }
        : sampled(rate(duplicateIds, sample.sampleCount), 'ratio'),
    outlierRate:
      outlierIds === undefined
        ? { provenance: 'unavailable', reason: 'outlier-evidence-unavailable' }
        : sampled(rate(outlierIds, sample.sampleCount), 'ratio'),
    metadataCoverage: metadataField
      ? sampled(coverage(sample, metadataField), 'ratio')
      : { provenance: 'unavailable', reason: 'metadata-field-not-selected' },
    sourceConfiguration: {
      value: sample.dimensions,
      provenance: 'measured',
      unit: 'dimensions',
    },
  }
}
