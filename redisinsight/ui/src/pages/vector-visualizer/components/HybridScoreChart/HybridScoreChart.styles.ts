import styled from 'styled-components'

export const ChartFrame = styled.div`
  display: inline-block;
  border: 1px solid ${({ theme }) => theme.semantic.color.border.neutral500};
  background: ${({ theme }) => theme.semantic.color.background.neutral100};
`
