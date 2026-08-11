import type { QueryLabNeighbor } from './QueryLab.types'
import {
  buildDistributionBins,
  buildRankGaps,
  largestRankGap,
  type RankGap,
} from './queryLabEvidence'

const neighbor = (
  id: string,
  rank: number,
  value: number,
): QueryLabNeighbor => ({
  id,
  rank,
  value,
  metric: 'distance',
  plotted: true,
})

describe('queryLabEvidence', () => {
  describe('buildDistributionBins', () => {
    it('bins finite neighbor and source-sample values across the observed range', () => {
      const bins = buildDistributionBins(
        [neighbor('first', 1, 0), neighbor('last', 2, 4)],
        {
          values: [1, 4],
          completeness: 'bounded',
          provenance: 'Redis response',
        },
      )

      expect(bins).toHaveLength(4)
      expect(bins.map(({ resultIds }) => resultIds)).toEqual([
        ['first'],
        [],
        [],
        ['last'],
      ])
      expect(bins.map(({ sourceCount }) => sourceCount)).toEqual([0, 1, 0, 1])
      expect(bins[0]).toMatchObject({ index: 0, start: 0, end: 1 })
      expect(bins[3]).toMatchObject({ index: 3, start: 3, end: 4 })
    })

    it('filters non-finite values and returns no bins when no finite evidence remains', () => {
      expect(
        buildDistributionBins(
          [neighbor('nan', 1, Number.NaN), neighbor('infinite', 2, Infinity)],
          {
            values: [Number.NEGATIVE_INFINITY, Number.NaN],
            completeness: 'partial',
            provenance: 'Redis response',
          },
        ),
      ).toEqual([])
    })

    it('pads a single observed value so it has a stable bin range', () => {
      const bins = buildDistributionBins([neighbor('only', 1, -10)])

      expect(bins).toHaveLength(4)
      expect(bins[0]).toMatchObject({ start: -10.5, end: -10.25 })
      expect(bins[2]).toMatchObject({ resultIds: ['only'] })
      expect(bins.every(({ sourceCount }) => sourceCount === undefined)).toBe(
        true,
      )
    })
  })

  describe('buildRankGaps', () => {
    it('orders finite neighbors by rank before calculating adjacent gaps', () => {
      const gaps = buildRankGaps([
        neighbor('third', 3, 0.1),
        neighbor('first', 1, 0.9),
        neighbor('second', 2, 0.6),
      ])

      expect(gaps).toEqual([
        expect.objectContaining({
          afterId: 'first',
          afterRank: 1,
          beforeId: 'second',
          beforeRank: 2,
          value: 0.9,
          nextValue: 0.6,
        }),
        expect.objectContaining({
          afterId: 'second',
          afterRank: 2,
          beforeId: 'third',
          beforeRank: 3,
          value: 0.6,
          nextValue: 0.1,
        }),
      ])
      expect(gaps[0].gap).toBeCloseTo(0.3)
      expect(gaps[1].gap).toBeCloseTo(0.5)
    })

    it('omits non-finite neighbors and has no gap for fewer than two values', () => {
      expect(buildRankGaps([neighbor('nan', 1, Number.NaN)])).toEqual([])
      expect(
        buildRankGaps([
          neighbor('finite', 1, 2),
          neighbor('infinite', 2, Infinity),
        ]),
      ).toEqual([])
    })
  })

  describe('largestRankGap', () => {
    const gaps: RankGap[] = [
      {
        afterId: 'a',
        afterRank: 1,
        beforeId: 'b',
        beforeRank: 2,
        gap: 0.2,
        value: 0.8,
        nextValue: 0.6,
      },
      {
        afterId: 'b',
        afterRank: 2,
        beforeId: 'c',
        beforeRank: 3,
        gap: 0.5,
        value: 0.6,
        nextValue: 0.1,
      },
    ]

    it('returns the largest supplied gap', () => {
      expect(largestRankGap(gaps)).toBe(gaps[1])
    })

    it('returns undefined for no gaps and preserves the first equal maximum', () => {
      expect(largestRankGap([])).toBeUndefined()
      expect(largestRankGap([gaps[1], { ...gaps[1], afterId: 'c' }])).toBe(
        gaps[1],
      )
    })
  })
})
