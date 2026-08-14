import React, { useState } from 'react'

import * as S from './AtlasLegend.styles'
import type { AtlasLegendProps } from './AtlasLegend.types'

const DEFAULT_MAX_VISIBLE = 12

export const AtlasLegend = ({
  entries,
  maxVisible = DEFAULT_MAX_VISIBLE,
  onEntryClick,
}: AtlasLegendProps) => {
  const [isExpanded, setIsExpanded] = useState(false)
  if (!entries.length) return null
  const isTruncated = entries.length > maxVisible
  const visibleEntries =
    isExpanded || !isTruncated ? entries : entries.slice(0, maxVisible)

  return (
    <S.Panel
      aria-label="Atlas color legend"
      data-testid="atlas-legend"
      gap="xs"
    >
      <S.EntryList gap="xs">
        {visibleEntries.map((entry) => (
          <S.Entry
            $dimmed={entry.dimmed ?? false}
            aria-label={`${entry.label}${entry.count !== undefined ? ` (${entry.count})` : ''}`}
            key={entry.label}
            onClick={() => onEntryClick?.(entry.label)}
            type="button"
          >
            <S.Swatch $color={entry.color} aria-hidden="true" />
            <S.EntryText>
              {entry.label}
              {entry.count !== undefined && (
                <S.EntryCount>{` (${entry.count.toLocaleString()})`}</S.EntryCount>
              )}
            </S.EntryText>
          </S.Entry>
        ))}
      </S.EntryList>
      {isTruncated && (
        <S.ExpanderButton
          onClick={() => setIsExpanded((value) => !value)}
          type="button"
        >
          {isExpanded ? 'Show less' : `Show all ${entries.length}`}
        </S.ExpanderButton>
      )}
    </S.Panel>
  )
}
