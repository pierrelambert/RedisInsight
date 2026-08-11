import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'

import { ThemeProvider } from 'uiSrc/components/base/utils/pluginsThemeContext'

import { DuplicateExplorer, OutlierExplorer, XRay } from './HealthExplorers'

const renderComponent = (
  component = (
    <ThemeProvider>
      <XRay facts={[]} />
    </ThemeProvider>
  ),
) => render(component)

describe('Health explorers', () => {
  it('labels duplicate candidates with their original-space rule and returns group IDs', () => {
    const onSelectionChange = jest.fn()
    renderComponent(
      <ThemeProvider>
        <DuplicateExplorer
          evidence={{
            kind: 'known',
            groups: [{ ids: ['a', 'b'] }],
            sampleCount: 2,
            similarityThreshold: 0.995,
            freshness: 'fresh',
            coverage: 'partial-neighbor-graph',
            formula:
              'connected components over original-space cosine similarity',
          }}
          onSelectionChange={onSelectionChange}
        />
      </ThemeProvider>,
    )
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Inspect duplicate candidate group 1',
      }),
    )
    expect(onSelectionChange).toHaveBeenCalledWith(['a', 'b'])
    expect(screen.getAllByText(/cosine similarity/)).not.toHaveLength(0)
  })

  it('exposes the default candidate parameter as a configurable control before recomputation', () => {
    const onDuplicateConfigChange = jest.fn()
    renderComponent(
      <ThemeProvider>
        <DuplicateExplorer
          evidence={{
            kind: 'known',
            groups: [],
            sampleCount: 2,
            similarityThreshold: 0.995,
            freshness: 'fresh',
            coverage: 'partial-neighbor-graph',
            formula:
              'connected components over original-space cosine similarity',
          }}
          onSelectionChange={jest.fn()}
          onConfigChange={onDuplicateConfigChange}
        />
      </ThemeProvider>,
    )
    fireEvent.change(
      screen.getByLabelText('Duplicate cosine similarity threshold'),
      { target: { value: '0.99' } },
    )
    expect(onDuplicateConfigChange).toHaveBeenCalledWith(0.99)
  })

  it('renders and configures an L2 duplicate rule without cosine labels', () => {
    const onConfigChange = jest.fn()
    renderComponent(
      <ThemeProvider>
        <DuplicateExplorer
          evidence={{
            kind: 'known',
            groups: [],
            sampleCount: 3,
            similarityThreshold: 0.05,
            threshold: 0.05,
            metric: 'l2',
            pairMeasure: 'L2 distance',
            duplicateDirection: 'at-most',
            freshness: 'fresh',
            coverage: 'sample-pair-complete',
            formula: 'connected components over original-space L2 distance',
          }}
          onSelectionChange={jest.fn()}
          onConfigChange={onConfigChange}
        />
      </ThemeProvider>,
    )

    expect(screen.getByText(/L2 distance ≤ 0.05/)).toBeInTheDocument()
    expect(screen.queryByText(/cosine similarity ≥/)).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Duplicate L2 distance threshold'), {
      target: { value: '0.1' },
    })
    expect(onConfigChange).toHaveBeenCalledWith(0.1)
  })

  it('keeps missing outlier evidence Unknown rather than healthy', () => {
    renderComponent(
      <ThemeProvider>
        <OutlierExplorer
          evidence={{ kind: 'unknown', reason: 'sample-too-small-for-k' }}
          onSelectionChange={jest.fn()}
        />
      </ThemeProvider>,
    )
    expect(screen.getByRole('status')).toHaveTextContent(
      'Unknown candidate evidence',
    )
    expect(screen.getByText(/evidence is unavailable/)).toBeInTheDocument()
  })

  it('renders x-ray facts as severity metric tiles with formula and freshness', () => {
    renderComponent(
      <ThemeProvider>
        <XRay
          facts={[
            {
              label: 'Metadata coverage',
              value: '3 / 4',
              formula: 'present/non-empty values',
              sampleCount: 4,
              freshness: 'fresh',
              status: 'candidate',
            },
          ]}
        />
      </ThemeProvider>,
    )

    const tile = screen.getByTestId('health-metric-tile-metadata-coverage')
    expect(tile).toHaveAttribute('data-health-severity', 'notice')
    expect(tile).toHaveTextContent('Metadata coverage')
    expect(tile).toHaveTextContent('3 / 4')
    expect(tile).toHaveTextContent('Sampled candidate')
    expect(screen.getByText(/present\/non-empty values/)).toBeInTheDocument()
  })

  it('exposes both outlier parameters and returns the requested configuration', () => {
    const onConfigChange = jest.fn()
    renderComponent(
      <ThemeProvider>
        <OutlierExplorer
          evidence={{
            kind: 'known',
            ids: [],
            sampleCount: 12,
            k: 10,
            robustDeviationThreshold: 3.5,
            medianDistance: 0.1,
            mad: 0.01,
            freshness: 'fresh',
            exactness: 'approximate',
            formula: 'median/MAD over kth-neighbor cosine distances',
          }}
          onSelectionChange={jest.fn()}
          onConfigChange={onConfigChange}
        />
      </ThemeProvider>,
    )

    fireEvent.change(screen.getByLabelText('Outlier neighbor count k'), {
      target: { value: '12' },
    })
    fireEvent.change(
      screen.getByLabelText('Outlier robust deviation threshold'),
      { target: { value: '4' } },
    )

    expect(onConfigChange).toHaveBeenNthCalledWith(1, {
      k: 12,
      robustDeviationThreshold: 3.5,
    })
    expect(onConfigChange).toHaveBeenNthCalledWith(2, {
      k: 10,
      robustDeviationThreshold: 4,
    })
    expect(screen.getByText(/exactness: approximate/)).toBeInTheDocument()
  })

  it('renders an explicit X-ray empty state', () => {
    renderComponent(
      <ThemeProvider>
        <XRay facts={[]} />
      </ThemeProvider>,
    )

    expect(screen.getByRole('status')).toHaveTextContent(
      'No bounded sample evidence is available',
    )
  })
})
