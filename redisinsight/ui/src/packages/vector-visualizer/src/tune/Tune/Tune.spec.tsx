import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'

import { ThemeProvider } from 'uiSrc/components/base/utils/pluginsThemeContext'

import type { TuneRecommendation } from '../recommendations'
import { Tune } from './Tune'
import type { SensitivityResult } from './Tune.types'

const buildCoordinates = (count: number): Float32Array =>
  Float32Array.from({ length: count * 2 }, (_, index) => index % 5)

const sensitivityRuns: SensitivityResult[] = [5, 15, 30].map((nNeighbors) => ({
  nNeighbors,
  quality: 0.8,
  coordinates: buildCoordinates(4),
  count: 4,
}))

const recommendations: TuneRecommendation[] = [
  {
    parameter: 'EF_RUNTIME',
    currentValue: 100,
    suggestedRange: '200-300',
    guidance: 'Medium indexes usually need EF_RUNTIME near 200.',
    impact: 'Higher EF_RUNTIME improves recall at the cost of latency.',
    confidence: 'medium',
  },
]

const renderComponent = (
  props: Partial<React.ComponentProps<typeof Tune>> = {},
) =>
  render(
    <ThemeProvider>
      <Tune
        recommendations={recommendations}
        sensitivityRuns={sensitivityRuns}
        onSelectK={() => undefined}
        {...props}
      />
    </ThemeProvider>,
  )

describe('Tune', () => {
  let getContextSpy: jest.SpyInstance

  beforeEach(() => {
    const context = {
      clearRect: jest.fn(),
      beginPath: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      fillStyle: '',
    }
    getContextSpy = jest
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue(context as unknown as CanvasRenderingContext2D)
  })

  afterEach(() => {
    getContextSpy.mockRestore()
  })

  it('renders the sensitivity section with a MiniAtlas thumbnail per run', () => {
    renderComponent()

    expect(
      screen.getByRole('button', { name: 'MiniAtlas K=5' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'MiniAtlas K=15' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'MiniAtlas K=30' }),
    ).toBeInTheDocument()
  })

  it('renders the recommendations list', () => {
    renderComponent()

    expect(screen.getByText('EF_RUNTIME')).toBeInTheDocument()
    expect(
      screen.getByText('Medium indexes usually need EF_RUNTIME near 200.'),
    ).toBeInTheDocument()
    expect(screen.getByText('medium')).toBeInTheDocument()
  })

  it('calls onSelectK when a thumbnail is clicked', () => {
    const onSelectK = jest.fn()
    renderComponent({ onSelectK })

    fireEvent.click(screen.getByRole('button', { name: 'MiniAtlas K=15' }))

    expect(onSelectK).toHaveBeenCalledWith(15)
  })

  it('shows the empty state with no sensitivity data', () => {
    renderComponent({ sensitivityRuns: [] })

    expect(
      screen.getByText('No sensitivity runs are available.'),
    ).toBeInTheDocument()
  })

  it('shows the running sensitivity status before maps are available', () => {
    renderComponent({ sensitivityRuns: [], sensitivityStatus: 'running' })

    expect(screen.getByText('Running k sensitivity maps…')).toBeInTheDocument()
    expect(
      screen.queryByText('No sensitivity runs are available.'),
    ).not.toBeInTheDocument()
  })

  it('shows why sensitivity maps are unavailable', () => {
    renderComponent({ sensitivityRuns: [], sensitivityStatus: 'unavailable' })

    expect(
      screen.getByText(
        'Sensitivity maps need at least 4 retained sampled vectors. Resample vectors and try again.',
      ),
    ).toBeInTheDocument()
  })

  it('shows the heuristic disclaimer', () => {
    renderComponent()

    expect(
      screen.getByText('Heuristic guidance, not optimization.'),
    ).toBeInTheDocument()
  })

  it('renders the current config section', () => {
    renderComponent({
      recommendations: [],
      currentConfig: { EF_RUNTIME: 100, M: 16, unsetValue: undefined },
      sourceKind: 'search-index',
    })

    expect(screen.getByText('EF_RUNTIME')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('M')).toBeInTheDocument()
    expect(screen.getByText('16')).toBeInTheDocument()
    expect(screen.queryByText('unsetValue')).not.toBeInTheDocument()
    expect(screen.queryByText('undefined')).not.toBeInTheDocument()
    expect(
      screen.getByText(
        'FT.INFO-relevant parameters observed for this Search index.',
      ),
    ).toBeInTheDocument()
  })
})
