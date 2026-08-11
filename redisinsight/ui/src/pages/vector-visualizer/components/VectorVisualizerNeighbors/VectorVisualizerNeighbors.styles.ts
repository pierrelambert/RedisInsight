import type React from 'react'
import styled from 'styled-components'

import { Button } from 'uiSrc/components/base/forms/buttons'
import { Col, Row } from 'uiSrc/components/base/layout/flex'

export const Shell = styled(Col)`
  flex: 1 1 auto;
  block-size: 100%;
  min-block-size: 0;
  min-inline-size: 0;
  overflow: hidden;
`

export const Header = styled(Row)`
  flex: 0 0 auto;
  min-inline-size: 0;
  padding-block-end: ${({ theme }) => theme.core.space.space100};
  border-block-end: ${({ theme }) => theme.core.space.space010} solid
    ${({ theme }) => theme.semantic.color.border.neutral500};
`

export const Plot = styled.div`
  position: relative;
  flex: 1 1 auto;
  min-block-size: ${({ theme }) => `calc(${theme.core.space.space800} * 5)`};
  min-inline-size: 0;
  overflow: hidden;
  background-color: ${({ theme }) =>
    theme.semantic.color.background.neutral200};
` as unknown as React.FC<React.HTMLAttributes<HTMLDivElement>>

export const RadialField = styled.div`
  position: absolute;
  inset: 0;
` as unknown as React.FC<React.HTMLAttributes<HTMLDivElement>>

export const RingField = styled.div`
  position: absolute;
  inset-inline-start: 50%;
  inset-block-start: 50%;
  block-size: 56%;
  max-inline-size: 56%;
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  pointer-events: none;
`

export const ScaleRing = styled.div<{ $radius: number }>`
  position: absolute;
  inset-inline-start: 50%;
  inset-block-start: 50%;
  inline-size: ${({ $radius }) => `${$radius * 2}%`};
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  border: ${({ theme }) => theme.core.space.space010} dashed
    ${({ theme }) => theme.semantic.color.border.informative400};
  border-radius: 50%;
  pointer-events: none;
` as unknown as React.FC<
  React.HTMLAttributes<HTMLDivElement> & { $radius: number }
>

export const RingLabel = styled.span<{ $radius: number }>`
  position: absolute;
  inset-inline-start: calc(50% + ${({ theme }) => theme.core.space.space100});
  inset-block-start: ${({ $radius }) => `${50 - $radius}%`};
  transform: translateY(-50%);
  color: ${({ theme }) => theme.semantic.color.text.neutral600};
  font-size: ${({ theme }) => theme.core.space.space150};
  pointer-events: none;
` as unknown as React.FC<
  React.HTMLAttributes<HTMLSpanElement> & { $radius: number }
>

export const QueryAnchor = styled(Button)<{ $selected: boolean }>`
  position: absolute;
  inset-inline-start: 50%;
  inset-block-start: 50%;
  inline-size: ${({ theme }) => theme.core.space.space200};
  block-size: ${({ theme }) => theme.core.space.space200};
  transform: translate(-50%, -50%);
  min-inline-size: ${({ theme }) => theme.core.space.space200};
  padding: 0;
  border: ${({ theme }) => theme.core.space.space050} solid
    ${({ theme }) => theme.semantic.color.border.primary300};
  border-radius: 50%;
  background-color: ${({ theme }) =>
    theme.semantic.color.background.primary300};
  box-shadow: 0 0 0 ${({ theme }) => theme.core.space.space100}
    ${({ $selected, theme }) =>
      $selected
        ? theme.semantic.color.border.primary500
        : theme.semantic.color.background.primary100};
  pointer-events: auto;
`

export const NeighborPoint = styled(Button)<{
  $color: string
  $selected: boolean
  $x: number
  $y: number
}>`
  position: absolute;
  inset-inline-start: ${({ $x }) => `${$x}%`};
  inset-block-start: ${({ $y }) => `${$y}%`};
  min-inline-size: ${({ theme }) => theme.core.space.space100};
  inline-size: ${({ theme }) => theme.core.space.space100};
  block-size: ${({ theme }) => theme.core.space.space100};
  transform: translate(-50%, -50%);
  padding: 0;
  border: ${({ theme }) => theme.core.space.space010} solid
    ${({ theme }) => theme.semantic.color.border.neutral500};
  border-radius: 50%;
  background-color: ${({ $color }) => $color};
  color: transparent;
  box-shadow: ${({ $color, $selected, theme }) =>
    $selected
      ? `0 0 0 ${theme.core.space.space050} ${theme.semantic.color.border.primary500}`
      : `0 0 ${theme.core.space.space100} color-mix(in srgb, ${$color} 55%, transparent)`};

  &:hover {
    min-inline-size: ${({ theme }) => theme.core.space.space150};
    inline-size: ${({ theme }) => theme.core.space.space150};
    block-size: ${({ theme }) => theme.core.space.space150};
  }

  &:focus-visible {
    outline: ${({ theme }) => theme.core.space.space020} solid
      ${({ theme }) => theme.semantic.color.border.primary500};
    outline-offset: ${({ theme }) => theme.core.space.space050};
  }
`

export const Legend = styled.ul`
  position: absolute;
  inset-inline-start: ${({ theme }) => theme.core.space.space150};
  inset-block-end: ${({ theme }) => theme.core.space.space100};
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.core.space.space150};
  max-inline-size: calc(100% - ${({ theme }) => theme.core.space.space300});
  margin: 0;
  padding: ${({ theme }) => theme.core.space.space100};
  border-radius: ${({ theme }) => theme.components.card.borderRadius};
  background-color: ${({ theme }) =>
    theme.semantic.color.background.neutral100};
  color: ${({ theme }) => theme.semantic.color.text.neutral600};
  font-size: ${({ theme }) => theme.core.space.space150};
  list-style: none;
` as unknown as React.FC<React.HTMLAttributes<HTMLUListElement>>

export const LegendItem = styled.li`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.core.space.space050};
` as unknown as React.FC<React.LiHTMLAttributes<HTMLLIElement>>

export const LegendSwatch = styled.span<{ $color: string }>`
  inline-size: ${({ theme }) => theme.core.space.space100};
  block-size: ${({ theme }) => theme.core.space.space100};
  border-radius: 50%;
  background-color: ${({ $color }) => $color};
` as unknown as React.FC<
  React.HTMLAttributes<HTMLSpanElement> & { $color: string }
>

export const State = styled(Col)`
  position: absolute;
  inset: 0;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.core.space.space300};
  text-align: center;
`
