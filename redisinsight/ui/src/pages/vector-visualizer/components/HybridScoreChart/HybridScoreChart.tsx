import React, { useEffect, useRef } from 'react'

import * as S from './HybridScoreChart.styles'
import type {
  HybridScoreChartDocument,
  HybridScoreChartProps,
} from './HybridScoreChart.types'

const CHART_WIDTH = 400
const CHART_HEIGHT = 300
const CHART_PADDING = 40
const DOT_RADIUS = 4
const AXIS_COLOR = '#888'
const TITLE_COLOR = '#aaa'
const AXIS_FONT = '11px sans-serif'
const TITLE_FONT = '12px sans-serif'

const SCORE_CHANNELS = [
  { key: 'textScore', label: 'Text', color: '#9ad0ff', y: 75 },
  { key: 'vectorScore', label: 'Vector', color: '#63d8a2', y: 150 },
  { key: 'hybridScore', label: 'Hybrid', color: '#ffb44d', y: 225 },
] as const

const hasScoreEvidence = (document: HybridScoreChartDocument) =>
  SCORE_CHANNELS.some(({ key }) => {
    const value = document[key]
    return value !== undefined && Number.isFinite(value)
  })

const scoreLabel = (value: number | undefined) =>
  value === undefined || !Number.isFinite(value) ? (
    <S.Unavailable>Unavailable</S.Unavailable>
  ) : (
    value.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')
  )

/**
 * Minimal Canvas 2D score-channel plot for FT.HYBRID results. Redis can return
 * text_score, vector_score, and hybrid_score on different rows depending on
 * how the hybrid operator merged its candidates, so every available score
 * channel is plotted instead of requiring complete text/vector pairs.
 */
export const HybridScoreChart: React.FC<HybridScoreChartProps> = ({
  documents,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const scoreDocuments = documents.filter(hasScoreEvidence)
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = CHART_WIDTH * dpr
    canvas.height = CHART_HEIGHT * dpr
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, CHART_WIDTH, CHART_HEIGHT)
    if (!scoreDocuments.length) {
      ctx.fillStyle = TITLE_COLOR
      ctx.font = TITLE_FONT
      ctx.textAlign = 'center'
      ctx.fillText('No Hybrid score channels returned', CHART_WIDTH / 2, 150)
      return
    }

    const plotWidth = CHART_WIDTH - CHART_PADDING * 2
    const scaleX = (value: number, values: number[]) => {
      const minValue = Math.min(...values)
      const maxValue = Math.max(...values)
      return maxValue === minValue
        ? CHART_PADDING + plotWidth / 2
        : CHART_PADDING +
            ((value - minValue) / (maxValue - minValue)) * plotWidth
    }

    ctx.strokeStyle = AXIS_COLOR
    ctx.lineWidth = 1
    ctx.font = AXIS_FONT
    SCORE_CHANNELS.forEach(({ key, label, color, y }) => {
      const values = documents.flatMap((document) => {
        const value = document[key]
        return value === undefined || !Number.isFinite(value) ? [] : [value]
      })
      ctx.strokeStyle = AXIS_COLOR
      ctx.beginPath()
      ctx.moveTo(CHART_PADDING, y)
      ctx.lineTo(CHART_WIDTH - CHART_PADDING, y)
      ctx.stroke()
      ctx.fillStyle = AXIS_COLOR
      ctx.textAlign = 'left'
      ctx.fillText(label, CHART_PADDING, y - 10)
      if (!values.length) {
        ctx.textAlign = 'right'
        ctx.fillText('not returned', CHART_WIDTH - CHART_PADDING, y - 10)
        return
      }
      documents.forEach((document, index) => {
        const value = document[key]
        if (value === undefined || !Number.isFinite(value)) return
        const x = scaleX(value, values)
        const jitter = ((index % 5) - 2) * 3
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(x, y + jitter, DOT_RADIUS, 0, Math.PI * 2)
        ctx.fill()
      })
    })

    ctx.fillStyle = TITLE_COLOR
    ctx.font = TITLE_FONT
    ctx.textAlign = 'center'
    ctx.fillText(
      `Hybrid score channels (${scoreDocuments.length} docs with evidence / ${documents.length} returned)`,
      CHART_WIDTH / 2,
      16,
    )
  }, [documents])

  return (
    <S.ChartFrame>
      <S.ChartCanvasFrame>
        <canvas
          ref={canvasRef}
          width={CHART_WIDTH}
          height={CHART_HEIGHT}
          style={{ width: CHART_WIDTH, height: CHART_HEIGHT }}
          data-testid="hybrid-score-chart"
          data-plotted-document-count={
            documents.filter(hasScoreEvidence).length
          }
        />
      </S.ChartCanvasFrame>
      <S.DocumentList aria-label="Hybrid returned documents">
        <S.DocumentRow>
          <strong>ID</strong>
          <strong>Text</strong>
          <strong>Vector</strong>
          <strong>Hybrid</strong>
        </S.DocumentRow>
        {documents.map((document) => (
          <S.DocumentRow key={document.id}>
            <span>{document.id}</span>
            <span>{scoreLabel(document.textScore)}</span>
            <span>{scoreLabel(document.vectorScore)}</span>
            <span>{scoreLabel(document.hybridScore)}</span>
          </S.DocumentRow>
        ))}
      </S.DocumentList>
    </S.ChartFrame>
  )
}
