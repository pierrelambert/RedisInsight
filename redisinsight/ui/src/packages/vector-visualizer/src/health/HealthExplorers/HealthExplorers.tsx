import React from 'react'

import { BaseButton as Button } from 'uiSrc/components/base/forms/buttons/Button'
import TextInput from 'uiSrc/components/base/inputs/TextInput'
import { Row } from 'uiSrc/components/base/layout/flex'
import { Text, Title } from 'uiSrc/components/base/text'

import { type UnknownHealthEvidence } from '../calculations'
import * as S from './HealthExplorers.styles'
import type {
  DuplicateExplorerProps,
  Freshness,
  OutlierExplorerProps,
  XRayFact,
} from './HealthExplorers.types'

const freshnessCopy = (freshness: Freshness) =>
  freshness === 'fresh'
    ? 'Fresh bounded sample'
    : 'Derived from stale sampled data'

const factStatusCopy = (status: XRayFact['status']) =>
  status === 'candidate' ? 'Sampled candidate' : status

const statusSeverity = (status: XRayFact['status']): S.HealthTileSeverity =>
  status === 'candidate'
    ? 'notice'
    : status === 'unknown'
      ? 'attention'
      : 'neutral'

const factSeverity = (fact: XRayFact): S.HealthTileSeverity =>
  fact.severity ?? statusSeverity(fact.status)

const factTestId = (label: string) =>
  `health-metric-tile-${label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`

const UnknownEvidence = ({ evidence }: { evidence: UnknownHealthEvidence }) => (
  <S.EvidencePanel aria-label="Unknown candidate evidence">
    <Text color="attention" role="status">
      Unknown candidate evidence
    </Text>
    <Text color="subdued">
      Reason: {evidence.reason.replaceAll('-', ' ')}. Original-space evidence is
      unavailable.
    </Text>
    <Text color="subdued">
      No Healthy status is inferred without sufficient original-space evidence.
    </Text>
  </S.EvidencePanel>
)

export const XRay = ({ facts }: { facts: XRayFact[] }) => (
  <S.EvidencePanel aria-label="Health X-ray">
    <Title component="h2" size="XS">
      X-ray summary
    </Title>
    {!facts.length ? (
      <Text color="subdued" role="status">
        No bounded sample evidence is available.
      </Text>
    ) : (
      <S.MetricGrid>
        {facts.map((fact) => {
          const severity = factSeverity(fact)
          return (
            <S.MetricTile
              $severity={severity}
              data-health-severity={severity}
              data-testid={factTestId(fact.label)}
              key={fact.label}
            >
              <S.MetricTileHeader gap="xs">
                <S.MetricLabel component="span" size="XS" variant="semiBold">
                  {fact.label}
                </S.MetricLabel>
                <S.MetricValue component="h3" size="XS">
                  {fact.value}
                </S.MetricValue>
                <S.MetricStatus
                  color={
                    severity === 'attention'
                      ? 'attention'
                      : severity === 'success'
                        ? 'success'
                        : severity === 'notice'
                          ? 'notice'
                          : severity === 'danger'
                            ? 'danger'
                            : 'subdued'
                  }
                  size="XS"
                >
                  {factStatusCopy(fact.status)}
                </S.MetricStatus>
              </S.MetricTileHeader>
              <S.MetricFormula>
                <summary>Evidence</summary>
                <Text color="subdued" size="XS">
                  {fact.formula}
                </Text>
                <Text color="subdued" size="XS">
                  Sample {fact.sampleCount} · {freshnessCopy(fact.freshness)}
                </Text>
              </S.MetricFormula>
            </S.MetricTile>
          )
        })}
      </S.MetricGrid>
    )}
  </S.EvidencePanel>
)

export const DuplicateExplorer = ({
  evidence,
  onSelectionChange,
  onConfigChange,
}: DuplicateExplorerProps) => {
  if (evidence.kind === 'unknown')
    return <UnknownEvidence evidence={evidence} />
  const pairMeasure = evidence.pairMeasure ?? 'cosine similarity'
  const threshold = evidence.threshold ?? evidence.similarityThreshold
  const operator = evidence.duplicateDirection === 'at-most' ? '≤' : '≥'
  const thresholdLabel = `Duplicate ${pairMeasure} threshold`
  return (
    <S.EvidencePanel aria-label="Duplicate candidate explorer">
      <Title component="h2" size="S">
        Duplicate candidates
      </Title>
      <Text color="subdued">
        Candidate rule: {evidence.formula}; {pairMeasure} {operator} {threshold}
        ; bounded sample: {evidence.sampleCount}; graph coverage:{' '}
        {evidence.coverage === 'threshold-complete'
          ? 'complete above supplied threshold'
          : evidence.coverage === 'sample-pair-complete'
            ? 'complete over bounded sample'
            : 'partial neighbor graph'}
        ; {freshnessCopy(evidence.freshness)}.
      </Text>
      <label>
        <Text component="span" size="S">
          {thresholdLabel}
        </Text>
        <TextInput
          aria-label={thresholdLabel}
          type="number"
          min={evidence.metric === 'l2' ? '0' : undefined}
          max={
            evidence.metric === 'cosine' || !evidence.metric ? '1' : undefined
          }
          step="0.001"
          value={String(threshold)}
          onChange={(value) => onConfigChange?.(Number(value))}
        />
      </label>
      {evidence.groups.length ? (
        evidence.groups.map((group, index) => (
          <Row gap="s" align="center" key={group.ids.join('\u0000')}>
            <Text>
              Group {index + 1}: {group.ids.length} sampled records
            </Text>
            <Button
              aria-label={`Inspect duplicate candidate group ${index + 1}`}
              size="s"
              onClick={() => onSelectionChange(group.ids)}
            >
              Inspect candidate
            </Button>
          </Row>
        ))
      ) : (
        <Text color="subdued" role="status">
          No duplicate candidates under this sampled rule.
        </Text>
      )}
    </S.EvidencePanel>
  )
}

export const OutlierExplorer = ({
  evidence,
  onSelectionChange,
  onConfigChange,
}: OutlierExplorerProps) => {
  if (evidence.kind === 'unknown')
    return <UnknownEvidence evidence={evidence} />
  return (
    <S.EvidencePanel aria-label="Outlier candidate explorer">
      <Title component="h2" size="S">
        Outlier candidates
      </Title>
      <Text color="subdued">
        Candidate rule: {evidence.formula}; k={evidence.k}; robust deviation
        threshold={evidence.robustDeviationThreshold}; bounded sample:{' '}
        {evidence.sampleCount}; exactness: {evidence.exactness};{' '}
        {freshnessCopy(evidence.freshness)}.
      </Text>
      <label>
        <Text component="span" size="S">
          Outlier neighbor count k
        </Text>
        <TextInput
          aria-label="Outlier neighbor count k"
          type="number"
          min="1"
          step="1"
          value={String(evidence.k)}
          onChange={(value) =>
            onConfigChange?.({
              k: Number(value),
              robustDeviationThreshold: evidence.robustDeviationThreshold,
            })
          }
        />
      </label>
      <label>
        <Text component="span" size="S">
          Outlier robust deviation threshold
        </Text>
        <TextInput
          aria-label="Outlier robust deviation threshold"
          type="number"
          min="0"
          step="0.1"
          value={String(evidence.robustDeviationThreshold)}
          onChange={(value) =>
            onConfigChange?.({
              k: evidence.k,
              robustDeviationThreshold: Number(value),
            })
          }
        />
      </label>
      {evidence.ids.length ? (
        evidence.ids.map((id) => (
          <Row gap="s" align="center" key={id}>
            <Text component="span">{id}</Text>
            <Button
              aria-label={`Inspect outlier candidate ${id}`}
              size="s"
              onClick={() => onSelectionChange([id])}
            >
              Inspect candidate
            </Button>
          </Row>
        ))
      ) : (
        <Text color="subdued" role="status">
          No outlier candidates under this sampled rule.
        </Text>
      )}
    </S.EvidencePanel>
  )
}
