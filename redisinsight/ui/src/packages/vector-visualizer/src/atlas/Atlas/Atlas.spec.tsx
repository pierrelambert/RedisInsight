import React from 'react'
import { act, render, screen } from '@testing-library/react'

import { ThemeProvider } from 'uiSrc/components/base/utils/pluginsThemeContext'

import { Atlas } from './Atlas'

interface RendererCallbacks {
  onSelect(ids: string[]): void
  onHover(id?: string): void
  onSelectionBoxChange?(box?: {
    x: number
    y: number
    width: number
    height: number
  }): void
  onUnsupported(): void
  onContextLost(): void
  onContextRestored(): void
  interactionMode?: 'pan' | 'region'
}

let mockCallbacks: RendererCallbacks | undefined
const mockDestroy = jest.fn()
const mockSetDensityGrid = jest.fn()
const mockSetDensityVisible = jest.fn()

jest.mock('../../renderer/AtlasRenderer', () => ({
  AtlasRenderer: jest
    .fn()
    .mockImplementation(
      (_canvas: HTMLCanvasElement, options: RendererCallbacks) => {
        mockCallbacks = options
        return {
          setPoints: jest.fn(),
          resize: jest.fn(),
          destroy: mockDestroy,
          setDensityGrid: mockSetDensityGrid,
          setDensityVisible: mockSetDensityVisible,
        }
      },
    ),
}))

const provenance = {
  sourceCount: 2,
  sampleCount: 2,
  method: 'UMAP' as const,
  seed: 7,
  freshness: 'fresh' as const,
  exactness: 'approximate' as const,
  quality: { kind: 'unknown' as const, reason: 'not-measured' as const },
}

const renderComponent = (
  props: Partial<React.ComponentProps<typeof Atlas>> = {},
) =>
  render(
    <ThemeProvider>
      <Atlas
        coordinates={new Float32Array([0, 0, 1, 1])}
        sampleIds={['a', 'b']}
        provenance={provenance}
        onSelectionChange={jest.fn()}
        {...props}
      />
    </ThemeProvider>,
  )

describe('Atlas', () => {
  beforeEach(() => {
    mockCallbacks = undefined
    mockDestroy.mockClear()
    mockSetDensityGrid.mockClear()
    mockSetDensityVisible.mockClear()
    global.ResizeObserver = class {
      observe(): void {}

      disconnect(): void {}
    } as unknown as typeof ResizeObserver
  })

  it('keeps the canvas mounted through context loss and restores a visible status', () => {
    renderComponent()

    expect(screen.getByText('UMAP 1 · derived coordinate')).toBeVisible()
    expect(screen.getByText('UMAP 2 · derived coordinate')).toBeVisible()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    act(() => mockCallbacks?.onContextLost())
    expect(screen.getByLabelText(/Atlas plot/)).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('context was lost')

    act(() => mockCallbacks?.onContextRestored())
    expect(screen.getByRole('status')).toHaveTextContent('context was restored')
  })

  it('links a point selection to the accessible caller-provided Selection contract', () => {
    const onSelectionChange = jest.fn()
    renderComponent({
      onSelectionChange,
      renderAccessibleSelection: (ids) => <output>{ids.join(',')}</output>,
    })

    act(() => mockCallbacks?.onSelect(['b']))
    expect(onSelectionChange).toHaveBeenCalledWith(['b'])
    expect(screen.getByText('b')).toBeInTheDocument()
  })

  it('exposes hover state through the same accessible selection contract', () => {
    renderComponent({
      renderAccessibleSelection: (_ids, hoveredId) => (
        <output>{hoveredId ? `Hovering ${hoveredId}` : 'No hover'}</output>
      ),
    })

    act(() => mockCallbacks?.onHover('a'))
    expect(screen.getByText('Hovering a')).toBeInTheDocument()
  })

  it('lists every active point state rather than relying on a single color', () => {
    renderComponent({ pointStates: { b: ['selected', 'outlier'] } })

    expect(screen.getByText('b: selected, outlier')).toBeInTheDocument()
  })

  it('feeds controlled selected IDs to the renderer as a non-color selected marker state', () => {
    const setPoints = jest.fn()
    const Renderer = require('../../renderer/AtlasRenderer').AtlasRenderer
    Renderer.mockImplementationOnce(() => ({
      setPoints,
      resize: jest.fn(),
      destroy: mockDestroy,
      setDensityGrid: mockSetDensityGrid,
      setDensityVisible: mockSetDensityVisible,
    }))
    renderComponent({ selectedIds: ['b'] })
    expect(setPoints.mock.calls.at(-1)?.[3]).toMatchObject({ b: ['selected'] })
  })

  it('forwards caller-controlled metadata colors without replacing selection state', () => {
    const setPoints = jest.fn()
    const Renderer = require('../../renderer/AtlasRenderer').AtlasRenderer
    Renderer.mockImplementationOnce(() => ({
      setPoints,
      resize: jest.fn(),
      destroy: mockDestroy,
      setDensityGrid: mockSetDensityGrid,
      setDensityVisible: mockSetDensityVisible,
    }))
    renderComponent({ selectedIds: ['b'], pointColors: { b: '#aabbcc' } })
    expect(setPoints.mock.calls.at(-1)?.[3]).toMatchObject({ b: ['selected'] })
    expect(setPoints.mock.calls.at(-1)?.[4]).toEqual({ b: '#aabbcc' })
  })

  it('renders a persistent selected-region overlay for region interaction', () => {
    renderComponent({ interactionMode: 'region', selectedIds: ['a', 'b'] })

    expect(mockCallbacks?.interactionMode).toBe('region')
    expect(screen.getByLabelText(/Selection plot/)).toHaveAttribute(
      'data-selection-mode',
      'region',
    )

    act(() =>
      mockCallbacks?.onSelectionBoxChange?.({
        x: 0.2,
        y: 0.3,
        width: 0.4,
        height: 0.5,
      }),
    )

    expect(screen.getByLabelText('Selected region bounds')).toHaveAttribute(
      'data-selected-count',
      '2',
    )
    expect(screen.getByLabelText('Selected region bounds')).toHaveStyle({
      insetInlineStart: '20%',
      insetBlockStart: '30%',
      inlineSize: '40%',
      blockSize: '50%',
    })
  })

  it('renders the legend panel when legendEntries are provided', () => {
    renderComponent({
      legendEntries: [
        { label: 'Cluster 0', color: '#ff0000', count: 10 },
        { label: 'Cluster 1', color: '#00ff00', count: 5 },
      ],
    })

    expect(screen.getByTestId('atlas-legend')).toBeInTheDocument()
    expect(screen.getByLabelText('Cluster 0 (10)')).toBeInTheDocument()
    expect(screen.getByLabelText('Cluster 1 (5)')).toBeInTheDocument()
  })

  it('does not render the legend panel when legendEntries is empty', () => {
    renderComponent({ legendEntries: [] })

    expect(screen.queryByTestId('atlas-legend')).not.toBeInTheDocument()
  })

  it('hides cluster labels when showMapLabels is false', () => {
    renderComponent({
      clusterLabels: [
        { id: 'c1', label: 'Group A', x: 0.5, y: 0.5, count: 10 },
      ],
      showMapLabels: false,
    })

    expect(
      screen.queryByLabelText('Group A cluster label'),
    ).not.toBeInTheDocument()
  })

  it('shows cluster labels when showMapLabels is true', () => {
    renderComponent({
      clusterLabels: [
        { id: 'c1', label: 'Group A', x: 0.5, y: 0.5, count: 10 },
      ],
      showMapLabels: true,
    })

    expect(screen.getByLabelText('Group A cluster label')).toBeInTheDocument()
  })

  it('passes density grid data to the renderer', () => {
    const grid = new Float32Array(16)
    renderComponent({
      showDensity: true,
      densityGrid: grid,
      densityGridSize: 4,
    })

    expect(mockSetDensityGrid).toHaveBeenCalledWith(grid, 4)
    expect(mockSetDensityVisible).toHaveBeenCalledWith(true)
  })
})
