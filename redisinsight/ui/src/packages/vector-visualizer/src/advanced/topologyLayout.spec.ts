import {
  GraphEdge,
  GraphNode,
  graphStats,
  LayoutPosition,
  springLayout,
} from './topologyLayout'

const node = (id: string, degree = 0): GraphNode => ({ id, degree })

const distance = (a: LayoutPosition, b: LayoutPosition): number =>
  Math.hypot(a.x - b.x, a.y - b.y)

const centroid = (points: LayoutPosition[]): LayoutPosition => ({
  x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
  y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
})

describe('springLayout', () => {
  it('separates two disconnected components into distinct clusters', () => {
    const groupA = ['a1', 'a2', 'a3']
    const groupB = ['b1', 'b2', 'b3']
    const nodes = [...groupA, ...groupB].map((id) => node(id))
    const edges: GraphEdge[] = [
      { source: 'a1', target: 'a2' },
      { source: 'a2', target: 'a3' },
      { source: 'b1', target: 'b2' },
      { source: 'b2', target: 'b3' },
    ]

    const positions = springLayout(nodes, edges)
    const pointsA = groupA.map((id) => positions.get(id) as LayoutPosition)
    const pointsB = groupB.map((id) => positions.get(id) as LayoutPosition)

    const averagePairDistance = (points: LayoutPosition[]): number => {
      let total = 0
      let count = 0
      for (let i = 0; i < points.length; i += 1) {
        for (let j = i + 1; j < points.length; j += 1) {
          total += distance(points[i], points[j])
          count += 1
        }
      }
      return total / count
    }

    const averageIntraDistance =
      (averagePairDistance(pointsA) + averagePairDistance(pointsB)) / 2
    const interDistance = distance(centroid(pointsA), centroid(pointsB))

    expect(interDistance).toBeGreaterThan(averageIntraDistance)
  })

  it('keeps the hub of a star graph roughly centered', () => {
    const leafCount = 8
    const leaves = Array.from({ length: leafCount }, (_, i) => `leaf-${i}`)
    const nodes = [node('hub'), ...leaves.map((id) => node(id))]
    const edges: GraphEdge[] = leaves.map((id) => ({
      source: 'hub',
      target: id,
    }))

    const positions = springLayout(nodes, edges)
    const hub = positions.get('hub') as LayoutPosition
    const center = { x: 0.5, y: 0.5 }
    const hubDistance = distance(hub, center)
    const avgLeafDistance =
      leaves.reduce(
        (sum, id) =>
          sum + distance(positions.get(id) as LayoutPosition, center),
        0,
      ) / leaves.length

    expect(hubDistance).toBeLessThan(avgLeafDistance)
  })

  it('positions a single node at the center', () => {
    const positions = springLayout([node('only')], [])

    expect(positions.size).toBe(1)
    expect(positions.get('only')).toEqual({ x: 0.5, y: 0.5 })
  })

  it('returns an empty map for an empty graph', () => {
    const positions = springLayout([], [])

    expect(positions.size).toBe(0)
  })

  it('lays out a linear chain with the endpoints farthest apart', () => {
    const nodes = ['a', 'b', 'c', 'd'].map((id) => node(id))
    const edges: GraphEdge[] = [
      { source: 'a', target: 'b' },
      { source: 'b', target: 'c' },
      { source: 'c', target: 'd' },
    ]

    const positions = springLayout(nodes, edges)
    const [a, b, c, d] = ['a', 'b', 'c', 'd'].map(
      (id) => positions.get(id) as LayoutPosition,
    )

    const endToEnd = distance(a, d)
    expect(endToEnd).toBeGreaterThanOrEqual(distance(a, b))
    expect(endToEnd).toBeGreaterThanOrEqual(distance(b, c))
    expect(endToEnd).toBeGreaterThanOrEqual(distance(c, d))
  })

  it('caps layout at the first 200 nodes', () => {
    const nodes = Array.from({ length: 250 }, (_, i) => node(`node-${i}`))

    const positions = springLayout(nodes, [])

    expect(positions.size).toBe(200)
    expect(positions.has('node-0')).toBe(true)
    expect(positions.has('node-199')).toBe(true)
    expect(positions.has('node-200')).toBe(false)
    expect(positions.has('node-249')).toBe(false)
  })

  it('converges less with fewer iterations', () => {
    const leaves = ['b', 'c', 'd', 'e', 'f']
    const nodes = [node('a'), ...leaves.map((id) => node(id))]
    const edges: GraphEdge[] = [{ source: 'a', target: 'b' }]

    const fewIterations = springLayout(nodes, edges, 1)
    const manyIterations = springLayout(nodes, edges, 100)

    const totalDisplacement = [...fewIterations.keys()].reduce((sum, id) => {
      const few = fewIterations.get(id) as LayoutPosition
      const many = manyIterations.get(id) as LayoutPosition
      return sum + distance(few, many)
    }, 0)

    expect(totalDisplacement).toBeGreaterThan(0)
  })

  it('normalizes all positions to [0, 1] x [0, 1]', () => {
    const nodes = Array.from({ length: 12 }, (_, i) => node(`n${i}`))
    const edges: GraphEdge[] = Array.from({ length: 11 }, (_, i) => ({
      source: `n${i}`,
      target: `n${i + 1}`,
    }))

    const positions = springLayout(nodes, edges)

    positions.forEach((position) => {
      expect(position.x).toBeGreaterThanOrEqual(0)
      expect(position.x).toBeLessThanOrEqual(1)
      expect(position.y).toBeGreaterThanOrEqual(0)
      expect(position.y).toBeLessThanOrEqual(1)
    })
  })

  it('is deterministic for the same input', () => {
    const nodes = ['a', 'b', 'c', 'd'].map((id) => node(id))
    const edges: GraphEdge[] = [
      { source: 'a', target: 'b' },
      { source: 'b', target: 'c' },
      { source: 'c', target: 'd' },
      { source: 'd', target: 'a' },
    ]

    const first = springLayout(nodes, edges)
    const second = springLayout(nodes, edges)

    expect([...first.entries()]).toEqual([...second.entries()])
  })
})

describe('graphStats', () => {
  it('computes node count, edge count and average degree', () => {
    const nodes = ['a', 'b', 'c', 'd'].map((id) => node(id))
    const edges: GraphEdge[] = [
      { source: 'a', target: 'b' },
      { source: 'b', target: 'c' },
      { source: 'c', target: 'd' },
    ]

    const stats = graphStats(nodes, edges)

    expect(stats.nodeCount).toBe(4)
    expect(stats.edgeCount).toBe(3)
    expect(stats.avgDegree).toBe(1.5)
  })

  it('counts two disconnected groups as two components', () => {
    const nodes = ['a1', 'a2', 'b1', 'b2'].map((id) => node(id))
    const edges: GraphEdge[] = [
      { source: 'a1', target: 'a2' },
      { source: 'b1', target: 'b2' },
    ]

    const stats = graphStats(nodes, edges)

    expect(stats.components).toBe(2)
  })

  it('counts a fully connected graph as a single component', () => {
    const nodes = ['a', 'b', 'c'].map((id) => node(id))
    const edges: GraphEdge[] = [
      { source: 'a', target: 'b' },
      { source: 'b', target: 'c' },
      { source: 'a', target: 'c' },
    ]

    const stats = graphStats(nodes, edges)

    expect(stats.components).toBe(1)
  })
})
