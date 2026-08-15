import {
  buildNativeDriftEvidence,
  buildNativeXRayFacts,
} from './nativeEvidence'

const sample: Parameters<typeof buildNativeXRayFacts>[0]['sample'] = {
  dimensions: 2,
  metric: 'cosine' as const,
  algorithm: 'HNSW',
  sourceCount: 4,
  sampleCount: 4,
  freshness: 'fresh' as const,
  records: [
    { id: 'a', metadata: { category: 'one', cluster: 'c1' } },
    { id: 'b', metadata: { category: 'one', cluster: 'c1' } },
    { id: 'c', metadata: { category: 'two', cluster: 'c2' } },
    { id: 'd', metadata: {} },
  ],
}

describe('native vector-free evidence', () => {
  it('builds the complete Health X-ray from bounded response-backed facts', () => {
    const facts = buildNativeXRayFacts({
      sample,
      metadataField: 'category',
      duplicateIds: ['a', 'b'],
      outlierIds: ['d'],
      queryValues: [0.1, 0.2, 0.4],
      evidenceSampleCount: 4,
      evidenceK: 2,
      evidenceExactness: 'sample-exact',
    })

    expect(
      Object.fromEntries(facts.map((fact) => [fact.label, fact.value])),
    ).toEqual({
      Dimensions: '2',
      'Redis source metric': 'cosine',
      'Algorithm / quantization': 'HNSW',
      'Indexed count': '4',
      'Sample freshness': 'Fresh bounded sample',
      'Duplicate candidate rate': '50%',
      'Outlier candidate rate': '25%',
      'Metadata coverage': '75%',
      'Query score distribution': '0.1 – 0.4 (3 results)',
    })
    expect(
      facts.find(({ label }) => label === 'Outlier candidate rate'),
    ).toMatchObject({ sampleCount: 4, formula: expect.stringContaining('k=2') })
    expect(facts.find(({ label }) => label === 'Dimensions')).toMatchObject({
      severity: 'danger',
    })
    expect(
      facts.find(({ label }) => label === 'Duplicate candidate rate'),
    ).toMatchObject({ severity: 'danger' })
  })

  it('returns vector-free sampled drift facts with explicit provenance', () => {
    const drift = buildNativeDriftEvidence({
      sample,
      vectors: new Float32Array([3, 4, 0, 2, 1, 0, 0, 1]),
      clusterField: 'cluster',
      metadataField: 'category',
      duplicateIds: ['a', 'b'],
      outlierIds: ['d'],
      queryNeighbors: [
        { id: 'a', plotted: true },
        { id: 'outside', plotted: false },
      ],
    })

    expect(drift).toMatchObject({
      clusterPopulation: { value: 2, provenance: 'sampled', unit: 'clusters' },
      vectorNorm: { value: 2.25, provenance: 'sampled', unit: 'mean-l2-norm' },
      neighborOverlap: { value: 0.5, provenance: 'sampled', unit: 'ratio' },
      duplicateRate: { value: 0.5, provenance: 'sampled', unit: 'ratio' },
      outlierRate: { value: 0.25, provenance: 'sampled', unit: 'ratio' },
      metadataCoverage: { value: 0.75, provenance: 'sampled', unit: 'ratio' },
      sourceConfiguration: {
        value: 2,
        provenance: 'measured',
        unit: 'dimensions',
      },
    })
    expect(JSON.stringify(drift)).not.toMatch(/vectors|payload|3,4,0,2/)
  })
})
