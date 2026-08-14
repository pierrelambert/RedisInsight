import { CommandPlan } from 'uiSrc/packages/vector-visualizer/src/contracts'

import {
  createNativeReadOnlyExecutor,
  serializeNativeCommandPlan,
} from './nativeExecution'

const plan = (overrides: Partial<CommandPlan> = {}): CommandPlan => ({
  command: 'FT.INFO',
  arguments: ['idx:products', new Uint8Array([0, 34, 92, 255])],
  readOnly: true,
  provenance: { kind: 'measured', exactness: 'unknown' },
  ...overrides,
})

describe('native Vector Visualizer read-only executor', () => {
  it('serializes every argument as CLI parser-safe bytes without retaining a raw vector value', () => {
    expect(serializeNativeCommandPlan(plan())).toBe(
      'FT.INFO "\\x69\\x64\\x78\\x3a\\x70\\x72\\x6f\\x64\\x75\\x63\\x74\\x73" "\\x00\\x22\\x5c\\xff"',
    )
  })

  it('accepts only the exact read-only command allowlist', async () => {
    const execute = createNativeReadOnlyExecutor({
      instanceId: 'instance-1',
      post: jest.fn(),
    })

    await expect(
      execute(plan({ command: 'DEL', readOnly: true })),
    ).rejects.toThrow('not allowed')
    await expect(
      execute(plan({ command: 'FT.INFO', readOnly: false as never })),
    ).rejects.toThrow('must be read-only')

    await expect(execute(plan({ command: 'VGETATTR' }))).rejects.not.toThrow(
      'not allowed',
    )
    await expect(execute(plan({ command: 'FT.AGGREGATE' }))).rejects.not.toThrow(
      'not allowed',
    )
    await expect(execute(plan({ command: 'FT.HYBRID' }))).rejects.not.toThrow(
      'not allowed',
    )
    await expect(execute(plan({ command: 'HGETALL' }))).rejects.not.toThrow(
      'not allowed',
    )
    await expect(execute(plan({ command: 'JSON.GET' }))).rejects.not.toThrow(
      'not allowed',
    )
  })

  it('uses the current CLI route with an AbortSignal and returns only the Redis reply', async () => {
    const post = jest.fn().mockResolvedValue({
      data: { response: ['ok'], status: 'success' },
    })
    const signal = new AbortController().signal
    const execute = createNativeReadOnlyExecutor({
      instanceId: 'instance-1',
      cliClientUuid: 'cli-1',
      post,
    })

    await expect(execute(plan(), signal)).resolves.toEqual(['ok'])
    expect(post).toHaveBeenCalledWith(
      '/databases/instance-1/cli/cli-1/send-command',
      expect.objectContaining({ outputFormat: 'RAW' }),
      { signal },
    )
  })

  it('maps an HTTP-success Redis failure to a safe command category', async () => {
    const execute = createNativeReadOnlyExecutor({
      instanceId: 'instance-1',
      post: jest.fn().mockResolvedValue({
        data: { response: 'NOPERM details must not escape', status: 'fail' },
      }),
    })

    await expect(execute(plan())).rejects.toThrow('acl-unavailable')
  })

  it('classifies only an unknown command as a safe unsupported-command fallback signal', async () => {
    const execute = createNativeReadOnlyExecutor({
      instanceId: 'instance-1',
      post: jest.fn().mockResolvedValue({
        data: {
          response:
            "ERR unknown command 'VRANGE', with args beginning with: secret",
          status: 'fail',
        },
      }),
    })

    await expect(execute(plan({ command: 'VRANGE' }))).rejects.toThrow(
      'unsupported-command',
    )
    await expect(execute(plan({ command: 'VRANGE' }))).rejects.not.toThrow(
      'secret',
    )
  })

  it('does not expose request config or serialized vector bytes when transport rejects', async () => {
    const execute = createNativeReadOnlyExecutor({
      instanceId: 'instance-1',
      post: jest.fn().mockRejectedValue({
        code: 'ECONNABORTED',
        config: { data: 'FT.INFO "\\x00\\xff"' },
      }),
    })

    await expect(execute(plan())).rejects.toThrow('command-unavailable')
    await expect(execute(plan())).rejects.not.toThrow('\\x00')
  })

  it('classifies an unknown read-only command without retaining its response text', async () => {
    const execute = createNativeReadOnlyExecutor({
      instanceId: 'instance-1',
      post: jest.fn().mockResolvedValue({
        data: { status: 'fail', response: 'ERR unknown command VRANGE' },
      }),
    })

    await expect(
      execute(
        plan({ command: 'VRANGE', arguments: ['vectors', '-', '+', '2'] }),
      ),
    ).rejects.toThrow('unsupported-command')
  })
})
