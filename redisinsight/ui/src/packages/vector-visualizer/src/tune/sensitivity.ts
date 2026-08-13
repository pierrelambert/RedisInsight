import type { LayoutJobV1 } from '../contracts'

export const DEFAULT_SENSITIVITY_VALUES = [5, 15, 30] as const

export interface SensitivityPlan {
  jobs: LayoutJobV1[]
  values: number[]
}

const copyTypedArray = <T extends Float32Array | Uint32Array>(
  source: T | undefined,
): T | undefined => (source === undefined ? undefined : (source.slice() as T))

export const planSensitivityRuns = (
  baseJob: LayoutJobV1,
  values: number[] = [...DEFAULT_SENSITIVITY_VALUES],
): SensitivityPlan => {
  const maxNeighbors = Math.max(0, baseJob.count - 1)
  const jobs = values.map((value) => {
    const nNeighbors = Math.min(value, maxNeighbors)
    const job: LayoutJobV1 = {
      ...baseJob,
      jobId: `${baseJob.jobId}-sensitivity-${value}`,
      vectors: copyTypedArray(baseJob.vectors),
      edgeOffsets: copyTypedArray(baseJob.edgeOffsets),
      edgeTargets: copyTypedArray(baseJob.edgeTargets),
      edgeDistances: copyTypedArray(baseJob.edgeDistances),
      parameters: { ...baseJob.parameters, nNeighbors },
    }
    return job
  })
  return { jobs, values }
}
