export interface AtlasLegendEntry {
  label: string
  color: string
  count?: number
  dimmed?: boolean
}

export interface AtlasLegendProps {
  entries: AtlasLegendEntry[]
  onEntryClick?: (label: string) => void
}
