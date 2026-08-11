import type { VectorDataSourceRef } from 'uiSrc/packages/vector-visualizer/src/contracts'

export type NativeSamplingMethod = 'ft-search' | 'vrange' | 'vrandmember'

export interface NativeManifestProvenanceInput {
  databaseId: string
  source: VectorDataSourceRef
  sampleIds: string[]
  samplingMethod: NativeSamplingMethod
  seed: number | 'unavailable'
  algorithm?: string
}

type SamplingProvenance = {
  method: 'ft-search-limit' | 'vrange' | 'vrandmember'
  sourceCommand: 'FT.SEARCH' | 'VRANGE' | 'VRANDMEMBER'
  seed: number | 'unavailable'
  determinism:
    | 'ordering-unspecified'
    | 'deterministic-stable-order'
    | 'unseeded-random'
  exactness: 'sample-exact' | 'unknown'
}

const hashSegments = (
  segments: Array<string | Uint8Array>,
  prefix = 'hash31:',
) => {
  let hash = 7
  const add = (value: number) => {
    hash = (hash * 31 + value) % 2147483647
  }
  segments.forEach((segment) => {
    if (typeof segment === 'string') {
      for (let index = 0; index < segment.length; index += 1)
        add(segment.charCodeAt(index))
    } else {
      segment.forEach(add)
    }
    add(0)
  })
  return `${prefix}${hash.toString(16).padStart(8, '0')}`
}

const samplingProvenance = ({
  samplingMethod,
  seed,
}: Pick<
  NativeManifestProvenanceInput,
  'samplingMethod' | 'seed'
>): SamplingProvenance => {
  if (samplingMethod === 'ft-search')
    return {
      method: 'ft-search-limit',
      sourceCommand: 'FT.SEARCH',
      seed,
      determinism: 'ordering-unspecified',
      exactness: 'unknown',
    }
  if (samplingMethod === 'vrange')
    return {
      method: 'vrange',
      sourceCommand: 'VRANGE',
      seed,
      determinism: 'deterministic-stable-order',
      exactness: 'sample-exact',
    }
  return {
    method: 'vrandmember',
    sourceCommand: 'VRANDMEMBER',
    seed,
    determinism: 'unseeded-random',
    exactness: 'unknown',
  }
}

export const buildNativeManifestProvenance = ({
  databaseId,
  source,
  sampleIds,
  samplingMethod,
  seed,
  algorithm,
}: NativeManifestProvenanceInput) => ({
  databaseId: hashSegments(['database', databaseId]),
  sourceId:
    source.kind === 'search-index'
      ? hashSegments([
          'search-index',
          databaseId,
          source.index,
          source.vectorField,
        ])
      : hashSegments(['vector-set', databaseId, source.key]),
  sampleIdDigest: hashSegments(['ordered-sample', ...sampleIds]),
  sampling: samplingProvenance({ samplingMethod, seed }),
  filter:
    source.kind === 'search-index'
      ? { syntax: 'search' as const, expression: '*' }
      : undefined,
  graphExactness:
    source.kind === 'vector-set'
      ? ('approximate' as const)
      : algorithm?.toLowerCase() === 'flat'
        ? ('exact' as const)
        : algorithm?.toLowerCase() === 'hnsw'
          ? ('approximate' as const)
          : ('unknown' as const),
})
