import { buildNativeManifestProvenance } from './nativeManifest'

describe('native manifest provenance', () => {
  it('produces distinct non-secret source and ordered sample digests for same-size inputs', () => {
    const first = buildNativeManifestProvenance({
      databaseId: 'database-secret-a',
      source: {
        kind: 'search-index',
        index: 'idx-private-a',
        vectorField: 'embedding',
      },
      sampleIds: ['doc:a', 'doc:b'],
      samplingMethod: 'ft-search',
      seed: 'unavailable',
      algorithm: 'FLAT',
    })
    const otherSource = buildNativeManifestProvenance({
      databaseId: 'database-secret-b',
      source: {
        kind: 'search-index',
        index: 'idx-private-b',
        vectorField: 'embedding',
      },
      sampleIds: ['doc:a', 'doc:b'],
      samplingMethod: 'ft-search',
      seed: 'unavailable',
      algorithm: 'HNSW',
    })
    const otherOrder = buildNativeManifestProvenance({
      databaseId: 'database-secret-a',
      source: {
        kind: 'search-index',
        index: 'idx-private-a',
        vectorField: 'embedding',
      },
      sampleIds: ['doc:b', 'doc:a'],
      samplingMethod: 'ft-search',
      seed: 'unavailable',
      algorithm: 'FLAT',
    })

    expect(first.databaseId).not.toBe(otherSource.databaseId)
    expect(first.sourceId).not.toBe(otherSource.sourceId)
    expect(first.sampleIdDigest).not.toBe(otherOrder.sampleIdDigest)
    expect(JSON.stringify([first, otherSource, otherOrder])).not.toMatch(
      /database-secret|idx-private|doc:/,
    )
    expect(first).toMatchObject({
      sampling: {
        method: 'ft-search-limit',
        sourceCommand: 'FT.SEARCH',
        seed: 'unavailable',
        determinism: 'ordering-unspecified',
        exactness: 'unknown',
      },
      filter: { syntax: 'search', expression: '*' },
      graphExactness: 'exact',
    })
    expect(otherSource.graphExactness).toBe('approximate')
  })

  it.each([
    [
      'vrange',
      'vrange',
      'VRANGE',
      'deterministic-stable-order',
      'sample-exact',
    ],
    ['vrandmember', 'vrandmember', 'VRANDMEMBER', 'unseeded-random', 'unknown'],
  ] as const)(
    'maps %s to its real command and reproducibility caveat',
    (samplingMethod, expectedMethod, sourceCommand, determinism, exactness) => {
      expect(
        buildNativeManifestProvenance({
          databaseId: 'database-a',
          source: { kind: 'vector-set', key: new Uint8Array([0, 255]) },
          sampleIds: ['a', 'b'],
          samplingMethod,
          seed: 'unavailable',
        }),
      ).toMatchObject({
        sampling: {
          method: expectedMethod,
          sourceCommand,
          seed: 'unavailable',
          determinism,
          exactness,
        },
        filter: undefined,
        graphExactness: 'approximate',
      })
    },
  )
})
