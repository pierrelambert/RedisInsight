import type { HTMLAttributes } from 'react'
import styled from 'styled-components'

export const Workspace = styled.main<HTMLAttributes<HTMLElement>>`
  display: grid;
  /* The visual contract's 200–280px / 280–360px desktop bands in RI tokens. */
  grid-template-columns:
    calc(
      ${({ theme }) => theme.core.space.space800} * 3 +
        ${({ theme }) => theme.core.space.space300}
    )
    minmax(0, 1fr)
    calc(
      ${({ theme }) => theme.core.space.space800} * 4 +
        ${({ theme }) => theme.core.space.space500}
    );
  grid-template-areas: 'controls visualization results';
  flex: 1 1 auto;
  min-block-size: 0;
  min-inline-size: 0;
  overflow: hidden;

  @media (prefers-reduced-motion: reduce) {
    scroll-behavior: auto;
    transition: none;
  }
`

export const ControlsRegion = styled.div`
  display: flex;
  grid-area: controls;
  min-block-size: 0;
  min-inline-size: 0;
  overflow: hidden;
`

export const VisualizationRegion = styled.div`
  grid-area: visualization;
  min-block-size: 0;
  min-inline-size: 0;
  overflow: hidden;
`

export const ResultsRegion = styled.div`
  display: flex;
  grid-area: results;
  min-block-size: 0;
  min-inline-size: 0;
  overflow: hidden;
`
