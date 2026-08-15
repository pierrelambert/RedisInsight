import {
  recommendSearchIndexTuning,
  recommendVectorSetTuning,
  resolveSearchIndexTuningProfile,
  TuneRecommendation,
} from './recommendations'

const confidenceWeight = { high: 2, medium: 1, low: 0 } as const

const isSortedByConfidenceDesc = (recommendations: TuneRecommendation[]) =>
  recommendations.every(
    (recommendation, index) =>
      index === 0 ||
      confidenceWeight[recommendations[index - 1].confidence] >=
        confidenceWeight[recommendation.confidence],
  )

describe('recommendVectorSetTuning', () => {
  it('recommends a moderate EF_RUNTIME range for a small index', () => {
    const recommendations = recommendVectorSetTuning({
      count: 5_000,
      dimensions: 128,
    })
    const efRecommendation = recommendations.find(
      (recommendation) => recommendation.parameter === 'EF_RUNTIME',
    )
    expect(efRecommendation?.suggestedRange).toBe('100-150')
  })

  it('recommends a higher EF_RUNTIME range for a large index', () => {
    const recommendations = recommendVectorSetTuning({
      count: 500_000,
      dimensions: 128,
    })
    const efRecommendation = recommendations.find(
      (recommendation) => recommendation.parameter === 'EF_RUNTIME',
    )
    expect(efRecommendation?.suggestedRange).toBe('300+')
  })

  it('suggests increasing EF when benchmark recall is low', () => {
    const recommendations = recommendVectorSetTuning(
      { count: 5_000, dimensions: 128 },
      0.75,
    )
    const lowRecallRecommendation = recommendations.find(
      (recommendation) =>
        recommendation.parameter === 'EF_RUNTIME' &&
        recommendation.guidance.toLowerCase().includes('increase'),
    )
    expect(lowRecallRecommendation).toBeDefined()
    expect(lowRecallRecommendation?.confidence).toBe('high')
  })

  it('does not suggest an EF increase when benchmark recall is healthy', () => {
    const recommendations = recommendVectorSetTuning(
      { count: 5_000, dimensions: 128 },
      0.98,
    )
    const lowRecallRecommendation = recommendations.find(
      (recommendation) =>
        recommendation.parameter === 'EF_RUNTIME' &&
        recommendation.guidance.toLowerCase().includes('increase'),
    )
    expect(lowRecallRecommendation).toBeUndefined()
  })

  it('suggests a higher M for high-dimensional vectors', () => {
    const recommendations = recommendVectorSetTuning({
      count: 5_000,
      dimensions: 600,
    })
    const mRecommendation = recommendations.find(
      (recommendation) => recommendation.parameter === 'M',
    )
    expect(mRecommendation?.suggestedRange).toBe('32-64')
  })

  it('flags M values above 64 as rarely justified', () => {
    const recommendations = recommendVectorSetTuning({
      count: 5_000,
      dimensions: 128,
      m: 96,
    })
    const excessiveMRecommendation = recommendations.find(
      (recommendation) =>
        recommendation.parameter === 'M' &&
        recommendation.guidance.toLowerCase().includes('rarely justified'),
    )
    expect(excessiveMRecommendation).toBeDefined()
  })

  it('returns safe defaults for an empty profile without crashing', () => {
    expect(() => recommendVectorSetTuning({})).not.toThrow()
    const recommendations = recommendVectorSetTuning({})
    expect(recommendations.length).toBeGreaterThan(0)
    recommendations.forEach((recommendation) => {
      expect(recommendation.parameter).toBeTruthy()
      expect(recommendation.guidance).toBeTruthy()
      expect(recommendation.impact).toBeTruthy()
    })
  })

  it('sorts recommendations by confidence, highest first', () => {
    const recommendations = recommendVectorSetTuning(
      { count: 5_000, dimensions: 600, m: 96 },
      0.5,
    )
    expect(recommendations.length).toBeGreaterThan(1)
    expect(isSortedByConfidenceDesc(recommendations)).toBe(true)
  })
})

describe('recommendSearchIndexTuning', () => {
  it('recommends a moderate EF_RUNTIME range for a small index', () => {
    const recommendations = recommendSearchIndexTuning({
      algorithm: 'hnsw',
      count: 5_000,
      dimensions: 128,
    })
    const efRecommendation = recommendations.find(
      (recommendation) => recommendation.parameter === 'EF_RUNTIME',
    )
    expect(efRecommendation?.suggestedRange).toBe('100-150')
  })

  it('recommends a higher EF_RUNTIME range for a large index', () => {
    const recommendations = recommendSearchIndexTuning({
      algorithm: 'hnsw',
      count: 500_000,
      dimensions: 128,
    })
    const efRecommendation = recommendations.find(
      (recommendation) => recommendation.parameter === 'EF_RUNTIME',
    )
    expect(efRecommendation?.suggestedRange).toBe('300+')
  })

  it('includes EF_CONSTRUCTION guidance', () => {
    const recommendations = recommendSearchIndexTuning({
      algorithm: 'hnsw',
      count: 5_000,
    })
    const efConstructionRecommendation = recommendations.find(
      (recommendation) => recommendation.parameter === 'EF_CONSTRUCTION',
    )
    expect(efConstructionRecommendation).toBeDefined()
    expect(efConstructionRecommendation?.suggestedRange).toBe('200+')
  })

  it('suggests a higher M for high-dimensional vectors', () => {
    const recommendations = recommendSearchIndexTuning({
      count: 5_000,
      dimensions: 600,
      algorithm: 'HNSW',
    })
    const mRecommendation = recommendations.find(
      (recommendation) => recommendation.parameter === 'M',
    )
    expect(mRecommendation?.suggestedRange).toBe('32-64')
  })

  it('flags M values above 64 as rarely justified', () => {
    const recommendations = recommendSearchIndexTuning({
      algorithm: 'hnsw',
      count: 5_000,
      dimensions: 128,
      m: 96,
    })
    const excessiveMRecommendation = recommendations.find(
      (recommendation) =>
        recommendation.parameter === 'M' &&
        recommendation.guidance.toLowerCase().includes('rarely justified'),
    )
    expect(excessiveMRecommendation).toBeDefined()
  })

  it('omits HNSW recommendations when a Search index is not HNSW', () => {
    expect(() => recommendSearchIndexTuning({})).not.toThrow()
    const recommendations = recommendSearchIndexTuning({})
    expect(recommendations).toEqual([])
  })

  it('uses current HNSW values discovered from FT.INFO', () => {
    const recommendations = recommendSearchIndexTuning({
      algorithm: 'hnsw',
      count: 5_000,
      dimensions: 768,
      m: 32,
      efConstruction: 300,
      efRuntime: 150,
    })

    expect(
      recommendations.find(
        (recommendation) => recommendation.parameter === 'EF_RUNTIME',
      )?.currentValue,
    ).toBe(150)
    expect(
      recommendations.find(
        (recommendation) => recommendation.parameter === 'EF_CONSTRUCTION',
      )?.currentValue,
    ).toBe(300)
    expect(
      recommendations.find((recommendation) => recommendation.parameter === 'M')
        ?.currentValue,
    ).toBe(32)
  })

  it('uses Redis HNSW defaults when FT.INFO omits optional attributes', () => {
    const profile = resolveSearchIndexTuningProfile({
      algorithm: 'hnsw',
      count: 5_000,
      dimensions: 768,
    })

    expect(profile).toMatchObject({
      m: 16,
      efConstruction: 200,
      efRuntime: 10,
      epsilon: 0.01,
    })

    const recommendations = recommendSearchIndexTuning(profile)
    expect(
      recommendations.find(
        (recommendation) => recommendation.parameter === 'EF_RUNTIME',
      )?.currentValue,
    ).toBe(10)
    expect(
      recommendations.find(
        (recommendation) => recommendation.parameter === 'EF_CONSTRUCTION',
      )?.currentValue,
    ).toBe(200)
    expect(
      recommendations.find((recommendation) => recommendation.parameter === 'M')
        ?.currentValue,
    ).toBe(16)
    expect(
      recommendations.find(
        (recommendation) => recommendation.parameter === 'EPSILON',
      )?.currentValue,
    ).toBe(0.01)
  })

  it('uses Redis SVS-VAMANA defaults when FT.INFO omits optional attributes', () => {
    const profile = resolveSearchIndexTuningProfile({
      algorithm: 'svs-vamana',
      count: 5_000,
      dimensions: 768,
    })

    expect(profile).toMatchObject({
      compression: 'none',
      graphMaxDegree: 32,
      constructionWindowSize: 200,
      searchWindowSize: 10,
      epsilon: 0.01,
      useSearchHistory: 'AUTO',
      searchBufferCapacity: 'SEARCH_WINDOW_SIZE',
    })

    const recommendations = recommendSearchIndexTuning(profile)
    expect(
      recommendations.find(
        (recommendation) => recommendation.parameter === 'SEARCH_WINDOW_SIZE',
      )?.currentValue,
    ).toBe(10)
    expect(
      recommendations.find(
        (recommendation) => recommendation.parameter === 'GRAPH_MAX_DEGREE',
      )?.currentValue,
    ).toBe(32)
    expect(
      recommendations.find(
        (recommendation) =>
          recommendation.parameter === 'CONSTRUCTION_WINDOW_SIZE',
      )?.currentValue,
    ).toBe(200)
  })

  it('sorts recommendations by confidence, highest first', () => {
    const recommendations = recommendSearchIndexTuning({
      algorithm: 'hnsw',
      count: 5_000,
      dimensions: 600,
      m: 96,
    })
    expect(recommendations.length).toBeGreaterThan(1)
    expect(isSortedByConfidenceDesc(recommendations)).toBe(true)
  })
})
