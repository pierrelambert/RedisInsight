import styled from 'styled-components'

import { BaseButton as Button } from 'uiSrc/components/base/forms/buttons/Button'

export const MatrixButton = styled(Button)<{ $intensity: number }>`
  min-height: ${({ theme }) => theme.core.space.space300};
  border: ${({ theme }) => theme.core.space.space010} solid
    ${({ theme }) => theme.semantic.color.border.neutral500};
  border-radius: ${({ theme }) => theme.components.card.borderRadius};
  background: ${({ theme }) => theme.semantic.color.background.informative400};
  color: ${({ theme }) => theme.semantic.color.text.primary600};
  opacity: ${({ $intensity }) => 0.25 + $intensity * 0.75};

  &:hover {
    background: ${({ theme }) =>
      theme.semantic.color.background.informative200};
  }

  &:focus-visible {
    outline: ${({ theme }) => theme.core.space.space050} solid
      ${({ theme }) => theme.semantic.color.text.informative400};
    outline-offset: ${({ theme }) => theme.core.space.space050};
  }
`
