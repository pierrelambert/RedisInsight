import type { VisualizerStatus } from '../../contracts'

export interface QueryLabNeighbor {
  id: string
  rank: number
  metric: 'similarity' | 'distance' | 'score'
  value: number
  plotted: boolean
  provenance?: string
}

export interface QueryLabProfile {
  kind: 'full' | 'reduced' | 'none'
  facts: Record<string, string | undefined>
  stages?: Array<{ name: string; count?: string; mode?: string }>
}

export interface QueryLabSourceSample {
  /** Finite metric values from a bounded host response. Raw vectors are never included. */
  values: number[]
  completeness: 'bounded' | 'partial'
  provenance: string
}

export interface QueryLabThreshold {
  value: number
  operator: 'gte' | 'lte'
  label: string
  provenance: string
}

export interface QueryLabProps {
  sourceKind: 'search-index' | 'vector-set'
  status: VisualizerStatus
  exactness: 'exact' | 'approximate' | 'sample-exact' | 'unknown'
  freshness: 'current' | 'stale' | 'changed while sampled'
  neighbors: QueryLabNeighbor[]
  profile: QueryLabProfile
  selectedIds?: string[]
  focusedId?: string
  onSelectionChange?(ids: string[]): void
  onFocusChange?(id: string): void
  sourceSample?: QueryLabSourceSample
  threshold?: QueryLabThreshold
  topKBoundary?: number
}
