import React from 'react'

import { RiBadge } from 'uiSrc/components/base/display/badge/RiBadge'
import { Col, Row } from 'uiSrc/components/base/layout/flex'
import { Text, Title } from 'uiSrc/components/base/text'

import { MiniAtlas } from '../MiniAtlas'
import type { TuneConfidence } from '../recommendations'
import * as S from './Tune.styles'
import type { TuneProps } from './Tune.types'

const confidenceVariant: Record<
  TuneConfidence,
  'success' | 'notice' | 'attention'
> = {
  high: 'success',
  medium: 'notice',
  low: 'attention',
}

const configLabelForSourceKind = (
  sourceKind: TuneProps['sourceKind'],
): string =>
  sourceKind === 'vector-set'
    ? 'VSIM-relevant parameters observed for this Vector Set.'
    : 'FT.INFO-relevant parameters observed for this Search index.'

const parameterLabel = (key: string): string => {
  const labels: Record<string, string> = {
    m: 'M',
    efConstruction: 'EF_CONSTRUCTION',
    efRuntime: 'EF_RUNTIME',
    epsilon: 'EPSILON',
    graphMaxDegree: 'GRAPH_MAX_DEGREE',
    constructionWindowSize: 'CONSTRUCTION_WINDOW_SIZE',
    searchWindowSize: 'SEARCH_WINDOW_SIZE',
    useSearchHistory: 'USE_SEARCH_HISTORY',
    searchBufferCapacity: 'SEARCH_BUFFER_CAPACITY',
  }

  return labels[key] ?? key
}

export const Tune = ({
  sensitivityRuns,
  sensitivityStatus = 'idle',
  selectedK,
  onSelectK,
  recommendations,
  currentConfig,
  sourceKind,
}: TuneProps) => {
  const configEntries = Object.entries(currentConfig ?? {}).filter(
    ([, value]) => value !== undefined,
  )

  return (
    <Col aria-label="Tune" gap="m">
      <S.Panel>
        <Title component="h2" size="S">
          nNeighbors sensitivity
        </Title>
        <Text color="subdued">
          Compare the UMAP layout at a few nNeighbors values before committing
          to one for the main Atlas.
        </Text>
        {sensitivityStatus === 'running' ? (
          <Text role="status" color="subdued">
            Running k sensitivity maps…
          </Text>
        ) : sensitivityStatus === 'unavailable' ? (
          <Text role="status" color="subdued">
            Sensitivity maps need at least 4 retained sampled vectors. Resample
            vectors and try again.
          </Text>
        ) : sensitivityStatus === 'error' ? (
          <Text role="status" color="subdued">
            Sensitivity maps could not be computed. Resample vectors and try
            again.
          </Text>
        ) : sensitivityRuns.length === 0 ? (
          <Text role="status" color="subdued">
            No sensitivity runs are available.
          </Text>
        ) : (
          <S.ThumbnailRow>
            {sensitivityRuns.map((run) => (
              <MiniAtlas
                coordinates={run.coordinates}
                count={run.count}
                key={run.nNeighbors}
                label={`K=${run.nNeighbors}`}
                quality={run.quality}
                selected={selectedK === run.nNeighbors}
                onClick={
                  onSelectK ? () => onSelectK(run.nNeighbors) : undefined
                }
              />
            ))}
          </S.ThumbnailRow>
        )}
      </S.Panel>
      <S.Panel>
        <Title component="h2" size="S">
          Parameter analysis
        </Title>
        {configEntries.length === 0 ? (
          <Text role="status" color="subdued">
            No current configuration facts are available.
          </Text>
        ) : (
          <S.ConfigChips>
            {configEntries.map(([key, value]) => (
              <S.ConfigChip key={key}>
                <Text color="subdued" component="span" size="XS">
                  {parameterLabel(key)}
                </Text>
                <S.Code>{String(value)}</S.Code>
              </S.ConfigChip>
            ))}
          </S.ConfigChips>
        )}
        {sourceKind && (
          <Text color="subdued" size="XS">
            {configLabelForSourceKind(sourceKind)}
          </Text>
        )}
      </S.Panel>
      <S.Panel>
        <Title component="h2" size="S">
          Recommendations
        </Title>
        {recommendations.length === 0 ? (
          <Text role="status" color="subdued">
            No recommendations are available.
          </Text>
        ) : (
          <S.RecommendationGrid>
            {recommendations.map((recommendation) => (
              <S.RecommendationCard key={recommendation.parameter}>
                <Row align="center" gap="s" justify="between">
                  <Text size="S">{recommendation.parameter}</Text>
                  <RiBadge
                    variant={confidenceVariant[recommendation.confidence]}
                  >
                    {recommendation.confidence}
                  </RiBadge>
                </Row>
                <Text color="subdued" size="XS">
                  Current:{' '}
                  <S.Code>
                    {recommendation.currentValue === undefined
                      ? 'unknown'
                      : String(recommendation.currentValue)}
                  </S.Code>
                  {recommendation.suggestedRange &&
                    ` · Suggested: ${recommendation.suggestedRange}`}
                </Text>
                <Text size="XS">{recommendation.guidance}</Text>
                <Text color="subdued" size="XS">
                  {recommendation.impact}
                </Text>
              </S.RecommendationCard>
            ))}
          </S.RecommendationGrid>
        )}
        <Text color="subdued">Heuristic guidance, not optimization.</Text>
      </S.Panel>
    </Col>
  )
}
