import styled from 'styled-components'
import type { FC, HTMLAttributes } from 'react'

import { Col, Row } from 'uiSrc/components/base/layout/flex'

export const VirtualGrid = styled(Col)`
  min-inline-size: 0;
  max-inline-size: 100%;
  overflow-x: auto;
  overflow-y: auto;
  border: ${({ theme }) => theme.core.space.space010} solid
    ${({ theme }) => theme.semantic.color.border.neutral500};
  border-radius: ${({ theme }) => theme.components.card.borderRadius};
`

export const TableHeader = styled(Row)<{
  $compact: boolean
  $idOnly: boolean
}>`
  grid-template-columns: ${({ $compact, $idOnly, theme }) =>
    $idOnly
      ? 'minmax(0, 1fr)'
      : $compact
        ? `minmax(0, 1fr) ${theme.core.space.space600}`
        : `${theme.core.space.space500} minmax(0, 1fr) ${theme.core.space.space500} ${theme.core.space.space600} auto`};
  display: grid;
  padding: ${({ theme }) => theme.core.space.space100};
`

export const RowGroup = styled.div`
  min-inline-size: 0;
` as unknown as FC<HTMLAttributes<HTMLDivElement>>

export const TableRow = styled(Row)<{
  $compact: boolean
  $idOnly: boolean
  $selected: boolean
}>`
  display: grid;
  grid-template-columns: ${({ $compact, $idOnly, theme }) =>
    $idOnly
      ? 'minmax(0, 1fr)'
      : $compact
        ? `minmax(0, 1fr) ${theme.core.space.space600}`
        : `${theme.core.space.space500} minmax(0, 1fr) ${theme.core.space.space500} ${theme.core.space.space600} auto`};
  align-items: center;
  gap: ${({ theme }) => theme.core.space.space100};
  padding: 0 ${({ theme }) => theme.core.space.space100};
  background-color: ${({ $selected, theme }) =>
    $selected
      ? theme.semantic.color.background.primary100
      : theme.semantic.color.background.neutral100};
`

export const Identifier = styled.code<HTMLAttributes<HTMLElement>>`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

export const ActionCell = styled.div`
  display: flex;
  justify-content: flex-end;
` as unknown as FC<HTMLAttributes<HTMLDivElement>>
