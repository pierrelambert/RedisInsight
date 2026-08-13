import type { LayoutJobV1 } from '../contracts'
import { DEFAULT_SENSITIVITY_VALUES, planSensitivityRuns } from './sensitivity'

const createBaseJob = (overrides: Partial<LayoutJobV1> = {}): LayoutJobV1 => ({
  version: 1,
  jobId: 'job-1',
  algorithm: 'umap',
  metric: 'cosine',
  count: 50,
  dimensions: 4,
  vectors: new Float32Array([1, 2, 3, 4, 5, 6, 7, 8]),
  seed: 42,
  parameters: { nNeighbors: 15 },
  ...overrides,
})

describe('planSensitivityRuns', () => {
  it('creates a job per default sensitivity value with matching nNeighbors', () => {
    const plan = planSensitivityRuns(createBaseJob())
    expect(plan.values).toEqual([...DEFAULT_SENSITIVITY_VALUES])
    expect(plan.jobs).toHaveLength(DEFAULT_SENSITIVITY_VALUES.length)
    plan.jobs.forEach((job, index) => {
      expect(job.parameters.nNeighbors).toBe(DEFAULT_SENSITIVITY_VALUES[index])
    })
  })

  it('gives each job a unique jobId derived from the base jobId', () => {
    const plan = planSensitivityRuns(createBaseJob({ jobId: 'base-job' }))
    expect(plan.jobs.map((job) => job.jobId)).toEqual([
      'base-job-sensitivity-5',
      'base-job-sensitivity-15',
      'base-job-sensitivity-30',
    ])
    const uniqueIds = new Set(plan.jobs.map((job) => job.jobId))
    expect(uniqueIds.size).toBe(plan.jobs.length)
  })

  it('uses custom values instead of the defaults when provided', () => {
    const plan = planSensitivityRuns(createBaseJob(), [3, 7])
    expect(plan.values).toEqual([3, 7])
    expect(plan.jobs).toHaveLength(2)
    expect(plan.jobs.map((job) => job.parameters.nNeighbors)).toEqual([3, 7])
  })

  it('clamps nNeighbors to count - 1 when the index is small', () => {
    const plan = planSensitivityRuns(createBaseJob({ count: 4 }))
    plan.jobs.forEach((job) => {
      expect(job.parameters.nNeighbors).toBe(3)
    })
  })

  it('does not mutate the base job', () => {
    const baseJob = createBaseJob({ jobId: 'immutable-job' })
    const baseVectorsSnapshot = new Float32Array(baseJob.vectors!)
    const baseParametersSnapshot = { ...baseJob.parameters }

    planSensitivityRuns(baseJob)

    expect(baseJob.jobId).toBe('immutable-job')
    expect(baseJob.parameters).toEqual(baseParametersSnapshot)
    expect(baseJob.vectors).toEqual(baseVectorsSnapshot)
  })

  it('deep-copies vectors so job vectors are not the same reference', () => {
    const baseJob = createBaseJob()
    const plan = planSensitivityRuns(baseJob)
    plan.jobs.forEach((job) => {
      expect(job.vectors).not.toBe(baseJob.vectors)
      expect(job.vectors).toEqual(baseJob.vectors)
    })
  })

  it('handles jobs without vectors or edge arrays gracefully', () => {
    const baseJob = createBaseJob({
      vectors: undefined,
      edgeOffsets: undefined,
      edgeTargets: undefined,
      edgeDistances: undefined,
    })
    expect(() => planSensitivityRuns(baseJob)).not.toThrow()
    const plan = planSensitivityRuns(baseJob)
    plan.jobs.forEach((job) => {
      expect(job.vectors).toBeUndefined()
    })
  })
})
