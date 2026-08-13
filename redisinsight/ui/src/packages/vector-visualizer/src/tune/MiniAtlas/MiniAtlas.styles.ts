import React from 'react'
import styled from 'styled-components'

import { Col, Row } from 'uiSrc/components/base/layout/flex'

export const Wrapper = styled(Col).attrs({ gap: 'xs' })<{
  $selected: boolean
  $clickable: boolean
}>`
  padding: ${({ theme }) => theme.core.space.space050};
  border: ${({ theme }) => theme.core.space.space010} solid
    ${({ $selected, theme }) =>
      $selected
        ? theme.semantic.color.border.primary500
        : theme.semantic.color.border.neutral500};
  border-radius: ${({ theme }) => theme.components.card.borderRadius};
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.semantic.color.text.primary400};
    outline-offset: 2px;
  }
`

export const CanvasFrame = styled.div<{
  $width: number
  $height: number
}>`
  position: relative;
  inline-size: ${({ $width }) => `${$width}px`};
  block-size: ${({ $height }) => `${$height}px`};
  background: ${({ theme }) => theme.semantic.color.background.neutral200};
` as unknown as React.FC<
  React.PropsWithChildren<
    React.HTMLAttributes<HTMLDivElement> & {
      $width: number
      $height: number
    }
  >
>

export const EmptyState = styled(Row).attrs({
  align: 'center',
  justify: 'center',
})`
  position: absolute;
  inset: 0;
`

export const Caption = styled(Row).attrs({
  align: 'center',
  gap: 'xs',
  justify: 'between',
})`
  min-inline-size: 0;
`
