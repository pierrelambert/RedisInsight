import type { HTMLAttributes } from 'react'
import styled from 'styled-components'
import { Button } from 'uiSrc/components/base/forms/buttons'
import { Col, Row } from 'uiSrc/components/base/layout/flex'

export const Controls = styled.aside<HTMLAttributes<HTMLElement>>`
  flex: 1 1 auto;
  min-block-size: 0;
  min-width: 0;
  overflow: auto;
  padding: ${({ theme }) => theme.core.space.space150};
  background: ${({ theme }) => theme.semantic.color.background.neutral100};
  border-right: 1px solid
    ${({ theme }) => theme.semantic.color.border.neutral500};
`

export const Fields = styled(Col)`
  min-width: 0;
`

export const Filters = styled(Row)`
  min-width: 0;
`

export const FilterChip = styled(Button)`
  max-width: 100%;
`

export const Summary = styled.dl<HTMLAttributes<HTMLDListElement>>`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: ${({ theme }) => theme.core.space.space050};
  margin: 0;
  padding-top: ${({ theme }) => theme.core.space.space100};
  border-top: 1px solid ${({ theme }) => theme.semantic.color.border.neutral500};

  dt {
    color: ${({ theme }) => theme.semantic.color.text.neutral500};
  }

  dd {
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`
