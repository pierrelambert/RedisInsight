import {
  asNumber,
  asText,
  createResultGuard,
  createVectorMemoryStore,
  metricValue,
  normalizeSelection,
  redactDiagnostic,
  toViewManifest,
} from './contracts'
import {
  parseSearchInfo,
  parseSearchNeighbors,
  parseSearchProfile,
  parseSearchSample,
  planSearchDiscovery,
  planSearchNeighbors,
  planSearchSample,
} from './searchAdapter'
import {
  parseVectorSetInfo,
  parseVectorSetAttributes,
  listVectorSetAttributeFields,
  combineVectorSetDiscovery,
  planVectorSetDiscovery,
  planVectorSetAttributes,
  parseVectorSetEmbeddings,
  parseVectorSetNeighborReply,
  parseVectorSetNeighbors,
  planVectorSetEmbeddings,
  planVectorSetNeighbors,
  planVectorSetSample,
  planVectorSetTopology,
  planVectorSetTruth,
  VECTOR_SET_CAPABILITIES,
} from './vectorSetAdapter'

describe('shared vector visualizer contracts', () => {
  it('decodes byte-backed text across the browser and Node realms', () => {
    expect(asText(new TextEncoder().encode('member:1'))).toBe('member:1')
  })

  it('coerces RedisInsight raw integer formatter objects in Search replies', () => {
    const taggedInteger = { type: 'integer', value: '2' }

    expect(asText(taggedInteger)).toBe('2')
    expect(asNumber(taggedInteger)).toBe(2)
    expect(
      parseSearchNeighbors(
        [
          taggedInteger,
          'doc:1',
          ['__vv_metric', '0.25'],
          'doc:2',
          ['__vv_metric', '0.5'],
        ],
        { metric: 'cosine', algorithm: 'hnsw' },
      ),
    ).toHaveLength(2)
  })

  it('keeps source-specific filters and binary PARAMS tokenized in a read-only Search KNN plan', () => {
    const plan = planSearchNeighbors({
      index: 'idx:docs',
      vectorField: 'embedding',
      filter: '@tenant:{acme} @year:[2024 +inf]',
      queryParameter: 'query-vector',
      vector: new Uint8Array([0, 1, 2]),
      limit: 5,
    })

    expect(plan).toEqual({
      command: 'FT.SEARCH',
      arguments: [
        'idx:docs',
        '(@tenant:{acme} @year:[2024 +inf])=>[KNN 5 @embedding $query-vector AS __vv_metric]',
        'PARAMS',
        '2',
        'query-vector',
        new Uint8Array([0, 1, 2]),
        'SORTBY',
        '__vv_metric',
        'ASC',
        'RETURN',
        '1',
        '__vv_metric',
        'DIALECT',
        '2',
      ],
      readOnly: true,
      provenance: { kind: 'measured', exactness: 'unknown' },
    })
  })

  it('states the nondeterministic Search LIMIT caveat and discovers RESP2 vector fields', () => {
    expect(planSearchDiscovery('idx:docs').arguments).toEqual(['idx:docs'])
    expect(
      planSearchSample({
        index: 'idx:docs',
        vectorField: 'embedding',
        limit: 2,
      }),
    ).toMatchObject({
      order: 'nondeterministic',
      caveat:
        'FT.SEARCH LIMIT ordering is nondeterministic without an explicit SORTBY.',
    })
    expect(
      parseSearchInfo([
        'index_definition',
        ['key_type', 'HASH'],
        'attributes',
        [
          [
            'identifier',
            'embedding',
            'attribute',
            'embedding',
            'type',
            'VECTOR',
            'algorithm',
            'FLAT',
            'data_type',
            'FLOAT32',
            'dim',
            '2',
            'distance_metric',
            'COSINE',
          ],
        ],
        'num_docs',
        '3',
      ]),
    ).toEqual(
      expect.objectContaining({
        storage: 'hash',
        indexedCount: 3,
        vectorFields: [
          {
            name: 'embedding',
            dimensions: 2,
            metric: 'cosine',
            algorithm: 'flat',
            dataType: 'FLOAT32',
          },
        ],
      }),
    )
  })

  it('normalizes Search response evidence without inventing absent profile stages', () => {
    expect(
      parseSearchNeighbors([1, 'doc:1', ['__vv_metric', '0.25']], {
        metric: 'cosine',
        algorithm: 'hnsw',
      }),
    ).toEqual([
      {
        id: 'doc:1',
        rawValue: 0.25,
        metric: 'distance',
        value: 0.25,
        sourceMetric: 'cosine',
        provenance: { kind: 'measured', exactness: 'approximate' },
      },
    ])
    expect(
      parseSearchProfile([
        'Results',
        [1],
        'Profile',
        ['Total profile time', '1.2', 'Parsing time', '0.1'],
      ]),
    ).toEqual({
      kind: 'full',
      stages: [],
      facts: { 'Total profile time': '1.2', 'Parsing time': '0.1' },
    })
  })

  it('reads documented FT.PROFILE tuples through coordinator and shard wrappers', () => {
    expect(
      parseSearchProfile([
        [1, 'doc:1', ['__vv_metric', '0.25']],
        [
          'Coordinator',
          [
            'Shards',
            [
              [
                'shard-1',
                [
                  'Iterators profile',
                  [['Type', 'VECTOR', 'Counter', '2', 'Mode', 'BATCHES']],
                ],
              ],
            ],
          ],
        ],
      ]),
    ).toEqual({
      kind: 'full',
      facts: {},
      stages: [{ Type: 'VECTOR', Counter: '2', Mode: 'BATCHES' }],
    })
  })

  it('keeps iterator evidence distinct from processor branches and wrapper duplicates', () => {
    expect(
      parseSearchProfile([
        [1, 'doc:1', ['__vv_metric', '0.25']],
        [
          'Iterators profile',
          ['Type', 'WILDCARD', 'Counter', 10],
          'Result processors profile',
          [
            'Iterators profile',
            ['Type', 'PROCESSOR', 'Counter', 99],
            ['Type', 'Index'],
          ],
          'Shards',
          [['Iterators profile', ['Type', 'WILDCARD', 'Counter', 10]]],
        ],
      ]),
    ).toEqual({
      kind: 'full',
      facts: {},
      stages: [{ Type: 'WILDCARD', Counter: 10 }],
    })
  })

  it('decodes only schema-authorized escaped Search vector fields', () => {
    expect(
      parseSearchSample([1, 'doc:fp32', ['embedding', '\\x00\\x00\\x80?']], {
        vectorField: 'embedding',
        dimensions: 1,
        dataType: 'FLOAT32',
      }),
    ).toEqual([{ id: 'doc:fp32', vector: new Float32Array([1]) }])
    expect(
      parseSearchSample(
        [1, 'doc:fp64', ['embedding', '\\x00\\x00\\x00\\x00\\x00\\x00\\xf0?']],
        { vectorField: 'embedding', dimensions: 1, dataType: 'FLOAT64' },
      ),
    ).toEqual([{ id: 'doc:fp64', vector: new Float32Array([1]) }])
    expect(
      parseSearchSample([1, 'doc:bad', ['embedding', '\\x00\\x00\\x80']], {
        vectorField: 'embedding',
        dimensions: 1,
        dataType: 'FLOAT32',
      }),
    ).toEqual([])
    expect(
      parseSearchSample([1, 'doc:untyped', ['embedding', '\\x00\\x00\\x80?']], {
        vectorField: 'embedding',
        dimensions: undefined,
        dataType: undefined,
      }),
    ).toEqual([])
    expect(
      parseSearchSample(
        {
          results: [
            {
              id: 'doc:resp3',
              extra_attributes: { embedding: '\\x00\\x00\\x80?' },
            },
            { id: 'doc:missing', extra_attributes: {} },
          ],
        },
        { vectorField: 'embedding', dimensions: 1, dataType: 'FLOAT32' },
      ),
    ).toEqual([{ id: 'doc:resp3', vector: new Float32Array([1]) }])
  })

  it('parses RESP3 Search result maps with exact FLAT evidence', () => {
    expect(
      parseSearchNeighbors(
        {
          results: [
            {
              id: 'doc:resp3',
              extra_attributes: { __vv_metric: '0.125' },
            },
          ],
        },
        { metric: 'l2', algorithm: 'flat' },
      ),
    ).toEqual([
      {
        id: 'doc:resp3',
        rawValue: 0.125,
        metric: 'distance',
        value: 0.125,
        sourceMetric: 'l2',
        provenance: { kind: 'measured', exactness: 'exact' },
      },
    ])
  })

  it('builds Vector Set plans without crossing Search filter grammar and requires confirmation for truth', () => {
    const binaryKey = new Uint8Array([0, 255, 34, 92])
    const binaryMember = new Uint8Array([0, 255, 65])
    expect(planVectorSetDiscovery(binaryKey)).toEqual([
      expect.objectContaining({ arguments: [binaryKey] }),
      expect.objectContaining({ arguments: [binaryKey] }),
      expect.objectContaining({ arguments: [binaryKey] }),
    ])
    expect(
      planVectorSetSample({ key: 'vectors', limit: 10, supportsRange: false }),
    ).toMatchObject({
      command: 'VRANDMEMBER',
      sampleMethod: 'unseeded-random',
      visibleWarning: 'VRANDMEMBER fallback is unseeded.',
    })
    expect(
      planVectorSetSample({ key: binaryKey, limit: 10, supportsRange: true }),
    ).toMatchObject({
      command: 'VRANGE',
      arguments: [binaryKey, '-', '+', '10'],
      sampleMethod: 'range',
    })
    expect(
      planVectorSetNeighbors({
        key: 'vectors',
        vector: [1, 2],
        limit: 3,
        filter: '.kind == "demo"',
        ef: 50,
        filterEf: 20,
      }).arguments,
    ).toEqual([
      'vectors',
      'VALUES',
      '2',
      '1',
      '2',
      'COUNT',
      '3',
      'WITHSCORES',
      'FILTER',
      '.kind == "demo"',
      'EF',
      '50',
      'FILTER-EF',
      '20',
    ])
    expect(
      planVectorSetTruth({ key: 'vectors', vector: [1, 2], limit: 3 }),
    ).toMatchObject({
      requiresConfirmation: true,
      operation: 'VSIM TRUTH',
    })
    expect(planVectorSetTopology(binaryKey, binaryMember)).toMatchObject({
      command: 'VLINKS',
      arguments: [binaryKey, binaryMember],
      readOnly: true,
    })
    expect(planVectorSetAttributes(binaryKey, binaryMember)).toMatchObject({
      command: 'VGETATTR',
      arguments: [binaryKey, binaryMember],
      readOnly: true,
    })
    expect(
      parseVectorSetAttributes(
        '{"category":"Docs","rank":3,"published":true,"nested":{"x":1}}',
        ['category', 'published'],
      ),
    ).toEqual({ category: 'Docs', published: true })
    const rawCliAttributeReply =
      '{\\"category\\":\\"Support\\",\\"language\\":\\"en\\",\\"published\\":true}'
    expect(listVectorSetAttributeFields(rawCliAttributeReply)).toEqual([
      'category',
      'language',
      'published',
    ])
    expect(
      parseVectorSetAttributes(rawCliAttributeReply, ['category']),
    ).toEqual({ category: 'Support' })
    expect(parseVectorSetAttributes('not-json', ['category'])).toEqual({})
  })

  it('parses documented VSIM WITHSCORES RESP2 pairs and RESP3 maps without losing member bytes', () => {
    expect(
      parseVectorSetInfo([
        'quant-type',
        'int8',
        'vector-dim',
        2,
        'size',
        4,
        'max-level',
        3,
        'unreviewed-graph-setting',
        99,
      ]),
    ).toEqual({
      dimensions: 2,
      quantization: 'int8',
      graphFacts: {
        maxLevel: 3,
        provenance: {
          command: 'VINFO',
          kind: 'measured',
          exactness: 'unknown',
        },
      },
    })
    const binaryMember = new Uint8Array([0, 255, 65])
    const resp2 = parseVectorSetNeighborReply(
      [binaryMember, '0.8', 'member:2', '0.6'],
      'cosine',
    )
    expect(resp2.neighbors).toEqual([
      {
        id: 'bytes:00ff41',
        rawValue: 0.8,
        metric: 'similarity',
        value: 0.8,
        provenance: { kind: 'measured', exactness: 'approximate' },
      },
      {
        id: 'member:2',
        rawValue: 0.6,
        metric: 'similarity',
        value: 0.6,
        provenance: { kind: 'measured', exactness: 'approximate' },
      },
    ])
    expect(resp2.members.get('bytes:00ff41')).toEqual(binaryMember)
    expect(
      planVectorSetEmbeddings('vectors', [...resp2.members.values()])[0],
    ).toMatchObject({ arguments: ['vectors', binaryMember] })
    expect(
      parseVectorSetNeighbors(
        new Map<unknown, unknown>([['member:3', '0.4']]),
        'cosine',
      ),
    ).toEqual([expect.objectContaining({ id: 'member:3', rawValue: 0.4 })])
  })

  it('combines separate native Vector Set discovery replies without inventing facts', () => {
    expect(
      combineVectorSetDiscovery({
        vcardReply: 4,
        vdimReply: 2,
        vinfoReply: ['quant-type', 'int8', 'vector-dim', 2, 'max-level', 4],
      }),
    ).toEqual({
      kind: 'available',
      cardinality: 4,
      dimensions: 2,
      quantization: 'int8',
      graphFacts: {
        maxLevel: 4,
        provenance: {
          command: 'VINFO',
          kind: 'measured',
          exactness: 'unknown',
        },
      },
      capabilities: VECTOR_SET_CAPABILITIES,
    })
    expect(
      combineVectorSetDiscovery({
        vcardReply: 4,
        vdimReply: 2,
        vinfoReply: new Map<unknown, unknown>([
          ['quant-type', 'int8'],
          ['vector-dim', 2],
          ['max-level', 5],
        ]),
      }),
    ).toMatchObject({
      kind: 'available',
      graphFacts: {
        maxLevel: 5,
        provenance: { command: 'VINFO' },
      },
    })
    expect(
      combineVectorSetDiscovery({
        vcardReply: 4,
        vdimReply: 2,
        vinfoReply: ['vector-dim', 3],
      }),
    ).toEqual({ kind: 'unavailable', reason: 'dimension-mismatch' })
    expect(
      combineVectorSetDiscovery({
        vcardReply: 'not-a-number',
        vdimReply: 2,
        vinfoReply: ['vector-dim', 2],
      }),
    ).toEqual({ kind: 'unavailable', reason: 'invalid-cardinality' })
  })

  it('decodes bounded VEMB values as reconstructed memory-only vectors', () => {
    expect(
      planVectorSetEmbeddings('vectors', ['member:1', 'member:malformed']),
    ).toEqual([
      expect.objectContaining({
        command: 'VEMB',
        arguments: ['vectors', 'member:1'],
        readOnly: true,
      }),
      expect.objectContaining({
        command: 'VEMB',
        arguments: ['vectors', 'member:malformed'],
        readOnly: true,
      }),
    ])
    expect(
      parseVectorSetEmbeddings([
        { member: 'member:1', reply: ['0.1', '0.2'] },
        { member: 'member:malformed', reply: ['not-a-number'] },
      ]),
    ).toEqual([
      {
        id: 'member:1',
        vector: new Float32Array([0.1, 0.2]),
        provenance: { kind: 'measured', exactness: 'unknown' },
        reconstructed: true,
      },
    ])
  })

  it('retains raw vectors only in clearable memory and rejects stale responses', () => {
    const vectors = createVectorMemoryStore()
    vectors.set('doc:1', new Float32Array([0.1, 0.2]))
    expect(vectors.size()).toBe(1)
    const manifest = toViewManifest({
      sourceKind: 'search-index',
      sourceId: 'idx:docs',
      sampleIds: ['doc:1'],
      rawVectors: vectors.snapshot(),
    })
    expect(manifest).toEqual({
      version: 1,
      sourceKind: 'search-index',
      sourceId: 'idx:docs',
      sampleIdDigest: 'hash31:11a70ac8',
    })
    expect(JSON.stringify(manifest)).not.toContain('doc:1')
    vectors.clear()
    expect(vectors.size()).toBe(0)

    const guard = createResultGuard()
    const generation = guard.begin()
    guard.begin()
    expect(guard.accept(generation, 'fresh')).toEqual({
      accepted: false,
      value: undefined,
    })
  })

  it('marks selected live neighbors outside a sample as not plotted and redacts diagnostics', () => {
    expect(normalizeSelection(['doc:1', 'doc:2'], new Set(['doc:1']))).toEqual([
      { id: 'doc:1', plotted: true },
      { id: 'doc:2', plotted: false },
    ])
    expect(metricValue('ip', 3)).toEqual({ metric: 'similarity', value: 3 })
    expect(
      redactDiagnostic({
        category: 'read-only',
        operation: 'search',
        command: 'FT.SEARCH idx:private @tenant:{secret}',
        vector: new Float32Array([1, 2]),
        content: 'private',
        id: 'doc:1',
      }),
    ).toEqual({ category: 'read-only', operation: 'search' })
  })
})
