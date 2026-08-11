import type { ReactNode } from 'react'

import type {
  AtlasPointColors,
  AtlasPointStates,
} from '../../renderer/AtlasRenderer'
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
  onSelectionChange(ids: string[]): void
  renderAccessibleSelection?(
    ids: string[],
    hoveredId?: string,
    pointStates?: AtlasPointStates,
  ): ReactNode
}
