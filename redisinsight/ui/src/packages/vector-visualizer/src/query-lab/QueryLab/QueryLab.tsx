import React, { useMemo, useState } from 'react'

import { RiBadge } from 'uiSrc/components/base/display/badge/RiBadge'
import { Col, Row } from 'uiSrc/components/base/layout/flex'
import { Text, Title } from 'uiSrc/components/base/text'

import { SelectionInspector } from '../../selection/SelectionInspector'
import { SelectionTable } from '../../selection/SelectionTable'
import type { QueryLabNeighbor, QueryLabProps } from './QueryLab.types'
import {
  buildDistributionBins,
  buildRankGaps,
  largestRankGap,
} from './queryLabEvidence'
import * as S from './QueryLab.styles'

const stateCopy: Record<QueryLabProps['status'], string> = {
  'source-not-selected': 'Select a vector data source.',
  discovering: 'Discovering source capabilities.',
  'ready-not-sampled': 'Ready to collect bounded read-only evidence.',
  ready: 'Query results are ready.',
  fetching: 'Fetching bounded query evidence.',
  layouting: 'Preparing linked query views.',
  partial: 'Partial query evidence is available.',
  stale: 'Results are stale or changed while sampled.',
  empty: 'No results matched this query.',
  unsupported: 'This source cannot provide Query Lab evidence.',
  'acl-unavailable': 'Redis ACLs do not allow this evidence.',
  cancelled: 'Query retrieval was cancelled.',
  'recoverable-error': 'Query evidence could not be loaded. Retry.',
  'fatal-error': 'Query Lab could not render this result.',
}

const READY_EVIDENCE_STATUSES = new Set<QueryLabProps['status']>([
  'ready',
  'partial',
  'stale',
])
const GOLDEN_ANGLE_DEGREES = 137.5
const RADIAL_PLOT_PERCENT = 42

const exactnessLabel: Record<QueryLabProps['exactness'], string> = {
  exact: 'Exact result',
  approximate: 'Approximate result',
  'sample-exact': 'Sample exact result',
  unknown: 'Exactness unavailable',
}

const profileTitle = (profile: QueryLabProps['profile']) =>
  profile.kind === 'full'
    ? 'Measured Search profile'
    : profile.kind === 'reduced'
      ? 'Reduced Vector Set profile'
      : 'Profile unavailable'

const metricValueLabel = (metric: 'similarity' | 'distance' | 'score') =>
  metric === 'similarity'
    ? 'Similarity score'
    : metric === 'distance'
      ? 'Distance'
      : 'Returned source score'

const radialScale = (
  metric: 'similarity' | 'distance' | 'score',
  value: number,
) => {
  const normalized =
    metric === 'distance' ? 1 / (1 + value) : Math.max(0, Math.min(1, value))

  return Math.max(0.25, Math.min(1, normalized))
}

const radialDistance = (
  metric: 'similarity' | 'distance' | 'score',
  value: number,
) => 1 - radialScale(metric, value)

const radialPosition = (
  metric: QueryLabNeighbor['metric'],
  rank: number,
  value: number,
) => {
  const angle = (rank * GOLDEN_ANGLE_DEGREES * Math.PI) / 180
  const distance = radialDistance(metric, value) * RADIAL_PLOT_PERCENT

  return {
    x: 50 + Math.cos(angle) * distance,
    y: 50 + Math.sin(angle) * distance,
  }
}

const thresholdOperator = (operator: 'gte' | 'lte') =>
  operator === 'gte' ? '≥' : '≤'

export const QueryLab = ({
  exactness,
  freshness,
  neighbors,
  profile,
  sourceKind,
  status,
  selectedIds: controlledSelectedIds,
  focusedId: controlledFocusedId,
  onSelectionChange,
  onFocusChange,
  sourceSample,
  threshold,
  topKBoundary,
}: QueryLabProps) => {
  const [uncontrolledSelectedIds, setUncontrolledSelectedIds] = useState<
    string[]
  >([])
  const [uncontrolledFocusedId, setUncontrolledFocusedId] = useState<string>()
  const selectedIds = controlledSelectedIds ?? uncontrolledSelectedIds
  const focusedId = controlledFocusedId ?? uncontrolledFocusedId
  const selectionRows = useMemo(() => {
    const selected = new Set(selectedIds)
    return neighbors.map((neighbor) => ({
      ...neighbor,
      selected: selected.has(neighbor.id),
    }))
  }, [neighbors, selectedIds])
  const focusedRow = selectionRows.find(({ id }) => id === focusedId)

  const selectMany = (ids: string[], focusId = ids[0]) => {
    if (!ids.length || !focusId) return
    if (controlledSelectedIds === undefined) setUncontrolledSelectedIds(ids)
    if (controlledFocusedId === undefined) setUncontrolledFocusedId(focusId)
    onSelectionChange?.(ids)
    onFocusChange?.(focusId)
  }

  const select = (id: string) => selectMany([id])

  const selectFromKeyboard = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    ids: string[],
    focusId = ids[0],
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      selectMany(ids, focusId)
    }
  }

  const metricLabel = metricValueLabel(neighbors[0]?.metric ?? 'similarity')
  const isEvidenceReady = READY_EVIDENCE_STATUSES.has(status)
  const responseProvenance = Array.from(
    new Set(
      neighbors.flatMap(({ provenance }) => (provenance ? [provenance] : [])),
    ),
  ).join(', ')
  const distributionBins = useMemo(
    () => buildDistributionBins(neighbors, sourceSample),
    [neighbors, sourceSample],
  )
  const rankGaps = useMemo(() => buildRankGaps(neighbors), [neighbors])
  const largestGap = largestRankGap(rankGaps)
  const metric = neighbors[0]?.metric ?? 'similarity'
  const thresholdRingRadius = threshold
    ? radialDistance(metric, threshold.value)
    : undefined
  const topKRingRadius = useMemo(() => {
    if (topKBoundary === undefined) return undefined
    const topKNeighbors = neighbors.filter(
      ({ rank, value }) => rank <= topKBoundary && Number.isFinite(value),
    )
    if (!topKNeighbors.length) return undefined
    return Math.max(
      ...topKNeighbors.map(({ metric: itemMetric, value }) =>
        radialDistance(itemMetric, value),
      ),
    )
  }, [neighbors, topKBoundary])

  return (
    <S.Shell gap="m">
      <S.Header align="center" gap="m" justify="between">
        <Col gap="xs">
          <Text color="subdued" size="XS">
            Query Lab
          </Text>
          <Title component="h2" size="M">
            Retrieval debugger
          </Title>
        </Col>
        <RiBadge variant="light">
          {sourceKind === 'search-index' ? 'Search index' : 'Vector Set'}
        </RiBadge>
      </S.Header>
      <Text aria-live="polite" role="status">
        {focusedId ? `Selected ${focusedId}` : stateCopy[status]}
      </Text>
      {isEvidenceReady ? (
        <S.Workspace
          data-layout="desktop-evidence-inspector"
          data-testid="query-lab-workspace"
        >
          <S.EvidencePanel
            as="section"
            aria-labelledby="response-evidence-heading"
          >
            <Title component="h3" id="response-evidence-heading" size="S">
              Response evidence
            </Title>
            <Text color="subdued" size="XS">
              {responseProvenance
                ? `Response-backed ${responseProvenance} results`
                : 'Response-backed command results'}
            </Text>
            <S.EvidenceScrollport
              aria-label="Response evidence scrollable content"
              data-testid="query-lab-evidence-scrollport"
              tabIndex={0}
            >
              <S.Section as="section" aria-labelledby="neighbors-heading">
                <Title component="h4" id="neighbors-heading" size="XS">
                  Neighbors
                </Title>
                <Text size="S">{metricLabel}</Text>
                <Text color="subdued" size="XS">
                  Distance from the query anchor is metric-monotonic.
                </Text>
                <Text color="subdued" size="XS">
                  Angle: layout only
                </Text>
                <Text color="subdued" size="XS">
                  {exactnessLabel[exactness]}
                </Text>
                <Text color="subdued" size="XS">
                  Freshness: {freshness}
                </Text>
                <S.RadialPlot aria-label="Query-centered radial neighbor layout">
                  {threshold && thresholdRingRadius !== undefined && (
                    <S.EvidenceRing
                      aria-label={`${threshold.label} ring`}
                      data-ring-radius={thresholdRingRadius.toFixed(4)}
                      $radius={thresholdRingRadius}
                    />
                  )}
                  {topKBoundary !== undefined &&
                    topKRingRadius !== undefined && (
                      <S.EvidenceRing
                        aria-label={`Top-${topKBoundary} result boundary ring`}
                        data-ring-radius={topKRingRadius.toFixed(4)}
                        $radius={topKRingRadius}
                      />
                    )}
                  <S.QueryAnchor aria-label="Query anchor">Query</S.QueryAnchor>
                  {neighbors.map((neighbor) => {
                    const position = radialPosition(
                      neighbor.metric,
                      neighbor.rank,
                      neighbor.value,
                    )

                    return (
                      <S.NeighborButton
                        aria-label={`Select ${neighbor.id}`}
                        aria-pressed={selectedIds.includes(neighbor.id)}
                        key={neighbor.id}
                        title={`${metricValueLabel(neighbor.metric)}: ${neighbor.value.toFixed(2)}`}
                        type="button"
                        $selected={selectedIds.includes(neighbor.id)}
                        $x={position.x}
                        $y={position.y}
                        onClick={() => select(neighbor.id)}
                        onKeyDown={(event) =>
                          selectFromKeyboard(event, [neighbor.id])
                        }
                      >
                        {neighbor.rank}
                      </S.NeighborButton>
                    )
                  })}
                </S.RadialPlot>
                <Col gap="xs">
                  {threshold ? (
                    <Text size="XS">
                      {threshold.label} {thresholdOperator(threshold.operator)}{' '}
                      {threshold.value.toFixed(2)} · {threshold.provenance}
                    </Text>
                  ) : (
                    <Text color="subdued" size="XS">
                      Metric threshold ring unavailable: no response-backed
                      threshold.
                    </Text>
                  )}
                  {topKBoundary !== undefined ? (
                    <Text size="XS">Top-{topKBoundary} result boundary</Text>
                  ) : (
                    <Text color="subdued" size="XS">
                      Top-k boundary ring unavailable: query k was not supplied.
                    </Text>
                  )}
                </Col>
              </S.Section>
              <S.EvidenceDetails>
                <S.Section as="section" aria-labelledby="distribution-heading">
                  <Title component="h3" id="distribution-heading" size="XS">
                    Result / source sample distribution
                  </Title>
                  <Text color="subdued" size="XS">
                    Score/distance axis · bounded query result sample ·
                    Freshness: {freshness}
                  </Text>
                  <Text>{metricLabel}</Text>
                  <Text>
                    {threshold
                      ? `${threshold.label}: ${thresholdOperator(threshold.operator)} ${threshold.value.toFixed(2)}`
                      : 'Threshold: Unavailable'}
                  </Text>
                  <Col gap="xs">
                    <Text color="subdued" size="XS">
                      {sourceSample
                        ? `${sourceSample.completeness === 'partial' ? 'Partial bounded' : 'Bounded'} source sample: ${sourceSample.values.filter(Number.isFinite).length} values · ${sourceSample.provenance}`
                        : 'Unavailable: bounded source-sample distribution facts were not returned.'}
                    </Text>
                    {distributionBins.map((bin) => (
                      <S.WaterfallRow
                        aria-label={`Distribution bin ${bin.index + 1}, ${bin.start.toFixed(2)} to ${bin.end.toFixed(2)}, result count ${bin.resultIds.length}, ${sourceSample ? `${sourceSample.completeness} source count ${bin.sourceCount ?? 0}` : 'source count unavailable'}`}
                        aria-pressed={bin.resultIds.some((id) =>
                          selectedIds.includes(id),
                        )}
                        disabled={!bin.resultIds.length}
                        key={`${bin.start}-${bin.end}`}
                        type="button"
                        $selected={bin.resultIds.some((id) =>
                          selectedIds.includes(id),
                        )}
                        onClick={() => selectMany(bin.resultIds)}
                      >
                        {bin.start.toFixed(2)}–{bin.end.toFixed(2)} · results{' '}
                        {bin.resultIds.length} · source{' '}
                        {bin.sourceCount ?? 'Unavailable'}
                      </S.WaterfallRow>
                    ))}
                  </Col>
                  <Title component="h3" size="XS">
                    Ordered adjacent rank gaps
                  </Title>
                  {largestGap ? (
                    <Text size="XS">
                      Largest observed adjacent gap: {largestGap.gap.toFixed(2)}{' '}
                      after rank {largestGap.afterRank} (descriptive only)
                    </Text>
                  ) : (
                    <Text color="subdued" size="XS">
                      Unavailable: at least two finite returned values are
                      required.
                    </Text>
                  )}
                  <Col gap="xs">
                    {rankGaps.map((gap) => (
                      <S.WaterfallRow
                        aria-label={`Select ${gap.afterId} from rank gaps`}
                        aria-pressed={selectedIds.includes(gap.afterId)}
                        key={`${gap.afterId}-${gap.beforeId}`}
                        type="button"
                        $selected={selectedIds.includes(gap.afterId)}
                        onClick={() =>
                          selectMany([gap.afterId, gap.beforeId], gap.afterId)
                        }
                        onKeyDown={(event) =>
                          selectFromKeyboard(
                            event,
                            [gap.afterId, gap.beforeId],
                            gap.afterId,
                          )
                        }
                      >
                        Rank {gap.afterRank} → {gap.beforeRank} ·{' '}
                        {gap.value.toFixed(2)} → {gap.nextValue.toFixed(2)} ·
                        gap {gap.gap.toFixed(2)}
                      </S.WaterfallRow>
                    ))}
                  </Col>
                </S.Section>
              </S.EvidenceDetails>
            </S.EvidenceScrollport>
          </S.EvidencePanel>
          <S.InspectorPanel
            as="aside"
            aria-labelledby="returned-results-heading"
          >
            <Title component="h3" id="returned-results-heading" size="S">
              Returned results
            </Title>
            <Text color="subdued" size="XS">
              {responseProvenance
                ? `Response-backed ${responseProvenance} results`
                : 'Response-backed command results'}
            </Text>
            <S.Section as="section" aria-labelledby="selection-heading">
              <Title component="h4" id="selection-heading" size="XS">
                Selection
              </Title>
              <SelectionTable
                focusedId={focusedId}
                rows={selectionRows}
                variant="compact"
                onFocus={select}
              />
            </S.Section>
            <SelectionInspector
              exactness={exactness}
              provenance={
                focusedRow?.id
                  ? neighbors.find(({ id }) => id === focusedRow.id)?.provenance
                  : undefined
              }
              row={focusedRow}
            />
            <S.Section as="section" aria-labelledby="profile-heading">
              <Title component="h4" id="profile-heading" size="XS">
                {profileTitle(profile)}
              </Title>
              {profile.kind === 'reduced' && (
                <Text color="subdued" size="S">
                  VSIM inputs and results only
                </Text>
              )}
              {profile.kind === 'full' && (
                <Text color="subdued" size="S">
                  {profile.stages?.length
                    ? 'Returned iterator stages'
                    : 'Iterator stages unavailable'}
                </Text>
              )}
              {Object.entries(profile.facts).map(([name, value]) => (
                <Row gap="s" justify="between" key={name}>
                  <Text size="S">{name}</Text>
                  <Text size="S">{value ?? 'Unavailable'}</Text>
                </Row>
              ))}
              {profile.stages?.map((stage) => (
                <Text
                  key={`${stage.name}-${stage.count ?? ''}-${stage.mode ?? ''}`}
                  size="S"
                >
                  {stage.name} · count: {stage.count ?? 'Unavailable'} · mode:{' '}
                  {stage.mode ?? 'Unavailable'}
                </Text>
              ))}
            </S.Section>
          </S.InspectorPanel>
        </S.Workspace>
      ) : (
        <S.StatePanel
          aria-label="Query Lab state"
          data-testid={`query-lab-state-${status}`}
        >
          <Text color="subdued" size="XS">
            Query Lab status
          </Text>
          <Title component="h3" size="S">
            Evidence unavailable
          </Title>
          <Text>{stateCopy[status]}</Text>
          <Text color="subdued" size="XS">
            Review the Workbench response or rerun the command. No additional
            Redis command was issued.
          </Text>
        </S.StatePanel>
      )}
    </S.Shell>
  )
}
