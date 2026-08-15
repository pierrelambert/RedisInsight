import { CliOutputFormatterType } from 'uiSrc/constants/cliOutput'
import { ApiEndpoints } from 'uiSrc/constants'
import { getUrl } from 'uiSrc/utils'
import type {
  CommandPlan,
  RedisArgument,
} from 'uiSrc/packages/vector-visualizer/src/contracts'

const READ_ONLY_VECTOR_COMMANDS = new Set([
  'FT.INFO',
  'FT.AGGREGATE',
  'FT.HYBRID',
  'FT.SEARCH',
  'FT.PROFILE',
  'HGETALL',
  'JSON.GET',
  'VCARD',
  'VDIM',
  'VINFO',
  'VRANGE',
  'VRANDMEMBER',
  'VEMB',
  'VGETATTR',
  'VSIM',
  'VLINKS',
])

type CliPost = (
  url: string,
  body: { command: string; outputFormat: CliOutputFormatterType },
  config: { signal?: AbortSignal },
) => Promise<{ data: { response: unknown } }>

type NativeCommandFailureCategory =
  | 'acl-unavailable'
  | 'cancelled'
  | 'unsupported-command'
  | 'command-unavailable'

const commandFailure = (category: NativeCommandFailureCategory) =>
  new Error(category)

const SAFE_TEXT_ARGUMENT = /^[^\s"\\]+$/

/**
 * The CLI backend parses double-quoted `\\xNN` sequences into the original
 * bytes. Keep readable command tokens readable for Workbench/profiler users,
 * while encoding only binary vector blobs as escaped bytes.
 */
export const serializeNativeArgument = (argument: RedisArgument) => {
  if (typeof argument === 'string') {
    if (SAFE_TEXT_ARGUMENT.test(argument)) return argument
    return `"${argument
      .replaceAll('\\', '\\\\')
      .replaceAll('"', '\\"')
      .replaceAll('\n', '\\n')
      .replaceAll('\r', '\\r')
      .replaceAll('\t', '\\t')}"`
  }

  return `"${[...argument]
    .map((byte) => `\\x${byte.toString(16).padStart(2, '0')}`)
    .join('')}"`
}

export const serializeNativeCommandPlan = (plan: CommandPlan) => {
  const command = plan.command.toUpperCase()
  if (!plan.readOnly)
    throw new Error('Native vector command must be read-only.')
  if (!READ_ONLY_VECTOR_COMMANDS.has(command))
    throw new Error(`Native vector command ${command} is not allowed.`)
  return [command, ...plan.arguments.map(serializeNativeArgument)].join(' ')
}

export const createNativeReadOnlyExecutor =
  ({
    instanceId,
    cliClientUuid = '',
    post,
  }: {
    instanceId: string
    cliClientUuid?: string
    post: CliPost
  }) =>
  async (plan: CommandPlan, signal?: AbortSignal): Promise<unknown> => {
    const command = serializeNativeCommandPlan(plan)
    try {
      const { data } = await post(
        getUrl(
          instanceId,
          ApiEndpoints.CLI,
          cliClientUuid,
          ApiEndpoints.SEND_COMMAND,
        ),
        { command, outputFormat: CliOutputFormatterType.Raw },
        { signal },
      )
      if (
        String((data as { status?: unknown }).status).toLowerCase() === 'fail'
      )
        throw commandFailure(
          /\b(?:acl|noperm|permission)\b/i.test(String(data.response))
            ? 'acl-unavailable'
            : /\bunknown command\b/i.test(String(data.response))
              ? 'unsupported-command'
              : 'command-unavailable',
        )
      return data.response
    } catch (error) {
      if (
        error instanceof Error &&
        [
          'acl-unavailable',
          'unsupported-command',
          'command-unavailable',
        ].includes(error.message)
      )
        throw error
      throw commandFailure(
        signal?.aborted ? 'cancelled' : 'command-unavailable',
      )
    }
  }
