import type { HTMLAttributes } from 'react'
import styled from 'styled-components'

import { ButtonGroup } from 'uiSrc/components/base/forms/button-group/ButtonGroup'
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

export const TabList = styled(ButtonGroup)<HTMLAttributes<HTMLDivElement>>`
  flex: 1 1 auto;
  min-width: 0;
`

export const ModeTab = styled(ButtonGroup.Button)``

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
