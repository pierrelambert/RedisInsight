import type { HTMLAttributes } from 'react'
import styled from 'styled-components'

import { Col, Row } from 'uiSrc/components/base/layout/flex'

export const Inspector = styled(Col)`
  flex: 1 1 auto;
  block-size: 100%;
  min-inline-size: ${({ theme }) =>
    `calc(${theme.core.space.space800} * 4 + ${theme.core.space.space300})`};
  max-inline-size: ${({ theme }) =>
    `calc(${theme.core.space.space800} * 5 + ${theme.core.space.space500})`};
  min-block-size: 0;
  overflow: hidden;
  padding: ${({ theme }) => theme.core.space.space150};
  border-inline-start: ${({ theme }) => theme.core.space.space010} solid
    ${({ theme }) => theme.semantic.color.border.neutral500};
  background-color: ${({ theme }) =>
    theme.semantic.color.background.neutral100};
`

export const Header = styled(Row)`
  min-inline-size: 0;
`

export const Actions = styled(Row)`
  min-inline-size: 0;
`

export const StatePanel = styled(Col)`
  min-block-size: ${({ theme }) => `calc(${theme.core.space.space800} * 3)`};
  padding: ${({ theme }) => theme.core.space.space150};
  border: ${({ theme }) => theme.core.space.space010} solid
    ${({ theme }) => theme.semantic.color.border.neutral500};
  border-radius: ${({ theme }) => theme.components.card.borderRadius};
  background-color: ${({ theme }) =>
    theme.semantic.color.background.neutral100};
`

export const TableRegion = styled(Col)`
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  flex: 1 1 auto;
  min-block-size: 0;
  gap: ${({ theme }) => theme.core.space.space100};
  overflow: hidden;
`

export const TableScroll = styled.div<HTMLAttributes<HTMLDivElement>>`
  min-block-size: 0;
  overflow: auto;
`

export const Detail = styled.div<HTMLAttributes<HTMLDivElement>>`
  min-block-size: 0;
  max-block-size: ${({ theme }) => `calc(${theme.core.space.space800} * 3)`};
  overflow: auto;
`
