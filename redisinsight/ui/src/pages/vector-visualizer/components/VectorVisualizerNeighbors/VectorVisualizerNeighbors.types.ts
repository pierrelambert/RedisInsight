import type {
  QueryLabNeighbor,
  QueryLabProps,
} from 'uiSrc/packages/vector-visualizer/src/query-lab/QueryLab/QueryLab.types'

export interface VectorVisualizerNeighborRecord {
  id: string
  metadata?: Record<string, string | number | boolean>
}

export interface VectorVisualizerNeighborsProps {
  anchorId?: string
  canRun: boolean
  exactness: QueryLabProps['exactness']
  freshness: QueryLabProps['freshness']
  metadataField: string
  neighbors: QueryLabNeighbor[]
  records: VectorVisualizerNeighborRecord[]
  selectedIds: string[]
  status: QueryLabProps['status']
  topKBoundary?: number
  onRun(): void
  onSelect(id: string): void
}
