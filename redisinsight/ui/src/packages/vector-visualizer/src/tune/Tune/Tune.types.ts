import type { TuneRecommendation } from '../recommendations'

export interface SensitivityResult {
  nNeighbors: number
  quality: number
  coordinates: Float32Array
  count: number
}

export interface TuneProps {
  sensitivityRuns: SensitivityResult[]
  sensitivityStatus?: 'idle' | 'running' | 'unavailable' | 'error'
  selectedK?: number
  onSelectK?(k: number): void
  recommendations: TuneRecommendation[]
  currentConfig?: Record<string, unknown>
  sourceKind?: 'search-index' | 'vector-set'
}
