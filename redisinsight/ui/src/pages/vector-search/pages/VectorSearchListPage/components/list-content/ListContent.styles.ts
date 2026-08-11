import styled from 'styled-components'
import { Col, Row } from 'uiSrc/components/base/layout/flex'

export const ContentArea = styled(Row)`
  min-height: 0;
  flex: 1;
`

export const TableWrapper = styled(Col)`
  padding: 2px;
  min-width: 0;
`

export const ScrollableWrapper = styled.div`
  height: 100%;
  overflow: auto;
`

export const VectorFieldPicker = styled(Col)`
  position: absolute;
  inset: 0;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.core.space.space100};
`
