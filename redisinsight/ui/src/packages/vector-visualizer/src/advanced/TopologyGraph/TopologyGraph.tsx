import React, { useMemo, useState } from 'react'

import { Button } from 'uiSrc/components/base/forms/buttons'
import { Col } from 'uiSrc/components/base/layout/flex'
import { Text } from 'uiSrc/components/base/text'

import { graphStats, springLayout } from '../topologyLayout'
import * as S from './TopologyGraph.styles'
import type { TopologyGraphProps, TopologyLayer } from './TopologyGraph.types'

const DEFAULT_WIDTH = 480
const DEFAULT_HEIGHT = 320
const NODE_MIN_RADIUS = 4
const NODE_RADIUS_PER_DEGREE = 2
const NODE_MAX_RADIUS = 20
const GRAPH_PADDING = NODE_MAX_RADIUS
const FALLBACK_NODE_THRESHOLD = 5

const nodeRadius = (degree: number): number =>
  Math.min(NODE_MAX_RADIUS, NODE_MIN_RADIUS + degree * NODE_RADIUS_PER_DEGREE)

interface TopologyStatsRowProps {
  stats: ReturnType<typeof graphStats>
}

const TopologyStatsRow = ({ stats }: TopologyStatsRowProps) => (
  <S.StatsRow>
    <Text size="s">Nodes: {stats.nodeCount}</Text>
    <Text size="s">Edges: {stats.edgeCount}</Text>
    <Text size="s">Avg degree: {stats.avgDegree.toFixed(2)}</Text>
    <Text size="s">Components: {stats.components}</Text>
  </S.StatsRow>
)

interface TopologyFallbackListProps {
  layer: TopologyLayer
  onNodeSelect?: (nodeId: string) => void
  selectedNodeId?: string
}

const TopologyFallbackList = ({
  layer,
  onNodeSelect,
  selectedNodeId,
}: TopologyFallbackListProps) => (
  <Col data-testid="topology-graph-fallback" gap="s">
    {layer.nodes.map((node) => {
      const targets = layer.edges
        .filter((edge) => edge.source === node.id)
        .map((edge) => edge.target)
      const isSelected = selectedNodeId === node.id

      return (
        <Col gap="xs" key={node.id}>
          <Button
            aria-pressed={isSelected}
            onClick={() => onNodeSelect?.(node.id)}
            size="s"
          >
            Select {node.id}
          </Button>
          {isSelected && <Text role="status">Selected {node.id}</Text>}
          {targets.length > 0 && <Text size="s">{targets.join(', ')}</Text>}
        </Col>
      )
    })}
  </Col>
)

interface TopologySvgGraphProps {
  height: number
  layer: TopologyLayer
  onNodeSelect?: (nodeId: string) => void
  selectedNodeId?: string
  width: number
}

const TopologySvgGraph = ({
  height,
  layer,
  onNodeSelect,
  selectedNodeId,
  width,
}: TopologySvgGraphProps) => {
  const positions = useMemo(
    () => springLayout(layer.nodes, layer.edges),
    [layer.nodes, layer.edges],
  )

  const toX = (normalizedX: number): number =>
    GRAPH_PADDING + normalizedX * (width - GRAPH_PADDING * 2)
  const toY = (normalizedY: number): number =>
    GRAPH_PADDING + normalizedY * (height - GRAPH_PADDING * 2)

  return (
    <S.GraphSvg
      data-testid="topology-graph-svg"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
    >
      {layer.edges.map((edge) => {
        const sourcePosition = positions.get(edge.source)
        const targetPosition = positions.get(edge.target)
        if (!sourcePosition || !targetPosition) return null

        const isHighlighted =
          selectedNodeId === edge.source || selectedNodeId === edge.target

        return (
          <S.EdgeLine
            $highlighted={isHighlighted}
            data-highlighted={isHighlighted}
            data-testid={`topology-edge-${edge.source}-${edge.target}`}
            key={`${edge.source}-${edge.target}`}
            x1={toX(sourcePosition.x)}
            x2={toX(targetPosition.x)}
            y1={toY(sourcePosition.y)}
            y2={toY(targetPosition.y)}
          />
        )
      })}
      {layer.nodes.map((node) => {
        const position = positions.get(node.id)
        if (!position) return null

        const isSelected = selectedNodeId === node.id

        return (
          <S.NodeCircle
            $selected={isSelected}
            aria-label={`Select ${node.id}`}
            cx={toX(position.x)}
            cy={toY(position.y)}
            data-selected={isSelected}
            data-testid={`topology-node-${node.id}`}
            key={node.id}
            onClick={() => onNodeSelect?.(node.id)}
            r={nodeRadius(node.degree)}
            role="button"
            tabIndex={0}
          />
        )
      })}
    </S.GraphSvg>
  )
}

export const TopologyGraph = ({
  height = DEFAULT_HEIGHT,
  layers,
  onNodeSelect,
  selectedNodeId,
  width = DEFAULT_WIDTH,
}: TopologyGraphProps) => {
  const [activeLayerIndex, setActiveLayerIndex] = useState(0)

  if (layers.length === 0) {
    return <Text size="s">No HNSW layer topology available.</Text>
  }

  const boundedIndex = Math.min(activeLayerIndex, layers.length - 1)
  const activeLayer = layers[boundedIndex]
  const stats = graphStats(activeLayer.nodes, activeLayer.edges)
  const isFallback = activeLayer.nodes.length < FALLBACK_NODE_THRESHOLD

  return (
    <S.Shell data-testid="topology-graph">
      <S.LayerTabs>
        {layers.map((layer, index) => (
          <S.LayerTabButton
            $active={index === boundedIndex}
            aria-pressed={index === boundedIndex}
            key={layer.layer}
            onClick={() => setActiveLayerIndex(index)}
            size="s"
          >
            Layer {layer.layer}
          </S.LayerTabButton>
        ))}
      </S.LayerTabs>
      <TopologyStatsRow stats={stats} />
      {isFallback ? (
        <TopologyFallbackList
          layer={activeLayer}
          onNodeSelect={onNodeSelect}
          selectedNodeId={selectedNodeId}
        />
      ) : (
        <TopologySvgGraph
          height={height}
          layer={activeLayer}
          onNodeSelect={onNodeSelect}
          selectedNodeId={selectedNodeId}
          width={width}
        />
      )}
    </S.Shell>
  )
}
