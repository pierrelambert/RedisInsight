import React, { useMemo } from 'react'

import { Col, Row } from 'uiSrc/components/base/layout/flex'
import { Text, Title } from 'uiSrc/components/base/text'

import * as S from './MetadataMatrix.styles'
import type { MetadataMatrixProps } from './MetadataMatrix.types'

export const MetadataMatrix = ({
  records,
  field,
  onSelectionChange,
  status,
}: MetadataMatrixProps) => {
  const clusters = useMemo(
    () =>
      [
        ...new Set(records.map(({ clusterId }) => clusterId).filter(Boolean)),
      ] as string[],
    [records],
  )
  const values = useMemo(
    () => [
      ...new Set(
        records
          .map(({ metadata }) => String(metadata?.[field] ?? ''))
          .filter((value) => value.trim()),
      ),
    ],
    [field, records],
  )
  const maxCount = useMemo(
    () =>
      Math.max(
        0,
        ...clusters.flatMap((clusterId) =>
          values.map(
            (value) =>
              records.filter(
                (record) =>
                  record.clusterId === clusterId &&
                  String(record.metadata?.[field] ?? '') === value,
              ).length,
          ),
        ),
      ),
    [clusters, field, records, values],
  )
  if (status)
    return (
      <Text role="status" color={status === 'error' ? 'danger' : 'subdued'}>
        {status === 'stale'
          ? 'Sampled count matrix is stale.'
          : `Sampled count matrix is ${status}.`}
      </Text>
    )
  if (!records.length)
    return (
      <Text role="status" color="subdued">
        No sampled records are available for the metadata matrix.
      </Text>
    )
  if (!clusters.length)
    return (
      <Text role="status" color="subdued">
        Cluster labels are unavailable. Supply authoritative cluster labels;
        UMAP positions are not clusters.
      </Text>
    )
  if (!values.length)
    return (
      <Text role="status" color="subdued">
        No non-empty sampled values are available for {field}.
      </Text>
    )
  return (
    <Col gap="s" aria-label="Metadata by supplied cluster count matrix">
      <Title component="h2" size="S">
        Metadata × cluster count matrix
      </Title>
      <Text color="subdued">
        Supplied cluster labels · sampled counts · field: {field}
      </Text>
      <Text aria-label="Heatmap count intensity legend" color="subdued">
        Heatmap intensity: 0 to {maxCount} sampled records (numeric labels are
        exact counts).
      </Text>
      <Col
        gap="s"
        role="table"
        aria-label="Metadata counts by supplied cluster"
      >
        <Row gap="s" align="center" role="row">
          <Text component="span" role="columnheader" size="S">
            Cluster
          </Text>
          {values.map((value) => (
            <Text component="span" role="columnheader" size="S" key={value}>
              {value}
            </Text>
          ))}
        </Row>
        {clusters.map((clusterId) => (
          <Row gap="s" align="center" role="row" key={clusterId}>
            <Text component="span" role="rowheader" size="S">
              {clusterId}
            </Text>
            {values.map((value) => {
              const ids = records
                .filter(
                  (record) =>
                    record.clusterId === clusterId &&
                    String(record.metadata?.[field] ?? '') === value,
                )
                .map(({ id }) => id)
              const intensity = maxCount ? ids.length / maxCount : 0
              return (
                <div role="cell" key={value}>
                  <S.MatrixButton
                    aria-label={`${clusterId}, ${value}: ${ids.length} sampled records`}
                    title={`Sampled count: ${ids.length}`}
                    size="s"
                    disabled={!ids.length}
                    data-intensity={intensity}
                    $intensity={intensity}
                    onClick={() => onSelectionChange(ids)}
                  >
                    {ids.length}
                  </S.MatrixButton>
                </div>
              )
            })}
          </Row>
        ))}
      </Col>
    </Col>
  )
}
