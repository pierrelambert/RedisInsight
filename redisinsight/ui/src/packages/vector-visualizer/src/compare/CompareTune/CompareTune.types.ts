import type { BenchmarkRunV1, LocalManifestV1 } from '../compare'

export type CompareTuneStatus =
  | 'ready'
  | 'empty'
  | 'unsupported'
  | 'recoverable-error'
  | 'cancelled'

export interface CompareTuneProps {
  left: LocalManifestV1
  right: LocalManifestV1
  runs: BenchmarkRunV1[]
  status?: CompareTuneStatus
  benchmarkEnabled?: boolean
  benchmarkSampleCount?: number
  onConfirmBenchmark(): void
}
