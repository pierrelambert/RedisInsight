import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'

import { ThemeProvider } from 'uiSrc/components/base/utils/pluginsThemeContext'

import { TopologyGraph } from './TopologyGraph'
import type { TopologyLayer } from './TopologyGraph.types'

const graphLayer: TopologyLayer = {
  layer: 0,
  nodes: [
    { id: 'n1', degree: 3 },
    { id: 'n2', degree: 2 },
    { id: 'n3', degree: 2 },
    { id: 'n4', degree: 1 },
    { id: 'n5', degree: 1 },
    { id: 'n6', degree: 1 },
  ],
  edges: [
    { source: 'n1', target: 'n2' },
    { source: 'n1', target: 'n3' },
    { source: 'n1', target: 'n4' },
    { source: 'n2', target: 'n5' },
    { source: 'n3', target: 'n6' },
  ],
}

const fallbackLayer: TopologyLayer = {
  layer: 1,
  nodes: [
    { id: 'a', degree: 1 },
    { id: 'b', degree: 1 },
    { id: 'c', degree: 0 },
  ],
  edges: [{ source: 'a', target: 'b' }],
}

const renderComponent = (
  props: Partial<React.ComponentProps<typeof TopologyGraph>> = {},
) =>
  render(
    <ThemeProvider>
      <TopologyGraph layers={[graphLayer]} {...props} />
    </ThemeProvider>,
  )

describe('TopologyGraph', () => {
  it('renders an svg with nodes and edges for a layer with at least 5 nodes', () => {
    renderComponent()

    expect(screen.getByTestId('topology-graph-svg')).toBeInTheDocument()
    graphLayer.nodes.forEach((node) => {
      expect(screen.getByTestId(`topology-node-${node.id}`)).toBeInTheDocument()
    })
    graphLayer.edges.forEach((edge) => {
      expect(
        screen.getByTestId(`topology-edge-${edge.source}-${edge.target}`),
      ).toBeInTheDocument()
    })
  })

  it('switches the active layer via the layer selector', () => {
    renderComponent({ layers: [graphLayer, fallbackLayer] })

    expect(screen.getByTestId('topology-graph-svg')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Layer 1' }))

    expect(screen.queryByTestId('topology-graph-svg')).not.toBeInTheDocument()
    expect(screen.getByTestId('topology-graph-fallback')).toBeInTheDocument()
  })

  it('calls onNodeSelect when a node is clicked', () => {
    const onNodeSelect = jest.fn()
    renderComponent({ onNodeSelect })

    fireEvent.click(screen.getByTestId('topology-node-n1'))

    expect(onNodeSelect).toHaveBeenCalledWith('n1')
  })

  it('visually highlights the selected node', () => {
    renderComponent({ selectedNodeId: 'n1' })

    expect(screen.getByTestId('topology-node-n1')).toHaveAttribute(
      'data-selected',
      'true',
    )
    expect(screen.getByTestId('topology-node-n2')).toHaveAttribute(
      'data-selected',
      'false',
    )
  })

  it('falls back to a text list for layers with fewer than 5 nodes', () => {
    renderComponent({ layers: [fallbackLayer] })

    expect(screen.getByTestId('topology-graph-fallback')).toBeInTheDocument()
    expect(screen.queryByTestId('topology-graph-svg')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Select a' })).toBeInTheDocument()
  })

  it('shows graph statistics for the active layer', () => {
    renderComponent()

    expect(screen.getByText('Nodes: 6')).toBeInTheDocument()
    expect(screen.getByText('Edges: 5')).toBeInTheDocument()
    expect(screen.getByText('Avg degree: 1.67')).toBeInTheDocument()
    expect(screen.getByText('Components: 1')).toBeInTheDocument()
  })

  it('renders a message when there are no layers', () => {
    renderComponent({ layers: [] })

    expect(
      screen.getByText('No HNSW layer topology available.'),
    ).toBeInTheDocument()
  })
})
