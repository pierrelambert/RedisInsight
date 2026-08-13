import type React from 'react'
import styled from 'styled-components'

import { Button } from 'uiSrc/components/base/forms/buttons'
import { Col, Row } from 'uiSrc/components/base/layout/flex'

export const Shell = styled(Col)`
  flex: 1 1 auto;
  block-size: 100%;
  min-block-size: 0;
  min-inline-size: 0;
  box-sizing: border-box;
  overflow: hidden;
  padding: ${({ theme }) => theme.core.space.space200};
  background-color: ${({ theme }) =>
    theme.semantic.color.background.neutral100};

  @media (prefers-reduced-motion: reduce) {
    &,
    & *,
    & *::before,
    & *::after {
      animation: none;
      transition: none;
    }
  }
`

export const Header = styled(Row)`
  flex: 0 0 auto;
  border-block-end: ${({ theme }) => theme.core.space.space010} solid
    ${({ theme }) => theme.semantic.color.border.neutral500};
  padding-block-end: ${({ theme }) => theme.core.space.space100};
`

export const Workspace = styled(Col)`
  flex: 1 1 0;
  min-block-size: 0;
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(18rem, 1fr);
  grid-template-rows: minmax(0, 1fr);
  align-items: start;
  gap: ${({ theme }) => theme.core.space.space200};
  min-inline-size: 0;
  overflow: hidden;
`

export const EvidencePanel = styled(Col).attrs({ gap: 'm' })`
  display: flex;
  flex-direction: column;
  block-size: 100%;
  min-block-size: 0;
  min-inline-size: 0;
  box-sizing: border-box;
  overflow: hidden;
  padding: ${({ theme }) => theme.core.space.space200};
  border: ${({ theme }) => theme.core.space.space010} solid
    ${({ theme }) => theme.semantic.color.border.neutral500};
  border-radius: ${({ theme }) => theme.components.card.borderRadius};
  background-color: ${({ theme }) =>
    theme.semantic.color.background.neutral200};
`

export const InspectorPanel = styled(Col).attrs({ gap: 'm' })`
  display: flex;
  flex-direction: column;
  block-size: 100%;
  min-block-size: 0;
  min-inline-size: 0;
  box-sizing: border-box;
  overflow-y: auto;
  padding: ${({ theme }) => theme.core.space.space200};
  border: ${({ theme }) => theme.core.space.space010} solid
    ${({ theme }) => theme.semantic.color.border.neutral500};
  border-radius: ${({ theme }) => theme.components.card.borderRadius};
  background-color: ${({ theme }) =>
    theme.semantic.color.background.neutral200};
`

export const EvidenceScrollport = styled.div`
  flex: 1 1 0;
  min-block-size: 0;
  min-inline-size: 0;
  overflow-x: hidden;
  overflow-y: auto;
  padding-block-end: ${({ theme }) => theme.core.space.space300};
  padding-inline-end: ${({ theme }) => theme.core.space.space100};
` as unknown as React.FC<React.HTMLAttributes<HTMLDivElement>>

export const Section = styled(Col).attrs({ gap: 's' })`
  min-inline-size: 0;
`

export const StatePanel = styled(Col).attrs({ gap: 's' })`
  min-block-size: ${({ theme }) => `calc(${theme.core.space.space800} * 2)`};
  justify-content: center;
  padding: ${({ theme }) => theme.core.space.space300};
  border: ${({ theme }) => theme.core.space.space010} solid
    ${({ theme }) => theme.semantic.color.border.neutral500};
  border-radius: ${({ theme }) => theme.components.card.borderRadius};
  background-color: ${({ theme }) =>
    theme.semantic.color.background.neutral200};
`

export const NeighborButton = styled(Button)<{
  $selected: boolean
  $x: number
  $y: number
}>`
  position: absolute;
  inset-inline-start: ${({ $x }) => `${$x}%`};
  inset-block-start: ${({ $y }) => `${$y}%`};
  transform: translate(-50%, -50%);
  border: ${({ theme }) => theme.core.space.space010} solid
    ${({ theme }) => theme.semantic.color.border.neutral500};
  border-radius: 50%;
  padding: ${({ theme }) => theme.core.space.space100};
  background-color: ${({ $selected, theme }) =>
    $selected
      ? theme.semantic.color.background.primary100
      : theme.semantic.color.background.neutral100};
  color: ${({ theme }) => theme.semantic.color.text.neutral700};
`

export const RadialPlot = styled.div`
  position: relative;
  min-block-size: ${({ theme }) => `calc(${theme.core.space.space800} * 4)`};
  overflow: hidden;
  border: ${({ theme }) => theme.core.space.space010} solid
    ${({ theme }) => theme.semantic.color.border.neutral500};
  border-radius: ${({ theme }) => theme.components.card.borderRadius};
  background-color: ${({ theme }) =>
    theme.semantic.color.background.neutral100};
` as unknown as React.FC<React.HTMLAttributes<HTMLDivElement>>

export const EvidenceRing = styled.div<{ $radius: number }>`
  position: absolute;
  inset-inline-start: 50%;
  inset-block-start: 50%;
  inline-size: ${({ $radius }) => `${Math.max(0.08, $radius) * 80}%`};
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  border: ${({ theme }) => theme.core.space.space010} dashed
    ${({ theme }) => theme.semantic.color.border.informative400};
  border-radius: 50%;
  pointer-events: none;
`

export const QueryAnchor = styled.span`
  position: absolute;
  inset-inline-start: 50%;
  inset-block-start: 50%;
  transform: translate(-50%, -50%);
` as unknown as React.FC<React.HTMLAttributes<HTMLSpanElement>>

export const WaterfallRow = styled(Button)<{ $selected: boolean }>`
  inline-size: 100%;
  text-align: start;
  border: 0;
  border-inline-start: ${({ theme }) => theme.core.space.space020} solid
    ${({ $selected, theme }) =>
      $selected
        ? theme.semantic.color.border.primary500
        : theme.semantic.color.border.neutral500};
  padding: ${({ theme }) => theme.core.space.space100};
  background-color: ${({ theme }) =>
    theme.semantic.color.background.neutral100};
  color: ${({ theme }) => theme.semantic.color.text.neutral700};
`
