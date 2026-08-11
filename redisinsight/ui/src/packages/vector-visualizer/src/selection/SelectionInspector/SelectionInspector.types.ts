import type { SelectionRow } from '../selection'

export interface SelectionInspectorProps {
  row?: SelectionRow
  exactness: 'exact' | 'approximate' | 'sample-exact' | 'unknown'
  provenance?: string
  onCopyId?(id: string): void
  onExportRow?(row: SelectionRow): void
  onRunNeighbors?(id: string): void
}
