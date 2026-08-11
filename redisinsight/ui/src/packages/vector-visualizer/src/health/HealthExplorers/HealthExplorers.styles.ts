import React from 'react'
import styled from 'styled-components'

export type HealthTileSeverity = 'notice' | 'attention' | 'neutral'

export const EvidencePanel = styled.section`
  padding: ${({ theme }) => theme.core.space.space150};
  border: ${({ theme }) => theme.core.space.space010} solid
    ${({ theme }) => theme.semantic.color.border.neutral500};
  border-radius: ${({ theme }) => theme.components.card.borderRadius};
  background: ${({ theme }) => theme.semantic.color.background.neutral200};
` as unknown as React.FC<
  React.PropsWithChildren<React.HTMLAttributes<HTMLElement>>
>

export const MetricGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
  gap: ${({ theme }) => theme.core.space.space100};
`

export const MetricTile = styled.article<{ $severity: HealthTileSeverity }>`
  padding: ${({ theme }) => theme.core.space.space100};
  border: ${({ theme }) => theme.core.space.space010} solid
    ${({ $severity, theme }) =>
      $severity === 'notice'
        ? theme.semantic.color.border.notice300
        : $severity === 'attention'
          ? theme.semantic.color.text.attention500
          : theme.semantic.color.border.neutral500};
  border-radius: ${({ theme }) => theme.components.card.borderRadius};
  background: ${({ $severity, theme }) =>
    $severity === 'notice'
      ? theme.semantic.color.background.notice100
      : theme.semantic.color.background.neutral100};
` as unknown as React.FC<
  React.PropsWithChildren<
    React.HTMLAttributes<HTMLElement> & { $severity: HealthTileSeverity }
  >
>
