import React from 'react'
import styled from 'styled-components'

import { Col, Row } from 'uiSrc/components/base/layout/flex'

export const Panel = styled.section`
  padding: ${({ theme }) => theme.core.space.space150};
  border: ${({ theme }) => theme.core.space.space010} solid
    ${({ theme }) => theme.semantic.color.border.neutral500};
  border-radius: ${({ theme }) => theme.components.card.borderRadius};
  background: ${({ theme }) => theme.semantic.color.background.neutral200};
` as unknown as React.FC<
  React.PropsWithChildren<React.HTMLAttributes<HTMLElement>>
>

export const ThumbnailRow = styled(Row).attrs({ gap: 'm', wrap: true })``

export const ConfigChips = styled(Row).attrs({ gap: 's', wrap: true })``

export const ConfigChip = styled(Col)`
  gap: ${({ theme }) => theme.core.space.space025};
  padding: ${({ theme }) =>
    `${theme.core.space.space050} ${theme.core.space.space100}`};
  border: ${({ theme }) => theme.core.space.space010} solid
    ${({ theme }) => theme.semantic.color.border.neutral500};
  border-radius: ${({ theme }) => theme.components.card.borderRadius};
`

export const RecommendationGrid = styled(Row).attrs({ gap: 's', wrap: true })`
  align-items: stretch;
`

export const RecommendationCard = styled(Col).attrs({ gap: 'xs' })`
  flex: 1 1 16rem;
  max-inline-size: 24rem;
  padding: ${({ theme }) => theme.core.space.space100};
  border: ${({ theme }) => theme.core.space.space010} solid
    ${({ theme }) => theme.semantic.color.border.neutral500};
  border-radius: ${({ theme }) => theme.components.card.borderRadius};
`

export const Code = styled.code`
  font-family: 'Source Code Pro', monospace;
`
