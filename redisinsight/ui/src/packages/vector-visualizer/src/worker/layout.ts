import { UMAP } from 'umap-js'
import type { LayoutJobV1 } from '../contracts'
import { normalizeCosineVectors, validateLayoutJob } from '../sampling/sampling'

export type LayoutQuality =
  | {
      kind: 'measured'
      name: 'bounded-k-neighbor-preservation'
      value: number
      k: number
      sampleSize: number
      exactness: 'sample-exact'
      freshness: 'unknown'
    }
  | { kind: 'unknown'; reason: 'insufficient-points' | 'not-measured' }

const QUALITY_SAMPLE_LIMIT = 512
const DEFAULT_UMAP_NEIGHBORS = 15
const INNER_PRODUCT_EXPONENT_LIMIT = 50
const MAX_POWER_ITERATIONS = 100
const POWER_ITERATION_CONVERGENCE_TOLERANCE = 1e-10

export interface BoundedMetricEvidenceJob {
  jobId: string
  ids: string[]
  vectors: Float32Array
  dimensions: number
  metric: LayoutJobV1['metric']
  maxSampleSize: number
  k: number
  freshness: 'fresh' | 'stale' | 'changed-while-sampled'
}

export interface BoundedMetricEvidenceResult {
  type: 'health-complete'
  jobId: string
  metric: LayoutJobV1['metric']
  sampleIds: string[]
  pairMeasure: 'cosine similarity' | 'L2 distance' | 'inner product'
  duplicateDirection: 'at-least' | 'at-most'
  edges: { sourceId: string; targetId: string; value: number }[]
  neighborDistanceMeasure:
    | 'cosine distance'
    | 'L2 distance'
    | 'inner-product dissimilarity'
  kthDistances: { id: string; kthNeighborDistance: number }[]
  k: number
  freshness: BoundedMetricEvidenceJob['freshness']
  exactness: 'sample-exact'
}

/**
 * This operates on a deliberately capped in-memory subset in a Worker. It
 * returns no vectors and never attempts an O(n²) calculation for the full
 * sampled Atlas (which may contain 20,000 points).
 */
export const runBoundedMetricEvidence = (
  job: BoundedMetricEvidenceJob,
): BoundedMetricEvidenceResult => {
  const count = Math.min(
    job.ids.length,
    Math.max(0, Math.floor(job.maxSampleSize)),
  )
  const sampleIds = job.ids.slice(0, count)
  const boundedVectors = job.vectors.slice(0, count * job.dimensions)
  const vectors =
    job.metric === 'cosine'
      ? normalizeCosineVectors(boundedVectors, count)
      : boundedVectors
  const pairDistances = sampleIds.map(() => [] as number[])
  const edges: BoundedMetricEvidenceResult['edges'] = []
  for (let source = 0; source < count; source += 1) {
    for (let target = source + 1; target < count; target += 1) {
      const sourceVector = vectors.subarray(
        source * job.dimensions,
        (source + 1) * job.dimensions,
      )
      const targetVector = vectors.subarray(
        target * job.dimensions,
        (target + 1) * job.dimensions,
      )
      let dot = 0
      for (let dimension = 0; dimension < job.dimensions; dimension += 1)
        dot += sourceVector[dimension] * targetVector[dimension]
      const value =
        job.metric === 'l2'
          ? euclideanDistance(sourceVector, targetVector)
          : job.metric === 'cosine'
            ? Math.max(-1, Math.min(1, dot))
            : dot
      edges.push({
        sourceId: sampleIds[source],
        targetId: sampleIds[target],
        value,
      })
      const distance =
        job.metric === 'cosine'
          ? 1 - value
          : job.metric === 'ip'
            ? innerProductDistance(sourceVector, targetVector)
            : value
      pairDistances[source].push(distance)
      pairDistances[target].push(distance)
    }
  }
  const k = Math.max(1, Math.floor(job.k))
  return {
    type: 'health-complete',
    jobId: job.jobId,
    metric: job.metric,
    sampleIds,
    pairMeasure:
      job.metric === 'cosine'
        ? 'cosine similarity'
        : job.metric === 'l2'
          ? 'L2 distance'
          : 'inner product',
    duplicateDirection: job.metric === 'l2' ? 'at-most' : 'at-least',
    edges,
    neighborDistanceMeasure:
      job.metric === 'cosine'
        ? 'cosine distance'
        : job.metric === 'l2'
          ? 'L2 distance'
          : 'inner-product dissimilarity',
    kthDistances: sampleIds.map((id, index) => ({
      id,
      kthNeighborDistance:
        [...pairDistances[index]].sort((left, right) => left - right)[k - 1] ??
        Number.NaN,
    })),
    k,
    freshness: job.freshness,
    exactness: 'sample-exact',
  }
}

type Complete = {
  type: 'complete'
  jobId: string
  coordinates: Float32Array
  quality: LayoutQuality
  timing?: { layoutMs: number }
}
type Unsupported = { type: 'unsupported'; algorithm: 'tsne' }
type Invalid = { type: 'invalid'; reason: string }
export type LayoutResult = Complete | Unsupported | Invalid

export interface WorkerLike {
  onmessage: ((event: MessageEvent<unknown>) => void) | null
  onerror: ((event: ErrorEvent) => void) | null
  postMessage(message: unknown, transfer?: Transferable[]): void
  terminate(): void
}

type WorkerResponse =
  | LayoutResult
  | BoundedMetricEvidenceResult
  | { type: 'cancelled'; jobId: string }

const random = (seed: number) => () => {
  const modulus = 0x1_0000_0000
  let value = Math.trunc(seed) % modulus
  if (value < 0) value += modulus
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) % modulus
    if (value < 0) value += modulus
    return value / modulus
  }
}

type BoundedNeighborhoodQualityInput = {
  vectors: Float32Array
  coordinates: Float32Array
  count: number
  dimensions: number
  metric: LayoutJobV1['metric']
  k: number
}

type NumericVector = ArrayLike<number>

const euclideanDistance = (left: NumericVector, right: NumericVector) => {
  let squared = 0
  for (let index = 0; index < left.length; index += 1)
    squared += (left[index] - right[index]) ** 2
  return Math.sqrt(squared)
}

const cosineDistance = (left: NumericVector, right: NumericVector) => {
  let dot = 0
  let leftNorm = 0
  let rightNorm = 0
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index]
    leftNorm += left[index] ** 2
    rightNorm += right[index] ** 2
  }
  if (!leftNorm || !rightNorm) return 1
  return 1 - Math.max(-1, Math.min(1, dot / Math.sqrt(leftNorm * rightNorm)))
}

/** Positive monotone dissimilarity: larger inner product is always nearer. */
const innerProductDistance = (left: NumericVector, right: NumericVector) => {
  let dot = 0
  for (let index = 0; index < left.length; index += 1)
    dot += left[index] * right[index]
  return Math.exp(
    -Math.max(
      -INNER_PRODUCT_EXPONENT_LIMIT,
      Math.min(INNER_PRODUCT_EXPONENT_LIMIT, dot),
    ),
  )
}

const distanceForMetric = (metric: LayoutJobV1['metric']) =>
  metric === 'ip'
    ? innerProductDistance
    : metric === 'cosine'
      ? cosineDistance
      : euclideanDistance

export const rankNearestNeighborsForMetric = ({
  vectors,
  count,
  dimensions,
  metric,
  index,
  k,
}: {
  vectors: Float32Array
  count: number
  dimensions: number
  metric: LayoutJobV1['metric']
  index: number
  k: number
}) =>
  Array.from({ length: count }, (_, candidate) => candidate)
    .filter((candidate) => candidate !== index)
    .map((candidate) => {
      const source = vectors.subarray(
        index * dimensions,
        (index + 1) * dimensions,
      )
      const target = vectors.subarray(
        candidate * dimensions,
        (candidate + 1) * dimensions,
      )
      const comparisonValue = distanceForMetric(metric)(source, target)
      return { candidate, comparisonValue }
    })
    .sort(
      (left, right) =>
        left.comparisonValue - right.comparisonValue ||
        left.candidate - right.candidate,
    )
    .slice(0, k)
    .map(({ candidate }) => candidate)

/**
 * Mean k-neighbor overlap between exact original-space and 2D-layout
 * neighborhoods. Callers cap input before this calculation; it is sampled
 * evidence only and never claims a global geometry guarantee.
 */
export const measureBoundedNeighborhoodPreservation = ({
  vectors,
  coordinates,
  count,
  dimensions,
  metric,
  k,
}: BoundedNeighborhoodQualityInput): LayoutQuality => {
  if (count < 2 || dimensions < 1 || coordinates.length < count * 2)
    return { kind: 'unknown', reason: 'insufficient-points' }
  const effectiveK = Math.min(Math.max(1, Math.floor(k)), count - 1)
  const overlaps = Array.from({ length: count }, (_, index) => {
    const original = new Set(
      rankNearestNeighborsForMetric({
        vectors,
        count,
        dimensions,
        metric,
        index,
        k: effectiveK,
      }),
    )
    const projected = rankNearestNeighborsForMetric({
      vectors: coordinates,
      count,
      dimensions: 2,
      metric: 'l2',
      index,
      k: effectiveK,
    })
    return (
      projected.filter((candidate) => original.has(candidate)).length /
      effectiveK
    )
  })
  return {
    kind: 'measured',
    name: 'bounded-k-neighbor-preservation',
    value: overlaps.reduce((total, overlap) => total + overlap, 0) / count,
    k: effectiveK,
    sampleSize: count,
    exactness: 'sample-exact',
    freshness: 'unknown',
  }
}

export interface PCAProjection {
  coordinates: Float32Array
  varianceExplainedRatio: number
}

type Eigenpair = { vector: Float64Array; eigenvalue: number }

const dotProduct = (left: Float64Array, right: Float64Array) => {
  let sum = 0
  for (let index = 0; index < left.length; index += 1)
    sum += left[index] * right[index]
  return sum
}

const normalizeInPlace = (vector: Float64Array) => {
  const norm = Math.sqrt(dotProduct(vector, vector))
  if (norm > 0)
    for (let index = 0; index < vector.length; index += 1) vector[index] /= norm
  return vector
}

/** Index-weighted, not uniform: avoids symmetry ties with axis-aligned test data. */
const seedVector = (dimensions: number): Float64Array => {
  const vector = new Float64Array(dimensions)
  for (let index = 0; index < dimensions; index += 1) vector[index] = index + 1
  return normalizeInPlace(vector)
}

/**
 * Applies the implicit covariance operator X^T X to `vector` without
 * materializing a d×d covariance or n×n Gram matrix. Each pass costs O(n·d),
 * which keeps bounded local samples viable for high-dimensional vectors.
 */
const applyCovariance = (
  centered: Float64Array,
  count: number,
  dimensions: number,
  vector: Float64Array,
): Float64Array => {
  const projected = new Float64Array(count)
  for (let row = 0; row < count; row += 1) {
    let sum = 0
    for (let col = 0; col < dimensions; col += 1)
      sum += centered[row * dimensions + col] * vector[col]
    projected[row] = sum
  }
  const result = new Float64Array(dimensions)
  for (let row = 0; row < count; row += 1) {
    const weight = projected[row]
    if (!weight) continue
    for (let col = 0; col < dimensions; col += 1)
      result[col] += centered[row * dimensions + col] * weight
  }
  return result
}

const powerIterateTopEigenpair = (
  centered: Float64Array,
  count: number,
  dimensions: number,
  deflate?: Eigenpair,
): Eigenpair => {
  let vector = seedVector(dimensions)
  let eigenvalue = 0
  for (let iteration = 0; iteration < MAX_POWER_ITERATIONS; iteration += 1) {
    const next = applyCovariance(centered, count, dimensions, vector)
    if (deflate) {
      const overlap = dotProduct(deflate.vector, vector) * deflate.eigenvalue
      for (let index = 0; index < dimensions; index += 1)
        next[index] -= overlap * deflate.vector[index]
      const residual = dotProduct(deflate.vector, next)
      for (let index = 0; index < dimensions; index += 1)
        next[index] -= residual * deflate.vector[index]
    }
    const norm = Math.sqrt(dotProduct(next, next))
    if (norm === 0) {
      vector = next
      eigenvalue = 0
      break
    }
    for (let index = 0; index < dimensions; index += 1) next[index] /= norm
    const similarity = Math.abs(dotProduct(next, vector))
    vector = next
    eigenvalue = norm
    if (1 - similarity < POWER_ITERATION_CONVERGENCE_TOLERANCE) break
  }
  return { vector, eigenvalue }
}

export const projectPCA = (
  vectors: Float32Array,
  count: number,
  dimensions: number,
): PCAProjection => {
  const mean = new Float64Array(dimensions)
  for (let row = 0; row < count; row += 1)
    for (let col = 0; col < dimensions; col += 1)
      mean[col] += vectors[row * dimensions + col]
  for (let col = 0; col < dimensions; col += 1) mean[col] /= count

  const centered = new Float64Array(count * dimensions)
  for (let row = 0; row < count; row += 1)
    for (let col = 0; col < dimensions; col += 1)
      centered[row * dimensions + col] =
        vectors[row * dimensions + col] - mean[col]

  let totalVariance = 0
  for (let index = 0; index < centered.length; index += 1)
    totalVariance += centered[index] * centered[index]

  const first = powerIterateTopEigenpair(centered, count, dimensions)
  const second =
    dimensions > 1
      ? powerIterateTopEigenpair(centered, count, dimensions, first)
      : { vector: new Float64Array(dimensions), eigenvalue: 0 }

  const coordinates = new Float32Array(count * 2)
  for (let row = 0; row < count; row += 1) {
    let firstScore = 0
    let secondScore = 0
    for (let col = 0; col < dimensions; col += 1) {
      const value = centered[row * dimensions + col]
      firstScore += value * first.vector[col]
      secondScore += value * second.vector[col]
    }
    coordinates[row * 2] = firstScore
    coordinates[row * 2 + 1] = secondScore
  }

  const varianceExplainedRatio =
    totalVariance > 0
      ? Math.min(
          1,
          Math.max(0, (first.eigenvalue + second.eigenvalue) / totalVariance),
        )
      : 1

  return { coordinates, varianceExplainedRatio }
}

export const runPCA = (job: LayoutJobV1): LayoutResult => {
  if (job.count === 0)
    return {
      type: 'complete',
      jobId: job.jobId,
      coordinates: new Float32Array(),
      quality: { kind: 'unknown', reason: 'insufficient-points' },
    }
  if (job.count === 1)
    return {
      type: 'complete',
      jobId: job.jobId,
      coordinates: new Float32Array([0, 0]),
      quality: { kind: 'unknown', reason: 'insufficient-points' },
    }
  const vectors =
    job.metric === 'cosine'
      ? normalizeCosineVectors(job.vectors!, job.count)
      : job.vectors!
  const { coordinates } = projectPCA(vectors, job.count, job.dimensions!)
  const qualityCount = Math.min(job.count, QUALITY_SAMPLE_LIMIT)
  const qualityK = Math.min(
    job.parameters.nNeighbors ?? DEFAULT_UMAP_NEIGHBORS,
    qualityCount - 1,
  )
  return {
    type: 'complete',
    jobId: job.jobId,
    coordinates,
    quality: measureBoundedNeighborhoodPreservation({
      vectors: vectors.slice(0, qualityCount * job.dimensions!),
      coordinates: coordinates.slice(0, qualityCount * 2),
      count: qualityCount,
      dimensions: job.dimensions!,
      metric: job.metric === 'ip' ? 'ip' : 'l2',
      k: qualityK,
    }),
  }
}

export const runLayout = (job: LayoutJobV1): LayoutResult => {
  if (job.algorithm === 'tsne')
    return { type: 'unsupported', algorithm: 'tsne' }
  const validation = validateLayoutJob(job)
  if (!validation.valid) return { type: 'invalid', reason: validation.reason }
  if (job.algorithm === 'pca') return runPCA(job)
  if (job.count === 0)
    return {
      type: 'complete',
      jobId: job.jobId,
      coordinates: new Float32Array(),
      quality: { kind: 'unknown', reason: 'insufficient-points' },
    }
  if (job.count === 1)
    return {
      type: 'complete',
      jobId: job.jobId,
      coordinates: new Float32Array([0, 0]),
      quality: { kind: 'unknown', reason: 'insufficient-points' },
    }
  const vectors =
    job.metric === 'cosine'
      ? normalizeCosineVectors(job.vectors!, job.count)
      : job.vectors!
  const rows = Array.from({ length: job.count }, (_, index) =>
    Array.from(
      vectors.slice(index * job.dimensions!, (index + 1) * job.dimensions!),
    ),
  )
  const umap = new UMAP({
    nNeighbors: Math.min(
      job.parameters.nNeighbors ?? DEFAULT_UMAP_NEIGHBORS,
      job.count - 1,
    ),
    distanceFn: distanceForMetric(job.metric === 'ip' ? 'ip' : 'l2'),
    random: random(job.seed)(),
  })
  const coordinates = new Float32Array(umap.fit(rows).flat())
  const qualityCount = Math.min(job.count, QUALITY_SAMPLE_LIMIT)
  const qualityK = Math.min(
    job.parameters.nNeighbors ?? DEFAULT_UMAP_NEIGHBORS,
    qualityCount - 1,
  )
  return {
    type: 'complete',
    jobId: job.jobId,
    coordinates,
    quality: measureBoundedNeighborhoodPreservation({
      vectors: vectors.slice(0, qualityCount * job.dimensions!),
      coordinates: coordinates.slice(0, qualityCount * 2),
      count: qualityCount,
      dimensions: job.dimensions!,
      metric: job.metric === 'ip' ? 'ip' : 'l2',
      k: qualityK,
    }),
  }
}

export class LayoutController {
  private active = 0

  start(_job: LayoutJobV1) {
    this.active += 1
    return this.active
  }

  accept<T>(generation: number, value: T) {
    return generation === this.active
      ? { accepted: true as const, value }
      : { accepted: false as const }
  }
}

/** Main-thread worker lifecycle: generation checks plus hard cancellation by termination. */
export class LayoutWorkerClient {
  private active?: {
    generation: number
    worker: WorkerLike
    reject: (error: Error) => void
  }

  private generation = 0

  constructor(private readonly createWorker: () => WorkerLike) {}

  start(job: LayoutJobV1): Promise<LayoutResult> {
    this.cancel()
    const generation = ++this.generation
    const worker = this.createWorker()
    return new Promise<LayoutResult>((resolve, reject) => {
      this.active = { generation, worker, reject }
      worker.onmessage = ({ data }: MessageEvent<unknown>) => {
        if (generation !== this.generation) return
        const result = data as WorkerResponse
        if (result.type === 'cancelled') {
          reject(new Error('Layout job cancelled'))
        } else if (result.type === 'health-complete') {
          reject(new Error('Invalid layout response'))
        } else {
          resolve(result)
        }
        this.release(worker, generation)
      }
      worker.onerror = () => {
        if (generation !== this.generation) return
        reject(new Error('Layout worker failed'))
        this.release(worker, generation)
      }
      const transfer = [
        job.vectors?.buffer,
        job.edgeOffsets?.buffer,
        job.edgeTargets?.buffer,
        job.edgeDistances?.buffer,
      ].filter((buffer): buffer is ArrayBuffer => buffer instanceof ArrayBuffer)
      worker.postMessage({ type: 'run', job }, transfer)
    })
  }

  startHealth(
    job: BoundedMetricEvidenceJob,
  ): Promise<BoundedMetricEvidenceResult> {
    this.cancel()
    const generation = ++this.generation
    const worker = this.createWorker()
    return new Promise<BoundedMetricEvidenceResult>((resolve, reject) => {
      this.active = { generation, worker, reject }
      worker.onmessage = ({ data }: MessageEvent<unknown>) => {
        if (generation !== this.generation) return
        const result = data as WorkerResponse
        if (result.type === 'cancelled') {
          reject(new Error('Health evidence cancelled'))
        } else if (result.type === 'health-complete') {
          resolve(result)
        } else {
          reject(new Error('Invalid health evidence response'))
        }
        this.release(worker, generation)
      }
      worker.onerror = () => {
        if (generation !== this.generation) return
        reject(new Error('Health evidence worker failed'))
        this.release(worker, generation)
      }
      worker.postMessage(
        { type: 'health', job },
        job.vectors.buffer instanceof ArrayBuffer ? [job.vectors.buffer] : [],
      )
    })
  }

  cancel(): void {
    if (!this.active) return
    const { worker, reject } = this.active
    this.active = undefined
    this.generation += 1
    worker.postMessage({ type: 'cancel' })
    worker.terminate()
    reject(new Error('Layout job cancelled'))
  }

  dispose(): void {
    this.cancel()
  }

  private release(worker: WorkerLike, generation: number): void {
    if (this.active?.generation === generation) this.active = undefined
    worker.terminate()
  }
}
