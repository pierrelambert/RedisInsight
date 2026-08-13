import React from 'react'

import { Button } from 'uiSrc/components/base/forms/buttons'
import { Col } from 'uiSrc/components/base/layout/flex'
import { Text, Title } from 'uiSrc/components/base/text'

import * as S from './SelectionInspector.styles'
import type { SelectionInspectorProps } from './SelectionInspector.types'

export const SelectionInspector = ({
  row,
  exactness,
  provenance,
  onCopyId,
  onExportRow,
  onRunNeighbors,
}: SelectionInspectorProps) => (
  <S.Inspector as="aside" aria-label="Selected record inspector">
    <Title component="h2" size="S">
      Inspector
    </Title>
    {row ? (
      <Col gap="s">
        <S.Identifier title={row.id}>{row.id}</S.Identifier>
        <Text>{row.plotted ? 'Plotted' : 'Not plotted'}</Text>
        <Text>
          {row.metric === 'score' ? 'Score' : 'Similarity'}:{' '}
          {Number.isFinite(row.value)
            ? (row.metric === 'distance'
                ? 1 - row.value
                : row.value
              ).toFixed(4)
            : 'Unavailable'}
        </Text>
        <Text>Exactness: {exactness.replace('-', ' ')}</Text>
        <Text>Evidence: {provenance ?? 'Unavailable'}</Text>
        {!!row.metadata && Object.keys(row.metadata).length > 0 && (
          <Col gap="xs" aria-label="Selected record metadata">
            <Text variant="semiBold">Metadata</Text>
            {Object.entries(row.metadata).map(([field, value]) => (
              <Text key={field}>
                {field}: {String(value)}
              </Text>
            ))}
          </Col>
        )}
        {(onRunNeighbors || onCopyId || onExportRow) && (
          <S.Actions align="center" gap="xs" wrap>
            {onRunNeighbors && (
              <Button size="s" onClick={() => onRunNeighbors(row.id)}>
                Run neighbors
              </Button>
            )}
            {onCopyId && (
              <Button
                size="s"
                variant="secondary-ghost"
                onClick={() => onCopyId(row.id)}
              >
                Copy ID
              </Button>
            )}
            {onExportRow && (
              <Button
                size="s"
                variant="secondary-ghost"
                onClick={() => onExportRow(row)}
              >
                Export row
              </Button>
            )}
          </S.Actions>
        )}
      </Col>
    ) : (
      <Text color="subdued">Select a result to inspect its evidence.</Text>
    )}
  </S.Inspector>
)
