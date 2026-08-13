export interface GraphNode {
  id: string
  degree: number
}

export interface GraphEdge {
  source: string
  target: string
}

export interface LayoutPosition {
  x: number
  y: number
}

export interface GraphStatistics {
  nodeCount: number
  edgeCount: number
  avgDegree: number
  components: number
}

const MAX_NODES = 200
const DEFAULT_ITERATIONS = 50
const CIRCLE_RADIUS = 1
const K_REPULSION = 1.0
const K_ATTRACTION = 0.1
const DAMPING = 0.95
const INITIAL_STEP = 0.1
const MIN_DISTANCE = 0.0001
const BOUND = 2

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max)

/**
 * Force-directed spring layout for small graphs.
 * Returns positions normalized to [0, 1] × [0, 1].
 */
export const springLayout = (
  nodes: GraphNode[],
  edges: GraphEdge[],
  iterations: number = DEFAULT_ITERATIONS,
): Map<string, LayoutPosition> => {
  const positions = new Map<string, LayoutPosition>()
  if (nodes.length === 0) return positions

  const cappedNodes = nodes.slice(0, MAX_NODES)
  const nodeIds = cappedNodes.map((node) => node.id)
  const nodeIndexById = new Map<string, number>(
    nodeIds.map((id, index) => [id, index]),
  )
  const nodeIdSet = new Set(nodeIds)
  const cappedEdges = edges.filter(
    (edge) =>
      edge.source !== edge.target &&
      nodeIdSet.has(edge.source) &&
      nodeIdSet.has(edge.target),
  )

  const nodeCount = cappedNodes.length
  const x = new Float64Array(nodeCount)
  const y = new Float64Array(nodeCount)

  for (let i = 0; i < nodeCount; i += 1) {
    const angle = (2 * Math.PI * i) / nodeCount
    x[i] = CIRCLE_RADIUS * Math.cos(angle)
    y[i] = CIRCLE_RADIUS * Math.sin(angle)
  }

  let step = INITIAL_STEP
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const forceX = new Float64Array(nodeCount)
    const forceY = new Float64Array(nodeCount)

    for (let i = 0; i < nodeCount; i += 1) {
      for (let j = i + 1; j < nodeCount; j += 1) {
        const dx = x[j] - x[i]
        const dy = y[j] - y[i]
        const distSq = Math.max(dx * dx + dy * dy, MIN_DISTANCE)
        const dist = Math.sqrt(distSq)
        const magnitude = K_REPULSION / distSq
        const unitX = dx / dist
        const unitY = dy / dist
        forceX[i] -= unitX * magnitude
        forceY[i] -= unitY * magnitude
        forceX[j] += unitX * magnitude
        forceY[j] += unitY * magnitude
      }
    }

    cappedEdges.forEach((edge) => {
      const sourceIndex = nodeIndexById.get(edge.source)
      const targetIndex = nodeIndexById.get(edge.target)
      if (sourceIndex === undefined || targetIndex === undefined) return

      const dx = x[targetIndex] - x[sourceIndex]
      const dy = y[targetIndex] - y[sourceIndex]
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), MIN_DISTANCE)
      const magnitude = K_ATTRACTION * dist
      const unitX = dx / dist
      const unitY = dy / dist
      forceX[sourceIndex] += unitX * magnitude
      forceY[sourceIndex] += unitY * magnitude
      forceX[targetIndex] -= unitX * magnitude
      forceY[targetIndex] -= unitY * magnitude
    })

    for (let i = 0; i < nodeCount; i += 1) {
      x[i] = clamp(x[i] + forceX[i] * step, -BOUND, BOUND)
      y[i] = clamp(y[i] + forceY[i] * step, -BOUND, BOUND)
    }

    step *= DAMPING
  }

  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (let i = 0; i < nodeCount; i += 1) {
    minX = Math.min(minX, x[i])
    maxX = Math.max(maxX, x[i])
    minY = Math.min(minY, y[i])
    maxY = Math.max(maxY, y[i])
  }

  const rangeX = maxX - minX
  const rangeY = maxY - minY

  for (let i = 0; i < nodeCount; i += 1) {
    const normalizedX = rangeX > MIN_DISTANCE ? (x[i] - minX) / rangeX : 0.5
    const normalizedY = rangeY > MIN_DISTANCE ? (y[i] - minY) / rangeY : 0.5
    positions.set(nodeIds[i], { x: normalizedX, y: normalizedY })
  }

  return positions
}

/**
 * Compute graph statistics including connected component count.
 */
export const graphStats = (
  nodes: GraphNode[],
  edges: GraphEdge[],
): GraphStatistics => {
  const nodeCount = nodes.length
  const edgeCount = edges.length
  const avgDegree = nodeCount > 0 ? (2 * edgeCount) / nodeCount : 0

  const nodeIds = nodes.map((node) => node.id)
  const nodeIdSet = new Set(nodeIds)
  const parent = new Map<string, string>(nodeIds.map((id) => [id, id]))

  const find = (id: string): string => {
    let root = id
    while (parent.get(root) !== root) {
      root = parent.get(root) as string
    }
    parent.set(id, root)
    return root
  }

  const union = (a: string, b: string): void => {
    const rootA = find(a)
    const rootB = find(b)
    if (rootA !== rootB) parent.set(rootA, rootB)
  }

  edges.forEach((edge) => {
    if (nodeIdSet.has(edge.source) && nodeIdSet.has(edge.target)) {
      union(edge.source, edge.target)
    }
  })

  const components = new Set(nodeIds.map((id) => find(id))).size

  return { nodeCount, edgeCount, avgDegree, components }
}
