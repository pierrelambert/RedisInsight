import React, { useContext } from 'react'

import {
  PluginsThemeContext,
  ThemeProvider,
} from 'uiSrc/components/base/utils/pluginsThemeContext'
import { fireEvent, render, screen, within } from 'uiSrc/utils/test-utils'

import { VectorVisualizerCanvas } from './VectorVisualizerCanvas'
import type { VectorVisualizerCanvasProps } from './VectorVisualizerCanvas.types'

describe('VectorVisualizerCanvas', () => {
  const onModeChange = jest.fn()
  const onUtilityAction = jest.fn()
  const defaultProps: VectorVisualizerCanvasProps = {
    mode: 'atlas',
    onModeChange,
    status: 'Ready',
    selectionCount: 1,
    utilityActions: [
      {
        id: 'reset',
        label: 'Reset view',
        onClick: onUtilityAction,
      },
    ],
    views: {
      atlas: <span>Atlas plot</span>,
      neighbors: <span>Neighbors plot</span>,
      selection: <span>Selection plot</span>,
    },
  }

  const ThemeTokenProbe = () => {
    const { theme } = useContext(PluginsThemeContext)

    return (
      <span
        aria-hidden="true"
        data-background={theme.semantic.color.background.neutral100}
        data-border={theme.semantic.color.border.neutral500}
        data-testid="canvas-theme-tokens"
      />
    )
  }

  const renderWithTheme = (
    component: React.ReactNode,
    colorMode: 'light' | 'dark' = 'light',
  ) => {
    document.body.className =
      colorMode === 'dark' ? 'theme_DARK' : 'theme_LIGHT'

    return render(
      <ThemeProvider>
        <ThemeTokenProbe />
        {component}
      </ThemeProvider>,
    )
  }

  const renderComponent = (
    propsOverride: Partial<VectorVisualizerCanvasProps> = {},
    colorMode: 'light' | 'dark' = 'light',
  ) => {
    const props = { ...defaultProps, ...propsOverride }

    return renderWithTheme(<VectorVisualizerCanvas {...props} />, colorMode)
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    document.body.className = ''
  })

  it('should expose the visualization landmark and utility actions without duplicating page context', () => {
    renderComponent()

    expect(
      screen.getByRole('region', { name: 'Vector visualizer visualization' }),
    ).toHaveAttribute('data-visualizer-state', 'ready')
    expect(
      screen.queryByText('Search index idx-products'),
    ).not.toBeInTheDocument()
    expect(screen.queryByText('Fresh sample')).not.toBeInTheDocument()
    expect(screen.queryByText('1 selected')).not.toBeInTheDocument()

    const tabList = screen.getByRole('tablist')
    const utilityActions = screen.getByRole('group', {
      name: 'Visualization actions',
    })

    expect(tabList).not.toContainElement(utilityActions)
    expect(tabList.parentElement).toContainElement(utilityActions)

    fireEvent.click(screen.getByRole('button', { name: 'Reset view' }))

    expect(onUtilityAction).toHaveBeenCalledTimes(1)
  })

  it('should update controlled panels and focus for all tab navigation keys', () => {
    const ControlledCanvas = () => {
      const [mode, setMode] =
        React.useState<VectorVisualizerCanvasProps['mode']>('atlas')

      return (
        <VectorVisualizerCanvas
          {...defaultProps}
          mode={mode}
          onModeChange={setMode}
        />
      )
    }

    renderWithTheme(<ControlledCanvas />)

    const atlasTab = screen.getByRole('tab', { name: 'Atlas' })
    expect(screen.getByRole('tablist')).toBeInTheDocument()
    expect(atlasTab).toHaveAttribute('aria-selected', 'true')

    fireEvent.keyDown(atlasTab, { key: 'ArrowRight' })
    expect(screen.getByRole('tab', { name: 'Neighbors' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('tabpanel', { name: 'Neighbors' })).toBeVisible()
    expect(screen.getByRole('tab', { name: 'Neighbors' })).toHaveFocus()

    fireEvent.keyDown(screen.getByRole('tab', { name: 'Neighbors' }), {
      key: 'ArrowLeft',
    })
    expect(atlasTab).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel', { name: 'Atlas' })).toBeVisible()
    expect(atlasTab).toHaveFocus()

    fireEvent.keyDown(atlasTab, { key: 'End' })
    expect(screen.getByRole('tab', { name: 'Selection' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('tabpanel', { name: 'Selection' })).toBeVisible()
    expect(screen.getByRole('tab', { name: 'Selection' })).toHaveFocus()

    fireEvent.keyDown(screen.getByRole('tab', { name: 'Selection' }), {
      key: 'Home',
    })
    expect(atlasTab).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel', { name: 'Atlas' })).toBeVisible()
    expect(atlasTab).toHaveFocus()
  })

  it('should scope mode IDs and focus to each Canvas instance', () => {
    renderWithTheme(
      <>
        <VectorVisualizerCanvas {...defaultProps} />
        <VectorVisualizerCanvas {...defaultProps} />
      </>,
    )

    const [firstCanvas, secondCanvas] = screen.getAllByRole('region', {
      name: 'Vector visualizer visualization',
    })
    const firstAtlasTab = within(firstCanvas).getByRole('tab', {
      name: 'Atlas',
    })
    const secondAtlasTab = within(secondCanvas).getByRole('tab', {
      name: 'Atlas',
    })

    expect(firstAtlasTab.id).not.toBe(secondAtlasTab.id)
    expect(firstAtlasTab).not.toHaveAttribute(
      'aria-controls',
      secondAtlasTab.getAttribute('aria-controls'),
    )

    fireEvent.keyDown(firstAtlasTab, { key: 'ArrowRight' })

    expect(
      within(firstCanvas).getByRole('tab', { name: 'Neighbors' }),
    ).toHaveFocus()
    expect(
      within(secondCanvas).getByRole('tab', { name: 'Atlas' }),
    ).toHaveAttribute('aria-selected', 'true')
  })

  it('should preserve inactive view content while only exposing the active panel', () => {
    renderComponent()

    expect(screen.getByText('Atlas plot')).toBeVisible()
    expect(screen.getByText('Neighbors plot')).toBeInTheDocument()
    expect(screen.getByText('Selection plot')).toBeInTheDocument()
    expect(screen.getByRole('tabpanel', { name: 'Atlas' })).toBeVisible()
    const panelFor = (mode: 'Neighbors' | 'Selection') =>
      document.getElementById(
        screen.getByRole('tab', { name: mode }).getAttribute('aria-controls')!,
      )!
    const neighborsPanel = panelFor('Neighbors')
    const selectionPanel = panelFor('Selection')

    expect(neighborsPanel).toHaveAttribute('data-active', 'false')
    expect(selectionPanel).toHaveAttribute('data-active', 'false')
    expect(neighborsPanel).not.toBeVisible()
    expect(selectionPanel).not.toBeVisible()
  })

  it.each([
    ['loading', 'Loading visualizer', <span>Loading plot</span>],
    ['error', 'Sampling failed', <span>Retry sampling</span>],
  ] as const)(
    'should render the %s state slot without discarding its views',
    (state, status, slot) => {
      renderComponent({
        state,
        status,
        loadingSlot: state === 'loading' ? slot : undefined,
        errorSlot: state === 'error' ? slot : undefined,
      })

      expect(
        screen.getByText(
          state === 'loading' ? 'Loading plot' : 'Retry sampling',
        ),
      ).toBeInTheDocument()
      expect(screen.getByText('Atlas plot')).toBeInTheDocument()
    },
  )

  it.each([
    ['empty', 'No vectors were returned for this bounded sample.'],
    ['unsupported', 'This source or vector field is unavailable for sampling.'],
    ['acl-unavailable', 'Redis ACLs do not allow this sampling capability.'],
    [
      'cancelled',
      'Sampling was cancelled and raw vectors were cleared from memory.',
    ],
  ] as const)(
    'should reserve the primary canvas region for an explicit %s state',
    (state, status) => {
      renderComponent({
        state,
        status,
      })

      expect(
        screen.getByRole('region', { name: 'Vector visualizer visualization' }),
      ).toHaveAttribute('data-visualizer-state', state)
      expect(
        screen.getByTestId('vector-visualizer-state-slot'),
      ).toHaveTextContent(status)
      expect(screen.getByText('Atlas plot')).toBeInTheDocument()
      expect(
        document.getElementById(
          screen
            .getByRole('tab', { name: 'Atlas' })
            .getAttribute('aria-controls')!,
        ),
      ).not.toBeVisible()
    },
  )

  it('should apply distinct semantic background and border tokens in both themes', () => {
    const { container: lightContainer, unmount } = renderComponent({}, 'light')
    const lightCanvas = within(lightContainer).getByRole('region', {
      name: 'Vector visualizer visualization',
    })
    const lightTokens = screen.getByTestId('canvas-theme-tokens')
    const lightBackground = lightTokens.getAttribute('data-background')
    const lightBorder = lightTokens.getAttribute('data-border')
    const lightCanvasClassName = lightCanvas.className

    unmount()

    const { container: darkContainer } = renderComponent({}, 'dark')
    const darkCanvas = within(darkContainer).getByRole('region', {
      name: 'Vector visualizer visualization',
    })
    const darkTokens = screen.getByTestId('canvas-theme-tokens')
    const darkBackground = darkTokens.getAttribute('data-background')
    const darkBorder = darkTokens.getAttribute('data-border')

    expect(darkCanvas).toBeInTheDocument()
    expect(lightCanvasClassName).not.toBe(darkCanvas.className)
    expect(lightBackground).toBeTruthy()
    expect(lightBorder).toBeTruthy()
    expect(darkBackground).toBeTruthy()
    expect(darkBorder).toBeTruthy()
    expect(darkBackground).not.toBe(lightBackground)
    expect(darkBorder).not.toBe(lightBorder)
    expect(document.head.innerHTML).toContain(darkBackground!)
    expect(document.head.innerHTML).toContain(darkBorder!)
  })
})
