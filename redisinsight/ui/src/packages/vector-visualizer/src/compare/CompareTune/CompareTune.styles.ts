import React from 'react'
import styled from 'styled-components'

export const Panel = styled.section`
  padding: ${({ theme }) => theme.core.space.space150};
  border: ${({ theme }) => theme.core.space.space010} solid
    ${({ theme }) => theme.semantic.color.border.neutral500};
  border-radius: ${({ theme }) => theme.components.card.borderRadius};
  background: ${({ theme }) => theme.semantic.color.background.neutral200};
` as unknown as React.FC<
  React.PropsWithChildren<React.HTMLAttributes<HTMLElement>>
>

export const Code = styled.code`
  font-family: 'Source Code Pro', monospace;
`

export const Plot = styled.svg<React.SVGProps<SVGSVGElement>>`
  width: 100%;
  max-width: 36rem;
  height: auto;
  border: ${({ theme }) => theme.core.space.space010} solid
    ${({ theme }) => theme.semantic.color.border.neutral500};
`
