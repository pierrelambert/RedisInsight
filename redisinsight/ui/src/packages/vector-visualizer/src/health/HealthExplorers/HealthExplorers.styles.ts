import React from 'react'
import styled from 'styled-components'

import { Col } from 'uiSrc/components/base/layout/flex'
import { Text, Title } from 'uiSrc/components/base/text'

export type HealthTileSeverity =
  | 'success'
  | 'notice'
  | 'attention'
  | 'danger'
  | 'neutral'

export const EvidencePanel = styled.section`
  flex: 1;
  min-inline-size: 0;
  padding: ${({ theme }) => theme.core.space.space075};
  border: ${({ theme }) => theme.core.space.space010} solid
    ${({ theme }) => theme.semantic.color.border.neutral500};
  border-radius: ${({ theme }) => theme.components.card.borderRadius};
  background: ${({ theme }) => theme.semantic.color.background.neutral200};
` as unknown as React.FC<
  React.PropsWithChildren<React.HTMLAttributes<HTMLElement>>
>

export const MetricGrid = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.core.space.space150};
  min-inline-size: 0;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-gutter: stable;
`

export const MetricTile = styled.article<{ $severity: HealthTileSeverity }>`
  flex: 0 0
    ${({ theme }) =>
      `calc(${theme.core.space.space800} + ${theme.core.space.space600})`};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.core.space.space025};
  min-inline-size: 0;
  padding: ${({ theme }) => theme.core.space.space050};
  border: ${({ theme }) => theme.core.space.space010} solid
    ${({ $severity, theme }) =>
      $severity === 'success'
        ? theme.semantic.color.border.success300
        : $severity === 'notice'
          ? theme.semantic.color.border.notice300
          : $severity === 'attention'
            ? theme.semantic.color.text.attention500
            : $severity === 'danger'
              ? theme.semantic.color.text.danger500
              : theme.semantic.color.border.neutral500};
  border-radius: ${({ theme }) => theme.components.card.borderRadius};
  background: ${({ $severity, theme }) =>
    $severity === 'success'
      ? theme.semantic.color.background.success100
      : $severity === 'notice'
        ? theme.semantic.color.background.notice100
        : $severity === 'attention'
          ? theme.semantic.color.background.attention100
          : $severity === 'danger'
            ? theme.semantic.color.background.danger100
            : theme.semantic.color.background.neutral100};
` as unknown as React.FC<
  React.PropsWithChildren<
    React.HTMLAttributes<HTMLElement> & { $severity: HealthTileSeverity }
  >
>

export const MetricTileHeader = styled(Col)`
  min-inline-size: 0;
`

export const MetricLabel = styled(Text)`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

export const MetricValue = styled(Title)`
  overflow-wrap: anywhere;
  line-height: ${({ theme }) => theme.core.space.space200};
`

export const MetricStatus = styled(Text)`
  overflow-wrap: anywhere;
`

export const MetricFormula = styled.details`
  min-inline-size: 0;

  > summary {
    cursor: pointer;
    color: ${({ theme }) => theme.semantic.color.text.informative600};
    font-size: ${({ theme }) => theme.core.space.space125};
  }
`
