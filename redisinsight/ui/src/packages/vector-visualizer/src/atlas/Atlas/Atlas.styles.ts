import React from 'react'
import styled from 'styled-components'

import { Col } from 'uiSrc/components/base/layout/flex'
import { Text } from 'uiSrc/components/base/text'

export const Shell = styled(Col)`
  flex: 1 1 auto;
  min-block-size: 40rem;
  min-inline-size: 0;
  overflow: hidden;
`

export const Header = styled.div`
  flex: 0 0 auto;
  padding-block-end: ${({ theme }) => theme.core.space.space100};
`

export const Footer = styled(Text)`
  flex: 0 0 auto;
  padding-block-start: ${({ theme }) => theme.core.space.space050};
`

export const CanvasRow = styled.div`
  display: flex;
  flex: 1 1 auto;
  gap: ${({ theme }) => theme.core.space.space100};
  min-block-size: 0;
  min-inline-size: 0;
`

export const CanvasFrame = styled.div`
  position: relative;
  display: flex;
  flex: 1 1 auto;
  min-block-size: 0;
  min-inline-size: 0;
`

const AxisLabel = styled(Text)`
  position: absolute;
  z-index: 1;
  pointer-events: none;
  color: ${({ theme }) => theme.semantic.color.text.neutral500};
`

export const HorizontalAxis = styled(AxisLabel)`
  inset-block-end: ${({ theme }) => theme.core.space.space050};
  inset-inline-start: 50%;
  transform: translateX(-50%);
`

export const VerticalAxis = styled(AxisLabel)`
  inset-block-start: 50%;
  inset-inline-start: ${({ theme }) => theme.core.space.space050};
  transform: translate(-45%, -50%) rotate(-90deg);
  transform-origin: center;
`

export const ClusterLabel = styled(Text)<{
  $offsetX: number
  $offsetY: number
  $scale: number
  $x: number
  $y: number
}>`
  position: absolute;
  z-index: 2;
  inset-inline-start: ${({ $offsetX, $scale, $x, theme }) =>
    `clamp(${theme.core.space.space500}, ` +
    `calc(${$x * $scale * 100}% + ${$offsetX}px), ` +
    `calc(100% - ${theme.core.space.space500}))`};
  inset-block-start: ${({ $offsetY, $scale, $y, theme }) =>
    `clamp(${theme.core.space.space200}, ` +
    `calc(${(1 - $y * $scale) * 100}% - ${$offsetY}px), ` +
    `calc(100% - ${theme.core.space.space200}))`};
  transform: translate(-50%, -50%);
  pointer-events: none;
  padding: ${({ theme }) =>
    `${theme.core.space.space025} ${theme.core.space.space050}`};
  border: ${({ theme }) => theme.core.space.space010} solid
    ${({ theme }) => theme.semantic.color.border.neutral500};
  border-radius: ${({ theme }) => theme.components.card.borderRadius};
  background: ${({ theme }) => theme.semantic.color.background.neutral100};
  color: ${({ theme }) => theme.semantic.color.text.primary600};
  white-space: nowrap;
`

export const AtlasCanvas = styled.canvas`
  flex: 1 1 auto;
  height: 100%;
  width: 100%;
  min-height: 0;
  border: ${({ theme }) => theme.core.space.space010} solid
    ${({ theme }) => theme.semantic.color.border.neutral500};
  border-radius: ${({ theme }) => theme.components.card.borderRadius};
  background: ${({ theme }) => theme.semantic.color.background.neutral200};

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.semantic.color.text.primary400};
    outline-offset: 2px;
  }
` as unknown as React.ForwardRefExoticComponent<
  React.CanvasHTMLAttributes<HTMLCanvasElement> &
    React.RefAttributes<HTMLCanvasElement>
>

export const SelectionOverlay = styled.div<{
  $height: number
  $width: number
  $x: number
  $y: number
}>`
  position: absolute;
  inset-block-start: ${({ $y }) => `${$y * 100}%`};
  inset-inline-start: ${({ $x }) => `${$x * 100}%`};
  inline-size: ${({ $width }) => `${$width * 100}%`};
  block-size: ${({ $height }) => `${$height * 100}%`};
  pointer-events: none;
  border: ${({ theme }) => theme.core.space.space010} solid
    ${({ theme }) => theme.semantic.color.border.informative400};
  background: ${({ theme }) =>
    `color-mix(in srgb, ${theme.semantic.color.background.informative400} 18%, transparent)`};
` as unknown as React.FC<
  React.HTMLAttributes<HTMLDivElement> & {
    $height: number
    $width: number
    $x: number
    $y: number
  }
>
