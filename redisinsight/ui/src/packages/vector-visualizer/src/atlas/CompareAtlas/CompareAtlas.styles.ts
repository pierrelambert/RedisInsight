import styled from 'styled-components'

import { Col, Row } from 'uiSrc/components/base/layout/flex'

export const CompareRow = styled(Row)`
  flex: 1 1 auto;
  min-block-size: 0;
  gap: ${({ theme }) => theme.core.space.space100};
`

export const PanelSlot = styled(Col)`
  flex: 1 1 50%;
  min-inline-size: 0;
  min-block-size: 0;
`
