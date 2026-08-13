import type {
  AtlasPointColors,
  AtlasPointStates,
} from '../../renderer/AtlasRenderer'
import type { AtlasClusterLabel, AtlasProps } from '../Atlas/Atlas.types'
import type { AtlasProvenance } from '../provenance'

export interface CompareAtlasPanel {
  coordinates: Float32Array
  provenance: AtlasProvenance
  title: string
}

export interface CompareAtlasProps {
  left: CompareAtlasPanel
  right: CompareAtlasPanel
  sampleIds: string[]
  pointStates?: AtlasPointStates
  pointColors?: AtlasPointColors
  clusterLabels?: AtlasClusterLabel[]
  selectedIds?: string[]
  onSelectionChange(ids: string[]): void
  renderAccessibleSelection?: AtlasProps['renderAccessibleSelection']
}
