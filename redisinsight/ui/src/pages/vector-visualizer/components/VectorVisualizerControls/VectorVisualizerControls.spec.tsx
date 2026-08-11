import React, { useContext } from 'react'

import { fireEvent, render, screen, userEvent } from 'uiSrc/utils/test-utils'
import {
  PluginsThemeContext,
  ThemeProvider,
} from 'uiSrc/components/base/utils/pluginsThemeContext'

import { VectorVisualizerControls } from './VectorVisualizerControls'
import type { VectorVisualizerControlsProps } from './VectorVisualizerControls.types'

const defaultProps: VectorVisualizerControlsProps = {
  source: {
    label: 'Vector field',
    value: 'embedding',
    options: [{ value: 'embedding', label: 'embedding' }],
    onChange: jest.fn(),
  },
  filter: {
    value: 'category:books',
    activeFilters: [{ id: 'category', label: 'category:books' }],
    onChange: jest.fn(),
    onRemove: jest.fn(),
    syntaxHelp: {
      content: 'Filter syntax is supplied by the selected source.',
    },
  },
  colorBy: {
    label: 'Color by',
    value: 'category',
    options: [{ value: 'category', label: 'category' }],
    onChange: jest.fn(),
  },
  sampleBudget: {
    value: 2000,
    min: 500,
    max: 20000,
    onChange: jest.fn(),
  },
  clusterLabels: { checked: true, onChange: jest.fn() },
  clusterLabelLimit: {
    label: 'Cluster label limit',
    value: 'top-12',
    options: [
      { value: 'off', label: 'Off' },
      { value: 'top-5', label: 'Top 5' },
      { value: 'top-12', label: 'Top 12' },
      { value: 'top-25', label: 'Top 25' },
      { value: 'all', label: 'All visible' },
    ],
    onChange: jest.fn(),
  },
  outliers: { checked: false, onChange: jest.fn() },
  summary: {
    sampleCount: 2000,
    sourceCount: 6000,
    samplingMethod: 'FT.SEARCH',
    projectionAlgorithm: 'UMAP',
    seed: 42,
    freshness: 'fresh',
    quality: 'measured',
  },
}

const ThemeTokenProbe = () => {
  const { theme } = useContext(PluginsThemeContext)

  return (
    <output
      data-background={theme.semantic.color.background.neutral100}
      data-border={theme.semantic.color.border.neutral500}
      data-testid="controls-theme-tokens"
    />
  )
}

const renderComponent = (
  propsOverride?: Partial<VectorVisualizerControlsProps>,
  colorMode: 'light' | 'dark' = 'light',
) => {
  const component = (
    <VectorVisualizerControls {...defaultProps} {...propsOverride} />
  )

  document.body.className = colorMode === 'dark' ? 'theme_DARK' : 'theme_LIGHT'

  return render(
    <ThemeProvider>
      <ThemeTokenProbe />
      {component}
    </ThemeProvider>,
  )
}

describe('VectorVisualizerControls', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    document.body.className = ''
  })

  it('should render the persistent controls landmark without a one-option projection menu', () => {
    renderComponent()

    expect(screen.getByTestId('vector-visualizer-controls')).toHaveAttribute(
      'aria-label',
      'Vector visualizer controls',
    )
    expect(
      screen.queryByRole('button', { name: 'Projection' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText('UMAP is the supported local 2D projection.'),
    ).not.toBeInTheDocument()
    expect(
      screen.getByLabelText('Sampling and freshness summary'),
    ).toHaveTextContent('UMAP')
    expect(screen.getByLabelText('Filter syntax help')).toHaveTextContent(
      'Filter syntax is supplied by the selected source.',
    )
  })

  it('should make an unsupported filter unavailable with its reason', () => {
    renderComponent({
      filter: {
        value: '',
        disabled: true,
        disabledReason: 'Filters are unavailable for Vector Set sampling.',
      },
    })

    expect(screen.getByLabelText('Filter sampled documents')).toBeDisabled()
    expect(
      screen.getByText('Filters are unavailable for Vector Set sampling.'),
    ).toBeInTheDocument()
  })

  it('should expose loading state without changing the controls hierarchy', () => {
    renderComponent({ loading: true })

    expect(screen.getByText('Updating visualizer controls.')).toHaveAttribute(
      'role',
      'status',
    )
    expect(screen.getByText('Updating visualizer controls.')).toHaveTextContent(
      'Updating visualizer controls.',
    )
    expect(screen.getByTestId('vector-visualizer-controls')).toContainElement(
      screen.getByText('Controls'),
    )
  })

  it('should forward every supported control callback', async () => {
    const onSourceChange = jest.fn()
    const onFilterChange = jest.fn()
    const onRemove = jest.fn()
    const onColorByChange = jest.fn()
    const onSampleBudgetChange = jest.fn()
    const onClusterLabelsChange = jest.fn()
    const onClusterLabelLimitChange = jest.fn()
    const onOutliersChange = jest.fn()
    const user = userEvent.setup()

    renderComponent({
      source: {
        label: defaultProps.source.label,
        value: defaultProps.source.value,
        onChange: onSourceChange,
        options: [
          { value: 'embedding', label: 'embedding' },
          { value: 'title_embedding', label: 'title_embedding' },
        ],
      },
      filter: {
        value: defaultProps.filter!.value,
        activeFilters: defaultProps.filter!.activeFilters,
        syntaxHelp: defaultProps.filter!.syntaxHelp,
        onChange: onFilterChange,
        onRemove,
      },
      colorBy: {
        label: defaultProps.colorBy!.label,
        value: defaultProps.colorBy!.value,
        onChange: onColorByChange,
        options: [
          { value: 'category', label: 'category' },
          { value: 'author', label: 'author' },
        ],
      },
      sampleBudget: {
        value: defaultProps.sampleBudget.value,
        min: defaultProps.sampleBudget.min,
        max: defaultProps.sampleBudget.max,
        onChange: onSampleBudgetChange,
      },
      clusterLabels: { checked: true, onChange: onClusterLabelsChange },
      clusterLabelLimit: {
        label: 'Cluster label limit',
        value: 'top-12',
        options: defaultProps.clusterLabelLimit!.options,
        onChange: onClusterLabelLimitChange,
      },
      outliers: { checked: false, onChange: onOutliersChange },
    })

    const selectControls = screen.getAllByRole('combobox')
    await user.click(selectControls[0])
    await user.click(screen.getByText('title_embedding'))
    await user.click(selectControls[1])
    await user.click(screen.getByText('author'))
    await user.click(screen.getByLabelText('Cluster label limit'))
    await user.click(screen.getByText('Top 25'))
    fireEvent.change(screen.getByLabelText('Filter sampled documents'), {
      target: { value: 'category:music' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: 'Remove filter category:books' }),
    )
    fireEvent.change(screen.getByLabelText(/Sample budget/), {
      target: { value: '2500' },
    })
    await user.click(screen.getAllByRole('switch')[0])
    await user.click(screen.getAllByRole('switch')[1])

    expect(onSourceChange).toHaveBeenCalledWith('title_embedding')
    expect(onFilterChange).toHaveBeenCalledWith('category:music')
    expect(onRemove).toHaveBeenCalledWith('category')
    expect(onColorByChange).toHaveBeenCalledWith('author')
    expect(onSampleBudgetChange).toHaveBeenCalledWith(2500)
    expect(onClusterLabelsChange).toHaveBeenCalledWith(false)
    expect(onClusterLabelLimitChange).toHaveBeenCalledWith('top-25')
    expect(onOutliersChange).toHaveBeenCalledWith(true)
  })

  it('should apply color changes to the current sample and expose a controlled cluster label limit', () => {
    renderComponent({
      metadataField: {
        value: 'category',
        onChange: jest.fn(),
      },
    })

    expect(
      screen.getByText(
        'Changes apply immediately to the current sampled Atlas using response-backed values.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Enter an allow-listed scalar field to color response-backed values in the current sample.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText(/resample/i)).not.toBeInTheDocument()
    expect(screen.getByLabelText('Cluster label limit')).toHaveTextContent(
      'Top 12',
    )
    expect(screen.getByLabelText('Cluster label limit')).not.toBeDisabled()
  })

  it('should disable every callback-driven control when a response-backed callback is absent', () => {
    renderComponent({
      source: {
        label: 'Vector field',
        value: 'embedding',
        options: [{ value: 'embedding', label: 'embedding' }],
      } as unknown as VectorVisualizerControlsProps['source'],
      filter: {
        value: 'category:books',
        activeFilters: [{ id: 'category', label: 'category:books' }],
      } as unknown as NonNullable<VectorVisualizerControlsProps['filter']>,
      colorBy: {
        label: 'Color by',
        value: 'category',
        options: [{ value: 'category', label: 'category' }],
      } as unknown as NonNullable<VectorVisualizerControlsProps['colorBy']>,
      sampleBudget: {
        value: 2000,
        min: 500,
        max: 20000,
      } as unknown as VectorVisualizerControlsProps['sampleBudget'],
      clusterLabels: {
        checked: true,
      } as unknown as NonNullable<
        VectorVisualizerControlsProps['clusterLabels']
      >,
      clusterLabelLimit: {
        label: 'Cluster label limit',
        value: 'top-12',
        options: [{ value: 'top-12', label: 'Top 12' }],
      } as unknown as NonNullable<
        VectorVisualizerControlsProps['clusterLabelLimit']
      >,
      outliers: {
        checked: false,
      } as unknown as NonNullable<VectorVisualizerControlsProps['outliers']>,
    })

    screen.getAllByRole('combobox').forEach((control) => {
      expect(control).toBeDisabled()
    })
    expect(screen.getByLabelText('Filter sampled documents')).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Remove filter category:books' }),
    ).toBeDisabled()
    expect(screen.getByLabelText(/Sample budget/)).toBeDisabled()
    screen.getAllByRole('switch').forEach((control) => {
      expect(control).toBeDisabled()
    })
    expect(
      screen.getAllByText(/response-backed action is connected/),
    ).toHaveLength(8)
  })

  it('should preserve an explicit disabled reason when no callback is supplied', () => {
    renderComponent({
      filter: {
        value: '',
        disabled: true,
        disabledReason: 'Filters are unavailable for Vector Set sampling.',
      },
    })

    expect(
      screen.getByText('Filters are unavailable for Vector Set sampling.'),
    ).toBeInTheDocument()
  })

  it('should call the active-filter removal callback', () => {
    const onRemove = jest.fn()
    renderComponent({ filter: { ...defaultProps.filter!, onRemove } })

    fireEvent.click(
      screen.getByRole('button', { name: 'Remove filter category:books' }),
    )

    expect(onRemove).toHaveBeenCalledWith('category')
  })

  it('should resolve distinct semantic control tokens in both RedisInsight themes', () => {
    const { unmount } = renderComponent(undefined, 'light')
    const lightTokens = screen.getByTestId('controls-theme-tokens')
    const lightBackground = lightTokens.getAttribute('data-background')
    const lightBorder = lightTokens.getAttribute('data-border')

    unmount()
    renderComponent(undefined, 'dark')
    const darkTokens = screen.getByTestId('controls-theme-tokens')

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
})
