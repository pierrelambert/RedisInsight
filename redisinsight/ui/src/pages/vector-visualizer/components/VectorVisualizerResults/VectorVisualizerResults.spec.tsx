import React, { useContext } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'

import {
  PluginsThemeContext,
  ThemeProvider,
} from 'uiSrc/components/base/utils/pluginsThemeContext'

import { VectorVisualizerResults } from './VectorVisualizerResults'
import type { VectorVisualizerResultsProps } from './VectorVisualizerResults.types'

const rows: VectorVisualizerResultsProps['rows'] = [
  {
    id: 'doc:1',
    metric: 'similarity',
    plotted: true,
    rank: 1,
    selected: true,
    value: 0.98,
  },
  {
    id: 'doc:2',
    metric: 'similarity',
    plotted: false,
    rank: 2,
    selected: false,
    value: 0.85,
  },
]

const ThemeTokenProbe = () => {
  const { theme } = useContext(PluginsThemeContext)

  return (
    <output
      aria-hidden="true"
      data-background={theme.semantic.color.background.neutral100}
      data-border={theme.semantic.color.border.neutral500}
      data-testid="results-theme-tokens"
    />
  )
}

describe('VectorVisualizerResults', () => {
  const defaultProps: VectorVisualizerResultsProps = {
    context: 'sampled',
    exactness: 'sample-exact',
    focusedId: 'doc:1',
    onResultFocus: jest.fn(),
    provenance: 'Bounded Redis response',
    rows,
    sourceKind: 'search-index',
    status: 'ready',
  }

  const renderComponent = (
    propsOverride: Partial<VectorVisualizerResultsProps> = {},
    theme: 'light' | 'dark' = 'light',
  ) => {
    const props = { ...defaultProps, ...propsOverride }

    document.body.className = theme === 'dark' ? 'theme_DARK' : 'theme_LIGHT'

    return render(
      <ThemeProvider>
        <ThemeTokenProbe />
        <VectorVisualizerResults {...props} />
      </ThemeProvider>,
    )
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    document.body.className = ''
  })

  it.each([
    ['sampled', 'search-index', 'Sampled documents'],
    ['nearest', 'search-index', 'Nearest documents'],
    ['selected', 'vector-set', 'Selected elements'],
  ] as const)(
    'renders the %s context with %s terminology',
    (context, sourceKind, title) => {
      renderComponent({ context, sourceKind })

      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()
      expect(
        screen.getByText(/Exact within the sampled result set/),
      ).toHaveTextContent('Bounded Redis response')
    },
  )

  it('resolves distinct semantic result tokens in both RedisInsight themes', () => {
    const { unmount } = renderComponent({}, 'light')
    const lightTokens = screen.getByTestId('results-theme-tokens')
    const lightBackground = lightTokens.getAttribute('data-background')
    const lightBorder = lightTokens.getAttribute('data-border')

    unmount()
    renderComponent({}, 'dark')
    const darkTokens = screen.getByTestId('results-theme-tokens')

    expect(darkTokens).toHaveAttribute('data-background')
    expect(darkTokens).toHaveAttribute('data-border')
    expect(darkTokens).toHaveAttribute(
      'data-background',
      expect.not.stringMatching(lightBackground ?? ''),
    )
    expect(darkTokens).toHaveAttribute(
      'data-border',
      expect.not.stringMatching(lightBorder ?? ''),
    )
  })

  it('filters virtualized rows with the accessible search input', () => {
    renderComponent()

    fireEvent.change(screen.getByLabelText('Search sampled documents'), {
      target: { value: 'doc:2' },
    })

    const grid = screen.getByRole('grid', { name: 'Virtualized selection' })
    expect(within(grid).getByText('doc:2')).toBeInTheDocument()
    expect(within(grid).queryByText('doc:1')).not.toBeInTheDocument()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it('keeps the virtualized table scroll separate from the persistent detail inspector', () => {
    renderComponent()

    const tableScroll = screen.getByTestId(
      'vector-visualizer-results-table-scroll',
    )
    const detail = screen.getByTestId('vector-visualizer-results-detail')

    expect(tableScroll).toContainElement(
      screen.getByRole('grid', { name: 'Virtualized selection' }),
    )
    expect(tableScroll).not.toContainElement(detail)
    expect(detail).toContainElement(
      screen.getByLabelText('Selected record inspector'),
    )
    expect(screen.getByText('2 results')).toBeInTheDocument()
  })

  it('uses a single compact ID column for sampled rows without query scores', () => {
    renderComponent({
      rows: rows.map((row) => ({ ...row, value: Number.NaN })),
    })

    const grid = screen.getByRole('grid', { name: 'Virtualized selection' })
    expect(grid).toHaveAttribute('aria-colcount', '1')
    expect(within(grid).getAllByRole('columnheader')).toHaveLength(1)
    expect(within(grid).queryByText('Unavailable')).not.toBeInTheDocument()
  })

  it('delegates selected-row focus through the existing keyboard table contract', () => {
    const onResultFocus = jest.fn()
    renderComponent({ onResultFocus })

    const grid = screen.getByRole('grid', { name: 'Virtualized selection' })
    fireEvent.keyDown(grid, { key: 'ArrowDown' })
    fireEvent.keyDown(grid, { key: 'Enter' })

    expect(onResultFocus).toHaveBeenCalledWith('doc:2')
    expect(onResultFocus).toHaveBeenCalledWith('doc:1')
    expect(
      within(screen.getByLabelText('Selected record inspector')).getByTitle(
        'doc:1',
      ),
    ).toBeInTheDocument()
  })

  it('delegates privacy-safe copy and export actions without accessing browser APIs', () => {
    const onCopyVisibleIds = jest.fn()
    const onExportVisibleResults = jest.fn()
    renderComponent({ onCopyVisibleIds, onExportVisibleResults })

    fireEvent.click(screen.getByRole('button', { name: 'Copy visible IDs' }))
    fireEvent.click(
      screen.getByRole('button', { name: 'Export visible results' }),
    )

    expect(onCopyVisibleIds).toHaveBeenCalledWith(['doc:1', 'doc:2'])
    expect(onExportVisibleResults).toHaveBeenCalledWith(rows)
  })

  it('explains that a source must be selected before results are available', () => {
    renderComponent({ status: 'source-not-selected' })

    expect(screen.getByRole('status')).toHaveTextContent(
      'Select a Search index or Vector Set source to view result evidence.',
    )
    expect(screen.getByLabelText('Search sampled documents')).toBeDisabled()
    expect(screen.queryByRole('grid')).not.toBeInTheDocument()
  })

  it('explains that the selected Vector Set must be sampled or queried first', () => {
    renderComponent({ sourceKind: 'vector-set', status: 'ready-not-sampled' })

    expect(screen.getByRole('status')).toHaveTextContent(
      'Sample or query the selected Vector Set to view result evidence.',
    )
    expect(screen.getByLabelText('Search sampled elements')).toBeDisabled()
    expect(screen.queryByRole('grid')).not.toBeInTheDocument()
  })

  it.each([
    ['empty', 'No sampled documents match the current workspace context.'],
    [
      'recoverable-error',
      'Result evidence could not be loaded. Retry from the workspace source action.',
    ],
  ] as const)('renders an explicit %s state', (status, copy) => {
    renderComponent({ status })

    expect(screen.getByRole('status')).toHaveTextContent(copy)
    expect(screen.queryByRole('grid')).not.toBeInTheDocument()
  })
})
