import styled from 'styled-components'
import type { HTMLAttributes } from 'react'

import { Col, Row } from 'uiSrc/components/base/layout/flex'

export const Inspector = styled(Col).attrs({ gap: 'm' })`
  min-inline-size: ${({ theme }) => theme.core.space.space1200};
  padding: ${({ theme }) => theme.core.space.space200};
  border: ${({ theme }) => theme.core.space.space010} solid
    ${({ theme }) => theme.semantic.color.border.neutral500};
  border-radius: ${({ theme }) => theme.components.card.borderRadius};
  background-color: ${({ theme }) =>
    theme.semantic.color.background.neutral200};
`

export const Identifier = styled.code<HTMLAttributes<HTMLElement>>`
  overflow-wrap: anywhere;
`

export const Actions = styled(Row)`
  min-inline-size: 0;
`
