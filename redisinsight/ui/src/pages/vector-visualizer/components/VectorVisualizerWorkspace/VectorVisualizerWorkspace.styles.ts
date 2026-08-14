import type React from 'react'
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
  grid-template-rows: minmax(0, 1fr) auto;
  grid-template-areas:
    'controls visualization results'
    'controls additional results';
  column-gap: ${({ theme }) => theme.core.space.space150};
  row-gap: ${({ theme }) => theme.core.space.space100};
  flex: 1 1 auto;
  min-block-size: 0;
  min-inline-size: 0;
  overflow: hidden;

  @media (prefers-reduced-motion: reduce) {
    scroll-behavior: auto;
    transition: none;
  }
` as unknown as React.FC<
  React.PropsWithChildren<React.HTMLAttributes<HTMLElement>>
>

export const ControlsRegion = styled.div`
  display: flex;
  grid-area: controls;
  min-block-size: 0;
  min-inline-size: 0;
  overflow: hidden;
` as React.FC<React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>>

export const VisualizationRegion = styled.div`
  display: flex;
  flex-direction: column;
  grid-area: visualization;
  min-block-size: 0;
  min-inline-size: 0;
  overflow: auto;
  overscroll-behavior: contain;
` as React.FC<React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>>

export const VisualizationPrimary = styled.div`
  flex: 1 1 auto;
  min-block-size: 0;
  min-inline-size: 0;
  overflow: auto;
  overscroll-behavior: contain;
` as React.FC<React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>>

export const AdditionalRegion = styled.div`
  grid-area: additional;
  display: flex;
  flex-direction: column;
  min-block-size: 0;
  min-inline-size: 0;
  max-block-size: min(
    42vh,
    ${({ theme }) => `calc(${theme.core.space.space800} * 7)`}
  );
  overflow: auto;
  overscroll-behavior: contain;
` as React.FC<React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>>

export const ResultsRegion = styled.div`
  display: flex;
  grid-area: results;
  min-block-size: 0;
  min-inline-size: 0;
  overflow: auto;
  overscroll-behavior: contain;
` as React.FC<React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>>
