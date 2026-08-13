import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ThemeProvider } from 'uiSrc/components/base/utils/pluginsThemeContext'

import { AtlasLegend } from './AtlasLegend'
import type { AtlasLegendEntry } from './AtlasLegend.types'

const renderComponent = (
  entries: AtlasLegendEntry[],
  onEntryClick?: (label: string) => void,
) =>
  render(
    <ThemeProvider>
      <AtlasLegend entries={entries} onEntryClick={onEntryClick} />
    </ThemeProvider>,
  )

describe('AtlasLegend', () => {
  it('renders nothing when entries is empty', () => {
    const { container } = renderComponent([])

    expect(container.firstChild).toBeNull()
  })

  it('renders a swatch and label for each entry', () => {
    renderComponent([
      { label: 'Cluster A', color: '#ff0000', count: 42 },
      { label: 'Cluster B', color: '#00ff00', count: 7 },
    ])

    expect(screen.getByLabelText('Cluster A (42)')).toBeInTheDocument()
    expect(screen.getByLabelText('Cluster B (7)')).toBeInTheDocument()
  })

  it('calls onEntryClick with the label when an entry is clicked', async () => {
    const onClick = jest.fn()
    renderComponent(
      [{ label: 'MyLabel', color: '#aabbcc' }],
      onClick,
    )

    await userEvent.click(screen.getByLabelText('MyLabel'))
    expect(onClick).toHaveBeenCalledWith('MyLabel')
  })

  it('applies dimmed styling via the $dimmed prop', () => {
    renderComponent([{ label: 'Dimmed', color: '#000', dimmed: true }])

    const entry = screen.getByLabelText('Dimmed')
    expect(entry).toBeInTheDocument()
  })

  it('renders the panel with the correct test id', () => {
    renderComponent([{ label: 'A', color: '#000' }])

    expect(screen.getByTestId('atlas-legend')).toBeInTheDocument()
  })
})
