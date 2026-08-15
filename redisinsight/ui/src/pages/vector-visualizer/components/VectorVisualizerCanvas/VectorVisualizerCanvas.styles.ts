import type { HTMLAttributes, RefAttributes } from 'react'
import styled from 'styled-components'

import { Button } from 'uiSrc/components/base/forms/buttons'
import { Col, Row } from 'uiSrc/components/base/layout/flex'

export const Canvas = styled(Col)`
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  height: 100%;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.semantic.color.border.neutral500};
  background-color: ${({ theme }) =>
    theme.semantic.color.background.neutral100};
`

export const ActiveModeSeam = styled.span<HTMLAttributes<HTMLSpanElement>>`
  display: none;
`

export const Chrome = styled(Col)`
  flex: 0 0 auto;
  padding: ${({ theme }) => theme.core.space.space100};
  border-bottom: 1px solid
    ${({ theme }) => theme.semantic.color.border.neutral500};
  background-color: ${({ theme }) =>
    theme.semantic.color.background.neutral100};
`

export const ModeChrome = styled(Row)`
  min-width: 0;
`

export const TabList = styled.div<
  HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>
>`
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  gap: ${({ theme }) => theme.core.space.space025};
`

export const ModeTab = styled(Button)<{ $isActive: boolean }>`
  border-color: ${({ $isActive, theme }) =>
    $isActive
      ? theme.semantic.color.border.informative300
      : theme.semantic.color.border.neutral500};
  background-color: ${({ $isActive, theme }) =>
    $isActive ? theme.semantic.color.background.informative300 : 'transparent'};
  color: ${({ $isActive, theme }) =>
    $isActive
      ? theme.semantic.color.text.primary700
      : theme.semantic.color.text.neutral700};
  box-shadow: ${({ $isActive, theme }) =>
    $isActive
      ? `inset 0 -${theme.core.space.space025} 0 ${theme.semantic.color.border.informative300}`
      : 'none'};
`

export const UtilityActions = styled(Row)`
  flex: 0 0 auto;
  margin-left: auto;
`

export const PlotRegion = styled(Col)`
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
`

export const ViewPanel = styled(Col)<{ $isActive: boolean }>`
  display: ${({ $isActive }) => ($isActive ? 'flex' : 'none')};
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
`

export const ViewContent = styled(Col)`
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  padding: ${({ theme }) => theme.core.space.space100};
`

export const StateSlot = styled(Col)`
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  padding: ${({ theme }) => theme.core.space.space150};
`
