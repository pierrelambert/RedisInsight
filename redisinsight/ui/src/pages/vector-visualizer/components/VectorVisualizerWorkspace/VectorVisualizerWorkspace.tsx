import React from 'react'

import type { VectorVisualizerWorkspaceProps } from './VectorVisualizerWorkspace.types'
import * as S from './VectorVisualizerWorkspace.styles'

export const VectorVisualizerWorkspace = ({
  controls,
  visualization,
  results,
}: VectorVisualizerWorkspaceProps) => (
  <S.Workspace
    aria-label="Vector visualizer workspace"
    data-testid="vector-visualizer-workspace"
  >
    <S.ControlsRegion>{controls}</S.ControlsRegion>
    <S.VisualizationRegion>{visualization}</S.VisualizationRegion>
    <S.ResultsRegion>{results}</S.ResultsRegion>
  </S.Workspace>
)
