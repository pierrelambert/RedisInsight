export interface AtlasLegendEntry {
  label: string
  color: string
  count?: number
  dimmed?: boolean
}

export interface AtlasLegendProps {
  entries: AtlasLegendEntry[]
  maxVisible?: number
  onEntryClick?: (label: string) => void
}
