import React, { useId, useRef } from 'react'

import { Button } from 'uiSrc/components/base/forms/buttons'
import { Text } from 'uiSrc/components/base/text'

import {
  vectorVisualizerCanvasModes,
  type VectorVisualizerCanvasMode,
  type VectorVisualizerCanvasProps,
  type VectorVisualizerModeTabsProps,
} from './VectorVisualizerCanvas.types'
import * as S from './VectorVisualizerCanvas.styles'

const modeLabels: Record<VectorVisualizerCanvasMode, string> = {
  atlas: 'Atlas',
  neighbors: 'Neighbors',
  selection: 'Selection',
}

const getAdjacentMode = (
  mode: VectorVisualizerCanvasMode,
  direction: 1 | -1,
) => {
  const index = vectorVisualizerCanvasModes.indexOf(mode)
  const nextIndex =
    (index + direction + vectorVisualizerCanvasModes.length) %
    vectorVisualizerCanvasModes.length

  return vectorVisualizerCanvasModes[nextIndex]
}

export const VectorVisualizerModeTabs = ({
  mode,
  onModeChange,
  utilityActions = [],
  idPrefix,
}: VectorVisualizerModeTabsProps) => {
  const generatedId = useId()
  const resolvedIdPrefix = idPrefix ?? `vector-visualizer-${generatedId}`
  const tabListRef = useRef<HTMLDivElement>(null)

  const getTabId = (canvasMode: VectorVisualizerCanvasMode) =>
    `${resolvedIdPrefix}-${canvasMode}-tab`
  const getPanelId = (canvasMode: VectorVisualizerCanvasMode) =>
    `${resolvedIdPrefix}-${canvasMode}-panel`

  const selectMode = (nextMode: VectorVisualizerCanvasMode) => {
    onModeChange(nextMode)
    tabListRef.current
      ?.querySelector<HTMLButtonElement>(
        `[data-vector-visualizer-mode="${nextMode}"]`,
      )
      ?.focus()
  }

  const handleTabKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    currentMode: VectorVisualizerCanvasMode,
  ) => {
    let nextMode: VectorVisualizerCanvasMode | undefined

    if (event.key === 'ArrowRight') nextMode = getAdjacentMode(currentMode, 1)
    if (event.key === 'ArrowLeft') nextMode = getAdjacentMode(currentMode, -1)
    if (event.key === 'Home') nextMode = vectorVisualizerCanvasModes[0]
    if (event.key === 'End') {
      nextMode =
        vectorVisualizerCanvasModes[vectorVisualizerCanvasModes.length - 1]
    }

    if (!nextMode) return

    event.preventDefault()
    selectMode(nextMode)
  }

  return (
    <S.ModeChrome align="center" gap="xs">
      <S.TabList ref={tabListRef} role="tablist">
        {vectorVisualizerCanvasModes.map((canvasMode) => {
          const label = modeLabels[canvasMode]
          const isActive = canvasMode === mode

          return (
            <S.ModeTab
              aria-controls={getPanelId(canvasMode)}
              aria-selected={isActive}
              $isActive={isActive}
              data-vector-visualizer-mode={canvasMode}
              id={getTabId(canvasMode)}
              key={canvasMode}
              role="tab"
              size="s"
              tabIndex={isActive ? 0 : -1}
              variant={isActive ? 'primary' : 'secondary-ghost'}
              onClick={() => selectMode(canvasMode)}
              onKeyDown={(event) => handleTabKeyDown(event, canvasMode)}
            >
              {label}
            </S.ModeTab>
          )
        })}
      </S.TabList>
      {utilityActions.length > 0 && (
        <S.UtilityActions
          align="center"
          aria-label="Visualization actions"
          gap="xs"
          role="group"
        >
          {utilityActions.map((action) => (
            <Button
              disabled={action.disabled}
              key={action.id}
              size="s"
              variant="secondary-ghost"
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
        </S.UtilityActions>
      )}
    </S.ModeChrome>
  )
}

export const VectorVisualizerCanvas = ({
  mode,
  onModeChange,
  views,
  status,
  selectionCount,
  selectedId,
  idPrefix,
  showModeChrome = true,
  state = 'ready',
  utilityActions = [],
  loadingSlot,
  errorSlot,
  stateSlot,
}: VectorVisualizerCanvasProps) => {
  const generatedId = useId()
  const resolvedIdPrefix = idPrefix ?? `vector-visualizer-${generatedId}`

  return (
    <S.Canvas
      aria-label="Vector visualizer visualization"
      data-active-mode={mode}
      data-selected-count={selectionCount}
      data-selected-id={selectedId}
      data-testid="vector-visualizer-visualization"
      data-visualizer-state={state}
      role="region"
    >
      <S.ActiveModeSeam data-testid="vector-visualizer-active-mode-title">
        {modeLabels[mode]}
      </S.ActiveModeSeam>
      {showModeChrome && (
        <S.Chrome gap="s">
          <VectorVisualizerModeTabs
            idPrefix={resolvedIdPrefix}
            mode={mode}
            utilityActions={utilityActions}
            onModeChange={onModeChange}
          />
        </S.Chrome>
      )}
      <S.PlotRegion>
        {state !== 'ready' && (
          <S.StateSlot
            contentCentered
            data-testid="vector-visualizer-state-slot"
            role={state === 'error' ? 'alert' : 'status'}
          >
            {stateSlot ??
              (state === 'loading' ? (
                (loadingSlot ?? <Text>Loading visualization</Text>)
              ) : state === 'error' ? (
                (errorSlot ?? <Text>Unable to render visualization.</Text>)
              ) : (
                <Text>{status}</Text>
              ))}
          </S.StateSlot>
        )}
        {vectorVisualizerCanvasModes.map((canvasMode) => {
          const isActive = canvasMode === mode && state === 'ready'

          return (
            <S.ViewPanel
              aria-hidden={!isActive}
              aria-labelledby={`${resolvedIdPrefix}-${canvasMode}-tab`}
              data-active={isActive}
              hidden={!isActive}
              id={`${resolvedIdPrefix}-${canvasMode}-panel`}
              key={canvasMode}
              role="tabpanel"
              $isActive={isActive}
            >
              <S.ViewContent>{views[canvasMode]}</S.ViewContent>
            </S.ViewPanel>
          )
        })}
      </S.PlotRegion>
    </S.Canvas>
  )
}
