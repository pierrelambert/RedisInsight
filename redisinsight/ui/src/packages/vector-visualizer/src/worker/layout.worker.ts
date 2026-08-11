import type { LayoutJobV1 } from '../contracts'
import { runBoundedMetricEvidence, runLayout } from './layout'
import type { BoundedMetricEvidenceJob } from './layout'

type WorkerRequest =
  | { type: 'run'; job: LayoutJobV1 }
  | { type: 'health'; job: BoundedMetricEvidenceJob }
  | { type: 'cancel' }

const workerScope = self as unknown as DedicatedWorkerGlobalScope
let isCancelled = false

workerScope.onmessage = ({ data }: MessageEvent<WorkerRequest>) => {
  if (data.type === 'cancel') {
    isCancelled = true
    return
  }

  isCancelled = false

  if (data.type === 'health') {
    const result = runBoundedMetricEvidence(data.job)
    if (isCancelled) {
      workerScope.postMessage({ type: 'cancelled', jobId: data.job.jobId })
      return
    }
    workerScope.postMessage(result)
    return
  }

  const started = performance.now()
  const result = runLayout(data.job)
  if (isCancelled) {
    workerScope.postMessage({ type: 'cancelled', jobId: data.job.jobId })
    return
  }
  const timedResult =
    result.type === 'complete'
      ? { ...result, timing: { layoutMs: performance.now() - started } }
      : result
  workerScope.postMessage(
    timedResult,
    timedResult.type === 'complete' ? [timedResult.coordinates.buffer] : [],
  )
}
