import { asNumber, asText, recordValue, toRecord } from './contracts'
import { parseSearchProfile } from './searchAdapter'
import { parseVectorSetNeighbors } from './vectorSetAdapter'
import type { QueryLabProps } from './query-lab/QueryLab'

type PluginResult = { response?: unknown; status?: unknown }

const MAX_PROFILE_STAGE_TEXT_LENGTH = 128

export type WorkbenchQueryRun =
  | {
      kind: 'ready'
      sourceKind: QueryLabProps['sourceKind']
      sourceLabel: string
      exactness: QueryLabProps['exactness']
      neighbors: QueryLabProps['neighbors']
      profile: QueryLabProps['profile']
    }
  | { kind: 'empty' | 'failed' | 'acl-unavailable' | 'invalid' | 'unsupported' }

const tokenize = (command: string): string[] => {
  const tokens: string[] = []
  let token = ''
  let quote: '"' | "'" | undefined
  for (let index = 0; index < command.length; index += 1) {
    const character = command[index]
    if (quote) {
      if (character === '\\' && index + 1 < command.length) {
        token += command[index + 1]
        index += 1
      } else if (character === quote) {
        token += character
        quote = undefined
      } else {
        token += character
      }
    } else if (character === '"' || character === "'") {
      token += character
      quote = character
    } else if (/\s/.test(character)) {
      if (token) tokens.push(token)
      token = ''
    } else {
      token += character
    }
  }
  if (quote) return []
  if (token) tokens.push(token)
  return tokens
}

const tokensBeforeParams = (tokens: string[]) => {
  const paramsIndex = tokens.findIndex(
    (token) => token.toUpperCase() === 'PARAMS',
  )
  return paramsIndex === -1 ? tokens : tokens.slice(0, paramsIndex)
}

/** A display command keeps command shape but never retains PARAMS values. */
export const redactWorkbenchCommand = (command: unknown): string => {
  if (typeof command !== 'string') return ''
  const tokens = tokenize(command)
  if (!tokens.length) return ''
  return (
    tokensBeforeParams(tokens).join(' ') +
    (tokens.length > tokensBeforeParams(tokens).length
      ? ' PARAMS [redacted]'
      : '')
  )
}

const commandKind = (
  command: unknown,
):
  | {
      kind: 'search' | 'aggregate' | 'hybrid' | 'profile'
      sourceLabel: string
      distanceField: string
    }
  | { kind: 'vector-set'; sourceLabel: string }
  | undefined => {
  if (typeof command !== 'string') return undefined
  const tokens = tokenize(command)
  if (tokens.length < 2) return undefined
  const safeTokens = tokensBeforeParams(tokens)
  const verb = safeTokens[0]?.toUpperCase()
  if (verb === 'VSIM') return { kind: 'vector-set', sourceLabel: safeTokens[1] }
  if (
    verb !== 'FT.SEARCH' &&
    verb !== 'FT.AGGREGATE' &&
    verb !== 'FT.HYBRID' &&
    verb !== 'FT.PROFILE'
  )
    return undefined
  const vectorClause = safeTokens.join(' ')
  const profileType =
    verb === 'FT.PROFILE' ? safeTokens[2]?.toUpperCase() : undefined
  const queryVerb = profileType ? `FT.${profileType}` : verb
  if (
    profileType &&
    queryVerb !== 'FT.SEARCH' &&
    queryVerb !== 'FT.AGGREGATE' &&
    queryVerb !== 'FT.HYBRID'
  )
    return undefined
  const knn = vectorClause.match(
    /=>\s*\[\s*KNN\s+\S+\s+@([^\s\]]+)\s+\S+([^\]]*)\]/i,
  )
  const hybrid =
    queryVerb === 'FT.HYBRID'
      ? vectorClause.match(
          /(?:^|\s)VSIM\s+@([^\s]+)\s+\S+(?:\s+\S+)*?\s+KNN\s+([1-9]\d{0,2})(?:\s|$)/i,
        )
      : undefined
  if (!knn && !hybrid) return undefined
  const distanceField =
    knn?.[2].match(/\bAS\s+([^\s\]]+)/i)?.[1] ??
    vectorClause.match(/\bAS\s+([^\s\]]+)/i)?.[1] ??
    `__${knn?.[1] ?? hybrid?.[1]}_score`
  return {
    kind:
      verb === 'FT.PROFILE'
        ? 'profile'
        : verb === 'FT.AGGREGATE'
          ? 'aggregate'
          : verb === 'FT.HYBRID'
            ? 'hybrid'
            : 'search',
    sourceLabel: safeTokens[1],
    distanceField,
  }
}

const unwrapResult = (
  data: unknown,
):
  | {
      response: unknown
      isFailed: boolean
      isAclFailure: boolean
    }
  | undefined => {
  if (!Array.isArray(data)) return undefined
  if (data.length === 0)
    return { response: [], isFailed: false, isAclFailure: false }
  if (data.length !== 1) return undefined
  const result = data[0] as PluginResult
  if (!result || typeof result !== 'object') return undefined
  const isFailed = String(result.status ?? '').toLowerCase() === 'fail'
  return {
    response: result.response,
    isFailed,
    isAclFailure:
      isFailed &&
      /\b(?:noperm|acl|permission)\b/i.test(String(result.response ?? '')),
  }
}

const toQueryLabNeighbors = (
  neighbors: Array<{
    id: string
    metric: 'similarity' | 'distance' | 'score'
    value: number
  }>,
): QueryLabProps['neighbors'] =>
  neighbors.map((neighbor, index) => ({
    ...neighbor,
    rank: index + 1,
    plotted: true,
    provenance: 'measured',
  }))

/** Workbench's executed Search result does not include FT.INFO metric evidence. */
const parseSearchQueryLabNeighbors = (
  reply: unknown,
  distanceField: string,
) => {
  const resp3Rows = recordValue(toRecord(reply), 'results')
  if (Array.isArray(resp3Rows)) {
    return resp3Rows.flatMap((row) => {
      const record = toRecord(row)
      const attributes = toRecord(recordValue(record, 'extra_attributes'))
      const id = asText(recordValue(record, 'id'))
      const value = asNumber(recordValue(attributes, distanceField))
      return id && value !== undefined
        ? [{ id, metric: 'distance' as const, value }]
        : []
    })
  }
  const rows = Array.isArray(reply) ? reply : []
  const neighbors: Array<{ id: string; metric: 'distance'; value: number }> = []
  for (let index = 1; index + 1 < rows.length; index += 2) {
    const id = asText(rows[index])
    const value = asNumber(
      recordValue(toRecord(rows[index + 1]), distanceField),
    )
    if (id && value !== undefined)
      neighbors.push({ id, metric: 'distance', value })
  }
  if (neighbors.length) return neighbors
  return rows.slice(1).flatMap((row) => {
    const fields = toRecord(row)
    const id = asText(
      recordValue(fields, 'id') ??
        recordValue(fields, '__key') ??
        recordValue(fields, 'key'),
    )
    const value = asNumber(recordValue(fields, distanceField))
    return id && value !== undefined
      ? [{ id, metric: 'distance' as const, value }]
      : []
  })
}

const parseProfileStages = (stages: Record<string, unknown>[]) =>
  stages.flatMap((stage) => {
    const name = asText(
      recordValue(stage, 'Type') ??
        recordValue(stage, 'Name') ??
        recordValue(stage, 'Iterator'),
    )
      ?.trim()
      .slice(0, MAX_PROFILE_STAGE_TEXT_LENGTH)
    if (!name) return []
    const count = asNumber(
      recordValue(stage, 'Counter') ??
        recordValue(stage, 'Count') ??
        recordValue(stage, 'Number of reading operations'),
    )
    const mode = asText(recordValue(stage, 'Mode'))
      ?.trim()
      .slice(0, MAX_PROFILE_STAGE_TEXT_LENGTH)
    return [
      {
        name,
        ...(count === undefined ? {} : { count: String(count) }),
        ...(mode === undefined ? {} : { mode }),
      },
    ]
  })

const profileResults = (response: unknown) => {
  const keyed = recordValue(toRecord(response), 'Results')
  return (
    keyed ??
    (Array.isArray(response) && response.length === 2 ? response[0] : undefined)
  )
}

export const parseWorkbenchQueryRun = ({
  command,
  data,
}: {
  command?: unknown
  data?: unknown
}): WorkbenchQueryRun => {
  const parsedCommand = commandKind(command)
  if (!parsedCommand) return { kind: 'unsupported' }
  const result = unwrapResult(data)
  if (!result) return { kind: 'invalid' }
  if (result.isAclFailure) return { kind: 'acl-unavailable' }
  if (result.isFailed) return { kind: 'failed' }

  if (parsedCommand.kind === 'vector-set') {
    if (!Array.isArray(result.response) && !(result.response instanceof Map))
      return { kind: 'invalid' }
    // RedisInsight's Vector Set results label this native `score` as similarity.
    const parsedNeighbors = parseVectorSetNeighbors(result.response, 'cosine')
    const neighbors = toQueryLabNeighbors(parsedNeighbors)
    return neighbors.length
      ? {
          kind: 'ready',
          sourceKind: 'vector-set',
          sourceLabel: parsedCommand.sourceLabel,
          exactness: parsedNeighbors[0]?.provenance.exactness ?? 'unknown',
          neighbors,
          profile: {
            kind: 'reduced',
            facts: { 'Result count': String(neighbors.length) },
          },
        }
      : { kind: 'empty' }
  }

  const searchResult =
    parsedCommand.kind === 'profile'
      ? profileResults(result.response)
      : result.response
  if (!Array.isArray(searchResult) && !(searchResult instanceof Map))
    return { kind: 'invalid' }
  const neighbors = toQueryLabNeighbors(
    parseSearchQueryLabNeighbors(searchResult, parsedCommand.distanceField),
  )
  if (!neighbors.length) return { kind: 'empty' }
  const profile =
    parsedCommand.kind === 'profile'
      ? (() => {
          const parsed = parseSearchProfile(result.response)
          return {
            kind: parsed.kind,
            facts: Object.fromEntries(
              Object.entries(parsed.facts).flatMap(([key, value]) => {
                const text = asText(value)
                return text === undefined ? [] : [[key, text]]
              }),
            ),
            stages: parseProfileStages(parsed.stages),
          }
        })()
      : { kind: 'none' as const, facts: {} }
  return {
    kind: 'ready',
    sourceKind: 'search-index',
    sourceLabel: parsedCommand.sourceLabel,
    exactness: 'unknown',
    neighbors,
    profile,
  }
}

export interface PersistedWorkbenchViewState {
  workflow: 'query-lab'
  selectedIds: string[]
  focusedId?: string
}

/** The SDK state channel may only carry the local view selection, never source payloads. */
export const toPersistedWorkbenchViewState = (
  value: Record<string, unknown>,
): PersistedWorkbenchViewState => ({
  workflow: 'query-lab',
  selectedIds: Array.isArray(value.selectedIds)
    ? value.selectedIds.filter((id): id is string => typeof id === 'string')
    : [],
  ...(typeof value.focusedId === 'string'
    ? { focusedId: value.focusedId }
    : {}),
})

const isExplicitReadOnlyFollowUp = (command: string) => {
  const tokens = tokenize(command)
  const verb = tokens[0]?.toUpperCase()
  const parsed = commandKind(command)
  const countIndex = tokens.findIndex(
    (token) => token.toUpperCase() === 'COUNT',
  )
  const requestedCount = Number(tokens[countIndex + 1])
  const bounded =
    parsed?.kind === 'search' || parsed?.kind === 'profile'
      ? /\bKNN\s+([1-9]\d?|100)\b/i.test(tokensBeforeParams(tokens).join(' '))
      : Number.isInteger(requestedCount) &&
        requestedCount >= 1 &&
        requestedCount <= 100
  return (
    (verb === 'FT.SEARCH' ||
      verb === 'FT.AGGREGATE' ||
      verb === 'FT.HYBRID' ||
      verb === 'FT.PROFILE' ||
      verb === 'VSIM') &&
    Boolean(parsed) &&
    bounded &&
    !tokens.some((token) =>
      /^(?:DEL|UNLINK|SET|HSET|JSON\.SET|VADD|VSETATTR)$/i.test(token),
    )
  )
}

export const createWorkbenchFollowUpController = (
  executeReadOnly: (command: string) => Promise<unknown>,
) => {
  let generation = 0
  return {
    cancel: () => {
      generation += 1
    },
    run: async (command: string) => {
      if (!isExplicitReadOnlyFollowUp(command))
        throw new Error(
          'Only explicit read-only follow-up commands are allowed.',
        )
      const requestGeneration = ++generation
      const result = await executeReadOnly(command)
      return requestGeneration === generation
        ? { accepted: true as const, result }
        : { accepted: false as const }
    },
  }
}

export interface WorkbenchSdk {
  executeRedisCommand(command?: string): Promise<unknown>
  getState(): Promise<unknown>
  setState(state?: PersistedWorkbenchViewState): Promise<unknown>
}

/**
 * The Workbench SDK has no cancellation signal. Generation rejection prevents
 * a late follow-up from replacing newer UI state; persistence is selection-only.
 */
export const createWorkbenchHostBinding = (sdk: WorkbenchSdk) => ({
  followUp: createWorkbenchFollowUpController((command) =>
    sdk.executeRedisCommand(command),
  ),
  loadState: async () => {
    const value = await sdk.getState()
    return toPersistedWorkbenchViewState(
      value && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {},
    )
  },
  saveState: async (state: Record<string, unknown>) =>
    sdk.setState(toPersistedWorkbenchViewState(state)),
})
