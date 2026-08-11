import {
  DEFAULT_DUPLICATE_CANDIDATE_CONFIG,
  DEFAULT_OUTLIER_CANDIDATE_CONFIG,
  calculateDuplicateCandidates,
  calculateMetadataCoverage,
  calculateOutlierCandidates,
  defaultDuplicateThresholdForMetric,
} from './calculations'

const records = [
  { id: 'a', metadata: { region: 'eu' }, clusterId: 'c1' },
  { id: 'b', metadata: { region: 'eu' }, clusterId: 'c1' },
  { id: 'c', metadata: { region: 'us' }, clusterId: 'c2' },
  { id: 'd', metadata: { region: '   ' }, clusterId: 'c2' },
]

describe('health calculations', () => {
  it('ships visible metric-specific duplicate defaults', () => {
    expect(defaultDuplicateThresholdForMetric('cosine')).toBe(0.995)
    expect(defaultDuplicateThresholdForMetric('l2')).toBe(0.05)
    expect(defaultDuplicateThresholdForMetric('ip')).toBe(0.995)
  })

  it.each([
    ['l2', 'L2 distance', 'at-most', [0.01, 2], 0.05],
    ['ip', 'inner product', 'at-least', [1.2, 0.1], 0.995],
  ] as const)(
    'finds %s duplicate candidates with a named metric rule',
    (metric, pairMeasure, duplicateDirection, values, threshold) => {
      expect(
        calculateDuplicateCandidates(
          records.slice(0, 3),
          {
            metric,
            sampleIds: ['a', 'b', 'c'],
            freshness: 'fresh',
            coverage: 'sample-pair-complete',
            pairMeasure,
            duplicateDirection,
            edges: [
              { sourceId: 'a', targetId: 'b', value: values[0] },
              { sourceId: 'a', targetId: 'c', value: values[1] },
              { sourceId: 'b', targetId: 'c', value: values[1] },
            ],
          },
          { threshold },
        ),
      ).toMatchObject({
        kind: 'known',
        groups: [{ ids: ['a', 'b'] }],
        metric,
        pairMeasure,
        duplicateDirection,
        threshold,
      })
    },
  )

  it('labels L2 kth-neighbor outlier evidence with its metric, rule, k, and exactness', () => {
    const distances = [
      0.01, 0.011, 0.012, 0.013, 0.014, 0.015, 0.016, 0.017, 0.018, 0.019, 1,
      0.02,
    ].map((kthNeighborDistance, index) => ({
      id: index === 10 ? 'far' : String(index),
      kthNeighborDistance,
    }))
    const result = calculateOutlierCandidates({
      metric: 'l2',
      distanceMeasure: 'L2 distance',
      sampleIds: distances.map(({ id }) => id),
      freshness: 'fresh',
      exactness: 'sample-exact',
      k: 10,
      distances,
    })

    expect(result).toMatchObject({
      kind: 'known',
      metric: 'l2',
      distanceMeasure: 'L2 distance',
      k: 10,
      exactness: 'sample-exact',
    })
    expect(result.kind === 'known' && result.ids).toContain('far')
  })

  it('counts non-empty allow-listed metadata over the bounded sample', () => {
    expect(calculateMetadataCoverage(records, 'region')).toMatchObject({
      kind: 'known',
      presentCount: 3,
      sampleCount: 4,
      formula:
        'present/non-empty allow-listed metadata values over bounded sample',
    })
  })

  it('finds original-space cosine duplicate connected components from supplied graph evidence', () => {
    expect(DEFAULT_DUPLICATE_CANDIDATE_CONFIG.similarityThreshold).toBe(0.995)
    expect(
      calculateDuplicateCandidates(records, {
        metric: 'cosine',
        sampleIds: ['a', 'b', 'c', 'd'],
        freshness: 'fresh',
        coverage: 'threshold-complete',
        coverageSimilarityThreshold: 0.995,
        edges: [
          { sourceId: 'a', targetId: 'b', cosineSimilarity: 0.9999 },
          { sourceId: 'b', targetId: 'c', cosineSimilarity: 0.8 },
        ],
      }),
    ).toMatchObject({
      kind: 'known',
      groups: [{ ids: ['a', 'b'] }],
      formula: 'connected components over original-space cosine similarity',
    })
  })

  it('returns Unknown candidate evidence when original-space graph evidence is missing or malformed', () => {
    expect(calculateDuplicateCandidates(records)).toEqual({
      kind: 'unknown',
      reason: 'missing-original-space-neighbor-evidence',
    })
    expect(
      calculateDuplicateCandidates(records, {
        metric: 'cosine',
        sampleIds: ['a', 'b', 'c', 'd'],
        freshness: 'fresh',
        coverage: 'partial-neighbor-graph',
        edges: [{ sourceId: 'a', targetId: 'b', cosineSimilarity: Number.NaN }],
      }),
    ).toEqual({
      kind: 'unknown',
      reason: 'invalid-original-space-neighbor-evidence',
    })
  })

  it('rejects a configured duplicate threshold below threshold-complete graph coverage', () => {
    expect(
      calculateDuplicateCandidates(
        records,
        {
          metric: 'cosine',
          sampleIds: ['a', 'b', 'c', 'd'],
          freshness: 'fresh',
          coverage: 'threshold-complete',
          coverageSimilarityThreshold: 0.995,
          edges: [],
        },
        {
          similarityThreshold: 0.99,
        } as unknown as typeof DEFAULT_DUPLICATE_CANDIDATE_CONFIG,
      ),
    ).toEqual({ kind: 'unknown', reason: 'coverage-threshold-mismatch' })
  })

  it('marks robust kth-neighbor-distance candidates without calling them defects', () => {
    const outlierEvidence = [
      { id: 'a', kthNeighborCosineDistance: 0.01 },
      { id: 'b', kthNeighborCosineDistance: 0.011 },
      { id: 'c', kthNeighborCosineDistance: 0.012 },
      { id: 'd', kthNeighborCosineDistance: 0.013 },
      { id: 'e', kthNeighborCosineDistance: 0.014 },
      { id: 'f', kthNeighborCosineDistance: 0.015 },
      { id: 'g', kthNeighborCosineDistance: 0.016 },
      { id: 'h', kthNeighborCosineDistance: 0.017 },
      { id: 'i', kthNeighborCosineDistance: 0.018 },
      { id: 'j', kthNeighborCosineDistance: 0.019 },
      { id: 'far', kthNeighborCosineDistance: 1 },
      { id: 'extra', kthNeighborCosineDistance: 0.02 },
    ]
    expect(DEFAULT_OUTLIER_CANDIDATE_CONFIG).toEqual({
      k: 10,
      robustDeviationThreshold: 3.5,
    })
    const result = calculateOutlierCandidates({
      metric: 'cosine-distance',
      sampleIds: outlierEvidence.map(({ id }) => id),
      freshness: 'fresh',
      exactness: 'sample-exact',
      k: 10,
      distances: outlierEvidence,
    })
    expect(result).toMatchObject({
      kind: 'known',
      formula: 'median/MAD over kth-neighbor cosine distances',
    })
    expect(result.kind === 'known' && result.ids).toContain('far')
  })

  it('returns Unknown when k cannot be supported or MAD is zero', () => {
    expect(
      calculateOutlierCandidates({
        metric: 'cosine-distance',
        sampleIds: records.map(({ id }) => id),
        freshness: 'fresh',
        exactness: 'sample-exact',
        k: 10,
        distances: records.map(({ id }) => ({
          id,
          kthNeighborCosineDistance: 0.01,
        })),
      }),
    ).toEqual({ kind: 'unknown', reason: 'sample-too-small-for-k' })
    expect(
      calculateOutlierCandidates({
        metric: 'cosine-distance',
        sampleIds: Array.from({ length: 11 }, (_, index) => String(index)),
        freshness: 'fresh',
        exactness: 'sample-exact',
        k: 10,
        distances: Array.from({ length: 11 }, (_, index) => ({
          id: String(index),
          kthNeighborCosineDistance: 0.01,
        })),
      }),
    ).toEqual({ kind: 'unknown', reason: 'zero-mad' })
  })
})
