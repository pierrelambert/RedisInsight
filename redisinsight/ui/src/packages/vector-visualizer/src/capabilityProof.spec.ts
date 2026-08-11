import {
  createAbortableReadOnlyExecutor,
  decodeSearchReply,
  decodeVectorSetReply,
  getSourceCapabilities,
  WORKBENCH_SAMPLE_LIMITS,
} from './capabilityProof'

describe('vector visualizer capability proof', () => {
  it('decodes bounded HASH and JSON Search rows without retaining vector values', () => {
    expect(
      decodeSearchReply([
        2,
        'doc:hash',
        ['title', 'Hash row', 'embedding', '[0.1,0.2]'],
        'doc:json',
        ['$', '{"title":"JSON row","embedding":[0.3,0.4]}'],
      ]),
    ).toEqual([
      { id: 'doc:hash', storage: 'hash', fields: { title: 'Hash row' } },
      { id: 'doc:json', storage: 'json', fields: { title: 'JSON row' } },
    ])
  })

  it('decodes Vector Set results while keeping reconstructed vector bytes memory-only', () => {
    expect(
      decodeVectorSetReply({
        elements: [
          {
            name: new TextEncoder().encode('member:1'),
            score: 0.92,
            attributes: '{"kind":"demo"}',
          },
        ],
        reconstructedVectors: [new Float32Array(2)],
      }),
    ).toEqual({
      members: [{ id: 'member:1', score: 0.92, attributes: { kind: 'demo' } }],
      vectorCount: 1,
    })
  })

  it('keeps source-specific unavailable capabilities explicit', () => {
    expect(getSourceCapabilities('search-index')).toMatchObject({
      queryProfile: 'full',
      topology: 'none',
      exactNeighbors: 'controlled-comparison',
    })
    expect(getSourceCapabilities('vector-set')).toMatchObject({
      queryProfile: 'reduced',
      topology: 'hnsw-adjacency',
      exactNeighbors: 'native',
    })
  })

  it('rejects an aborted native read and leaves Workbench sampling unavailable', async () => {
    const controller = new AbortController()
    const execute = createAbortableReadOnlyExecutor(() =>
      Promise.resolve('late'),
    )
    controller.abort()

    await expect(
      execute('FT.INFO safe:index', controller.signal),
    ).rejects.toThrow('Read-only command cancelled')
    expect(WORKBENCH_SAMPLE_LIMITS.atlas).toEqual({
      available: false,
      reason: 'plugin SDK execution has no AbortSignal contract',
    })
  })
})
