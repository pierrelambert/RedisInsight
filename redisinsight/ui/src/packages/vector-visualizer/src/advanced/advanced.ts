import {
  asNumber,
  asText,
  RedisArgument,
  recordValue,
  toRecord,
} from '../contracts'
import { parseSearchProfile } from '../searchAdapter'
import { parseVectorSetMember } from '../vectorSetAdapter'

export interface TopologyAdjacency {
  layer: number
  source: string
  targets: string[]
}

export type VlinksTopology =
  | {
      kind: 'ready'
      totalAdjacencies: number
      shownAdjacencies: number
      layers: TopologyAdjacency[]
      /** Original source/target bulk strings for subsequent read-only plans. */
      memberArguments: Map<string, RedisArgument>
    }
  | { kind: 'unsupported' | 'malformed' }

/**
 * VLINKS is supplied only after capability/version discovery has confirmed it.
 * Its links are HNSW layer adjacency, never semantic nearest-neighbor results.
 */
export const parseVlinksTopology = (
  reply: unknown,
  options: { supported: boolean; limit: number; source: RedisArgument },
): VlinksTopology => {
  if (!options.supported) return { kind: 'unsupported' }
  if (options.limit < 1) return { kind: 'malformed' }
  const source = parseVectorSetMember(options.source)
  if (!source) return { kind: 'malformed' }
  const layerEntries: Array<[unknown, unknown]> = Array.isArray(reply)
    ? reply.map((targets, layer) => [layer, targets])
    : reply instanceof Map
      ? [...reply.entries()]
      : reply && typeof reply === 'object'
        ? Object.entries(reply)
        : []
  const memberArguments = new Map<string, RedisArgument>([
    [source.id, source.argument],
  ])
  const adjacencies = layerEntries.flatMap(([layerValue, targetsValue]) => {
    const layer = asNumber(layerValue)
    const targetValues = Array.isArray(targetsValue)
      ? targetsValue
      : targetsValue instanceof Map
        ? [...targetsValue.keys()]
        : targetsValue && typeof targetsValue === 'object'
          ? Object.keys(targetsValue)
          : []
    if (layer === undefined || !targetValues.length) return []
    const targets = targetValues.flatMap((targetValue) => {
      const target = parseVectorSetMember(targetValue)
      if (!target) return []
      memberArguments.set(target.id, target.argument)
      return [target.id]
    })
    return targets.length ? [{ layer, source: source.id, targets }] : []
  })
  if (!adjacencies.length) return { kind: 'malformed' }
  return {
    kind: 'ready',
    totalAdjacencies: adjacencies.length,
    shownAdjacencies: Math.min(adjacencies.length, options.limit),
    layers: adjacencies.slice(0, options.limit),
    memberArguments,
  }
}

export type SearchExecutionEvidence =
  | {
      kind: 'ready'
      facts: Record<string, string>
      vectorMode?: string
    }
  | { kind: 'malformed' }

export interface VectorSetProfile {
  kind: 'reduced'
  facts: Record<string, string>
}

/** FT.PROFILE facts are displayed only when the response includes them. */
export const parseSearchExecutionEvidence = (
  reply: unknown,
): SearchExecutionEvidence => {
  const profileValue = recordValue(toRecord(reply), 'Profile')
  if (profileValue === undefined) return { kind: 'malformed' }
  const parsed = parseSearchProfile(reply)
  const facts = Object.fromEntries(
    Object.entries(parsed.facts).flatMap(([name, value]) => {
      const text = asText(value)
      return text === undefined ? [] : [[name, text]]
    }),
  )
  const vectorMode =
    facts['Vector mode'] ?? facts['Vector execution mode'] ?? 'Unavailable'
  return {
    kind: 'ready',
    facts,
    ...(vectorMode === 'Unavailable' ? { vectorMode } : {}),
  }
}

export const reduceVectorSetProfile = (input: {
  resultCount?: number
  ef?: number
  filterEf?: number
  elapsedMs?: number
}): VectorSetProfile => ({
  kind: 'reduced' as const,
  facts: {
    'Result count':
      input.resultCount === undefined
        ? 'Unavailable'
        : String(input.resultCount),
    EF: input.ef === undefined ? 'Unavailable' : String(input.ef),
    'FILTER-EF':
      input.filterEf === undefined ? 'Unavailable' : String(input.filterEf),
    'Elapsed time':
      input.elapsedMs === undefined ? 'Unavailable' : `${input.elapsedMs} ms`,
  },
})
