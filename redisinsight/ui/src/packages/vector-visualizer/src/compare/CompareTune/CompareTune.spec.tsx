import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'

import { ThemeProvider } from 'uiSrc/components/base/utils/pluginsThemeContext'

import { CompareTune } from './CompareTune'
import type { LocalManifestV1 } from '../compare'

const left: LocalManifestV1 = {
  version: 1,
  sourceKind: 'search-index',
  sourceId: 'idx-products',
  dimensions: 3,
  metric: 'cosine',
  vectorField: 'embedding',
  sampleCount: 100,
  sourceCount: 1000,
  sampleIdDigest: 'hash31:base',
}

const renderComponent = (
  props: Partial<React.ComponentProps<typeof CompareTune>> = {},
) =>
  render(
    <ThemeProvider>
      <CompareTune
        left={left}
        right={{ ...left, sampleCount: 120, sourceCount: 1040 }}
        runs={[
          {
            version: 1,
            id: 'measured',
            manifest: left,
            recall: { value: 0.98, evidence: 'measured' },
            latencyMs: { value: 12, evidence: 'measured' },
            memoryMb: {
              evidence: 'unavailable',
              detail: 'Comparable Redis/index memory was not observed',
            },
          },
          {
            version: 1,
            id: 'estimated',
            manifest: left,
            recall: { value: 0.9, evidence: 'sampled' },
            latencyMs: { value: 9, evidence: 'estimated' },
            memoryMb: { value: 18, evidence: 'estimated' },
          },
        ]}
        onConfirmBenchmark={() => undefined}
        {...props}
      />
    </ThemeProvider>,
  )

describe('CompareTune', () => {
  it('shows compatible drift and only plots comparable measured Pareto evidence', () => {
    renderComponent({
      left: {
        ...left,
        driftEvidence: {
          clusterPopulation: {
            value: 10,
            provenance: 'sampled',
            unit: 'records',
          },
          vectorNorm: {
            value: 0.9,
            provenance: 'measured',
            unit: 'mean L2 norm',
          },
        },
      },
      right: {
        ...left,
        sampleCount: 120,
        sourceCount: 1040,
        driftEvidence: {
          clusterPopulation: {
            value: 12,
            provenance: 'sampled',
            unit: 'records',
          },
          vectorNorm: {
            value: 0.98,
            provenance: 'measured',
            unit: 'mean L2 norm',
          },
        },
      },
    })

    expect(screen.getByText('Compatible manifests')).toBeInTheDocument()
    expect(screen.getByText('Sample count: +20')).toBeInTheDocument()
    expect(screen.getByText('Source count: +40')).toBeInTheDocument()
    expect(
      screen.getByText('cluster population: 10 → 12; Δ +2 records (sampled)'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'vector norm: 0.9 → 0.98; Δ +0.08 mean L2 norm (measured)',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Measured run: measured')).toBeInTheDocument()
    expect(
      screen.queryByText('Measured run: estimated'),
    ).not.toBeInTheDocument()
    expect(screen.getAllByText('Recall (ratio)')).toHaveLength(2)
    expect(screen.getAllByText('Latency (ms)')).toHaveLength(2)
    expect(
      screen.getByText('Memory: unavailable for this run'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('img', {
        name: 'Pareto plot: latency against recall; fixed marker size because comparable memory is unavailable',
      }),
    ).toBeInTheDocument()
  })

  it('explains incompatible drift rather than coercing it', () => {
    renderComponent({ right: { ...left, dimensions: 4 } })

    expect(screen.getByText('Comparison unavailable')).toBeInTheDocument()
    expect(screen.getByText('dimensions differ')).toBeInTheDocument()
  })

  it('requires confirmation and permits cancel before a truth preview executes', () => {
    const onConfirmBenchmark = jest.fn()
    renderComponent({ onConfirmBenchmark })

    fireEvent.click(
      screen.getByRole('button', { name: 'Preview truth benchmark' }),
    )
    expect(screen.getByText('50 bounded comparisons')).toBeInTheDocument()
    expect(screen.getByText('FT.SEARCH KNN')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel benchmark' }))
    expect(screen.queryByText('FT.SEARCH KNN')).not.toBeInTheDocument()
    expect(onConfirmBenchmark).not.toHaveBeenCalled()

    fireEvent.click(
      screen.getByRole('button', { name: 'Preview truth benchmark' }),
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Confirm read-only benchmark' }),
    )
    expect(onConfirmBenchmark).toHaveBeenCalledTimes(1)
  })

  it('uses the exact bounded Vector Set count and hides unsupported benchmark controls', () => {
    const vectorSet = {
      ...left,
      sourceKind: 'vector-set' as const,
      sourceId: 'vector-set',
      vectorField: undefined,
      sampleCount: 4,
      sourceCount: 4,
    }
    const { rerender } = renderComponent({
      left: vectorSet,
      right: vectorSet,
      benchmarkSampleCount: 4,
    })

    fireEvent.click(
      screen.getByRole('button', { name: 'Preview truth benchmark' }),
    )
    expect(screen.getByText('4 bounded comparisons')).toBeInTheDocument()
    expect(screen.getByText('VSIM TRUTH')).toBeInTheDocument()

    rerender(
      <ThemeProvider>
        <CompareTune
          left={left}
          right={left}
          runs={[]}
          benchmarkEnabled={false}
          onConfirmBenchmark={() => undefined}
        />
      </ThemeProvider>,
    )
    expect(
      screen.queryByRole('button', { name: 'Preview truth benchmark' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByText('Measured truth benchmark unavailable for this source.'),
    ).toBeInTheDocument()
  })

  it.each([
    ['empty', 'No comparable benchmark runs are available.'],
    ['unsupported', 'Compare & Tune is unavailable for this source.'],
    ['recoverable-error', 'Compare & Tune could not load. Retry.'],
    ['cancelled', 'Benchmark preview was cancelled.'],
  ] as const)('renders the %s state visibly', (status, copy) => {
    renderComponent({ status, runs: [] })
    expect(screen.getByRole('status')).toHaveTextContent(copy)
  })
})
