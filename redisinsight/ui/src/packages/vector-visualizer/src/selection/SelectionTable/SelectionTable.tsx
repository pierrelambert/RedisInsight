import React, { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import { FixedSizeList } from 'react-window'
import type { ListChildComponentProps } from 'react-window'

import { Button } from 'uiSrc/components/base/forms/buttons'
import { Col } from 'uiSrc/components/base/layout/flex'
import { Text } from 'uiSrc/components/base/text'

import { MAX_VISIBLE_ROWS, ROW_HEIGHT } from './SelectionTable.constants'
import * as S from './SelectionTable.styles'
import type { RowData, SelectionTableProps } from './SelectionTable.types'

const rowDomId = (id: string) =>
  `selection-row-${Array.from(id)
    .map((character) => (character.codePointAt(0) ?? 0).toString(16))
    .join('-')}`

const SelectionTableRow = ({
  index,
  style,
  data,
}: ListChildComponentProps<RowData>) => {
  const row = data.rows[index]
  const isFocused = row.id === data.focusedId
  const isCompact = data.variant !== 'default'
  const isIdOnly = data.variant === 'compact-id'
  const value = Number.isFinite(row.value)
    ? row.value.toFixed(2)
    : 'Unavailable'

  return (
    <S.TableRow
      aria-rowindex={index + 2}
      aria-selected={row.selected}
      data-selected={row.selected}
      data-testid={`vector-visualizer-selected-row-${row.id}`}
      data-focused={isFocused || undefined}
      id={rowDomId(row.id)}
      role="row"
      style={style as CSSProperties}
      $compact={isCompact}
      $idOnly={isIdOnly}
      $selected={row.selected}
      onClick={() => data.onFocus(row.id)}
    >
      {!isCompact && (
        <Text
          aria-label={`Rank ${row.rank}`}
          component="span"
          size="S"
          role="gridcell"
        >
          {row.rank}
        </Text>
      )}
      <S.Identifier
        aria-label={
          isCompact
            ? `Rank ${row.rank} ID/member ${row.id}`
            : `ID/member ${row.id}`
        }
        role="gridcell"
        title={row.id}
      >
        {row.id}
      </S.Identifier>
      {!isIdOnly && (
        <Text
          aria-label={`Score/distance ${value}`}
          component="span"
          size="S"
          role="gridcell"
        >
          {value}
        </Text>
      )}
      {!isCompact && (
        <>
          <Text
            aria-label={`Plotted state ${row.plotted ? 'Plotted' : 'Outside sample'}`}
            component="span"
            size="S"
            role="gridcell"
          >
            {row.plotted ? 'Plotted' : 'Outside sample'}
          </Text>
          <S.ActionCell aria-label={`Actions for ${row.id}`} role="gridcell">
            <Button
              aria-label={`Inspect ${row.id}`}
              aria-pressed={isFocused}
              size="s"
              onClick={() => data.onFocus(row.id)}
            >
              Inspect
            </Button>
          </S.ActionCell>
        </>
      )}
    </S.TableRow>
  )
}

export const SelectionTable = ({
  rows,
  focusedId,
  variant = 'default',
  onFocus,
}: SelectionTableProps) => {
  const listRef = useRef<FixedSizeList<RowData>>(null)
  const height = Math.min(rows.length, MAX_VISIBLE_ROWS) * ROW_HEIGHT
  const focusedIndex = rows.findIndex(({ id }) => id === focusedId)

  useEffect(() => {
    if (focusedIndex >= 0) listRef.current?.scrollToItem(focusedIndex, 'smart')
  }, [focusedIndex])

  if (!rows.length) {
    return <Text color="subdued">No query records.</Text>
  }

  return (
    <Col gap="s">
      <S.VirtualGrid
        aria-activedescendant={
          focusedIndex >= 0 ? rowDomId(rows[focusedIndex].id) : undefined
        }
        aria-colcount={
          variant === 'compact-id' ? 1 : variant === 'compact' ? 2 : 5
        }
        aria-label="Virtualized selection"
        aria-multiselectable="true"
        aria-rowcount={rows.length + 1}
        role="grid"
        tabIndex={0}
        onKeyDown={(event) => {
          const currentIndex = focusedIndex >= 0 ? focusedIndex : 0
          let nextIndex: number | undefined
          if (event.key === 'ArrowDown')
            nextIndex = Math.min(rows.length - 1, currentIndex + 1)
          if (event.key === 'ArrowUp') nextIndex = Math.max(0, currentIndex - 1)
          if (event.key === 'Home') nextIndex = 0
          if (event.key === 'End') nextIndex = rows.length - 1
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onFocus(rows[currentIndex].id)
            return
          }
          if (nextIndex !== undefined) {
            event.preventDefault()
            listRef.current?.scrollToItem(nextIndex, 'smart')
            onFocus(rows[nextIndex].id)
          }
        }}
      >
        <S.TableHeader
          aria-rowindex={1}
          gap="s"
          role="row"
          $compact={variant !== 'default'}
          $idOnly={variant === 'compact-id'}
        >
          {variant === 'default' && (
            <Text component="span" size="XS" role="columnheader">
              Rank
            </Text>
          )}
          <Text component="span" size="XS" role="columnheader">
            ID/member
          </Text>
          {variant !== 'compact-id' && (
            <Text
              aria-label={variant === 'compact' ? 'Score/distance' : undefined}
              component="span"
              size="XS"
              role="columnheader"
            >
              {variant === 'compact' ? 'Score' : 'Score/distance'}
            </Text>
          )}
          {variant === 'default' && (
            <>
              <Text component="span" size="XS" role="columnheader">
                Plotted state
              </Text>
              <Text component="span" size="XS" role="columnheader">
                Actions
              </Text>
            </>
          )}
        </S.TableHeader>
        <S.RowGroup role="rowgroup">
          <FixedSizeList<RowData>
            ref={listRef}
            height={height}
            itemCount={rows.length}
            itemData={{ rows, focusedId, onFocus, variant }}
            itemKey={(index, data) => data.rows[index].id}
            itemSize={ROW_HEIGHT}
            width="100%"
          >
            {SelectionTableRow}
          </FixedSizeList>
        </S.RowGroup>
      </S.VirtualGrid>
    </Col>
  )
}
