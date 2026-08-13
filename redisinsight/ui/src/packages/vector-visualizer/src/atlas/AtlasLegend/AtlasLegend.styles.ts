import styled from 'styled-components'

import { Col } from 'uiSrc/components/base/layout/flex'

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

export const Entry = styled.button.attrs({ type: 'button' as const })<{
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

export const Swatch = styled.span<{ $color: string }>`
  display: inline-block;
  flex: 0 0 auto;
  inline-size: ${({ theme }) => theme.core.space.space100};
  block-size: ${({ theme }) => theme.core.space.space100};
  border-radius: ${({ theme }) => theme.core.space.space025};
  background: ${({ $color }) => $color};
`
