import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'

import { ThemeProvider } from 'uiSrc/components/base/utils/pluginsThemeContext'

import { MetadataMatrix } from './MetadataMatrix'

const renderComponent = (
  props: Partial<React.ComponentProps<typeof MetadataMatrix>> = {},
) =>
  render(
    <ThemeProvider>
      <MetadataMatrix
        records={[]}
        field="region"
        onSelectionChange={jest.fn()}
        {...props}
      />
    </ThemeProvider>,
  )

describe('MetadataMatrix', () => {
  it('selects the exact supplied-cluster sample IDs from a matrix cell', () => {
    const onSelectionChange = jest.fn()
    renderComponent({
      records: [
        { id: 'a', clusterId: 'cluster-a', metadata: { region: 'eu' } },
        { id: 'b', clusterId: 'cluster-a', metadata: { region: 'eu' } },
        { id: 'c', clusterId: 'cluster-b', metadata: { region: 'us' } },
      ],
      onSelectionChange,
    })

    fireEvent.click(
      screen.getByRole('button', { name: 'cluster-a, eu: 2 sampled records' }),
    )
    expect(onSelectionChange).toHaveBeenCalledWith(['a', 'b'])
    expect(screen.getByText(/Supplied cluster labels/)).toBeInTheDocument()
    expect(
      screen.getByLabelText('Heatmap count intensity legend'),
    ).toHaveTextContent('0 to 2 sampled records')
    expect(
      screen.getByRole('button', {
        name: 'cluster-a, eu: 2 sampled records',
      }),
    ).toHaveAttribute('data-intensity', '1')
  })

  it('renders Unknown instead of inventing clusters', () => {
    renderComponent({ records: [{ id: 'a', metadata: { region: 'eu' } }] })
    expect(screen.getByRole('status')).toHaveTextContent(
      'Cluster labels are unavailable',
    )
  })

  it.each(['loading', 'error', 'partial', 'stale', 'unsupported'] as const)(
    'renders the sampled matrix %s state explicitly',
    (status) => {
      renderComponent({ status })

      expect(screen.getByRole('status')).toHaveTextContent(status)
    },
  )

  it('renders an explicit empty sampled-record state', () => {
    renderComponent()

    expect(screen.getByRole('status')).toHaveTextContent(
      'No sampled records are available',
    )
  })
})
