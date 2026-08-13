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

export const Tune = ({
  sensitivityRuns,
  selectedK,
  onSelectK,
  recommendations,
  currentConfig,
  sourceKind,
}: TuneProps) => {
  const configEntries = Object.entries(currentConfig ?? {})

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
        {sensitivityRuns.length === 0 ? (
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
                  {key}
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
