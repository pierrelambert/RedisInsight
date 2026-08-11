import type { SelectionRow } from '../selection'

export interface SelectionTableProps {
  rows: SelectionRow[]
  focusedId?: string
  variant?: 'default' | 'compact' | 'compact-id'
  onFocus(id: string): void
}

export interface RowData {
  focusedId?: string
  onFocus(id: string): void
  rows: SelectionRow[]
  variant: 'default' | 'compact' | 'compact-id'
}
