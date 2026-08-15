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

// Blue color ramp bounds used to encode hybrid_score intensity per dot.
const RAMP_RED_BASE = 30
const RAMP_RED_RANGE = 100
const RAMP_GREEN_BASE = 60
const RAMP_GREEN_RANGE = 100
const RAMP_BLUE_BASE = 180
const RAMP_BLUE_RANGE = 75

const isPlottable = (
  document: HybridScoreChartDocument,
): document is HybridScoreChartDocument & {
  textScore: number
  vectorScore: number
} =>
  document.textScore !== undefined &&
  Number.isFinite(document.textScore) &&
  document.vectorScore !== undefined &&
  Number.isFinite(document.vectorScore)

const scoreLabel = (value: number | undefined) =>
  value === undefined || !Number.isFinite(value) ? (
    <S.Unavailable>Unavailable</S.Unavailable>
  ) : (
    value.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')
  )

/**
 * Minimal Canvas 2D scatter chart plotting FT.HYBRID results: text_score on
 * the x-axis, vector_score on the y-axis, and hybrid_score encoded as dot
 * color intensity. No external charting library is used.
 */
export const HybridScoreChart: React.FC<HybridScoreChartProps> = ({
  documents,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const plottableDocuments = documents.filter(isPlottable)
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = CHART_WIDTH * dpr
    canvas.height = CHART_HEIGHT * dpr
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, CHART_WIDTH, CHART_HEIGHT)
    if (!plottableDocuments.length) {
      ctx.fillStyle = TITLE_COLOR
      ctx.font = TITLE_FONT
      ctx.textAlign = 'center'
      ctx.fillText('No complete text/vector score pairs', CHART_WIDTH / 2, 150)
      return
    }

    const textScores = plottableDocuments.map((doc) => doc.textScore)
    const vectorScores = plottableDocuments.map((doc) => doc.vectorScore)
    const hybridScores = plottableDocuments.flatMap((doc) =>
      doc.hybridScore === undefined ? [] : [doc.hybridScore],
    )
    const minText = Math.min(...textScores)
    const maxText = Math.max(...textScores)
    const minVector = Math.min(...vectorScores)
    const maxVector = Math.max(...vectorScores)
    const minHybrid = hybridScores.length ? Math.min(...hybridScores) : 0
    const maxHybrid = hybridScores.length ? Math.max(...hybridScores) : 0

    const plotWidth = CHART_WIDTH - CHART_PADDING * 2
    const plotHeight = CHART_HEIGHT - CHART_PADDING * 2

    const scaleX = (value: number) =>
      maxText === minText
        ? CHART_PADDING + plotWidth / 2
        : CHART_PADDING + ((value - minText) / (maxText - minText)) * plotWidth

    const scaleY = (value: number) =>
      maxVector === minVector
        ? CHART_PADDING + plotHeight / 2
        : CHART_PADDING +
          plotHeight -
          ((value - minVector) / (maxVector - minVector)) * plotHeight

    ctx.strokeStyle = AXIS_COLOR
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(CHART_PADDING, CHART_PADDING)
    ctx.lineTo(CHART_PADDING, CHART_HEIGHT - CHART_PADDING)
    ctx.lineTo(CHART_WIDTH - CHART_PADDING, CHART_HEIGHT - CHART_PADDING)
    ctx.stroke()

    ctx.fillStyle = AXIS_COLOR
    ctx.font = AXIS_FONT
    ctx.textAlign = 'center'
    ctx.fillText('text_score', CHART_WIDTH / 2, CHART_HEIGHT - 8)
    ctx.save()
    ctx.translate(12, CHART_HEIGHT / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText('vector_score', 0, 0)
    ctx.restore()

    plottableDocuments.forEach((doc) => {
      const x = scaleX(doc.textScore)
      const y = scaleY(doc.vectorScore)
      const intensity =
        doc.hybridScore === undefined || maxHybrid === minHybrid
          ? 0.5
          : (doc.hybridScore - minHybrid) / (maxHybrid - minHybrid)
      const red = Math.round(RAMP_RED_BASE + (1 - intensity) * RAMP_RED_RANGE)
      const green = Math.round(
        RAMP_GREEN_BASE + (1 - intensity) * RAMP_GREEN_RANGE,
      )
      const blue = Math.round(RAMP_BLUE_BASE + intensity * RAMP_BLUE_RANGE)
      ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`
      ctx.beginPath()
      ctx.arc(x, y, DOT_RADIUS, 0, Math.PI * 2)
      ctx.fill()
    })

    ctx.fillStyle = TITLE_COLOR
    ctx.font = TITLE_FONT
    ctx.textAlign = 'center'
    ctx.fillText(
      `Hybrid scores (${plottableDocuments.length} plotted / ${documents.length} docs)`,
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
