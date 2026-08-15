import styled from 'styled-components'

export const ChartFrame = styled.div`
  display: grid;
  grid-template-columns: minmax(16rem, 1fr) minmax(18rem, 1fr);
  gap: ${({ theme }) => theme.core.space.space100};
  border: 1px solid ${({ theme }) => theme.semantic.color.border.neutral500};
  background: ${({ theme }) => theme.semantic.color.background.neutral100};
  padding: ${({ theme }) => theme.core.space.space100};
`

export const ChartCanvasFrame = styled.div`
  min-inline-size: 0;
  overflow: hidden;
`

export const DocumentList = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.core.space.space050};
  min-inline-size: 0;
  max-block-size: 18rem;
  overflow: auto;
`

export const DocumentRow = styled.div`
  display: grid;
  grid-template-columns: minmax(8rem, 1fr) repeat(3, minmax(5rem, auto));
  gap: ${({ theme }) => theme.core.space.space050};
  align-items: center;
  border-block-end: 1px solid
    ${({ theme }) => theme.semantic.color.border.neutral500};
  padding-block: ${({ theme }) => theme.core.space.space025};
  color: ${({ theme }) => theme.semantic.color.text.neutral600};
  font-size: ${({ theme }) => theme.core.space.space150};
`

export const Unavailable = styled.span`
  color: ${({ theme }) => theme.semantic.color.text.neutral400};
`
