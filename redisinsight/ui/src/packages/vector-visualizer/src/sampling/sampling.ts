import type { LayoutJobV1 } from '../contracts'

export interface SampleSnapshotInput {
  ids: string[]
  vectors: Float32Array
  sourceCount: number
}

/** Keeps raw embeddings process-local and makes invalidation explicit. */
export const createSampleSnapshot = ({
  ids,
  vectors,
  sourceCount,
}: SampleSnapshotInput) => {
  let rawVectors: Float32Array | undefined = vectors
  return {
    ids: [...ids],
    sourceCount,
    takeVectors: () => rawVectors,
    invalidate: () => {
      rawVectors = undefined
    },
  }
}

export const sampleFreshness = (before: number, after: number) =>
  before === after ? 'fresh' : 'changed-while-sampled'

export const normalizeCosineVectors = (
  vectors: Float32Array,
  count: number,
) => {
  if (count < 1 || vectors.length % count) throw new Error('invalid dimensions')
  const dimensions = vectors.length / count
  const normalized = new Float32Array(vectors.length)
  for (let row = 0; row < count; row += 1) {
    let magnitude = 0
    for (let column = 0; column < dimensions; column += 1) {
      const value = vectors[row * dimensions + column]
      if (!Number.isFinite(value)) throw new Error('non-finite vector')
      magnitude += value * value
    }
    if (!magnitude) throw new Error('zero vector')
    const scale = 1 / Math.sqrt(magnitude)
    for (let column = 0; column < dimensions; column += 1)
      normalized[row * dimensions + column] =
        vectors[row * dimensions + column] * scale
  }
  return normalized
}

export const validateLayoutJob = (job: LayoutJobV1) => {
  if (
    job.version !== 1 ||
    (job.algorithm !== 'umap' && job.algorithm !== 'pca')
  )
    return { valid: false as const, reason: 'unsupported-algorithm' }
  if (job.count === 0 && !job.vectors && !job.dimensions)
    return { valid: true as const }
  if (
    job.count < 0 ||
    job.count > 20_000 ||
    !job.dimensions ||
    !job.vectors ||
    job.vectors.length !== job.count * job.dimensions
  )
    return { valid: false as const, reason: 'invalid-job' }
  try {
    if (job.metric === 'cosine') normalizeCosineVectors(job.vectors, job.count)
    else if (job.vectors.some((value) => !Number.isFinite(value)))
      return { valid: false as const, reason: 'invalid-vector' }
  } catch {
    return { valid: false as const, reason: 'invalid-vector' }
  }
  return { valid: true as const }
}
