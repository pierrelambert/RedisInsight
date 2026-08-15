import type { CommandPlan } from 'uiSrc/packages/vector-visualizer/src/contracts'

import {
  orchestrateNativeQuery,
  orchestrateNativeSample,
} from './nativeOrchestration'

const float32 = (...values: number[]) =>
  Array.from(new Uint8Array(new Float32Array(values).buffer))
    .map((byte) => `\\x${byte.toString(16).padStart(2, '0')}`)
    .join('')

const searchInfo = (count = 2, dataType = 'FLOAT32') => [
  'num_docs',
  count,
  'attributes',
  [
    [
      'identifier',
      'embedding',
      'attribute',
      'embedding',
      'type',
      'VECTOR',
      'data_type',
      dataType,
      'dim',
      2,
      'distance_metric',
      'COSINE',
      'algorithm',
      'FLAT',
    ],
    ['identifier', 'region', 'attribute', 'region', 'type', 'TAG'],
    ['identifier', 'cluster', 'attribute', 'cluster', 'type', 'TEXT'],
  ],
]

const searchRows = (...rows: Array<[string, string]>) => [
  rows.length,
  ...rows.flatMap(([id, vector]) => [id, ['embedding', vector]]),
]

const vectorSetInfo = (dimensions = 2) => [
  'vector-dim',
  dimensions,
  'max-level',
  4,
]

const replyByCommand = (replies: Record<string, unknown | Error>) => {
  return jest.fn(async (plan: CommandPlan) => {
    const reply = replies[plan.command]
    if (reply instanceof Error) throw reply
    return reply
  })
}

describe('native vector sampling orchestration', () => {
  it('provides the injected native sampling entry point', () => {
    expect(orchestrateNativeSample).toBeDefined()
  })

  it('samples a validated FLOAT32 Search field and reports freshness', async () => {
    const execute = replyByCommand({
      'FT.INFO': searchInfo(),
      'FT.SEARCH': searchRows(
        ['doc:1', float32(1, 2)],
        ['doc:2', float32(3, 4)],
      ),
    })

    const result = await orchestrateNativeSample({
      source: { kind: 'search-index', index: 'idx', vectorField: 'embedding' },
      limit: 500,
      filter: '@region:{eu}',
      execute,
    })

    expect(result).toMatchObject({
      kind: 'success',
      ids: ['doc:1', 'doc:2'],
      dimensions: 2,
      metric: 'cosine',
      sourceCount: 2,
      sampleCount: 2,
      method: 'ft-search',
      freshness: 'fresh',
      commandCount: 3,
      availableMetadataFields: ['region', 'cluster'],
    })
    expect(result.vectors).toEqual(new Float32Array([1, 2, 3, 4]))
    expect(execute.mock.calls.map(([plan]) => plan.command)).toEqual([
      'FT.INFO',
      'FT.SEARCH',
      'FT.INFO',
    ])
    expect(execute.mock.calls[1][0].arguments[1]).toBe('@region:{eu}')
  })

  it('preserves HNSW tuning values discovered from FT.INFO', async () => {
    const hnswInfo = searchInfo().map((value) => value)
    const attributesIndex = hnswInfo.indexOf('attributes')
    const attributes = hnswInfo[attributesIndex + 1] as unknown[][]
    const algorithmIndex = attributes[0].indexOf('algorithm')
    attributes[0][algorithmIndex + 1] = 'HNSW'
    attributes[0] = [
      ...attributes[0],
      'm',
      '32',
      'ef_construction',
      '300',
      'ef_runtime',
      '150',
    ]
    const execute = replyByCommand({
      'FT.INFO': hnswInfo,
      'FT.SEARCH': searchRows(
        ['doc:1', float32(1, 2)],
        ['doc:2', float32(3, 4)],
      ),
    })

    const result = await orchestrateNativeSample({
      source: { kind: 'search-index', index: 'idx', vectorField: 'embedding' },
      limit: 500,
      execute,
    })

    expect(result).toMatchObject({
      algorithm: 'hnsw',
      m: 32,
      efConstruction: 300,
      efRuntime: 150,
    })
  })

  it('preserves SVS-VAMANA tuning values discovered from FT.INFO', async () => {
    const svsInfo = searchInfo().map((value) => value)
    const attributesIndex = svsInfo.indexOf('attributes')
    const attributes = svsInfo[attributesIndex + 1] as unknown[][]
    const algorithmIndex = attributes[0].indexOf('algorithm')
    attributes[0][algorithmIndex + 1] = 'SVS-VAMANA'
    attributes[0] = [
      ...attributes[0],
      'compression',
      'LVQ8',
      'graph_max_degree',
      '40',
      'construction_window_size',
      '250',
      'search_window_size',
      '20',
    ]
    const execute = replyByCommand({
      'FT.INFO': svsInfo,
      'FT.SEARCH': searchRows(
        ['doc:1', float32(1, 2)],
        ['doc:2', float32(3, 4)],
      ),
    })

    const result = await orchestrateNativeSample({
      source: { kind: 'search-index', index: 'idx', vectorField: 'embedding' },
      limit: 500,
      execute,
    })

    expect(result).toMatchObject({
      algorithm: 'svs-vamana',
      compression: 'LVQ8',
      graphMaxDegree: 40,
      constructionWindowSize: 250,
      searchWindowSize: 20,
    })
  })

  it('keeps only explicitly allow-listed response metadata for the matrix seam', async () => {
    const execute = replyByCommand({
      'FT.INFO': searchInfo(1),
      'FT.SEARCH': [
        1,
        'doc:metadata',
        [
          'embedding',
          float32(1, 2),
          'region',
          'eu',
          'cluster',
          'catalog-a',
          'private_note',
          'must-not-reach-ui',
        ],
      ],
    })

    const result = await orchestrateNativeSample({
      source: { kind: 'search-index', index: 'idx', vectorField: 'embedding' },
      limit: 500,
      allowListedFields: ['region', 'cluster'],
      execute,
    })

    expect(result.records).toEqual([
      { id: 'doc:metadata', metadata: { region: 'eu', cluster: 'catalog-a' } },
    ])
    expect(JSON.stringify(result.records)).not.toContain('private_note')
    expect(JSON.stringify(execute.mock.calls[1][0].arguments)).not.toContain(
      'private_note',
    )
  })

  it('normalizes RESP3 FLOAT64 Search rows without preserving raw bytes', async () => {
    const bytes = new Uint8Array(new Float64Array([1.5, 2.5]).buffer)
    const escaped = Array.from(bytes)
      .map((byte) => `\\x${byte.toString(16).padStart(2, '0')}`)
      .join('')
    const execute = replyByCommand({
      'FT.INFO': searchInfo(1, 'FLOAT64'),
      'FT.SEARCH': new Map<string, unknown>([
        [
          'results',
          [
            new Map<string, unknown>([
              ['id', 'doc:64'],
              [
                'extra_attributes',
                new Map<string, unknown>([['embedding', escaped]]),
              ],
            ]),
          ],
        ],
      ]),
    })

    const result = await orchestrateNativeSample({
      source: { kind: 'search-index', index: 'idx', vectorField: 'embedding' },
      limit: 500,
      execute,
    })

    expect(result).toMatchObject({ kind: 'success', ids: ['doc:64'] })
    expect(result.vectors).toEqual(new Float32Array([1.5, 2.5]))
    expect(JSON.stringify(result)).not.toContain(escaped)
  })

  it('marks malformed Search vectors partial and detects a count change', async () => {
    const infoReplies = [searchInfo(2), searchInfo(3)]
    const execute = jest.fn(async (plan: CommandPlan) => {
      if (plan.command === 'FT.INFO') return infoReplies.shift()
      return searchRows(['doc:bad', '\\x01'])
    })

    const result = await orchestrateNativeSample({
      source: { kind: 'search-index', index: 'idx', vectorField: 'embedding' },
      limit: 500,
      execute,
    })

    expect(result).toMatchObject({
      kind: 'partial',
      sampleCount: 0,
      partialReason: 'invalid-or-missing-vectors',
      freshness: 'changed-while-sampled',
    })
  })

  it('returns empty only for an empty valid Search response', async () => {
    const result = await orchestrateNativeSample({
      source: { kind: 'search-index', index: 'idx', vectorField: 'embedding' },
      limit: 500,
      execute: replyByCommand({ 'FT.INFO': searchInfo(0), 'FT.SEARCH': [0] }),
    })

    expect(result).toMatchObject({ kind: 'empty', sampleCount: 0 })
  })

  it('stops Search stages after abort or stale acceptance', async () => {
    const controller = new AbortController()
    const execute = jest.fn(async (plan: CommandPlan) => {
      if (plan.command === 'FT.INFO') controller.abort()
      return searchInfo()
    })

    await expect(
      orchestrateNativeSample({
        source: {
          kind: 'search-index',
          index: 'idx',
          vectorField: 'embedding',
        },
        limit: 500,
        execute,
        signal: controller.signal,
      }),
    ).resolves.toMatchObject({ kind: 'cancelled' })
    expect(execute).toHaveBeenCalledTimes(1)

    await expect(
      orchestrateNativeSample({
        source: {
          kind: 'search-index',
          index: 'idx',
          vectorField: 'embedding',
        },
        limit: 500,
        execute: replyByCommand({ 'FT.INFO': searchInfo() }),
        generation: 3,
        accept: () => false,
      }),
    ).resolves.toMatchObject({ kind: 'stale' })
  })

  it('normalizes a transport cancellation rejection only when its signal is aborted', async () => {
    const controller = new AbortController()
    const execute = jest.fn(async () => {
      controller.abort()
      throw new Error('cancelled')
    })

    await expect(
      orchestrateNativeSample({
        source: {
          kind: 'search-index',
          index: 'idx',
          vectorField: 'embedding',
        },
        limit: 500,
        execute,
        signal: controller.signal,
      }),
    ).resolves.toMatchObject({ kind: 'cancelled' })
  })

  it('samples a binary-key Vector Set through VRANGE and reconstructed VEMB vectors', async () => {
    const key = new Uint8Array([0, 255, 10])
    const execute = jest.fn(async (plan: CommandPlan) => {
      if (plan.command === 'VCARD') return 2
      if (plan.command === 'VDIM') return 2
      if (plan.command === 'VINFO') return vectorSetInfo()
      if (plan.command === 'VRANGE') return ['member:1', 'member:2']
      if (plan.command === 'VEMB')
        return plan.arguments[1] === 'member:1' ? [1, 2] : [3, 4]
      if (plan.command === 'VGETATTR')
        return plan.arguments[1] === 'member:1'
          ? '{"category":"Docs","published":true}'
          : '{"category":"Product","published":false}'
      throw new Error(`unexpected ${plan.command}`)
    })

    const result = await orchestrateNativeSample({
      source: { kind: 'vector-set', key },
      limit: 500,
      execute,
    })

    expect(result).toMatchObject({
      kind: 'success',
      ids: ['member:1', 'member:2'],
      dimensions: 2,
      metric: 'cosine',
      sourceCount: 2,
      method: 'vrange',
      reconstruction: 'vemb-reconstructed',
      freshness: 'fresh',
      commandCount: 9,
      records: [
        { id: 'member:1', metadata: { category: 'Docs' } },
        { id: 'member:2', metadata: { category: 'Product' } },
      ],
      availableMetadataFields: ['category', 'published'],
      graphFacts: {
        maxLevel: 4,
        provenance: {
          command: 'VINFO',
          kind: 'measured',
          exactness: 'unknown',
        },
      },
    })
    expect(result.vectors).toEqual(new Float32Array([1, 2, 3, 4]))
    expect(execute.mock.calls[0][0].arguments[0]).toBe(key)
    expect(
      execute.mock.calls.find(([plan]) => plan.command === 'VRANGE')?.[0]
        .arguments,
    ).toEqual([key, '-', '+', '500'])
    expect(
      execute.mock.calls.filter(([plan]) => plan.command === 'VGETATTR'),
    ).toHaveLength(2)
  })

  it('preserves escaped binary Vector Set members for VEMB and returns quantization facts', async () => {
    const binaryMember = 'member\\x00\\xff'
    const execute = jest.fn(async (plan: CommandPlan) => {
      if (plan.command === 'VCARD') return 1
      if (plan.command === 'VDIM') return 2
      if (plan.command === 'VINFO')
        return ['vector-dim', 2, 'quant-type', 'int8']
      if (plan.command === 'VRANGE') return [binaryMember]
      if (plan.command === 'VEMB') {
        expect(plan.arguments[1]).toEqual(
          new Uint8Array([109, 101, 109, 98, 101, 114, 0, 255]),
        )
        return [1, 2]
      }
      if (plan.command === 'VGETATTR') return '{}'
      throw new Error(`unexpected ${plan.command}`)
    })

    const result = await orchestrateNativeSample({
      source: { kind: 'vector-set', key: new Uint8Array([1]) },
      limit: 500,
      execute,
    })
    expect(result).toMatchObject({
      kind: 'success',
      ids: [binaryMember],
      quantization: 'int8',
    })
    expect(result.memberArguments?.get(binaryMember)).toEqual(
      new Uint8Array([109, 101, 109, 98, 101, 114, 0, 255]),
    )
  })

  it('uses VRANDMEMBER only after typed VRANGE unsupported-command failure', async () => {
    const calls: string[] = []
    const execute = jest.fn(async (plan: CommandPlan) => {
      calls.push(plan.command)
      if (plan.command === 'VCARD') return 1
      if (plan.command === 'VDIM') return 2
      if (plan.command === 'VINFO') return vectorSetInfo()
      if (plan.command === 'VRANGE') throw new Error('unsupported-command')
      if (plan.command === 'VRANDMEMBER') return ['member:1']
      if (plan.command === 'VEMB') return [1, 2]
      if (plan.command === 'VGETATTR') return '{}'
      throw new Error(`unexpected ${plan.command}`)
    })

    await expect(
      orchestrateNativeSample({
        source: { kind: 'vector-set', key: new Uint8Array([1]) },
        limit: 500,
        execute,
      }),
    ).resolves.toMatchObject({ method: 'vrandmember', seed: 'unavailable' })
    expect(calls).toContain('VRANDMEMBER')

    const aclExecute = jest.fn(async (plan: CommandPlan) => {
      if (plan.command === 'VCARD') return 1
      if (plan.command === 'VDIM') return 2
      if (plan.command === 'VINFO') return vectorSetInfo()
      if (plan.command === 'VRANGE') throw new Error('acl-unavailable')
      throw new Error('VRANDMEMBER must not be called')
    })
    await expect(
      orchestrateNativeSample({
        source: { kind: 'vector-set', key: new Uint8Array([1]) },
        limit: 500,
        execute: aclExecute,
      }),
    ).rejects.toThrow('acl-unavailable')

    const wrongTypeExecute = jest.fn(async (plan: CommandPlan) => {
      if (plan.command === 'VCARD') return 1
      if (plan.command === 'VDIM') return 2
      if (plan.command === 'VINFO') return vectorSetInfo()
      if (plan.command === 'VRANGE') throw new Error('WRONGTYPE')
      throw new Error('VRANDMEMBER must not be called')
    })
    await expect(
      orchestrateNativeSample({
        source: { kind: 'vector-set', key: new Uint8Array([1]) },
        limit: 500,
        execute: wrongTypeExecute,
      }),
    ).rejects.toThrow('WRONGTYPE')
  })

  it('marks a Vector Set changed while sampled when the post-sample VCARD differs', async () => {
    const cardinalities = [2, 3]
    const execute = jest.fn(async (plan: CommandPlan) => {
      if (plan.command === 'VCARD') return cardinalities.shift()
      if (plan.command === 'VDIM') return 2
      if (plan.command === 'VINFO') return vectorSetInfo()
      if (plan.command === 'VRANGE') return ['member:1']
      if (plan.command === 'VEMB') return [1, 2]
      if (plan.command === 'VGETATTR') return '{}'
      throw new Error(`unexpected ${plan.command}`)
    })

    await expect(
      orchestrateNativeSample({
        source: { kind: 'vector-set', key: new Uint8Array([1]) },
        limit: 500,
        execute,
      }),
    ).resolves.toMatchObject({ freshness: 'changed-while-sampled' })
  })

  it('rejects mismatched discovery, marks malformed VEMB partial, and aborts before later VEMB', async () => {
    await expect(
      orchestrateNativeSample({
        source: { kind: 'vector-set', key: new Uint8Array([1]) },
        limit: 500,
        execute: replyByCommand({ VCARD: 2, VDIM: 2, VINFO: vectorSetInfo(3) }),
      }),
    ).resolves.toMatchObject({
      kind: 'unsupported',
      partialReason: 'dimension-mismatch',
    })

    const malformed = await orchestrateNativeSample({
      source: { kind: 'vector-set', key: new Uint8Array([1]) },
      limit: 500,
      execute: replyByCommand({
        VCARD: 1,
        VDIM: 2,
        VINFO: vectorSetInfo(),
        VRANGE: ['member:bad'],
        VEMB: [1],
      }),
    })
    expect(malformed).toMatchObject({
      kind: 'partial',
      partialReason: 'invalid-or-missing-vectors',
    })

    const controller = new AbortController()
    const execute = jest.fn(async (plan: CommandPlan) => {
      if (plan.command === 'VCARD') return 2
      if (plan.command === 'VDIM') return 2
      if (plan.command === 'VINFO') return vectorSetInfo()
      if (plan.command === 'VRANGE') return ['a', 'b']
      controller.abort()
      return [1, 2]
    })
    await expect(
      orchestrateNativeSample({
        source: { kind: 'vector-set', key: new Uint8Array([1]) },
        limit: 500,
        execute,
        signal: controller.signal,
      }),
    ).resolves.toMatchObject({ kind: 'cancelled' })
    expect(
      execute.mock.calls.filter(([plan]) => plan.command === 'VEMB'),
    ).toHaveLength(1)
  })

  it('enforces explicit sample, byte, and command budgets before execution', async () => {
    const execute = jest.fn()
    const source = {
      kind: 'search-index' as const,
      index: 'idx',
      vectorField: 'embedding',
    }
    await expect(
      orchestrateNativeSample({ source, limit: 499, execute }),
    ).rejects.toThrow('500..20000')
    await expect(
      orchestrateNativeSample({ source, limit: 20_001, execute }),
    ).rejects.toThrow('500..20000')
    await expect(
      orchestrateNativeSample({
        source,
        limit: 500,
        execute: replyByCommand({ 'FT.INFO': searchInfo() }),
        maxBytes: 3_999,
      }),
    ).rejects.toThrow('byte budget')
    await expect(
      orchestrateNativeSample({
        source: { kind: 'vector-set', key: new Uint8Array([1]) },
        limit: 500,
        execute: replyByCommand({ VCARD: 1, VDIM: 2, VINFO: vectorSetInfo() }),
        maxCommandCount: 4,
      }),
    ).rejects.toThrow('command budget')
    await expect(
      orchestrateNativeSample({
        source: { kind: 'vector-set', key: new Uint8Array([1]) },
        limit: 20_000,
        execute: replyByCommand({
          VCARD: 0,
          VDIM: 2,
          VINFO: vectorSetInfo(),
          VRANGE: [],
        }),
      }),
    ).resolves.toMatchObject({ kind: 'empty' })
  })
})

describe('native Vector Visualizer query orchestration', () => {
  it.each([
    ['FLAT', 'exact'],
    ['HNSW', 'approximate'],
    [undefined, 'unknown'],
  ] as const)(
    'carries discovered Search algorithm %s into %s query exactness',
    async (algorithm, exactness) => {
      await expect(
        orchestrateNativeQuery({
          source: {
            kind: 'search-index',
            index: 'idx-products',
            vectorField: 'embedding',
          },
          anchorId: 'doc:anchor',
          anchorVector: new Float32Array([1, 0]),
          sampleIds: ['doc:anchor'],
          metric: 'cosine',
          algorithm,
          limit: 10,
          execute: async () => [[1, 'doc:anchor', ['__vv_metric', 0]], []],
        }),
      ).resolves.toMatchObject({ kind: 'ready', exactness })
    },
  )

  it('runs a bounded Search KNN only for the selected in-memory anchor and returns measured neighbors', async () => {
    const execute = jest.fn(async (plan: CommandPlan) => {
      expect(plan.command).toBe('FT.PROFILE')
      return [
        [
          2,
          'doc:anchor',
          ['__vv_metric', 0],
          'doc:neighbor',
          ['__vv_metric', 0.125],
        ],
        [],
      ]
    })

    await expect(
      orchestrateNativeQuery({
        source: {
          kind: 'search-index',
          index: 'idx-products',
          vectorField: 'embedding',
        },
        anchorId: 'doc:anchor',
        anchorVector: new Float32Array([1, 0]),
        sampleIds: ['doc:anchor', 'doc:neighbor'],
        metric: 'cosine',
        limit: 10,
        execute,
      }),
    ).resolves.toEqual({
      kind: 'ready',
      exactness: 'unknown',
      neighbors: [
        {
          id: 'doc:anchor',
          rank: 1,
          metric: 'distance',
          value: 0,
          plotted: true,
          provenance: 'FT.SEARCH',
        },
        {
          id: 'doc:neighbor',
          rank: 2,
          metric: 'distance',
          value: 0.125,
          plotted: true,
          provenance: 'FT.SEARCH',
        },
      ],
      profile: { kind: 'full', facts: {}, stages: [] },
    })
    expect(execute).toHaveBeenCalledTimes(1)
  })

  it('accepts RedisInsight raw integer wrappers in FT.PROFILE Search results', async () => {
    const execute = jest.fn(async () => [
      [
        { type: 'integer', value: '2' },
        'doc:anchor',
        ['__vv_metric', '0'],
        'doc:neighbor',
        ['__vv_metric', '0.125'],
      ],
      ['Total profile time', '1.2'],
    ])

    await expect(
      orchestrateNativeQuery({
        source: {
          kind: 'search-index',
          index: 'idx-products',
          vectorField: 'embedding',
        },
        anchorId: 'doc:anchor',
        anchorVector: new Float32Array([1, 0]),
        sampleIds: ['doc:anchor', 'doc:neighbor'],
        metric: 'cosine',
        limit: 10,
        execute,
      }),
    ).resolves.toMatchObject({
      kind: 'ready',
      neighbors: [
        { id: 'doc:anchor', value: 0 },
        { id: 'doc:neighbor', value: 0.125 },
      ],
    })
  })

  it('extracts named FT.PROFILE Results tuples with RedisInsight raw integer wrappers', async () => {
    const execute = jest.fn(async () => [
      'Results',
      [
        { type: 'integer', value: '2' },
        'doc:anchor',
        ['__vv_metric', '0'],
        'doc:neighbor',
        ['__vv_metric', '0.125'],
      ],
      'Profile',
      ['Total profile time', '1.2'],
    ])

    await expect(
      orchestrateNativeQuery({
        source: {
          kind: 'search-index',
          index: 'idx-products',
          vectorField: 'embedding',
        },
        anchorId: 'doc:anchor',
        anchorVector: new Float32Array([1, 0]),
        sampleIds: ['doc:anchor', 'doc:neighbor'],
        metric: 'cosine',
        limit: 10,
        execute,
      }),
    ).resolves.toMatchObject({
      kind: 'ready',
      neighbors: [
        { id: 'doc:anchor', value: 0 },
        { id: 'doc:neighbor', value: 0.125 },
      ],
      profile: {
        kind: 'full',
        facts: { 'Total profile time': '1.2' },
      },
    })
  })

  const paramTokens = (plan: CommandPlan): unknown[] => {
    const args = plan.arguments
    const paramsIndex = args.indexOf('PARAMS')
    const count = Number(args[paramsIndex + 1])
    return args.slice(paramsIndex + 2, paramsIndex + 2 + count)
  }

  it('threads EF_RUNTIME into the KNN PARAMS section', async () => {
    const execute = jest.fn(async (plan: CommandPlan) => {
      expect(plan.command).toBe('FT.PROFILE')
      expect(paramTokens(plan)).toEqual([
        'vv_anchor',
        expect.anything(),
        'EF_RUNTIME',
        '200',
      ])
      return [[1, 'doc:anchor', ['__vv_metric', 0]], []]
    })

    await expect(
      orchestrateNativeQuery({
        source: {
          kind: 'search-index',
          index: 'idx-products',
          vectorField: 'embedding',
        },
        anchorId: 'doc:anchor',
        anchorVector: new Float32Array([1, 0]),
        sampleIds: ['doc:anchor'],
        metric: 'cosine',
        algorithm: 'hnsw',
        limit: 10,
        efRuntime: 200,
        execute,
      }),
    ).resolves.toMatchObject({ kind: 'ready' })
    expect(execute).toHaveBeenCalledTimes(1)
  })

  it('dispatches range query mode to planProfileRangeQuery with radius and epsilon', async () => {
    const execute = jest.fn(async (plan: CommandPlan) => {
      expect(plan.command).toBe('FT.PROFILE')
      expect(plan.arguments[1]).toBe('SEARCH')
      const query = plan.arguments[4] as string
      expect(query).toContain('VECTOR_RANGE 0.5 $vv_anchor')
      expect(query).toContain('$EPSILON: 0.02')
      return [[1, 'doc:anchor', ['__vv_metric', 0.1]], []]
    })

    await expect(
      orchestrateNativeQuery({
        source: {
          kind: 'search-index',
          index: 'idx-products',
          vectorField: 'embedding',
        },
        anchorId: 'doc:anchor',
        anchorVector: new Float32Array([1, 0]),
        sampleIds: ['doc:anchor'],
        metric: 'cosine',
        limit: 10,
        queryMode: 'range',
        radius: 0.5,
        epsilon: 0.02,
        execute,
      }),
    ).resolves.toMatchObject({ kind: 'ready' })
    expect(execute).toHaveBeenCalledTimes(1)
  })

  it('includes BATCH_SIZE in PARAMS when HYBRID_POLICY is BATCHES', async () => {
    const execute = jest.fn(async (plan: CommandPlan) => {
      expect(paramTokens(plan)).toEqual([
        'vv_anchor',
        expect.anything(),
        'HYBRID_POLICY',
        'BATCHES',
        'BATCH_SIZE',
        '50',
      ])
      return [[1, 'doc:anchor', ['__vv_metric', 0]], []]
    })

    await expect(
      orchestrateNativeQuery({
        source: {
          kind: 'search-index',
          index: 'idx-products',
          vectorField: 'embedding',
        },
        anchorId: 'doc:anchor',
        anchorVector: new Float32Array([1, 0]),
        sampleIds: ['doc:anchor'],
        metric: 'cosine',
        limit: 10,
        hybridPolicy: 'BATCHES',
        batchSize: 50,
        execute,
      }),
    ).resolves.toMatchObject({ kind: 'ready' })
    expect(execute).toHaveBeenCalledTimes(1)
  })

  it('includes SEARCH_WINDOW_SIZE in PARAMS for an SVS-VAMANA algorithm', async () => {
    const execute = jest.fn(async (plan: CommandPlan) => {
      expect(paramTokens(plan)).toEqual([
        'vv_anchor',
        expect.anything(),
        'SEARCH_WINDOW_SIZE',
        '64',
      ])
      return [[1, 'doc:anchor', ['__vv_metric', 0]], []]
    })

    await expect(
      orchestrateNativeQuery({
        source: {
          kind: 'search-index',
          index: 'idx-products',
          vectorField: 'embedding',
        },
        anchorId: 'doc:anchor',
        anchorVector: new Float32Array([1, 0]),
        sampleIds: ['doc:anchor'],
        metric: 'cosine',
        algorithm: 'svs-vamana',
        limit: 10,
        searchWindowSize: 64,
        execute,
      }),
    ).resolves.toMatchObject({ kind: 'ready' })
    expect(execute).toHaveBeenCalledTimes(1)
  })

  it('dispatches aggregate query mode with a named vector metric and loaded group field', async () => {
    const execute = jest.fn(async (plan: CommandPlan) => {
      expect(plan.command).toBe('FT.PROFILE')
      expect(plan.arguments.slice(0, 5)).toEqual([
        'idx-products',
        'AGGREGATE',
        'LIMITED',
        'QUERY',
        '*=>[KNN 10 @embedding $vv_anchor AS __vv_metric]',
      ])
      expect(plan.arguments).toEqual(
        expect.arrayContaining([
          'LOAD',
          '1',
          '@brand',
          'GROUPBY',
          '1',
          '@brand',
          'REDUCE',
          'AVG',
          '1',
          '@__vv_metric',
          'AS',
          'avg_value',
        ]),
      )
      return [
        [1, ['brand', 'Nord', 'avg_value', '0.125']],
        ['Total profile time', '1', 'Iterators profile', ['Type', 'WILDCARD']],
      ]
    })

    await expect(
      orchestrateNativeQuery({
        source: {
          kind: 'search-index',
          index: 'idx-products',
          vectorField: 'embedding',
        },
        anchorId: 'doc:anchor',
        anchorVector: new Float32Array([1, 0]),
        sampleIds: ['doc:anchor'],
        metric: 'cosine',
        limit: 10,
        queryMode: 'aggregate',
        aggregateGroupByFields: ['brand'],
        aggregateLoadFields: ['brand'],
        aggregateReduceOps: [
          { function: 'AVG', field: '__vv_metric', alias: 'avg_value' },
        ],
        execute,
      }),
    ).resolves.toMatchObject({
      kind: 'aggregate-ready',
      groups: [{ brand: 'Nord', avg_value: 0.125 }],
      profile: { kind: 'full' },
    })
    expect(execute).toHaveBeenCalledTimes(1)
  })

  it('dispatches hybrid query mode with nested yield-score clauses', async () => {
    const execute = jest.fn(async (plan: CommandPlan) => {
      expect(plan.command).toBe('FT.PROFILE')
      expect(plan.arguments.slice(0, 5)).toEqual([
        'idx-products',
        'HYBRID',
        'LIMITED',
        'QUERY',
        'SEARCH',
      ])
      const knnIndex = plan.arguments.indexOf('KNN')
      const knnCount = Number(plan.arguments[knnIndex + 1])
      expect(
        plan.arguments.slice(knnIndex + 2, knnIndex + 2 + knnCount),
      ).toEqual(['K', '10', 'YIELD_SCORE_AS', 'vector_score'])
      const combineIndex = plan.arguments.indexOf('COMBINE')
      const combineCount = Number(plan.arguments[combineIndex + 2])
      expect(
        plan.arguments.slice(combineIndex + 3, combineIndex + 3 + combineCount),
      ).toEqual(['YIELD_SCORE_AS', 'hybrid_score'])
      const sortIndex = plan.arguments.indexOf('SORTBY')
      expect(plan.arguments.slice(sortIndex, sortIndex + 4)).toEqual([
        'SORTBY',
        '2',
        'hybrid_score',
        'ASC',
      ])
      return [
        [
          1,
          'doc:anchor',
          ['text_score', '0.5', 'vector_score', '0.1', 'hybrid_score', '0.6'],
        ],
        ['Total profile time', '1', 'Iterators profile', ['Type', 'HYBRID']],
      ]
    })

    await expect(
      orchestrateNativeQuery({
        source: {
          kind: 'search-index',
          index: 'idx-products',
          vectorField: 'embedding',
        },
        anchorId: 'doc:anchor',
        anchorVector: new Float32Array([1, 0]),
        sampleIds: ['doc:anchor'],
        metric: 'cosine',
        limit: 10,
        queryMode: 'hybrid',
        textQuery: '*',
        execute,
      }),
    ).resolves.toMatchObject({
      kind: 'hybrid-ready',
      documents: [{ id: 'doc:anchor', hybridScore: 0.6 }],
      profile: { kind: 'full' },
    })
    expect(execute).toHaveBeenCalledTimes(1)
  })
})
