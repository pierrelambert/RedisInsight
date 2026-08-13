import React from 'react'

import { Atlas } from '../Atlas/Atlas'
import * as S from './CompareAtlas.styles'
import type { CompareAtlasProps } from './CompareAtlas.types'

/**
 * Renders two Atlas instances side by side so a caller can compare the same
 * sampled records under two projections (for example PCA vs UMAP). Both
 * panels share selection, coloring, and cluster labels; only coordinates and
 * provenance differ per panel. Interaction is always panning here — region
 * selection needs a single canvas, so it is not offered in split view.
 */
export const CompareAtlas = ({
  left,
  right,
  sampleIds,
  pointStates,
  pointColors,
  clusterLabels,
  selectedIds,
  onSelectionChange,
  renderAccessibleSelection,
}: CompareAtlasProps) => (
  <S.CompareRow gap="m">
    <S.PanelSlot>
      <Atlas
        title={left.title}
        coordinates={left.coordinates}
        sampleIds={sampleIds}
        provenance={left.provenance}
        pointStates={pointStates}
        pointColors={pointColors}
        clusterLabels={clusterLabels}
        interactionMode="pan"
        showEvidenceDetails={false}
        selectedIds={selectedIds}
        onSelectionChange={onSelectionChange}
        renderAccessibleSelection={renderAccessibleSelection}
      />
    </S.PanelSlot>
    <S.PanelSlot>
      <Atlas
        title={right.title}
        coordinates={right.coordinates}
        sampleIds={sampleIds}
        provenance={right.provenance}
        pointStates={pointStates}
        pointColors={pointColors}
        clusterLabels={clusterLabels}
        interactionMode="pan"
        showEvidenceDetails={false}
        selectedIds={selectedIds}
        onSelectionChange={onSelectionChange}
      />
    </S.PanelSlot>
  </S.CompareRow>
)
