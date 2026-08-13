import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'

import { Text, Title } from 'uiSrc/components/base/text'
import { PluginsThemeContext } from 'uiSrc/components/base/utils/pluginsThemeContext'

import {
  AtlasRenderer,
  type AtlasSelectionBox,
  type AtlasPointState,
  type AtlasPointStates,
  type AtlasRendererPalette,
} from '../../renderer/AtlasRenderer'
import type { AtlasTransform } from '../../renderer/interaction'
import { AtlasLegend } from '../AtlasLegend'
import { atlasProvenanceRows } from '../provenance'
import * as S from './Atlas.styles'
import type { AtlasProps } from './Atlas.types'

/** Canvas has no point DOM nodes; callers provide the linked Selection table/inspector. */
export const Atlas = ({
  title = 'Atlas',
  coordinates,
  sampleIds,
  provenance,
  pointStates = {},
  pointColors = {},
  clusterLabels = [],
  interactionMode = 'pan',
  showEvidenceDetails = true,
  selectedIds: controlledSelectedIds,
  legendEntries,
  onLegendEntryClick,
  showMapLabels = false,
  showDensity = false,
  densityGrid,
  densityGridSize,
  onSelectionChange,
  renderAccessibleSelection,
}: AtlasProps) => {
  const canvas = useRef<HTMLCanvasElement>(null)
  const renderer = useRef<AtlasRenderer>()
  const [rendererState, setRendererState] = useState<
    'idle' | 'lost' | 'restored' | 'unsupported'
  >('idle')
  const [uncontrolledSelectedIds, setUncontrolledSelectedIds] = useState<
    string[]
  >([])
  const selectedIds = controlledSelectedIds ?? uncontrolledSelectedIds
  const [hoveredId, setHoveredId] = useState<string>()
  const [selectionBox, setSelectionBox] = useState<AtlasSelectionBox>()
  const [transform, setTransform] = useState<AtlasTransform>({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  })
  const { theme } = useContext(PluginsThemeContext)
  const palette = useMemo<AtlasRendererPalette>(
    () => ({
      default: theme.semantic.color.text.primary600,
      selected: theme.semantic.color.text.informative400,
      liveNeighbor: theme.semantic.color.text.success500,
      outlier: theme.semantic.color.text.attention500,
      duplicate: theme.semantic.color.text.discovery400,
      hovered: theme.semantic.color.text.primary400,
      pointSize: Number.parseFloat(theme.core.space.space100) * 10,
    }),
    [theme],
  )

  useEffect(() => {
    if (!canvas.current) return undefined
    const nextRenderer = new AtlasRenderer(canvas.current, {
      interactionMode,
      onSelect: (ids) => {
        if (controlledSelectedIds === undefined) setUncontrolledSelectedIds(ids)
        onSelectionChange(ids)
      },
      onHover: setHoveredId,
      onSelectionBoxChange: setSelectionBox,
      onTransformChange: setTransform,
      onUnsupported: () => setRendererState('unsupported'),
      onContextLost: () => setRendererState('lost'),
      onContextRestored: () => setRendererState('restored'),
    })
    renderer.current = nextRenderer
    const observer = new ResizeObserver(([entry]) => {
      nextRenderer.resize(entry.contentRect.width, entry.contentRect.height)
    })
    observer.observe(canvas.current)
    return () => {
      observer.disconnect()
      nextRenderer.destroy()
    }
  }, [controlledSelectedIds, interactionMode, onSelectionChange])

  useEffect(() => {
    if (interactionMode !== 'region' || !selectedIds.length)
      setSelectionBox(undefined)
  }, [interactionMode, selectedIds.length])

  useEffect(() => {
    const controlledStates: AtlasPointStates = Object.fromEntries(
      selectedIds.map((id) => [
        id,
        [...(pointStates[id] ?? []), 'selected'] as AtlasPointState[],
      ]),
    )
    renderer.current?.setPoints(
      coordinates,
      sampleIds,
      palette,
      { ...pointStates, ...controlledStates },
      pointColors,
    )
  }, [coordinates, palette, pointColors, pointStates, sampleIds, selectedIds])

  useEffect(() => {
    if (densityGrid && densityGridSize) {
      renderer.current?.setDensityGrid(densityGrid, densityGridSize)
    }
  }, [densityGrid, densityGridSize])

  useEffect(() => {
    renderer.current?.setDensityVisible(showDensity)
  }, [showDensity])

  return (
    <S.Shell>
      <S.Header>
        <Title component="h2" size="M">
          {title}
        </Title>
        <Text color="subdued" size="S">
          {interactionMode === 'region'
            ? `${selectedIds.length} points selected from the displayed sample`
            : `2D UMAP projection · ${sampleIds.length} response-backed sampled records`}
        </Text>
      </S.Header>
      <S.CanvasRow>
        <S.CanvasFrame>
          <S.AtlasCanvas
            aria-label={
              interactionMode === 'region'
                ? 'Selection plot; drag to select a region; use the linked selection table for keyboard navigation'
                : 'Atlas plot; use the linked selection table for keyboard navigation'
            }
            data-colored-point-count={Object.keys(pointColors).length}
            data-point-count={sampleIds.length}
            data-point-palette={JSON.stringify(palette)}
            data-selection-mode={interactionMode}
            ref={canvas}
            tabIndex={0}
          />
          <S.HorizontalAxis aria-hidden="true">
            UMAP 1 · derived coordinate
          </S.HorizontalAxis>
          <S.VerticalAxis aria-hidden="true">
            UMAP 2 · derived coordinate
          </S.VerticalAxis>
          {showMapLabels &&
            clusterLabels.map((clusterLabel) => (
              <S.ClusterLabel
                $offsetX={transform.offsetX}
                $offsetY={transform.offsetY}
                $scale={transform.scale}
                $x={clusterLabel.x}
                $y={clusterLabel.y}
                aria-label={`${clusterLabel.label} cluster label`}
                data-cluster-count={clusterLabel.count}
                key={clusterLabel.id}
                title={`${clusterLabel.label}: ${clusterLabel.count.toLocaleString()} sampled records`}
              >
                {clusterLabel.label}
              </S.ClusterLabel>
            ))}
          {selectionBox && (
            <S.SelectionOverlay
              $height={selectionBox.height}
              $width={selectionBox.width}
              $x={selectionBox.x}
              $y={selectionBox.y}
              aria-label="Selected region bounds"
              data-selected-count={selectedIds.length}
              role="img"
            />
          )}
        </S.CanvasFrame>
        {legendEntries && legendEntries.length > 0 && (
          <AtlasLegend
            entries={legendEntries}
            onEntryClick={onLegendEntryClick}
          />
        )}
      </S.CanvasRow>
      {rendererState === 'lost' && (
        <Text color="danger" role="status">
          The WebGL2 context was lost. Waiting to restore the Atlas.
        </Text>
      )}
      {rendererState === 'restored' && (
        <Text role="status">The WebGL2 context was restored.</Text>
      )}
      <S.Footer color="subdued" size="XS">
        {interactionMode === 'region'
          ? 'Drag to select a region · ring selected · the inspector follows the selected set'
          : 'Circle sampled point · ring selected · diamond live neighbor · triangle outlier · square duplicate'}
      </S.Footer>
      {rendererState === 'unsupported' && (
        <Text color="danger" role="status">
          WebGL2 is unavailable. Use the linked selection table to inspect
          sampled records.
        </Text>
      )}
      {showEvidenceDetails && (
        <details>
          <summary>Atlas evidence and accessible point selection</summary>
          <dl>
            {atlasProvenanceRows(provenance).map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          {Object.entries(pointStates)
            .filter(([, states]) => states?.length)
            .map(([id, states]) => (
              <Text key={id} color="subdued">
                {id}: {states?.join(', ')}
              </Text>
            ))}
          {renderAccessibleSelection?.(selectedIds, hoveredId, pointStates)}
        </details>
      )}
    </S.Shell>
  )
}
