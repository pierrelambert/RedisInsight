import type { HealthSampleRecord } from '../../health/calculations'

export interface MetadataMatrixProps {
  records: HealthSampleRecord[]
  field: string
  onSelectionChange(ids: string[]): void
  status?: 'loading' | 'error' | 'partial' | 'stale' | 'unsupported'
}
