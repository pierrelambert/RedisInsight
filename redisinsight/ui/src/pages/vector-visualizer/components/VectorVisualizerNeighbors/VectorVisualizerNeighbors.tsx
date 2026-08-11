import React, { useContext, useMemo } from 'react'

import { Button } from 'uiSrc/components/base/forms/buttons'
import { Col } from 'uiSrc/components/base/layout/flex'
import { Text, Title } from 'uiSrc/components/base/text'
import { PluginsThemeContext } from 'uiSrc/components/base/utils/pluginsThemeContext'

import type {
  VectorVisualizerNeighborRecord,
  VectorVisualizerNeighborsProps,
} from './VectorVisualizerNeighbors.types'
import * as S from './VectorVisualizerNeighbors.styles'

const GOLDEN_ANGLE_DEGREES = 137.5
const MINIMUM_POINT_RADIUS_PERCENT = 7
const MAXIMUM_POINT_RADIUS_X_PERCENT = 46
const MAXIMUM_POINT_RADIUS_Y_PERCENT = 42
const RING_FRACTIONS = [0.25, 0.5, 0.75] as const
const RING_RADII_PERCENT = [18, 32, 46] as const

const exactnessLabel: Record<
  VectorVisualizerNeighborsProps['exactness'],
  string
> = {
  exact: 'Exact result',
  approximate: 'Approximate result',
  'sample-exact': 'Sample exact result',
  unknown: 'Exactness unavailable',
}

const stateCopy: Record<VectorVisualizerNeighborsProps['status'], string> = {
  'source-not-selected': 'Select a vector data source.',
  discovering: 'Discovering source capabilities.',
  'ready-not-sampled': 'Select a sampled point, then run its neighbor query.',
  ready: 'Neighbor evidence is ready.',
  fetching: 'Fetching bounded neighbor evidence.',
  layouting: 'Preparing the radial neighbor view.',
  partial: 'Partial neighbor evidence is available.',
  stale: 'Neighbor evidence is stale or changed while sampled.',
  empty: 'No neighbors matched this query.',
  unsupported: 'This source cannot provide neighbor evidence.',
  'acl-unavailable': 'Redis ACLs do not allow neighbor evidence.',
  cancelled: 'Neighbor retrieval was cancelled.',
  'recoverable-error': 'Neighbor evidence could not be loaded. Retry.',
  'fatal-error': 'The neighbor view could not render this result.',
}

const readyStatuses = new Set<VectorVisualizerNeighborsProps['status']>([
  'ready',
  'partial',
  'stale',
])

const metricLabel = (metric: 'similarity' | 'distance' | 'score') =>
  metric === 'similarity'
    ? 'Similarity'
    : metric === 'distance'
      ? 'Distance'
      : 'Returned score'

const metricPresentation = (
  metric: 'similarity' | 'distance' | 'score',
  value: number,
) => {
  const rawValue = value.toFixed(2)

  if (metric === 'distance') {
    const similarity = (1 - value).toFixed(2)

    return {
      accessibleLabel: `Similarity: ${similarity}, Raw distance: ${rawValue}`,
      primaryLabel: 'Similarity',
      primaryValue: similarity,
      rawDistance: rawValue,
      title: `Similarity: ${similarity} · Raw distance: ${rawValue}`,
    }
  }

  return {
    accessibleLabel: `${metricLabel(metric)}: ${rawValue}`,
    primaryLabel: metricLabel(metric),
    primaryValue: rawValue,
    rawDistance: undefined,
    title: `${metricLabel(metric)}: ${rawValue}`,
  }
}

const buildPointColorEncoding = (
  records: VectorVisualizerNeighborRecord[],
  metadataField: string,
  palette: string[],
  visibleIds: Set<string>,
) => {
  const values = [
    ...new Set(
      records.flatMap(({ id, metadata }) => {
        if (!visibleIds.has(id)) return []
        const value = metadata?.[metadataField]
        return value === undefined || value === '' ? [] : [String(value)]
      }),
    ),
  ].sort()
  const colors = new Map(
    values.map((value, index) => [value, palette[index % palette.length]]),
  )

  return {
    legend: values.map((value) => ({ color: colors.get(value)!, value })),
    pointColors: Object.fromEntries(
      records.flatMap(({ id, metadata }) => {
        const value = metadata?.[metadataField]
        const color =
          value === undefined ? undefined : colors.get(String(value))
        return color ? [[id, color]] : []
      }),
    ),
  }
}

export const VectorVisualizerNeighbors = ({
  anchorId,
  canRun,
  exactness,
  freshness,
  metadataField,
  neighbors,
  onRun,
  onSelect,
  records,
  selectedIds,
  status,
  topKBoundary,
}: VectorVisualizerNeighborsProps) => {
  const { theme } = useContext(PluginsThemeContext)
  const radialNeighbors = neighbors.filter(({ id }) => id !== anchorId)
  const metric = neighbors[0]?.metric ?? 'distance'
  const finiteValues = radialNeighbors
    .map(({ value }) => value)
    .filter(Number.isFinite)
  const minimumValue = finiteValues.length ? Math.min(...finiteValues) : 0
  const maximumValue = finiteValues.length ? Math.max(...finiteValues) : 1
  const valueRange = maximumValue - minimumValue
  const colorEncoding = useMemo(
    () =>
      buildPointColorEncoding(
        records,
        metadataField,
        [
          theme.semantic.color.text.informative400,
          theme.semantic.color.text.success500,
          theme.semantic.color.text.attention500,
          theme.semantic.color.text.discovery400,
          theme.semantic.color.text.primary400,
        ],
        new Set(radialNeighbors.map(({ id }) => id)),
      ),
    [metadataField, radialNeighbors, records, theme],
  )
  const isReady = readyStatuses.has(status) && radialNeighbors.length > 0

  const progressFor = (value: number, rank: number) => {
    const fallbackProgress =
      radialNeighbors.length > 1
        ? (rank - 1) / (radialNeighbors.length - 1)
        : 0.5
    const valueProgress =
      valueRange > 0
        ? metric === 'distance'
          ? (value - minimumValue) / valueRange
          : (maximumValue - value) / valueRange
        : fallbackProgress
    return Math.max(0, Math.min(1, valueProgress))
  }

  const valueForRing = (fraction: number) =>
    metric === 'distance'
      ? minimumValue + fraction * valueRange
      : maximumValue - fraction * valueRange

  return (
    <S.Shell data-testid="vector-visualizer-neighbors" gap="s">
      <S.Header align="center" gap="m" justify="between">
        <Col gap="xs">
          <Title component="h2" size="M">
            {anchorId ? `Neighbors of ${anchorId}` : 'Neighbors'}
          </Title>
          <Text color="subdued" size="XS">
            {metric === 'distance'
              ? 'Similarity (1 - raw distance)'
              : metricLabel(metric)}{' '}
            preserves response order · angle is layout only ·{' '}
            {exactnessLabel[exactness]} · {freshness}
          </Text>
        </Col>
        <Button
          disabled={!canRun || status === 'fetching'}
          size="s"
          onClick={onRun}
        >
          Run selected anchor query
        </Button>
      </S.Header>

      <S.Plot
        aria-label="Query-centered radial neighbor layout"
        data-colored-point-count={
          radialNeighbors.filter(({ id }) => colorEncoding.pointColors[id])
            .length
        }
        data-layout="full-workspace-metric-radial"
        data-neighbor-count={radialNeighbors.length}
        data-result-boundary={topKBoundary}
      >
        {isReady ? (
          <S.RadialField data-testid="vector-visualizer-neighbors-radial-field">
            <S.RingField>
              {RING_FRACTIONS.map((fraction, index) => {
                const radius = RING_RADII_PERCENT[index]
                const rawValue = valueForRing(fraction)
                const presentation = metricPresentation(metric, rawValue)
                return (
                  <React.Fragment key={fraction}>
                    <S.ScaleRing
                      aria-label={`${presentation.primaryLabel} metric threshold ring ${presentation.primaryValue}${presentation.rawDistance ? `; raw distance ${presentation.rawDistance}` : ''}`}
                      data-ring-value={presentation.primaryValue}
                      data-raw-distance={presentation.rawDistance}
                      title={presentation.title}
                      $radius={radius}
                    />
                    <S.RingLabel aria-hidden="true" $radius={radius}>
                      {presentation.primaryValue}
                    </S.RingLabel>
                  </React.Fragment>
                )
              })}
              <S.QueryAnchor
                aria-label={
                  anchorId ? `Select query anchor ${anchorId}` : 'Query anchor'
                }
                aria-pressed={Boolean(
                  anchorId && selectedIds.includes(anchorId),
                )}
                title={anchorId}
                type="button"
                $selected={Boolean(anchorId && selectedIds.includes(anchorId))}
                onClick={() => {
                  if (anchorId) onSelect(anchorId)
                }}
              />
            </S.RingField>
            {radialNeighbors.map((neighbor, index) => {
              const angle =
                (neighbor.rank * GOLDEN_ANGLE_DEGREES * Math.PI) / 180
              const progress = progressFor(neighbor.value, index + 1)
              const radiusX =
                MINIMUM_POINT_RADIUS_PERCENT +
                progress *
                  (MAXIMUM_POINT_RADIUS_X_PERCENT -
                    MINIMUM_POINT_RADIUS_PERCENT)
              const radiusY =
                MINIMUM_POINT_RADIUS_PERCENT +
                progress *
                  (MAXIMUM_POINT_RADIUS_Y_PERCENT -
                    MINIMUM_POINT_RADIUS_PERCENT)
              const x = 50 + Math.cos(angle) * radiusX
              const y = 50 + Math.sin(angle) * radiusY
              const presentation = metricPresentation(
                neighbor.metric,
                neighbor.value,
              )

              return (
                <S.NeighborPoint
                  aria-label={`Select ${neighbor.id}, ${presentation.accessibleLabel}`}
                  aria-pressed={selectedIds.includes(neighbor.id)}
                  key={neighbor.id}
                  title={presentation.title}
                  type="button"
                  $color={
                    colorEncoding.pointColors[neighbor.id] ??
                    theme.semantic.color.text.informative400
                  }
                  $selected={selectedIds.includes(neighbor.id)}
                  $x={x}
                  $y={y}
                  onClick={() => onSelect(neighbor.id)}
                />
              )
            })}
            {colorEncoding.legend.length > 0 && (
              <S.Legend aria-label="Neighbor color legend">
                {colorEncoding.legend.map(({ color, value }) => (
                  <S.LegendItem key={value}>
                    <S.LegendSwatch aria-hidden="true" $color={color} />
                    {value}
                  </S.LegendItem>
                ))}
              </S.Legend>
            )}
          </S.RadialField>
        ) : (
          <S.State gap="s" role="status">
            <Title component="h3" size="S">
              Neighbor evidence
            </Title>
            <Text color="subdued">{stateCopy[status]}</Text>
          </S.State>
        )}
      </S.Plot>
    </S.Shell>
  )
}
