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
  })
})
