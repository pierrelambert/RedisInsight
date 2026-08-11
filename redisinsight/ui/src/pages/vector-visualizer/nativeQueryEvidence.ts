import type { QueryLabProps } from 'uiSrc/packages/vector-visualizer/src/query-lab/QueryLab'
import type { BoundedMetricEvidenceResult } from 'uiSrc/packages/vector-visualizer/src/worker/layout'

type NativeQuerySourceEvidenceInput = {
  sourceKind: QueryLabProps['sourceKind']
  sampleKind: 'success' | 'partial'
  neighborMetric?: QueryLabProps['neighbors'][number]['metric']
  health?: Pick<
    BoundedMetricEvidenceResult,
    | 'metric'
    | 'pairMeasure'
    | 'neighborDistanceMeasure'
    | 'edges'
    | 'kthDistances'
  >
}

const finiteValues = (values: number[]) => values.filter(Number.isFinite)

/**
 * Returns only metric values derived from bounded Redis response vectors. It
 * intentionally omits values when the query and source-evidence scales differ.
 */
export const buildNativeQuerySourceSample = ({
  sourceKind,
  sampleKind,
  neighborMetric,
  health,
}: NativeQuerySourceEvidenceInput): QueryLabProps['sourceSample'] => {
  if (!health || !neighborMetric) return undefined
  const completeness = sampleKind === 'partial' ? 'partial' : 'bounded'
  if (
    sourceKind === 'search-index' &&
    neighborMetric === 'distance' &&
    (health.metric === 'cosine' || health.metric === 'l2')
  ) {
    const values = finiteValues(
      health.kthDistances.map(({ kthNeighborDistance }) => kthNeighborDistance),
    )
    if (!values.length) return undefined
    return {
      values,
      completeness,
      provenance: `locally derived from bounded Redis response vectors: sample-exact ${health.neighborDistanceMeasure}`,
    }
  }
  if (sourceKind === 'vector-set' && neighborMetric === 'similarity') {
    const values = finiteValues(health.edges.map(({ value }) => value))
    if (!values.length) return undefined
    return {
      values,
      completeness,
      provenance: `locally derived from bounded Redis response vectors: sample-exact ${health.pairMeasure}`,
    }
  }
  return undefined
}
