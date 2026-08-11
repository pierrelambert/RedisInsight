import type { CommandPlan } from 'uiSrc/packages/vector-visualizer/src/contracts'
import type { LocalManifestV1 } from 'uiSrc/packages/vector-visualizer/src/compare/compare'

import { runNativeVectorSetBenchmark } from './nativeBenchmark'

const manifest: LocalManifestV1 = {
  version: 1,
  sourceKind: 'vector-set',
  sourceId: 'vector-set',
  sampleIdDigest: 'sample:500',
  dimensions: 2,
  metric: 'cosine',
  sampleCount: 500,
  sourceCount: 1_000,
}

describe('native controlled benchmark', () => {
  it('records only measured comparable Vector Set truth evidence after explicit invocation', async () => {
    const commands: CommandPlan[] = []
    const execute = jest.fn(async (plan: CommandPlan) => {
      commands.push(plan)
      return plan.arguments.includes('TRUTH')
        ? ['member:a', '0.1', 'member:c', '0.3']
        : ['member:a', '0.1', 'member:b', '0.2']
    })
    const times = [10, 22]

    const result = await runNativeVectorSetBenchmark({
      key: new Uint8Array([0, 255]),
      anchorVector: new Float32Array([1, 0]),
      limit: 2,
      manifest,
      execute,
      now: () => times.shift() ?? 22,
      completedAt: '2026-08-08T00:00:00.000Z',
    })

    expect(commands).toHaveLength(2)
    expect(commands[1]).toMatchObject({
      command: 'VSIM',
      readOnly: true,
      requiresConfirmation: true,
      operation: 'VSIM TRUTH',
    })
    expect(result).toMatchObject({
      recall: { value: 0.5, evidence: 'measured' },
      latencyMs: { value: 12, evidence: 'measured' },
      memoryMb: {
        evidence: 'unavailable',
        detail:
          'Comparable Redis/index memory was not observed for this benchmark run',
      },
      completedAt: '2026-08-08T00:00:00.000Z',
    })
    expect(JSON.stringify(result)).not.toMatch(
      /anchorVector|rawVectors|payload/,
    )
    expect(JSON.stringify(result)).not.toContain('sampleBufferBytes')
  })
})
