import { buildNativeQuerySourceSample } from './nativeQueryEvidence'

const health = {
  metric: 'cosine' as const,
  pairMeasure: 'cosine similarity' as const,
  neighborDistanceMeasure: 'cosine distance' as const,
  edges: [
    { sourceId: 'a', targetId: 'b', value: 0.8 },
    { sourceId: 'a', targetId: 'c', value: Number.NaN },
  ],
  kthDistances: [
    { id: 'a', kthNeighborDistance: 0.1 },
    { id: 'b', kthNeighborDistance: Number.POSITIVE_INFINITY },
  ],
}

describe('native Query Lab source evidence', () => {
  it('uses finite bounded original-space distances for compatible Search results', () => {
    expect(
      buildNativeQuerySourceSample({
        sourceKind: 'search-index',
        sampleKind: 'success',
        neighborMetric: 'distance',
        health,
      }),
    ).toEqual({
      values: [0.1],
      completeness: 'bounded',
      provenance:
        'locally derived from bounded Redis response vectors: sample-exact cosine distance',
    })
  })

  it('uses bounded pair similarities for Vector Set similarity results', () => {
    expect(
      buildNativeQuerySourceSample({
        sourceKind: 'vector-set',
        sampleKind: 'partial',
        neighborMetric: 'similarity',
        health,
      }),
    ).toEqual({
      values: [0.8],
      completeness: 'partial',
      provenance:
        'locally derived from bounded Redis response vectors: sample-exact cosine similarity',
    })
  })

  it('omits source values when the query metric scale is not comparable', () => {
    expect(
      buildNativeQuerySourceSample({
        sourceKind: 'search-index',
        sampleKind: 'success',
        neighborMetric: 'distance',
        health: {
          ...health,
          metric: 'ip',
          pairMeasure: 'inner product',
          neighborDistanceMeasure: 'inner-product dissimilarity',
        },
      }),
    ).toBeUndefined()
  })
})
