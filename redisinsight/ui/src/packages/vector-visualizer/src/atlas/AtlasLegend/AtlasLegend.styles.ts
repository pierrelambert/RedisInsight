import type React from 'react'
import styled from 'styled-components'

import { Col } from 'uiSrc/components/base/layout/flex'
import { Text } from 'uiSrc/components/base/text'

export const Panel = styled(Col)`
  flex: 0 0 auto;
  inline-size: 12.5rem;
  max-block-size: 100%;
  overflow-y: auto;
  padding: ${({ theme }) => theme.core.space.space100};
  border: ${({ theme }) => theme.core.space.space010} solid
    ${({ theme }) => theme.semantic.color.border.neutral500};
  border-radius: ${({ theme }) => theme.components.card.borderRadius};
  background: ${({ theme }) => theme.semantic.color.background.neutral100};
`

export const EntryList = styled(Col)`
  max-block-size: 24rem;
  overflow-y: auto;
`

type EntryProps = React.PropsWithChildren<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    $dimmed?: boolean
  }
>

type ExpanderButtonProps = React.PropsWithChildren<
  React.ButtonHTMLAttributes<HTMLButtonElement>
>

const EntryBase = styled.button<{
  $dimmed?: boolean
}>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.core.space.space075};
  padding: ${({ theme }) =>
    `${theme.core.space.space025} ${theme.core.space.space050}`};
  border: none;
  border-radius: ${({ theme }) => theme.components.card.borderRadius};
  background: transparent;
  cursor: pointer;
  opacity: ${({ $dimmed }) => ($dimmed ? 0.35 : 1)};
  transition: background 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.semantic.color.background.neutral200};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.semantic.color.text.primary400};
    outline-offset: -2px;
  }
`

export const Entry = EntryBase as React.ComponentType<EntryProps>

export const EntryText = styled(Text).attrs({
  color: 'subdued',
  size: 'S',
  component: 'span',
})`
  min-inline-size: 0;
  overflow-wrap: anywhere;
`

export const EntryCount = styled(Text).attrs({
  color: 'subdued',
  size: 'XS',
  component: 'span',
})``

const ExpanderButtonBase = styled.button`
  padding: ${({ theme }) =>
    `${theme.core.space.space025} ${theme.core.space.space050}`};
  border: ${({ theme }) => theme.core.space.space010} solid
    ${({ theme }) => theme.semantic.color.border.neutral500};
  border-radius: ${({ theme }) => theme.components.card.borderRadius};
  background: ${({ theme }) => theme.semantic.color.background.neutral100};
  color: ${({ theme }) => theme.semantic.color.text.informative400};
  cursor: pointer;
  text-align: start;

  &:hover {
    background: ${({ theme }) => theme.semantic.color.background.neutral200};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.semantic.color.text.primary400};
    outline-offset: -2px;
  }
`

export const ExpanderButton =
  ExpanderButtonBase as React.ComponentType<ExpanderButtonProps>

export const Swatch = styled.span<{ $color: string }>`
  display: inline-block;
  flex: 0 0 auto;
  inline-size: ${({ theme }) => theme.core.space.space100};
  block-size: ${({ theme }) => theme.core.space.space100};
  border-radius: ${({ theme }) => theme.core.space.space025};
  background: ${({ $color }) => $color};
`
