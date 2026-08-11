export interface SelectionCandidate {
  id: string
  rank: number
  value: number
  metric: 'similarity' | 'distance' | 'score'
  plotted: boolean
  metadata?: Record<string, string | number | boolean>
}

export interface SelectionRow extends SelectionCandidate {
  selected: boolean
}

export const buildSelectionRows = (
  candidates: SelectionCandidate[],
  selectedIds: string[],
): SelectionRow[] => {
  const selected = new Set(selectedIds)

  return candidates
    .filter(({ id }) => selected.has(id))
    .map((candidate) => ({ ...candidate, selected: true }))
}
