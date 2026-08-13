import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { faker } from '@faker-js/faker'

import { ThemeProvider } from 'uiSrc/components/base/utils/pluginsThemeContext'

import { SelectionInspector } from './SelectionInspector'

const renderComponent = (
  props: Partial<React.ComponentProps<typeof SelectionInspector>> = {},
) =>
  render(
    <ThemeProvider>
      <SelectionInspector exactness="unknown" {...props} />
    </ThemeProvider>,
  )

describe('SelectionInspector', () => {
  it('renders the selected record evidence without exposing raw vectors', () => {
    const id = faker.string.uuid()

    renderComponent({
      row: {
        id,
        rank: 1,
        value: 0.25,
        metric: 'distance',
        plotted: true,
        selected: true,
      },
      exactness: 'approximate',
      provenance: 'Redis response',
    })

    expect(screen.getByTitle(id)).toBeInTheDocument()
    expect(screen.getByText('Similarity: 0.7500')).toBeInTheDocument()
    expect(screen.getByText('Exactness: approximate')).toBeInTheDocument()
    expect(screen.getByText('Evidence: Redis response')).toBeInTheDocument()
  })

  it('renders an explicit empty selection state', () => {
    renderComponent()

    expect(
      screen.getByText('Select a result to inspect its evidence.'),
    ).toBeInTheDocument()
  })

  it('renders unavailable instead of NaN when no response-backed score exists', () => {
    renderComponent({
      row: {
        id: 'sampled-record',
        rank: 1,
        value: Number.NaN,
        metric: 'distance',
        plotted: true,
        selected: true,
      },
      exactness: 'sample-exact',
      provenance: 'Bounded sampled Redis response',
    })

    expect(screen.getByText('Similarity: Unavailable')).toBeInTheDocument()
    expect(screen.queryByText('Similarity: NaN')).not.toBeInTheDocument()
  })

  it('renders selected metadata and explicit record actions', () => {
    const onCopyId = jest.fn()
    const onExportRow = jest.fn()
    const onRunNeighbors = jest.fn()
    const row = {
      id: 'doc:metadata',
      rank: 1,
      value: 0.16,
      metric: 'distance' as const,
      plotted: true,
      selected: true,
      metadata: { brand: 'Redis', price: 42 },
    }

    renderComponent({
      row,
      exactness: 'sample-exact',
      provenance: 'Bounded sampled Redis response',
      onCopyId,
      onExportRow,
      onRunNeighbors,
    })

    expect(screen.getByLabelText('Selected record metadata')).toHaveTextContent(
      'brand: Redis',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Run neighbors' }))
    fireEvent.click(screen.getByRole('button', { name: 'Copy ID' }))
    fireEvent.click(screen.getByRole('button', { name: 'Export row' }))
    expect(onRunNeighbors).toHaveBeenCalledWith('doc:metadata')
    expect(onCopyId).toHaveBeenCalledWith('doc:metadata')
    expect(onExportRow).toHaveBeenCalledWith(row)
  })
})
