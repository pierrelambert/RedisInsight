import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { faker } from '@faker-js/faker'

import { ThemeProvider } from 'uiSrc/components/base/utils/pluginsThemeContext'

import { QueryLab, QueryLabProps } from './QueryLab'

const defaultProps: QueryLabProps = {
  sourceKind: 'search-index',
  status: 'ready',
  exactness: 'approximate',
  freshness: 'current',
  neighbors: [
    {
      id: faker.string.alphanumeric(10),
      rank: 1,
      metric: 'similarity',
      value: 0.91,
      plotted: true,
      provenance: 'FT.SEARCH',
    },
    {
      id: faker.string.alphanumeric(10),
      rank: 4,
      metric: 'similarity',
      value: 0.53,
      plotted: false,
      provenance: 'FT.SEARCH',
    },
  ],
  profile: {
    kind: 'full',
    facts: {
      'Vector mode': 'BATCHES',
      'Total profile time': '1.2 ms',
    },
  },
}

describe('QueryLab', () => {
  const renderComponent = (props: Partial<QueryLabProps> = {}) =>
    render(
      <ThemeProvider>
        <QueryLab {...defaultProps} {...props} />
      </ThemeProvider>,
    )

  it('synchronizes a rank selection across the neighbors, waterfall, Selection, and inspector', () => {
    renderComponent()

    const neighbor = defaultProps.neighbors[1]
    fireEvent.click(
      screen.getByRole('button', { name: `Select ${neighbor.id}` }),
    )

    expect(screen.getByRole('status')).toHaveTextContent(
      `Selected ${neighbor.id}`,
    )
    expect(
      screen.getByRole('heading', { name: 'Returned results' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('row', { name: new RegExp(neighbor.id) }),
    ).toHaveAttribute('aria-selected', 'true')
    expect(
      screen.getByRole('heading', { name: 'Inspector' }),
    ).toHaveTextContent('Inspector')
    expect(screen.getByText('Not plotted')).toBeInTheDocument()
    expect(screen.getByText(/Similarity: 0\.5300/)).toBeInTheDocument()
  })

  it('prioritizes response-backed evidence beside a persistent result inspector', () => {
    renderComponent()

    expect(screen.getByTestId('query-lab-workspace')).toHaveAttribute(
      'data-layout',
      'desktop-evidence-inspector',
    )
    expect(
      screen.getByRole('heading', { name: 'Response evidence' }),
    ).toBeInTheDocument()
    expect(
      screen.getByTestId('query-lab-neighbor-evidence-layout'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Returned results' }),
    ).toBeInTheDocument()
    expect(
      screen.getAllByText('Response-backed FT.SEARCH results'),
    ).toHaveLength(2)
    expect(screen.getByTestId('query-lab-evidence-scrollport')).toHaveAttribute(
      'aria-label',
      'Response evidence scrollable content',
    )
  })

  it('supports keyboard selection from the linked neighbor controls', () => {
    renderComponent()

    const neighbor = defaultProps.neighbors[0]
    fireEvent.keyDown(
      screen.getByRole('button', { name: `Select ${neighbor.id}` }),
      { key: 'Enter' },
    )

    expect(screen.getByRole('status')).toHaveTextContent(
      `Selected ${neighbor.id}`,
    )
  })

  it('exposes every returned neighbor through the non-canvas grid before selection', () => {
    renderComponent()

    const grid = screen.getByRole('grid', { name: 'Virtualized selection' })
    expect(
      screen.getByRole('row', {
        name: new RegExp(defaultProps.neighbors[0].id),
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('row', {
        name: new RegExp(defaultProps.neighbors[1].id),
      }),
    ).toBeInTheDocument()

    fireEvent.keyDown(grid, { key: 'ArrowDown' })

    expect(screen.getByRole('status')).toHaveTextContent(
      `Selected ${defaultProps.neighbors[1].id}`,
    )
  })

  it('keeps adjacent rank-gap multi-selection equivalent for keyboard users', () => {
    const onSelectionChange = jest.fn()
    renderComponent({ onSelectionChange })

    fireEvent.keyDown(
      screen.getAllByRole('button', { name: /from rank gaps$/ })[0],
      { key: ' ' },
    )

    expect(onSelectionChange).toHaveBeenCalledWith([
      defaultProps.neighbors[0].id,
      defaultProps.neighbors[1].id,
    ])
  })

  it('keeps every result selected from a histogram bin linked across neighbors and the grid', () => {
    const neighbors = [
      { ...defaultProps.neighbors[0], rank: 1, value: 0.9 },
      { ...defaultProps.neighbors[1], rank: 2, value: 0.85 },
    ]
    renderComponent({
      neighbors,
      sourceSample: {
        values: [0, 1],
        completeness: 'bounded',
        provenance: 'response sample',
      },
    } as Partial<QueryLabProps>)

    fireEvent.click(
      screen.getByRole('button', {
        name: /Distribution bin 4.*result count 2/i,
      }),
    )

    neighbors.forEach(({ id }) => {
      expect(
        screen.getByRole('button', { name: `Select ${id}` }),
      ).toHaveAttribute('aria-pressed', 'true')
      expect(screen.getByRole('row', { name: new RegExp(id) })).toHaveAttribute(
        'aria-selected',
        'true',
      )
    })
  })

  it('uses the native page selection seam when a controlled selection is supplied', () => {
    const onSelectionChange = jest.fn()
    renderComponent({
      selectedIds: [defaultProps.neighbors[0].id],
      focusedId: defaultProps.neighbors[0].id,
      onSelectionChange,
    })

    fireEvent.click(
      screen.getByRole('button', {
        name: `Select ${defaultProps.neighbors[1].id}`,
      }),
    )

    expect(onSelectionChange).toHaveBeenCalledWith([
      defaultProps.neighbors[1].id,
    ])
  })

  it('does not mask a non-ready query state behind the selected document label', () => {
    renderComponent({
      status: 'recoverable-error',
      neighbors: [],
      selectedIds: [defaultProps.neighbors[0].id],
      focusedId: defaultProps.neighbors[0].id,
    })

    expect(screen.getByRole('status')).toHaveTextContent(
      'Query evidence could not be loaded. Retry.',
    )
    expect(
      screen.getByTestId('query-lab-state-recoverable-error'),
    ).toHaveTextContent(`Selected document: ${defaultProps.neighbors[0].id}`)
    expect(screen.queryByTestId('query-lab-workspace')).not.toBeInTheDocument()
  })

  it('labels radial angle as layout-only and preserves metric-aware exact values', () => {
    renderComponent()

    expect(screen.getByText('Angle: layout only')).toBeInTheDocument()
    expect(screen.getAllByText('Similarity score')).not.toHaveLength(0)
    expect(screen.getByText('Approximate result')).toBeInTheDocument()
    expect(
      screen.getAllByRole('button', { name: /from rank gaps$/ })[0],
    ).toHaveTextContent('0.91')
    expect(
      screen.getByRole('button', {
        name: `Select ${defaultProps.neighbors[0].id}`,
      }),
    ).toHaveAttribute('title', 'Similarity score: 0.91')
  })

  it('uses query-centred monotonic radii and links labelled distribution bins to selection', () => {
    renderComponent({
      sourceSample: {
        values: [0.1, 0.4, 0.8, 1],
        completeness: 'bounded',
        provenance: 'FT.SEARCH score sample',
      },
      threshold: {
        value: 0.7,
        operator: 'gte',
        label: 'Accepted similarity',
        provenance: 'query threshold',
      },
      topKBoundary: 1,
    } as Partial<QueryLabProps>)

    expect(screen.getByLabelText('Query anchor')).toBeInTheDocument()
    expect(screen.getByText('Accepted similarity: ≥ 0.70')).toBeInTheDocument()
    expect(
      screen.getByText('Result / source sample distribution'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: /Distribution bin 4.*result count 1.*bounded source count 2/i,
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Largest observed adjacent gap: 0.38 after rank 1 (descriptive only)',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Top-1 result boundary')).toBeInTheDocument()
    expect(
      screen.getByText('Accepted similarity ≥ 0.70 · query threshold'),
    ).toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('button', {
        name: /Distribution bin 4.*result count 1.*bounded source count 2/i,
      }),
    )
    expect(screen.getByRole('status')).toHaveTextContent(
      `Selected ${defaultProps.neighbors[0].id}`,
    )
  })

  it('changes histogram counts, adjacent gaps, and threshold ring geometry for distinct numeric inputs', () => {
    const { rerender } = renderComponent({
      neighbors: [
        { ...defaultProps.neighbors[0], rank: 1, value: 0.9 },
        { ...defaultProps.neighbors[1], rank: 2, value: 0.5 },
      ],
      sourceSample: {
        values: [0, 0.2, 0.8, 1],
        completeness: 'bounded',
        provenance: 'response A',
      },
      threshold: {
        value: 0.75,
        operator: 'gte',
        label: 'Similarity threshold',
        provenance: 'query A',
      },
    } as Partial<QueryLabProps>)

    const initialRingRadius = screen
      .getByLabelText('Similarity threshold ring')
      .getAttribute('data-ring-radius')
    expect(
      screen.getByText(
        'Largest observed adjacent gap: 0.40 after rank 1 (descriptive only)',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: /Distribution bin 4.*result count 1.*bounded source count 2/i,
      }),
    ).toBeInTheDocument()

    rerender(
      <ThemeProvider>
        <QueryLab
          {...defaultProps}
          neighbors={[
            { ...defaultProps.neighbors[0], rank: 1, value: 0.65 },
            { ...defaultProps.neighbors[1], rank: 2, value: 0.6 },
          ]}
          sourceSample={{
            values: [0.55, 0.58, 0.61, 0.64],
            completeness: 'bounded',
            provenance: 'response B',
          }}
          threshold={{
            value: 0.6,
            operator: 'gte',
            label: 'Similarity threshold',
            provenance: 'query B',
          }}
        />
      </ThemeProvider>,
    )

    expect(
      screen.getByText(
        'Largest observed adjacent gap: 0.05 after rank 1 (descriptive only)',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByLabelText('Similarity threshold ring'),
    ).not.toHaveAttribute('data-ring-radius', initialRingRadius)
    expect(
      screen.getByRole('button', {
        name: /Distribution bin 4.*result count 1.*bounded source count 1/i,
      }),
    ).toBeInTheDocument()
  })

  it('labels absent and partial bounded source evidence without inventing values', () => {
    const { rerender } = renderComponent()

    expect(
      screen.getByText(
        'Unavailable: bounded source-sample distribution facts were not returned.',
      ),
    ).toBeInTheDocument()

    rerender(
      <ThemeProvider>
        <QueryLab
          {...defaultProps}
          sourceSample={{
            values: [0.2, 0.4],
            completeness: 'partial',
            provenance: 'cancelled bounded scan',
          }}
        />
      </ThemeProvider>,
    )

    expect(
      screen.getByText(
        'Partial bounded source sample: 2 values · cancelled bounded scan',
      ),
    ).toBeInTheDocument()
  })

  it('renders full Search profile facts and does not fabricate a missing stage', () => {
    renderComponent()

    expect(screen.getByText('Measured Search profile')).toBeInTheDocument()
    expect(screen.getByText('BATCHES')).toBeInTheDocument()
    expect(screen.getByText('Iterator stages unavailable')).toBeInTheDocument()
  })

  it('renders only returned Search iterator stages', () => {
    renderComponent({
      profile: {
        ...defaultProps.profile,
        stages: [{ name: 'VECTOR', count: '2', mode: 'BATCHES' }],
      },
    })
    expect(screen.getByText('Returned iterator stages')).toBeInTheDocument()
    expect(
      screen.getByText('VECTOR · count: 2 · mode: BATCHES'),
    ).toBeInTheDocument()
  })

  it('renders the reduced Vector Set profile without Search iterator stages', () => {
    renderComponent({
      sourceKind: 'vector-set',
      profile: {
        kind: 'reduced',
        facts: { 'Result count': '2', EF: undefined },
      },
    })

    expect(screen.getByText('Reduced Vector Set profile')).toBeInTheDocument()
    expect(screen.getByText('VSIM inputs and results only')).toBeInTheDocument()
    expect(screen.getByText('Unavailable')).toBeInTheDocument()
    expect(
      screen.queryByText('Measured Search profile'),
    ).not.toBeInTheDocument()
  })

  it.each([
    ['source-not-selected', 'Select a vector data source.'],
    ['discovering', 'Discovering source capabilities.'],
    ['ready-not-sampled', 'Ready to collect bounded read-only evidence.'],
    ['ready', 'Query results are ready.'],
    ['fetching', 'Fetching bounded query evidence.'],
    ['layouting', 'Preparing linked query views.'],
    ['partial', 'Partial query evidence is available.'],
    ['stale', 'Results are stale or changed while sampled.'],
    ['empty', 'No results matched this query.'],
    ['unsupported', 'This source cannot provide Query Lab evidence.'],
    ['acl-unavailable', 'Redis ACLs do not allow this evidence.'],
    ['cancelled', 'Query retrieval was cancelled.'],
    ['recoverable-error', 'Query evidence could not be loaded. Retry.'],
    ['fatal-error', 'Query Lab could not render this result.'],
  ] as const)(
    'renders the %s state with an accessible next step',
    (status, copy) => {
      renderComponent({ status, neighbors: [] })

      expect(screen.getByRole('status')).toHaveTextContent(copy)
      if (status === 'ready' || status === 'partial' || status === 'stale') {
        expect(screen.getByTestId('query-lab-workspace')).toBeInTheDocument()
      } else {
        expect(
          screen.getByTestId(`query-lab-state-${status}`),
        ).toBeInTheDocument()
      }
    },
  )
})
