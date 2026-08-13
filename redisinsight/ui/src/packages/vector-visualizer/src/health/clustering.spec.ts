import {
  autoEpsilon,
  computeDBSCAN,
  clusterCentroids,
  DBSCANResult,
} from './clustering'

const makeCoordinates = (points: [number, number][]): Float32Array => {
  const coords = new Float32Array(points.length * 2)
  points.forEach(([x, y], i) => {
    coords[i * 2] = x
    coords[i * 2 + 1] = y
  })
  return coords
}

describe('autoEpsilon', () => {
  it('returns a fallback for fewer than two points', () => {
    const coords = new Float32Array([0.5, 0.5])
    expect(autoEpsilon(coords, 1, 4)).toBe(0.1)
  })

  it('returns a fallback for zero points', () => {
    expect(autoEpsilon(new Float32Array(0), 0, 4)).toBe(0.1)
  })

  it('returns a finite positive epsilon for a simple cluster', () => {
    const coords = makeCoordinates([
      [0.1, 0.1],
      [0.12, 0.11],
      [0.09, 0.13],
      [0.11, 0.09],
      [0.8, 0.8],
      [0.82, 0.81],
    ])
    const eps = autoEpsilon(coords, 6, 3)
    expect(eps).toBeGreaterThan(0)
    expect(Number.isFinite(eps)).toBe(true)
  })

  it('clamps k to count - 1 when k exceeds point count', () => {
    const coords = makeCoordinates([
      [0, 0],
      [1, 1],
    ])
    const eps = autoEpsilon(coords, 2, 100)
    expect(eps).toBeGreaterThan(0)
    expect(Number.isFinite(eps)).toBe(true)
  })
})

describe('computeDBSCAN', () => {
  it('assigns all points to noise when epsilon is very small', () => {
    const coords = makeCoordinates([
      [0, 0],
      [1, 1],
      [2, 2],
    ])
    const result = computeDBSCAN(coords, 3, 0.001, 2)

    expect(result.clusterCount).toBe(0)
    expect(Array.from(result.assignments)).toEqual([-1, -1, -1])
  })

  it('assigns all points to one cluster when epsilon is large enough', () => {
    const coords = makeCoordinates([
      [0.5, 0.5],
      [0.51, 0.51],
      [0.52, 0.49],
    ])
    const result = computeDBSCAN(coords, 3, 0.1, 2)

    expect(result.clusterCount).toBe(1)
    expect(Array.from(result.assignments)).toEqual([0, 0, 0])
  })

  it('finds two separate clusters', () => {
    const coords = makeCoordinates([
      [0.1, 0.1],
      [0.11, 0.1],
      [0.12, 0.1],
      [0.9, 0.9],
      [0.91, 0.9],
      [0.92, 0.9],
    ])
    const result = computeDBSCAN(coords, 6, 0.05, 2)

    expect(result.clusterCount).toBe(2)
    expect(result.assignments[0]).toBe(result.assignments[1])
    expect(result.assignments[0]).toBe(result.assignments[2])
    expect(result.assignments[3]).toBe(result.assignments[4])
    expect(result.assignments[3]).toBe(result.assignments[5])
    expect(result.assignments[0]).not.toBe(result.assignments[3])
  })

  it('marks isolated points as noise alongside a cluster', () => {
    const coords = makeCoordinates([
      [0.5, 0.5],
      [0.51, 0.5],
      [0.52, 0.5],
      [0.0, 0.0],
    ])
    const result = computeDBSCAN(coords, 4, 0.05, 2)

    expect(result.clusterCount).toBe(1)
    expect(result.assignments[0]).toBe(0)
    expect(result.assignments[1]).toBe(0)
    expect(result.assignments[2]).toBe(0)
    expect(result.assignments[3]).toBe(-1)
  })

  it('handles an empty point set', () => {
    const result = computeDBSCAN(new Float32Array(0), 0, 0.1, 2)
    expect(result.clusterCount).toBe(0)
    expect(result.assignments.length).toBe(0)
  })

  it('requires minPoints neighbors to form a cluster', () => {
    const coords = makeCoordinates([
      [0.5, 0.5],
      [0.51, 0.5],
    ])
    const result = computeDBSCAN(coords, 2, 0.1, 3)
    expect(result.clusterCount).toBe(0)
  })
})

describe('clusterCentroids', () => {
  it('computes centroids for two clusters', () => {
    const coords = makeCoordinates([
      [0, 0],
      [2, 0],
      [10, 10],
      [12, 10],
    ])
    const assignments = new Int32Array([0, 0, 1, 1])
    const centroids = clusterCentroids(coords, assignments, 4)

    expect(centroids).toHaveLength(2)

    const c0 = centroids.find((c) => c.clusterId === 0)!
    expect(c0.x).toBeCloseTo(1)
    expect(c0.y).toBeCloseTo(0)
    expect(c0.count).toBe(2)

    const c1 = centroids.find((c) => c.clusterId === 1)!
    expect(c1.x).toBeCloseTo(11)
    expect(c1.y).toBeCloseTo(10)
    expect(c1.count).toBe(2)
  })

  it('excludes noise points from centroids', () => {
    const coords = makeCoordinates([
      [5, 5],
      [0, 0],
      [6, 5],
    ])
    const assignments = new Int32Array([0, -1, 0])
    const centroids = clusterCentroids(coords, assignments, 3)

    expect(centroids).toHaveLength(1)
    expect(centroids[0].x).toBeCloseTo(5.5)
    expect(centroids[0].y).toBeCloseTo(5)
    expect(centroids[0].count).toBe(2)
  })

  it('returns an empty array when all points are noise', () => {
    const coords = makeCoordinates([
      [1, 1],
      [2, 2],
    ])
    const assignments = new Int32Array([-1, -1])
    expect(clusterCentroids(coords, assignments, 2)).toEqual([])
  })

  it('returns an empty array for zero points', () => {
    expect(
      clusterCentroids(new Float32Array(0), new Int32Array(0), 0),
    ).toEqual([])
  })
})
