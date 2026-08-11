import {
  createWorkbenchFollowUpController,
  parseWorkbenchQueryRun,
  toPersistedWorkbenchViewState,
  createWorkbenchHostBinding,
} from './workbenchIntegration'
import resultProfileR7 from '../../ri-explain/test-data/result-profile_r7.json'
import resultProfileR8 from '../../ri-explain/test-data/result-profile_r8.json'

describe('Workbench Query Lab integration', () => {
  it('parses a tokenized vector FT.SEARCH result without retaining PARAMS bytes', () => {
    const run = parseWorkbenchQueryRun({
      command:
        'FT.SEARCH idx:docs "*=>[KNN 2 @embedding $query_vector AS score]" PARAMS 2 query_vector raw-vector-bytes',
      data: [
        {
          status: 'success',
          response: [2, 'doc:1', ['score', '0.12'], 'doc:2', ['score', '0.31']],
        },
      ],
    })

    expect(run).toMatchObject({
      kind: 'ready',
      sourceKind: 'search-index',
      sourceLabel: 'idx:docs',
      profile: { kind: 'none' },
      neighbors: [
        expect.objectContaining({
          id: 'doc:1',
          rank: 1,
          metric: 'distance',
          value: 0.12,
        }),
        expect.objectContaining({ id: 'doc:2', rank: 2, value: 0.31 }),
      ],
    })
    expect(JSON.stringify(run)).not.toContain('raw-vector-bytes')
  })

  it('uses the Redis default distance-field name when KNN omits AS', () => {
    expect(
      parseWorkbenchQueryRun({
        command:
          'FT.SEARCH idx:docs "*=>[KNN 1 @embedding $query_vector]" PARAMS 2 query_vector private-vector',
        data: [
          {
            status: 'success',
            response: [1, 'doc:1', ['__embedding_score', '0.2']],
          },
        ],
      }),
    ).toMatchObject({
      kind: 'ready',
      neighbors: [
        expect.objectContaining({
          id: 'doc:1',
          metric: 'distance',
          value: 0.2,
        }),
      ],
    })
  })

  it('renders Search FT.PROFILE as a measured full profile only from response facts', () => {
    const run = parseWorkbenchQueryRun({
      command:
        'FT.PROFILE idx:docs SEARCH QUERY "*=>[KNN 1 @embedding $q AS distance]" PARAMS 2 q private-vector',
      data: [
        {
          status: 'success',
          response: [
            'Results',
            [1, 'doc:1', ['distance', '0.2']],
            'Profile',
            [
              'Total profile time',
              '1.2',
              'Iterators profile',
              [['Type', 'VECTOR', 'Counter', '2', 'Mode', 'BATCHES']],
            ],
          ],
        },
      ],
    })

    expect(run).toMatchObject({
      kind: 'ready',
      sourceKind: 'search-index',
      profile: {
        kind: 'full',
        facts: { 'Total profile time': '1.2' },
        stages: [{ name: 'VECTOR', count: '2', mode: 'BATCHES' }],
      },
    })
    expect(JSON.stringify(run)).not.toContain('private-vector')
  })

  it.each([
    [
      'SEARCH',
      'FT.PROFILE idx:docs SEARCH QUERY "*=>[KNN 1 @embedding $q AS distance]" PARAMS 2 q private-vector',
      [1, 'doc:1', ['distance', '0.2']],
    ],
    [
      'AGGREGATE',
      'FT.PROFILE idx:docs AGGREGATE QUERY "*=>[KNN 1 @embedding $q AS distance]" PARAMS 2 q private-vector',
      [1, ['id', 'doc:1', 'distance', '0.2']],
    ],
    [
      'HYBRID',
      'FT.PROFILE idx:docs HYBRID QUERY "*" VSIM @embedding $q KNN 1 AS distance PARAMS 2 q private-vector',
      [1, ['id', 'doc:1', 'distance', '0.2']],
    ],
  ] as const)(
    'parses the documented RESP2 %s profile tuple without retaining PARAMS',
    (_, command, results) => {
      const run = parseWorkbenchQueryRun({
        command,
        data: [
          {
            status: 'success',
            response: [
              results,
              [
                'Total profile time',
                '1.2',
                'Iterators profile',
                [['Type', 'VECTOR', 'Counter', '2', 'Mode', 'BATCHES']],
              ],
            ],
          },
        ],
      })

      expect(run).toMatchObject({
        kind: 'ready',
        sourceKind: 'search-index',
        profile: {
          kind: 'full',
          facts: { 'Total profile time': '1.2' },
          stages: [{ name: 'VECTOR', count: '2', mode: 'BATCHES' }],
        },
      })
      expect(JSON.stringify(run)).not.toContain('private-vector')
    },
  )

  it.each([
    [
      'Redis 7 RESP2 pair-array profile',
      'FT.PROFILE idx:docs HYBRID QUERY "*" VSIM @embedding $q KNN 1 AS distance PARAMS 2 q private-vector',
      resultProfileR7[0].response[1],
    ],
    [
      'Redis 8 shard/coordinator profile',
      'FT.PROFILE idx:docs SEARCH QUERY "*=>[KNN 1 @embedding $q AS distance]" PARAMS 2 q private-vector',
      resultProfileR8[0].response[1],
    ],
  ] as const)(
    'parses exact ri-explain %s iterator profile without exposing result processors',
    (_, command, profile) => {
      const run = parseWorkbenchQueryRun({
        command,
        data: [
          {
            status: 'success',
            response: [[1, 'doc:1', ['distance', '0.2']], profile],
          },
        ],
      })

      expect(run).toMatchObject({
        kind: 'ready',
        profile: {
          stages: [{ name: 'WILDCARD', count: '10' }],
        },
      })
      expect(JSON.stringify(run)).not.toContain('Result processors profile')
      expect(JSON.stringify(run)).not.toContain('private-vector')
    },
  )

  it('reads RESP3 coordinator and shard profile wrappers without inventing stages', () => {
    const run = parseWorkbenchQueryRun({
      command:
        'FT.PROFILE idx:docs SEARCH QUERY "*=>[KNN 1 @embedding $q AS distance]"',
      data: [
        {
          status: 'success',
          response: new Map<unknown, unknown>([
            ['Results', [1, 'doc:1', ['distance', '0.2']]],
            [
              'Profile',
              new Map<unknown, unknown>([
                [
                  'Coordinator',
                  [
                    'Shards',
                    [
                      [
                        'shard-1',
                        [
                          'Iterators profile',
                          [
                            [
                              'Type',
                              'VECTOR',
                              'Counter',
                              '2',
                              'Mode',
                              'BATCHES',
                            ],
                          ],
                        ],
                      ],
                    ],
                  ],
                ],
              ]),
            ],
          ]),
        },
      ],
    })

    expect(run).toMatchObject({
      kind: 'ready',
      profile: {
        kind: 'full',
        stages: [{ name: 'VECTOR', count: '2', mode: 'BATCHES' }],
      },
    })
  })

  it.each([
    [
      'FT.AGGREGATE',
      'FT.AGGREGATE idx:docs "*=>[KNN 2 @embedding $query_vector AS score]" PARAMS 2 query_vector private-vector',
      [2, ['id', 'doc:1', 'score', '0.12'], ['id', 'doc:2', 'score', '0.31']],
    ],
    [
      'FT.HYBRID',
      'FT.HYBRID idx:docs SEARCH "*" VSIM @embedding $query_vector KNN 2 AS score PARAMS 2 query_vector private-vector',
      [2, ['id', 'doc:1', 'score', '0.12'], ['id', 'doc:2', 'score', '0.31']],
    ],
  ] as const)(
    'parses token-aware vector %s rows without retaining PARAMS',
    (_, command, response) => {
      const run = parseWorkbenchQueryRun({
        command,
        data: [{ status: 'success', response }],
      })

      expect(run).toMatchObject({
        kind: 'ready',
        sourceKind: 'search-index',
        sourceLabel: 'idx:docs',
        neighbors: [
          expect.objectContaining({ id: 'doc:1', value: 0.12 }),
          expect.objectContaining({ id: 'doc:2', value: 0.31 }),
        ],
      })
      expect(JSON.stringify(run)).not.toContain('private-vector')
    },
  )

  it.each([
    'FT.AGGREGATE idx:docs "@title:hello"',
    'FT.HYBRID idx:docs SEARCH "VSIM @embedding $query_vector KNN 2"',
  ])('rejects non-vector %s commands', (command) => {
    expect(
      parseWorkbenchQueryRun({
        command,
        data: [{ status: 'success', response: [] }],
      }),
    ).toEqual({ kind: 'unsupported' })
  })

  it('keeps only named numeric response-backed profile stage fields', () => {
    const run = parseWorkbenchQueryRun({
      command:
        'FT.PROFILE idx:docs SEARCH QUERY "*=>[KNN 1 @embedding $q AS distance]"',
      data: [
        {
          status: 'success',
          response: [
            'Results',
            [1, 'doc:1', ['distance', '0.2']],
            'Profile',
            [
              'Iterators profile',
              [
                [
                  'Type',
                  'VECTOR',
                  'Counter',
                  'not-a-count',
                  'Payload',
                  'must-not-cross-the-contract',
                ],
              ],
            ],
          ],
        },
      ],
    })

    expect(run).toMatchObject({
      kind: 'ready',
      profile: { stages: [{ name: 'VECTOR' }] },
    })
    expect(JSON.stringify(run)).not.toContain('must-not-cross-the-contract')
    expect(JSON.stringify(run)).not.toContain('not-a-count')
  })

  it('parses VSIM as a reduced profile and leaves plain FT.SEARCH inactive', () => {
    const run = parseWorkbenchQueryRun({
      command: 'VSIM vectors VALUES 2 0.1 0.2 COUNT 1',
      data: [{ status: 'success', response: ['member:1', '0.9'] }],
    })
    expect(run).toMatchObject({
      kind: 'ready',
      sourceKind: 'vector-set',
      exactness: 'approximate',
      neighbors: [
        expect.objectContaining({
          metric: 'similarity',
          rawValue: 0.9,
          value: 0.9,
        }),
      ],
      profile: { kind: 'reduced', facts: { 'Result count': '1' } },
    })
    expect(
      parseWorkbenchQueryRun({
        command: 'FT.SEARCH idx:docs "hello"',
        data: [{ status: 'success', response: [] }],
      }),
    ).toEqual({ kind: 'unsupported' })
  })

  it('admits RESP3 VSIM WITHSCORES maps through the shared binary-safe parser', () => {
    const binaryMember = new Uint8Array([0, 255, 65])

    expect(
      parseWorkbenchQueryRun({
        command: 'VSIM vectors VALUES 2 0.1 0.2 COUNT 2 WITHSCORES',
        data: [
          {
            status: 'success',
            response: new Map<unknown, unknown>([
              [binaryMember, '0.9'],
              ['member:2', '0.7'],
            ]),
          },
        ],
      }),
    ).toMatchObject({
      kind: 'ready',
      sourceKind: 'vector-set',
      neighbors: [
        expect.objectContaining({
          id: 'bytes:00ff41',
          metric: 'similarity',
          value: 0.9,
        }),
        expect.objectContaining({ id: 'member:2', value: 0.7 }),
      ],
      profile: { kind: 'reduced', facts: { 'Result count': '2' } },
    })
  })

  it.each([
    [
      'empty',
      'VSIM vectors VALUES 2 0.1 0.2',
      [{ status: 'success', response: [] }],
    ],
    [
      'failed',
      'VSIM vectors VALUES 2 0.1 0.2',
      [{ status: 'fail', response: 'ERR' }],
    ],
    [
      'acl-unavailable',
      'VSIM vectors VALUES 2 0.1 0.2',
      [{ status: 'fail', response: 'NOPERM user has no permissions' }],
    ],
    [
      'invalid',
      'VSIM vectors VALUES 2 0.1 0.2',
      [{ status: 'success', response: { malformed: true } }],
    ],
  ] as const)('labels %s result evidence honestly', (kind, command, data) => {
    expect(parseWorkbenchQueryRun({ command, data })).toMatchObject({ kind })
  })

  it('persists only non-sensitive view state and rejects raw vector-bearing values', () => {
    expect(
      toPersistedWorkbenchViewState({
        workflow: 'query-lab',
        selectedIds: ['doc:1'],
        focusedId: 'doc:1',
        rawVectors: new Float32Array([1, 2]),
        command: 'FT.SEARCH private-index',
        payload: { title: 'private' },
      }),
    ).toEqual({
      workflow: 'query-lab',
      selectedIds: ['doc:1'],
      focusedId: 'doc:1',
    })
  })

  it('runs only explicit read-only follow-up commands and ignores late results after cancellation', async () => {
    let resolveFirst: ((value: unknown) => void) | undefined
    const execute = jest.fn(
      () =>
        new Promise<unknown>((resolve) => {
          resolveFirst = resolve
        }),
    )
    const controller = createWorkbenchFollowUpController(execute)

    const pending = controller.run('FT.SEARCH idx "*=>[KNN 1 @embedding $q]"')
    controller.cancel()
    resolveFirst?.(['late'])

    await expect(pending).resolves.toEqual({ accepted: false })
    await expect(controller.run('DEL forbidden')).rejects.toThrow('read-only')
    await expect(controller.run('FT.SEARCH idx "hello"')).rejects.toThrow(
      'read-only',
    )
    await expect(
      controller.run('VSIM vectors VALUES 2 0.1 0.2'),
    ).rejects.toThrow('read-only')
    await expect(
      controller.run('VSIM vectors VALUES 2 0.1 0.2 COUNT 0'),
    ).rejects.toThrow('read-only')
    await expect(
      controller.run('VSIM vectors VALUES 2 0.1 0.2 COUNT 101'),
    ).rejects.toThrow('read-only')
    await expect(
      controller.run(
        'FT.PROFILE idx SEARCH QUERY "*=>[KNN 101 @embedding $q]"',
      ),
    ).rejects.toThrow('read-only')
    expect(execute).toHaveBeenCalledTimes(1)
  })

  it('binds the SDK state channel through the redacted view-state boundary', async () => {
    const sdk = {
      executeRedisCommand: jest.fn().mockResolvedValue([{ status: 'success' }]),
      getState: jest.fn().mockResolvedValue({
        workflow: 'query-lab',
        selectedIds: ['doc:1'],
        rawVectors: [1, 2],
      }),
      setState: jest.fn().mockResolvedValue(undefined),
    }
    const host = createWorkbenchHostBinding(sdk)

    await expect(host.loadState()).resolves.toEqual({
      workflow: 'query-lab',
      selectedIds: ['doc:1'],
    })
    await host.saveState({
      workflow: 'query-lab',
      selectedIds: ['doc:2'],
      command: 'FT.SEARCH private',
    })

    expect(sdk.setState).toHaveBeenCalledWith({
      workflow: 'query-lab',
      selectedIds: ['doc:2'],
    })
  })
})
