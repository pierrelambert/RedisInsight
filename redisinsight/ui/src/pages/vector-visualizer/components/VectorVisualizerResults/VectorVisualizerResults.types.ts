import type {
  Exactness,
  VisualizerStatus,
} from 'uiSrc/packages/vector-visualizer/src/contracts'
import type { SelectionRow } from 'uiSrc/packages/vector-visualizer/src/selection/selection'

export type ResultsInspectorContext = 'sampled' | 'nearest' | 'selected'

export interface VectorVisualizerResultsProps {
  context: ResultsInspectorContext
  exactness: Exactness
  provenance: string
  rows: SelectionRow[]
  sourceKind: 'search-index' | 'vector-set'
  status: VisualizerStatus
  focusedId?: string
  onCopyFocusedId?(id: string): void
  onCopyVisibleIds?(ids: string[]): void
  onExportFocusedResult?(row: SelectionRow): void
  onExportVisibleResults?(rows: SelectionRow[]): void
  onRunNeighborsForFocused?(id: string): void
  onResultFocus(id: string): void
}
