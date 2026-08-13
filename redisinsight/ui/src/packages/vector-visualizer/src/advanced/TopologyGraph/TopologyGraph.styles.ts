import React from 'react'
import styled from 'styled-components'

import { Button } from 'uiSrc/components/base/forms/buttons'
import { Col, Row } from 'uiSrc/components/base/layout/flex'

export const Shell = styled(Col).attrs({ gap: 's' })``

export const LayerTabs = styled(Row).attrs({ gap: 'xs' })`
  flex-wrap: wrap;
`

export const LayerTabButton = styled(Button)<{ $active: boolean }>`
  border: ${({ theme }) => theme.core.space.space010} solid
    ${({ $active, theme }) =>
      $active
        ? theme.semantic.color.border.primary500
        : theme.semantic.color.border.neutral500};
  background-color: ${({ $active, theme }) =>
    $active
      ? theme.semantic.color.background.primary100
      : theme.semantic.color.background.neutral100};
`

export const StatsRow = styled(Row).attrs({ gap: 'm', justify: 'between' })`
  flex-wrap: wrap;
  padding-block: ${({ theme }) => theme.core.space.space050};
`

export const GraphSvg = styled.svg`
  inline-size: 100%;
  block-size: auto;
  border: ${({ theme }) => theme.core.space.space010} solid
    ${({ theme }) => theme.semantic.color.border.neutral500};
  border-radius: ${({ theme }) => theme.components.card.borderRadius};
  background: ${({ theme }) => theme.semantic.color.background.neutral200};
` as unknown as React.FC<React.SVGProps<SVGSVGElement>>

export const EdgeLine = styled.line<{ $highlighted: boolean }>`
  stroke: ${({ $highlighted, theme }) =>
    $highlighted
      ? theme.semantic.color.border.primary500
      : theme.semantic.color.border.neutral500};
  stroke-width: ${({ $highlighted }) => ($highlighted ? 2 : 1)};
` as unknown as React.FC<
  React.SVGProps<SVGLineElement> & { $highlighted: boolean }
>

export const NodeCircle = styled.circle<{ $selected: boolean }>`
  cursor: pointer;
  fill: ${({ $selected, theme }) =>
    $selected
      ? theme.semantic.color.background.primary400
      : theme.semantic.color.background.informative400};
  stroke: ${({ $selected, theme }) =>
    $selected
      ? theme.semantic.color.border.primary500
      : theme.semantic.color.border.neutral500};
  stroke-width: ${({ $selected }) => ($selected ? 3 : 1)};

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.semantic.color.text.primary400};
  }
` as unknown as React.FC<
  React.SVGProps<SVGCircleElement> & { $selected: boolean }
>
