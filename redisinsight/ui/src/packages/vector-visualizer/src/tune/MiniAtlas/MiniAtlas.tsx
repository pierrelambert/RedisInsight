import React, { useContext, useEffect, useRef } from 'react'

import { Text } from 'uiSrc/components/base/text'
import { PluginsThemeContext } from 'uiSrc/components/base/utils/pluginsThemeContext'

import { normalizeCoordinates } from '../../renderer/AtlasRenderer'
import * as S from './MiniAtlas.styles'

export interface MiniAtlasProps {
  coordinates: Float32Array | null
  count: number
  width?: number
  height?: number
  label?: string
  quality?: number
  selected?: boolean
  onClick?(): void
}

const DEFAULT_SIZE = 200
const DOT_RADIUS = 3
const CANVAS_PADDING = 8

const renderMiniAtlas = (
  canvas: HTMLCanvasElement,
  coordinates: Float32Array | null,
  count: number,
  width: number,
  height: number,
  color: string,
): void => {
  const context = canvas.getContext('2d')
  if (!context) return
  context.clearRect(0, 0, width, height)
  if (!coordinates || count <= 0 || coordinates.length < count * 2) return

  const normalized = normalizeCoordinates(coordinates.slice(0, count * 2))
  const drawableWidth = Math.max(1, width - CANVAS_PADDING * 2)
  const drawableHeight = Math.max(1, height - CANVAS_PADDING * 2)
  context.fillStyle = color
  for (let index = 0; index < count; index += 1) {
    const x = CANVAS_PADDING + normalized[index * 2] * drawableWidth
    const y = CANVAS_PADDING + (1 - normalized[index * 2 + 1]) * drawableHeight
    context.beginPath()
    context.arc(x, y, DOT_RADIUS, 0, Math.PI * 2)
    context.fill()
  }
}

/** No interaction, no WebGL — a static 2D-canvas thumbnail for comparing layouts at a glance. */
export const MiniAtlas = ({
  coordinates,
  count,
  width = DEFAULT_SIZE,
  height = DEFAULT_SIZE,
  label,
  quality,
  selected = false,
  onClick,
}: MiniAtlasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { theme } = useContext(PluginsThemeContext)
  const hasData = Boolean(coordinates) && count > 0

  useEffect(() => {
    if (!canvasRef.current) return
    renderMiniAtlas(
      canvasRef.current,
      coordinates,
      count,
      width,
      height,
      theme.semantic.color.text.informative400,
    )
  }, [coordinates, count, width, height, theme])

  return (
    <S.Wrapper
      $clickable={Boolean(onClick)}
      $selected={selected}
      aria-label={label ? `MiniAtlas ${label}` : 'MiniAtlas'}
      aria-pressed={onClick ? selected : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onClick()
              }
            }
          : undefined
      }
    >
      <S.CanvasFrame $height={height} $width={width}>
        <canvas height={height} ref={canvasRef} width={width} />
        {!hasData && (
          <S.EmptyState role="status">
            <Text color="subdued" size="XS">
              No layout data
            </Text>
          </S.EmptyState>
        )}
      </S.CanvasFrame>
      {(label !== undefined || quality !== undefined) && (
        <S.Caption>
          {label !== undefined && <Text size="XS">{label}</Text>}
          {quality !== undefined && (
            <Text color="subdued" size="XS">
              {Math.round(quality * 100)}%
            </Text>
          )}
        </S.Caption>
      )}
    </S.Wrapper>
  )
}
