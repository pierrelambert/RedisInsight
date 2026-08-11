import type { QueryLabNeighbor, QueryLabSourceSample } from './QueryLab.types'

const DISTRIBUTION_BIN_COUNT = 4

export interface DistributionBin {
  end: number
  index: number
  resultIds: string[]
  sourceCount?: number
  start: number
}

export interface RankGap {
  afterId: string
  afterRank: number
  beforeId: string
  beforeRank: number
  gap: number
  nextValue: number
  value: number
}

const finite = (value: number) => Number.isFinite(value)

export const buildDistributionBins = (
  neighbors: QueryLabNeighbor[],
  sourceSample?: QueryLabSourceSample,
): DistributionBin[] => {
  const results = neighbors.filter(({ value }) => finite(value))
  const sourceValues = sourceSample?.values.filter(finite) ?? []
  const allValues = [...results.map(({ value }) => value), ...sourceValues]

  if (!allValues.length) return []

  const observedMinimum = Math.min(...allValues)
  const observedMaximum = Math.max(...allValues)
  const padding =
    observedMinimum === observedMaximum
      ? Math.max(Math.abs(observedMinimum) * 0.05, 0.5)
      : 0
  const minimum = observedMinimum - padding
  const maximum = observedMaximum + padding
  const width = (maximum - minimum) / DISTRIBUTION_BIN_COUNT
  const bins: DistributionBin[] = Array.from(
    { length: DISTRIBUTION_BIN_COUNT },
    (_, index) => ({
      index,
      start: minimum + width * index,
      end: minimum + width * (index + 1),
      resultIds: [],
      sourceCount: sourceSample ? 0 : undefined,
    }),
  )
  const binIndex = (value: number) =>
    Math.min(
      DISTRIBUTION_BIN_COUNT - 1,
      Math.max(0, Math.floor((value - minimum) / width)),
    )

  results.forEach(({ id, value }) => bins[binIndex(value)].resultIds.push(id))
  sourceValues.forEach((value) => {
    const bin = bins[binIndex(value)]
    bin.sourceCount = (bin.sourceCount ?? 0) + 1
  })

  return bins
}

export const buildRankGaps = (neighbors: QueryLabNeighbor[]): RankGap[] => {
  const ordered = neighbors
    .filter(({ value }) => finite(value))
    .slice()
    .sort((left, right) => left.rank - right.rank)

  return ordered.slice(0, -1).map((neighbor, index) => {
    const next = ordered[index + 1]
    return {
      afterId: neighbor.id,
      afterRank: neighbor.rank,
      beforeId: next.id,
      beforeRank: next.rank,
      gap: Math.abs(neighbor.value - next.value),
      value: neighbor.value,
      nextValue: next.value,
    }
  })
}

export const largestRankGap = (gaps: RankGap[]) =>
  gaps.reduce<RankGap | undefined>(
    (largest, gap) => (!largest || gap.gap > largest.gap ? gap : largest),
    undefined,
  )
