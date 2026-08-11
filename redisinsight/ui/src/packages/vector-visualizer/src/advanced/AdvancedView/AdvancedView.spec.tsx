import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'

import { ThemeProvider } from 'uiSrc/components/base/utils/pluginsThemeContext'

import { Advanced } from './AdvancedView'

const renderComponent = (
  props: Partial<React.ComponentProps<typeof Advanced>> = {},
) =>
  render(
    <ThemeProvider>
      <Advanced
        sourceKind="vector-set"
        status="ready"
        topology={{
          kind: 'ready',
          totalAdjacencies: 2,
          shownAdjacencies: 1,
          memberArguments: new Map(),
          layers: [
            { layer: 0, source: 'node:a', targets: ['node:b', 'node:c'] },
          ],
        }}
        vectorSetProfile={{
          kind: 'reduced',
          facts: { 'Result count': '2', EF: 'Unavailable' },
        }}
        {...props}
      />
    </ThemeProvider>,
  )

describe('Advanced view', () => {
  it('labels VLINKS as HNSW topology rather than semantic neighbors and links supplied IDs', () => {
    renderComponent()

    expect(screen.getByText('VLINKS topology')).toBeInTheDocument()
    expect(
      screen.getByText(
        'HNSW layer adjacency, not semantic nearest-neighbor truth.',
      ),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Select node:a' }))
    expect(screen.getByRole('status')).toHaveTextContent('Selected node:a')
    expect(screen.getByText('node:b, node:c')).toBeInTheDocument()
    expect(screen.getByText('Showing 1 of 2 adjacencies.')).toBeInTheDocument()
  })

  it('keeps Search topology unavailable and presents returned FT.PROFILE facts as execution evidence', () => {
    renderComponent({
      sourceKind: 'search-index',
      topology: { kind: 'unsupported' },
      searchProfile: {
        kind: 'ready',
        facts: { 'Vector mode': 'BATCHES', 'Total profile time': '1.2' },
      },
    })

    expect(screen.getByText('Search topology unavailable')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Redis has not returned authoritative topology or traversal evidence.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Measured Search execution evidence'),
    ).toBeInTheDocument()
    expect(screen.getByText('BATCHES')).toBeInTheDocument()
    expect(
      screen.getByText('Execution profile, not HNSW traversal.'),
    ).toBeInTheDocument()
  })

  it.each([
    ['acl-unavailable', 'Redis ACLs do not allow this Advanced evidence.'],
    ['cancelled', 'Advanced evidence retrieval was cancelled.'],
    ['recoverable-error', 'Advanced evidence could not be loaded. Retry.'],
    ['unsupported', 'This source does not support this Advanced evidence.'],
  ] as const)(
    'renders the %s state without blanking the workspace',
    (status, copy) => {
      renderComponent({ status, topology: { kind: 'unsupported' } })

      expect(screen.getByRole('status')).toHaveTextContent(copy)
    },
  )

  it('keeps the Vector Set profile reduced and does not imitate FT.PROFILE iterator stages', () => {
    renderComponent()

    expect(screen.getByText('Reduced Vector Set profile')).toBeInTheDocument()
    expect(screen.getByText('VSIM inputs and results only')).toBeInTheDocument()
    expect(screen.queryByText('Iterator stages')).not.toBeInTheDocument()
  })
})
