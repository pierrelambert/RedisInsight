import React from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { faker } from '@faker-js/faker'

import { ThemeProvider } from 'uiSrc/components/base/utils/pluginsThemeContext'

import type { SelectionRow } from '../selection'
import { SelectionTable } from './SelectionTable'
import type { SelectionTableProps } from './SelectionTable.types'

const rows: SelectionRow[] = Array.from({ length: 12 }, (_, index) => ({
  id: `doc:${index + 1}`,
  rank: index + 1,
  value: faker.number.float({ min: 0.1, max: 1, fractionDigits: 2 }),
  metric: 'similarity',
  plotted: index % 2 === 0,
  selected: index === 0,
}))

describe('SelectionTable', () => {
  const renderComponent = (focusedId = rows[0].id, onFocus = jest.fn()) =>
    render(
      <ThemeProvider>
        <SelectionTable focusedId={focusedId} rows={rows} onFocus={onFocus} />
      </ThemeProvider>,
    )

  it('places labelled column headers and data/action cells inside the grid hierarchy', () => {
    renderComponent()

    const grid = screen.getByRole('grid', { name: 'Virtualized selection' })
    expect(grid).toHaveAttribute('aria-multiselectable', 'true')
    expect(within(grid).getAllByRole('columnheader')).toHaveLength(5)
    expect(
      within(grid).getByRole('columnheader', { name: 'ID/member' }),
    ).toBeInTheDocument()
    expect(
      within(grid).getByRole('gridcell', { name: 'Rank 1' }),
    ).toBeInTheDocument()
    expect(
      within(grid).getByRole('gridcell', { name: 'ID/member doc:1' }),
    ).toBeInTheDocument()
    expect(
      within(grid).getByRole('gridcell', { name: 'Actions for doc:1' }),
    ).toContainElement(
      within(grid).getByRole('button', { name: 'Inspect doc:1' }),
    )
  })

  it('labels an empty query result without implying hidden selections', () => {
    render(
      <ThemeProvider>
        <SelectionTable rows={[]} onFocus={jest.fn()} />
      </ThemeProvider>,
    )

    expect(screen.getByText('No query records.')).toBeInTheDocument()
  })

  it('moves the virtual grid focus and activates the focused row from the keyboard', () => {
    const onFocus = jest.fn()
    renderComponent(rows[0].id, onFocus)

    const grid = screen.getByRole('grid', { name: 'Virtualized selection' })
    expect(grid).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('row', { name: /doc:1/ }).id,
    )

    fireEvent.keyDown(grid, { key: 'ArrowDown' })
    expect(onFocus).toHaveBeenCalledWith('doc:2')

    fireEvent.keyDown(grid, { key: 'End' })
    expect(onFocus).toHaveBeenCalledWith('doc:12')

    fireEvent.keyDown(grid, { key: 'Enter' })
    expect(onFocus).toHaveBeenCalledWith('doc:1')
  })

  it('keeps distinct stable DOM identities for Redis IDs with similar punctuation', () => {
    render(
      <ThemeProvider>
        <SelectionTable
          focusedId="doc:1"
          rows={[
            { ...rows[0], id: 'doc:1' },
            { ...rows[1], id: 'doc/1' },
          ]}
          onFocus={jest.fn()}
        />
      </ThemeProvider>,
    )

    expect(screen.getByRole('row', { name: /doc:1/ }).id).not.toBe(
      screen.getByRole('row', { name: /doc\/1/ }).id,
    )
  })

  it('exposes a stable selected-row seam that performs the real focus action', () => {
    const onFocus = jest.fn()
    renderComponent(rows[0].id, onFocus)

    const row = screen.getByTestId('vector-visualizer-selected-row-doc:2')
    expect(row).toHaveAttribute('data-selected', 'false')

    fireEvent.click(row)

    expect(onFocus).toHaveBeenCalledWith('doc:2')
  })

  it('keeps virtualization without pagination semantics', () => {
    renderComponent()

    const grid = screen.getByRole('grid', { name: 'Virtualized selection' })
    expect(grid).toHaveAttribute('aria-rowcount', '13')
    expect(grid).toHaveAttribute('aria-colcount', '5')
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    expect(within(grid).getAllByRole('row').length).toBeLessThan(
      rows.length + 1,
    )
  })

  it('labels a non-response-backed score as unavailable instead of inventing one', () => {
    render(
      <ThemeProvider>
        <SelectionTable
          focusedId="doc:1"
          rows={[{ ...rows[0], value: Number.NaN }]}
          onFocus={jest.fn()}
        />
      </ThemeProvider>,
    )

    expect(
      screen.getByRole('gridcell', { name: 'Score/distance Unavailable' }),
    ).toHaveTextContent('Unavailable')
  })

  it('uses a compact two-column inspector variant while preserving row activation', () => {
    const onFocus = jest.fn()
    const CompactSelectionTable = SelectionTable as React.ComponentType<
      SelectionTableProps & { variant: 'compact' }
    >

    render(
      <ThemeProvider>
        <CompactSelectionTable
          focusedId="doc:1"
          rows={rows}
          variant="compact"
          onFocus={onFocus}
        />
      </ThemeProvider>,
    )

    const grid = screen.getByRole('grid', { name: 'Virtualized selection' })
    expect(grid).toHaveAttribute('aria-colcount', '2')
    expect(within(grid).getAllByRole('columnheader')).toHaveLength(2)
    expect(
      within(grid).getByRole('columnheader', { name: 'ID/member' }),
    ).toBeInTheDocument()
    expect(
      within(grid).getByRole('columnheader', { name: 'Score/distance' }),
    ).toBeInTheDocument()
    expect(
      within(grid).getByRole('gridcell', { name: 'Rank 1 ID/member doc:1' }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('vector-visualizer-selected-row-doc:2'))

    expect(onFocus).toHaveBeenCalledWith('doc:2')
  })
})
