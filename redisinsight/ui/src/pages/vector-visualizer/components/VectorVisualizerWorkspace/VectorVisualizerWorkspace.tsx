import React from 'react'

import type { VectorVisualizerWorkspaceProps } from './VectorVisualizerWorkspace.types'
import * as S from './VectorVisualizerWorkspace.styles'

export const VectorVisualizerWorkspace = ({
  controls,
  additional,
  visualization,
  results,
}: VectorVisualizerWorkspaceProps) => (
  <S.Workspace
    aria-label="Vector visualizer workspace"
    data-testid="vector-visualizer-workspace"
  >
    <S.ControlsRegion data-testid="vector-visualizer-controls-region">
      {controls}
    </S.ControlsRegion>
    <S.VisualizationRegion data-testid="vector-visualizer-visualization-region">
      <S.VisualizationPrimary>{visualization}</S.VisualizationPrimary>
    </S.VisualizationRegion>
    <S.ResultsRegion data-testid="vector-visualizer-results-region">
      {results}
    </S.ResultsRegion>
    {additional && (
      <S.AdditionalRegion data-testid="vector-visualizer-additional-workflows-region">
        {additional}
      </S.AdditionalRegion>
    )}
  </S.Workspace>
)
