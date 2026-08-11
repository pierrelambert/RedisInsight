import {
  LayoutController,
  LayoutWorkerClient,
  WorkerLike,
  measureBoundedNeighborhoodPreservation,
  rankNearestNeighborsForMetric,
  runBoundedMetricEvidence,
  runLayout,
} from './layout'

const job = {
  version: 1 as const,
  jobId: 'one',
  algorithm: 'umap' as const,
  metric: 'cosine' as const,
  count: 2,
  dimensions: 2,
  vectors: new Float32Array([1, 0, 0, 1]),
  seed: 4,
  parameters: { nNeighbors: 2 },
}

describe('atlas worker protocol', () => {
  it('builds inner-product neighborhoods that numerically differ from L2 neighborhoods', () => {
    const vectors = new Float32Array([1, 0, 10, 0, 0.9, 0.1])

    expect(
      rankNearestNeighborsForMetric({
        vectors,
        count: 3,
        dimensions: 2,
        metric: 'ip',
        index: 0,
        k: 1,
      }),
    ).toEqual([1])
    expect(
      rankNearestNeighborsForMetric({
        vectors,
        count: 3,
        dimensions: 2,
        metric: 'l2',
        index: 0,
        k: 1,
      }),
    ).toEqual([2])
  })

  it('measures bounded k-neighbor preservation against exact original-space and layout neighbors', () => {
    const good = measureBoundedNeighborhoodPreservation({
      vectors: new Float32Array([1, 0, 0.99, 0.01, 0, 1, 0.01, 0.99]),
      coordinates: new Float32Array([0, 0, 0.1, 0, 5, 5, 5.1, 5]),
      count: 4,
      dimensions: 2,
      metric: 'cosine',
      k: 1,
    })
    const bad = measureBoundedNeighborhoodPreservation({
      vectors: new Float32Array([1, 0, 0.99, 0.01, 0, 1, 0.01, 0.99]),
      coordinates: new Float32Array([0, 0, 5, 5, 0.1, 0, 5.1, 5]),
      count: 4,
      dimensions: 2,
      metric: 'cosine',
      k: 1,
    })

    expect(good).toEqual({
      kind: 'measured',
      name: 'bounded-k-neighbor-preservation',
      value: 1,
      k: 1,
      sampleSize: 4,
      exactness: 'sample-exact',
      freshness: 'unknown',
    })
    expect(bad).toMatchObject({
      kind: 'measured',
      name: 'bounded-k-neighbor-preservation',
      value: 0,
      k: 1,
      sampleSize: 4,
      exactness: 'sample-exact',
      freshness: 'unknown',
    })
  })

  it('attaches bounded neighborhood-quality provenance to a completed UMAP layout', () => {
    const result = runLayout(job)

    expect(result).toMatchObject({
      type: 'complete',
      quality: {
        kind: 'measured',
        name: 'bounded-k-neighbor-preservation',
        k: 1,
        sampleSize: 2,
        exactness: 'sample-exact',
        freshness: 'unknown',
      },
    })
  })

  it('uses inner-product ordering for inner-product original-space evidence', () => {
    const quality = measureBoundedNeighborhoodPreservation({
      vectors: new Float32Array([1, 0, 100, 0, 0.9, 0]),
      coordinates: new Float32Array([0, 0, 0.1, 0, 5, 5]),
      count: 3,
      dimensions: 2,
      metric: 'ip',
      k: 1,
    })

    expect(quality).toMatchObject({ kind: 'measured', value: 1 })
  })

  it('returns typed unsupported output and rejects stale jobs', () => {
    expect(runLayout({ ...job, algorithm: 'pca' })).toEqual({
      type: 'unsupported',
      algorithm: 'pca',
    })
    const controller = new LayoutController()
    const first = controller.start(job)
    controller.start({ ...job, jobId: 'two' })
    expect(
      controller.accept(first, {
        type: 'complete',
        jobId: 'one',
        coordinates: new Float32Array(4),
        quality: 1,
      }),
    ).toEqual({ accepted: false })
  })

  it('returns explicit empty and singleton layouts with unknown quality', () => {
    expect(
      runLayout({
        ...job,
        count: 0,
        dimensions: undefined,
        vectors: undefined,
      }),
    ).toEqual({
      type: 'complete',
      jobId: 'one',
      coordinates: new Float32Array(),
      quality: { kind: 'unknown', reason: 'insufficient-points' },
    })
    expect(
      runLayout({ ...job, count: 1, vectors: new Float32Array([1, 0]) }),
    ).toEqual({
      type: 'complete',
      jobId: 'one',
      coordinates: new Float32Array([0, 0]),
      quality: { kind: 'unknown', reason: 'insufficient-points' },
    })
  })

  it('terminates superseded workers and rejects late results', async () => {
    const workers: FakeWorker[] = []
    const client = new LayoutWorkerClient(() => {
      const worker = new FakeWorker()
      workers.push(worker)
      return worker
    })
    const first = client.start(job)
    const second = client.start({ ...job, jobId: 'two' })

    expect(workers[0].terminated).toBe(true)
    workers[0].emit({
      type: 'complete',
      jobId: 'one',
      coordinates: new Float32Array(4),
      quality: { kind: 'unknown', reason: 'not-measured' },
    })
    workers[1].emit({
      type: 'complete',
      jobId: 'two',
      coordinates: new Float32Array(4),
      quality: { kind: 'unknown', reason: 'not-measured' },
    })

    await expect(first).rejects.toThrow('cancelled')
    await expect(second).resolves.toMatchObject({
      type: 'complete',
      jobId: 'two',
    })
  })

  it('derives vector-free metric-aware evidence only for the configured capped subset', () => {
    const evidence = runBoundedMetricEvidence({
      jobId: 'health',
      ids: ['a', 'b', 'c'],
      vectors: new Float32Array([1, 0, 1, 0, 0, 1]),
      dimensions: 2,
      metric: 'cosine',
      maxSampleSize: 2,
      k: 1,
      freshness: 'fresh',
    })

    expect(evidence).toEqual({
      type: 'health-complete',
      jobId: 'health',
      metric: 'cosine',
      sampleIds: ['a', 'b'],
      pairMeasure: 'cosine similarity',
      duplicateDirection: 'at-least',
      edges: [{ sourceId: 'a', targetId: 'b', value: 1 }],
      neighborDistanceMeasure: 'cosine distance',
      kthDistances: [
        { id: 'a', kthNeighborDistance: 0 },
        { id: 'b', kthNeighborDistance: 0 },
      ],
      k: 1,
      freshness: 'fresh',
      exactness: 'sample-exact',
    })
    expect(JSON.stringify(evidence)).not.toContain('vectors')
  })

  it.each([
    [
      'l2',
      'L2 distance',
      'at-most',
      [
        { sourceId: 'a', targetId: 'b', value: 9 },
        { sourceId: 'a', targetId: 'c', value: 0.1 },
        { sourceId: 'b', targetId: 'c', value: 9.1 },
      ],
      'L2 distance',
    ],
    [
      'ip',
      'inner product',
      'at-least',
      [
        { sourceId: 'a', targetId: 'b', value: 10 },
        { sourceId: 'a', targetId: 'c', value: 0.9 },
        { sourceId: 'b', targetId: 'c', value: 9 },
      ],
      'inner-product dissimilarity',
    ],
  ] as const)(
    'computes %s pair and local-neighbor evidence with named units',
    (
      metric,
      pairMeasure,
      duplicateDirection,
      edges,
      neighborDistanceMeasure,
    ) => {
      const evidence = runBoundedMetricEvidence({
        jobId: `health-${metric}`,
        ids: ['a', 'b', 'c'],
        vectors: new Float32Array([1, 0, 10, 0, 0.9, 0]),
        dimensions: 2,
        metric,
        maxSampleSize: 3,
        k: 1,
        freshness: 'fresh',
      })

      expect(evidence).toMatchObject({
        metric,
        pairMeasure,
        duplicateDirection,
        edges: edges.map(({ sourceId, targetId }) => ({ sourceId, targetId })),
        neighborDistanceMeasure,
        k: 1,
        exactness: 'sample-exact',
      })
      evidence.edges.forEach((edge, index) =>
        expect(edge.value).toBeCloseTo(edges[index].value),
      )
      expect(
        evidence.kthDistances.every(({ kthNeighborDistance }) =>
          Number.isFinite(kthNeighborDistance),
        ),
      ).toBe(true)
    },
  )

  it('runs capped health evidence through the worker client rather than the page thread', async () => {
    const worker = new FakeWorker()
    const client = new LayoutWorkerClient(() => worker)
    const result = client.startHealth({
      jobId: 'health-client',
      ids: ['a', 'b'],
      vectors: new Float32Array([1, 0, 1, 0]),
      dimensions: 2,
      metric: 'cosine',
      maxSampleSize: 200,
      k: 1,
      freshness: 'fresh',
    })

    worker.emit({
      type: 'health-complete',
      jobId: 'health-client',
      metric: 'cosine',
      sampleIds: ['a', 'b'],
      pairMeasure: 'cosine similarity',
      duplicateDirection: 'at-least',
      edges: [{ sourceId: 'a', targetId: 'b', value: 1 }],
      neighborDistanceMeasure: 'cosine distance',
      kthDistances: [
        { id: 'a', kthNeighborDistance: 0 },
        { id: 'b', kthNeighborDistance: 0 },
      ],
      k: 1,
      freshness: 'fresh',
      exactness: 'sample-exact',
    })

    await expect(result).resolves.toMatchObject({ type: 'health-complete' })
  })
})

class FakeWorker implements WorkerLike {
  onmessage: ((event: MessageEvent<unknown>) => void) | null = null

  onerror: ((event: ErrorEvent) => void) | null = null

  terminated = false

  postMessage(): void {}

  terminate(): void {
    this.terminated = true
  }

  emit(data: unknown): void {
    this.onmessage?.({ data } as MessageEvent<unknown>)
  }
}
