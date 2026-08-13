import type { ReactNode } from 'react'

import type {
  AtlasPointColors,
  AtlasPointStates,
} from '../../renderer/AtlasRenderer'
import type { AtlasLegendEntry } from '../AtlasLegend'
import type { AtlasProvenance } from '../provenance'

export interface AtlasClusterLabel {
  id: string
  label: string
  x: number
  y: number
  count: number
}

export interface AtlasProps {
  title?: string
  coordinates: Float32Array
  sampleIds: string[]
  provenance: AtlasProvenance
  pointStates?: AtlasPointStates
  pointColors?: AtlasPointColors
  clusterLabels?: AtlasClusterLabel[]
  interactionMode?: 'pan' | 'region'
  showEvidenceDetails?: boolean
  selectedIds?: string[]
  legendEntries?: AtlasLegendEntry[]
  onLegendEntryClick?: (label: string) => void
  showMapLabels?: boolean
  showDensity?: boolean
  densityGrid?: Float32Array | null
  densityGridSize?: number
  onSelectionChange(ids: string[]): void
  renderAccessibleSelection?(
    ids: string[],
    hoveredId?: string,
    pointStates?: AtlasPointStates,
  ): ReactNode
}
