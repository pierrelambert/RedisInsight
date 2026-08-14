import React from 'react'
import { render, screen } from 'uiSrc/utils/test-utils'

import { VectorVisualizerWorkspace } from './VectorVisualizerWorkspace'

describe('VectorVisualizerWorkspace', () => {
  const renderComponent = () =>
    render(
      <VectorVisualizerWorkspace
        controls={
          <aside data-testid="vector-visualizer-controls">Controls</aside>
        }
        results={
          <aside data-testid="vector-visualizer-results-inspector">
            Results
          </aside>
        }
        visualization={
          <section data-testid="vector-visualizer-visualization">
            Canvas
          </section>
        }
        additional={
          <section data-testid="vector-visualizer-additional">
            Additional workflows
          </section>
        }
      />,
    )

  it('keeps controls, visualization, and results in one named desktop workspace', () => {
    renderComponent()

    const workspace = screen.getByTestId('vector-visualizer-workspace')
    expect(workspace).toHaveAttribute(
      'aria-label',
      'Vector visualizer workspace',
    )
    expect(screen.getByTestId('vector-visualizer-controls')).toBeVisible()
    expect(screen.getByTestId('vector-visualizer-visualization')).toBeVisible()
    expect(
      screen.getByTestId('vector-visualizer-results-inspector'),
    ).toBeVisible()
    expect(
      screen.getByTestId('vector-visualizer-additional-workflows-region'),
    ).toContainElement(screen.getByTestId('vector-visualizer-additional'))
    expect(
      screen.getByTestId('vector-visualizer-visualization'),
    ).not.toContainElement(screen.getByTestId('vector-visualizer-additional'))
  })

  it('keeps additional workflows in a separate center-bottom panel outside the chart region', () => {
    renderComponent()

    const workspace = screen.getByTestId('vector-visualizer-workspace')
    const visualizationRegion = screen.getByTestId(
      'vector-visualizer-visualization-region',
    )
    const controlsRegion = screen.getByTestId(
      'vector-visualizer-controls-region',
    )
    const resultsRegion = screen.getByTestId('vector-visualizer-results-region')
    const additionalRegion = screen.getByTestId(
      'vector-visualizer-additional-workflows-region',
    )

    expect(workspace).toContainElement(controlsRegion)
    expect(workspace).toContainElement(visualizationRegion)
    expect(workspace).toContainElement(resultsRegion)
    expect(workspace).toContainElement(additionalRegion)
    expect(visualizationRegion).not.toContainElement(additionalRegion)
    expect(controlsRegion).not.toContainElement(additionalRegion)
    expect(resultsRegion).not.toContainElement(additionalRegion)
  })
})
