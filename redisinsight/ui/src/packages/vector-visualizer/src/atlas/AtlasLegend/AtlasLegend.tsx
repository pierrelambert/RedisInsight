import React from 'react'

import { Text } from 'uiSrc/components/base/text'

import * as S from './AtlasLegend.styles'
import type { AtlasLegendProps } from './AtlasLegend.types'

export const AtlasLegend = ({ entries, onEntryClick }: AtlasLegendProps) => {
  if (!entries.length) return null

  return (
    <S.Panel
      aria-label="Atlas color legend"
      data-testid="atlas-legend"
      gap="xs"
    >
      {entries.map((entry) => (
        <S.Entry
          $dimmed={entry.dimmed}
          aria-label={`${entry.label}${entry.count !== undefined ? ` (${entry.count})` : ''}`}
          key={entry.label}
          type="button"
          onClick={() => onEntryClick?.(entry.label)}
        >
          <S.Swatch $color={entry.color} aria-hidden="true" />
          <Text color="subdued" size="S">
            {entry.label}
            {entry.count !== undefined && (
              <Text color="subdued" size="XS">
                {` (${entry.count.toLocaleString()})`}
              </Text>
            )}
          </Text>
        </S.Entry>
      ))}
    </S.Panel>
  )
}
