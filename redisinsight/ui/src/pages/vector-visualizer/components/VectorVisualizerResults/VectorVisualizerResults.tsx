import React, { useMemo, useState } from 'react'

import { Button } from 'uiSrc/components/base/forms/buttons'
import { SearchInput } from 'uiSrc/components/base/inputs'
import { Col } from 'uiSrc/components/base/layout/flex'
import { Text, Title } from 'uiSrc/components/base/text'
import { SelectionInspector } from 'uiSrc/packages/vector-visualizer/src/selection/SelectionInspector'
import { SelectionTable } from 'uiSrc/packages/vector-visualizer/src/selection/SelectionTable'

import type {
  ResultsInspectorContext,
  VectorVisualizerResultsProps,
} from './VectorVisualizerResults.types'
import type { VisualizerStatus } from 'uiSrc/packages/vector-visualizer/src/contracts'
import * as S from './VectorVisualizerResults.styles'

const contextLabel: Record<
  ResultsInspectorContext,
  Record<VectorVisualizerResultsProps['sourceKind'], string>
> = {
  sampled: {
    'search-index': 'Sampled documents',
    'vector-set': 'Sampled elements',
  },
  nearest: {
    'search-index': 'Nearest documents',
    'vector-set': 'Nearest elements',
  },
  selected: {
    'search-index': 'Selected documents',
    'vector-set': 'Selected elements',
  },
}

const exactnessLabel = {
  exact: 'Exact result',
  approximate: 'Approximate result',
  'sample-exact': 'Exact within the sampled result set',
  unknown: 'Exactness unavailable',
} as const

const sourceLabel: Record<VectorVisualizerResultsProps['sourceKind'], string> =
  {
    'search-index': 'Search index',
    'vector-set': 'Vector Set',
  }

const assertUnhandledStatus = (status: never): never => {
  throw new Error(`Unhandled vector visualizer status: ${status}`)
}

const stateCopy = (
  status: VisualizerStatus,
  entityLabel: string,
  selectedSourceLabel: string,
): string | undefined => {
  switch (status) {
    case 'source-not-selected':
      return 'Select a Search index or Vector Set source to view result evidence.'
    case 'discovering':
    case 'fetching':
    case 'layouting':
      return `Loading ${entityLabel.toLowerCase()}.`
    case 'ready-not-sampled':
      return `Sample or query the selected ${selectedSourceLabel} to view result evidence.`
    case 'empty':
      return `No ${entityLabel.toLowerCase()} match the current workspace context.`
    case 'acl-unavailable':
      return 'Redis ACLs do not allow this result evidence.'
    case 'unsupported':
      return 'This source cannot provide result evidence for this workspace.'
    case 'cancelled':
      return 'Result retrieval was cancelled.'
    case 'recoverable-error':
      return 'Result evidence could not be loaded. Retry from the workspace source action.'
    case 'fatal-error':
      return 'The result inspector could not render this evidence.'
    case 'ready':
    case 'partial':
    case 'stale':
      return undefined
    default:
      return assertUnhandledStatus(status)
  }
}

export const VectorVisualizerResults = ({
  context,
  exactness,
  focusedId,
  onCopyFocusedId,
  onCopyVisibleIds,
  onExportFocusedResult,
  onExportVisibleResults,
  onRunNeighborsForFocused,
  onResultFocus,
  provenance,
  rows,
  sourceKind,
  status,
}: VectorVisualizerResultsProps) => {
  const [search, setSearch] = useState('')
  const title = contextLabel[context][sourceKind]
  const normalizedSearch = search.trim().toLocaleLowerCase()
  const visibleRows = useMemo(
    () =>
      normalizedSearch
        ? rows.filter(({ id }) =>
            id.toLocaleLowerCase().includes(normalizedSearch),
          )
        : rows,
    [normalizedSearch, rows],
  )
  const focusedRow = rows.find(({ id }) => id === focusedId)
  const visibleFocusedId = visibleRows.some(({ id }) => id === focusedId)
    ? focusedId
    : undefined
  const message = stateCopy(status, title, sourceLabel[sourceKind])
  const isReady = message === undefined

  return (
    <S.Inspector
      aria-label={`${title} result inspector`}
      data-results-context={context}
      data-testid="vector-visualizer-results-inspector"
      gap="s"
      role="complementary"
    >
      <S.Header align="center" gap="s" justify="between">
        <Col gap="xs">
          <Title component="h2" size="S">
            {title}
          </Title>
          <Text color="subdued" size="XS">
            {exactnessLabel[exactness]} · {provenance}
          </Text>
        </Col>
        <Text color="subdued" size="XS">
          {visibleRows.length.toLocaleString()} results
        </Text>
      </S.Header>

      <SearchInput
        aria-label={`Search ${title.toLowerCase()}`}
        disabled={!isReady}
        placeholder="Search IDs"
        value={search}
        onChange={setSearch}
      />

      {(onCopyVisibleIds || onExportVisibleResults) && (
        <S.Actions align="center" gap="s" wrap>
          {onCopyVisibleIds && (
            <Button
              disabled={!visibleRows.length || !isReady}
              size="s"
              variant="secondary-ghost"
              onClick={() => onCopyVisibleIds(visibleRows.map(({ id }) => id))}
            >
              Copy visible IDs
            </Button>
          )}
          {onExportVisibleResults && (
            <Button
              disabled={!visibleRows.length || !isReady}
              size="s"
              variant="secondary-ghost"
              onClick={() => onExportVisibleResults(visibleRows)}
            >
              Export visible results
            </Button>
          )}
        </S.Actions>
      )}

      {message ? (
        <S.StatePanel align="start" contentCentered gap="s" role="status">
          <Text>{message}</Text>
        </S.StatePanel>
      ) : (
        <S.TableRegion aria-label={`${title} virtualized table`} role="region">
          <S.TableScroll data-testid="vector-visualizer-results-table-scroll">
            <SelectionTable
              focusedId={visibleFocusedId}
              rows={visibleRows}
              variant={context === 'nearest' ? 'compact' : 'compact-id'}
              onFocus={onResultFocus}
            />
          </S.TableScroll>
          <S.Detail data-testid="vector-visualizer-results-detail">
            <SelectionInspector
              exactness={exactness}
              provenance={provenance}
              row={focusedRow}
              onCopyId={onCopyFocusedId}
              onExportRow={onExportFocusedResult}
              onRunNeighbors={onRunNeighborsForFocused}
            />
          </S.Detail>
        </S.TableRegion>
      )}
    </S.Inspector>
  )
}
