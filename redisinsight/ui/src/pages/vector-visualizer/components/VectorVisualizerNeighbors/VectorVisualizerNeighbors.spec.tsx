import React from 'react'
import { faker } from '@faker-js/faker'

import { ThemeProvider } from 'uiSrc/components/base/utils/pluginsThemeContext'
import { fireEvent, render, screen } from 'uiSrc/utils/test-utils'

import { VectorVisualizerNeighbors } from './VectorVisualizerNeighbors'
import type { VectorVisualizerNeighborsProps } from './VectorVisualizerNeighbors.types'

describe('VectorVisualizerNeighbors', () => {
  const anchorId = faker.string.uuid()
  const neighborId = faker.string.uuid()
  const secondNeighborId = faker.string.uuid()
  const thirdNeighborId = faker.string.uuid()
  const onRun = jest.fn()
  const onSelect = jest.fn()
  const defaultProps: VectorVisualizerNeighborsProps = {
    anchorId,
    canRun: true,
    exactness: 'exact',
    freshness: 'current',
    metadataField: 'region',
    neighbors: [
      {
        id: anchorId,
        metric: 'distance',
        plotted: true,
        rank: 1,
        value: 0,
      },
      {
        id: neighborId,
        metric: 'distance',
        plotted: true,
        rank: 2,
        value: 0.16,
      },
      {
        id: secondNeighborId,
        metric: 'distance',
        plotted: true,
        rank: 3,
        value: 0.31,
      },
      {
        id: thirdNeighborId,
        metric: 'distance',
        plotted: true,
        rank: 4,
        value: 0.67,
      },
    ],
    records: [
      { id: anchorId, metadata: { region: 'north' } },
      { id: neighborId, metadata: { region: 'south' } },
      { id: secondNeighborId, metadata: { region: 'west' } },
      { id: thirdNeighborId, metadata: { region: 'south' } },
    ],
    selectedIds: [],
    status: 'ready',
    topKBoundary: 50,
    onRun,
    onSelect,
  }
  const neighborButtonLabel = `Select ${neighborId}, Similarity: 0.84, Raw distance: 0.16`

  const renderComponent = (
    propsOverride: Partial<VectorVisualizerNeighborsProps> = {},
  ) =>
    render(
      <ThemeProvider>
        <VectorVisualizerNeighbors {...defaultProps} {...propsOverride} />
      </ThemeProvider>,
    )

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders one focused radial canvas without Workbench Query Lab chrome', () => {
    renderComponent()

    expect(
      screen.getByRole('heading', { name: `Neighbors of ${anchorId}` }),
    ).toBeVisible()
    expect(
      screen.getByLabelText('Query-centered radial neighbor layout'),
    ).toHaveAttribute('data-neighbor-count', '3')
    expect(
      screen.getByLabelText('Query-centered radial neighbor layout'),
    ).toHaveAttribute('data-colored-point-count', '3')
    expect(
      screen.getByLabelText('Query-centered radial neighbor layout'),
    ).toHaveAttribute('data-layout', 'full-workspace-metric-radial')
    expect(
      screen.queryByRole('button', { name: `Select ${anchorId}` }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: `Select query anchor ${anchorId}` }),
    ).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getAllByLabelText(/metric threshold ring/)).toHaveLength(3)
    expect(
      screen.getByRole('list', { name: 'Neighbor color legend' }),
    ).toHaveTextContent('south')
    expect(
      screen.getByRole('list', { name: 'Neighbor color legend' }),
    ).toHaveTextContent('west')
    expect(
      screen.getByRole('button', { name: neighborButtonLabel }),
    ).toBeEmptyDOMElement()
    expect(
      screen.queryByRole('heading', { name: 'Retrieval debugger' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Returned results' }),
    ).not.toBeInTheDocument()
  })

  it('caps plotted non-anchor dots to the requested neighbor boundary', () => {
    renderComponent({ topKBoundary: 2 })

    expect(
      screen.getByLabelText('Query-centered radial neighbor layout'),
    ).toHaveAttribute('data-neighbor-count', '2')
    expect(
      screen.getByRole('button', { name: neighborButtonLabel }),
    ).toBeVisible()
    expect(
      screen.queryByRole('button', {
        name: `Select ${thirdNeighborId}, Similarity: 0.33, Raw distance: 0.67`,
      }),
    ).not.toBeInTheDocument()
  })

  it('presents a raw distance as similarity while retaining the raw evidence', () => {
    renderComponent()

    expect(screen.getByText(/Similarity from Redis distance/)).toBeVisible()
    expect(
      screen.getByRole('button', { name: neighborButtonLabel }),
    ).toHaveAttribute('title', 'Similarity: 0.84 · Raw distance: 0.16')
    expect(
      screen.getByRole('button', { name: neighborButtonLabel }),
    ).toHaveAccessibleName(
      `Select ${neighborId}, Similarity: 0.84, Raw distance: 0.16`,
    )
    expect(
      screen.getByLabelText(
        'Similarity metric threshold ring 0.71; raw distance 0.29',
      ),
    ).toBeVisible()
  })

  it('keeps Redis cosine distances over one as non-negative similarities', () => {
    renderComponent({
      neighbors: [
        {
          id: anchorId,
          metric: 'distance',
          plotted: true,
          rank: 1,
          value: 0,
        },
        {
          id: neighborId,
          metric: 'distance',
          plotted: true,
          rank: 2,
          value: 1.04,
        },
      ],
      records: [
        { id: anchorId, metadata: { region: 'north' } },
        { id: neighborId, metadata: { region: 'south' } },
      ],
    })

    expect(
      screen.getByRole('button', {
        name: `Select ${neighborId}, Similarity: 0.96, Raw distance: 1.04`,
      }),
    ).toHaveAttribute('title', 'Similarity: 0.96 · Raw distance: 1.04')
    expect(screen.queryByText(/Similarity: -/)).not.toBeInTheDocument()
    expect(
      screen.queryByLabelText(/Similarity metric threshold ring -/),
    ).not.toBeInTheDocument()
  })

  it('keeps response selection controlled and delegates actions', () => {
    const { rerender } = renderComponent()
    const neighbor = screen.getByRole('button', { name: neighborButtonLabel })

    expect(neighbor).toHaveAttribute(
      'title',
      'Similarity: 0.84 · Raw distance: 0.16',
    )
    expect(neighbor).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(neighbor)
    fireEvent.click(
      screen.getByRole('button', { name: 'Run selected anchor query' }),
    )

    expect(onSelect).toHaveBeenCalledWith(neighborId)
    expect(onRun).toHaveBeenCalledTimes(1)

    fireEvent.click(
      screen.getByRole('button', { name: `Select query anchor ${anchorId}` }),
    )
    expect(onSelect).toHaveBeenCalledWith(anchorId)

    rerender(
      <ThemeProvider>
        <VectorVisualizerNeighbors
          {...defaultProps}
          selectedIds={[neighborId]}
        />
      </ThemeProvider>,
    )
    expect(
      screen.getByRole('button', { name: neighborButtonLabel }),
    ).toHaveAttribute('aria-pressed', 'true')
  })

  it('uses the plot region for an honest non-ready state', () => {
    renderComponent({ neighbors: [], status: 'ready-not-sampled' })

    expect(screen.getByRole('status', { name: '' })).toHaveTextContent(
      'Select a sampled point, then run its neighbor query.',
    )
    expect(
      screen.queryByLabelText(/metric threshold ring/),
    ).not.toBeInTheDocument()
  })
})
