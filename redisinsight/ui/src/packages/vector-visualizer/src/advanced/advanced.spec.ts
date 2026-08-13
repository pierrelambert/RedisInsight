import { parseSearchExecutionEvidence, parseVlinksTopology } from './advanced'

describe('Advanced topology and profile evidence', () => {
  it('parses documented VLINKS RESP2 layers and preserves binary source and targets', () => {
    const source = new Uint8Array([0, 255, 65])
    const result = parseVlinksTopology(
      [[new Uint8Array([1, 2]), 'node:c'], ['node:d']],
      { supported: true, limit: 2, source },
    )
    expect(result).toMatchObject({
      kind: 'ready',
      totalAdjacencies: 2,
      shownAdjacencies: 2,
      layers: [
        {
          layer: 0,
          source: 'bytes:00ff41',
          targets: ['bytes:0102', 'node:c'],
        },
        { layer: 1, source: 'bytes:00ff41', targets: ['node:d'] },
      ],
    })
    if (result.kind === 'ready') {
      expect(result.memberArguments.get('bytes:00ff41')).toEqual(source)
      expect(result.memberArguments.get('bytes:0102')).toEqual(
        new Uint8Array([1, 2]),
      )
    }
    expect(
      parseVlinksTopology(
        new Map<unknown, unknown>([
          [0, new Map<unknown, unknown>([['node:e', '0.1']])],
        ]),
        { supported: true, limit: 1, source: 'node:a' },
      ),
    ).toMatchObject({
      kind: 'ready',
      layers: [{ layer: 0, source: 'node:a', targets: ['node:e'] }],
    })
  })

  it('enforces the topology limit and rejects malformed or unsupported VLINKS evidence', () => {
    expect(
      parseVlinksTopology([['node:b'], ['node:c']], {
        supported: true,
        limit: 1,
        source: 'node:a',
      }),
    ).toMatchObject({ kind: 'ready', totalAdjacencies: 2, shownAdjacencies: 1 })
    expect(
      parseVlinksTopology([], {
        supported: false,
        limit: 10,
        source: 'node:a',
      }),
    ).toEqual({ kind: 'unsupported' })
    expect(
      parseVlinksTopology([['node:b']], {
        supported: true,
        limit: 10,
        source: 'node:a',
      }),
    ).not.toEqual({ kind: 'malformed' })
    expect(
      parseVlinksTopology(['node:b'], {
        supported: true,
        limit: 10,
        source: 'node:a',
      }),
    ).toEqual({ kind: 'malformed' })
  })

  it('keeps FT.PROFILE execution facts response-backed and treats missing vector mode as unavailable', () => {
    expect(
      parseSearchExecutionEvidence([
        'Results',
        [],
        'Profile',
        ['Vector mode', 'BATCHES', 'Total profile time', '1.2'],
      ]),
    ).toEqual({
      kind: 'ready',
      facts: { 'Vector mode': 'BATCHES', 'Total profile time': '1.2' },
    })
    expect(
      parseSearchExecutionEvidence([
        'Results',
        [],
        'Profile',
        ['Total profile time', '1.2'],
      ]),
    ).toEqual({
      kind: 'ready',
      facts: { 'Total profile time': '1.2' },
      vectorMode: 'Unavailable',
    })
  })

  it('parses RESP2 two-element FT.PROFILE response without keyed Profile field', () => {
    expect(
      parseSearchExecutionEvidence([
        [1, 'doc:1', ['__vv_metric', '0.5']],
        ['Total profile time', '2.5', 'Vector mode', 'BATCHES'],
      ]),
    ).toEqual({
      kind: 'ready',
      facts: { 'Total profile time': '2.5', 'Vector mode': 'BATCHES' },
    })
  })
})
