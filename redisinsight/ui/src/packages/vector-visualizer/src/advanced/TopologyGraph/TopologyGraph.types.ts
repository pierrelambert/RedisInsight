import type { GraphEdge, GraphNode } from '../topologyLayout'

export interface TopologyLayer {
  layer: number
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export interface TopologyGraphProps {
  layers: TopologyLayer[]
  selectedNodeId?: string
  onNodeSelect?: (nodeId: string) => void
  width?: number
  height?: number
}
