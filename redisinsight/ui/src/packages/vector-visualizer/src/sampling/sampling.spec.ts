import {
  createSampleSnapshot,
  normalizeCosineVectors,
  validateLayoutJob,
  sampleFreshness,
} from './sampling'

describe('atlas sampling', () => {
  it('normalizes finite cosine vectors and rejects zero/non-finite values', () => {
    expect(normalizeCosineVectors(new Float32Array([3, 4]), 1)).toEqual(
      new Float32Array([0.6, 0.8]),
    )
    expect(() => normalizeCosineVectors(new Float32Array([0, 0]), 1)).toThrow(
      'zero vector',
    )
  })
  it('bounds jobs and reports freshness changes', () => {
    expect(
      validateLayoutJob({
        version: 1,
        jobId: 'a',
        algorithm: 'umap',
        metric: 'cosine',
        count: 2,
        dimensions: 2,
        vectors: new Float32Array([1, 0, 0, 1]),
        seed: 1,
        parameters: {},
      }),
    ).toEqual({ valid: true })
    expect(sampleFreshness(10, 11)).toBe('changed-while-sampled')
  })

  it('keeps raw vectors in a cancellable memory-only sample snapshot', () => {
    const snapshot = createSampleSnapshot({
      ids: ['a'],
      vectors: new Float32Array([1, 0]),
      sourceCount: 1,
    })

    expect(snapshot.takeVectors()).toEqual(new Float32Array([1, 0]))
    snapshot.invalidate()
    expect(snapshot.takeVectors()).toBeUndefined()
  })

  it('accepts explicit empty and singleton layouts without invalid dimensions', () => {
    expect(
      validateLayoutJob({
        version: 1,
        jobId: 'empty',
        algorithm: 'umap',
        metric: 'cosine',
        count: 0,
        seed: 1,
        parameters: {},
      }),
    ).toEqual({ valid: true })
    expect(
      validateLayoutJob({
        version: 1,
        jobId: 'single',
        algorithm: 'umap',
        metric: 'cosine',
        count: 1,
        dimensions: 2,
        vectors: new Float32Array([1, 0]),
        seed: 1,
        parameters: {},
      }),
    ).toEqual({ valid: true })
  })
})
