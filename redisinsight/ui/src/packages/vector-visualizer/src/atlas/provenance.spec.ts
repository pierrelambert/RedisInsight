import { atlasProvenanceRows } from './provenance'

describe('Atlas provenance', () => {
  it('labels the projection as sampled and never fabricates a quality value', () => {
    expect(
      atlasProvenanceRows({
        sourceCount: 20_000,
        sampleCount: 2_000,
        method: 'UMAP',
        seed: 7,
        sourceFilter: 'tenant:blue',
        freshness: 'changed-while-sampled',
        exactness: 'approximate',
        quality: { kind: 'unknown', reason: 'not-measured' },
      }),
    ).toEqual(
      expect.arrayContaining([
        ['Projection', '2D projection of a sample'],
        ['Quality', 'Unknown (not measured)'],
        ['Freshness', 'Changed while sampled'],
      ]),
    )
  })

  it('discloses the bounded quality sample, exactness, and freshness', () => {
    expect(
      atlasProvenanceRows({
        sourceCount: 20_000,
        sampleCount: 2_000,
        method: 'UMAP',
        seed: 7,
        freshness: 'fresh',
        exactness: 'approximate',
        quality: {
          kind: 'measured',
          name: 'bounded-k-neighbor-preservation',
          value: 0.625,
          k: 15,
          sampleSize: 512,
          exactness: 'sample-exact',
          freshness: 'unknown',
        },
      }),
    ).toEqual(
      expect.arrayContaining([
        [
          'Quality',
          'bounded-k-neighbor-preservation (0.625 at k=15; sample 512; sample exact; freshness unknown)',
        ],
      ]),
    )
  })
})
