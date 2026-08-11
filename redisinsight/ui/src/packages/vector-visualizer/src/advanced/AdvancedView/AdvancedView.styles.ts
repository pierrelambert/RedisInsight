import styled from 'styled-components'

import { Col } from 'uiSrc/components/base/layout/flex'

export const Shell = styled(Col).attrs({ gap: 'm' })``

export const Panel = styled(Col).attrs({ gap: 's' })`
  padding: ${({ theme }) => theme.core.space.space200};
  border-radius: ${({ theme }) => theme.core.space.space100};
  background: ${({ theme }) => theme.semantic.color.background.neutral100};
`
