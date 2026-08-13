export interface DBSCANResult {
  assignments: Int32Array
  clusterCount: number
}

export interface ClusterCentroid {
  x: number
  y: number
  clusterId: number
  count: number
}

const NOISE_LABEL = -1

export const autoEpsilon = (
  coordinates: Float32Array,
  count: number,
  k: number,
): number => {
  if (count < 2) return 0.1

  const effectiveK = Math.min(k, count - 1)
  const distances: number[] = []

  for (let i = 0; i < count; i += 1) {
    const kDistances: number[] = []
    const ix = coordinates[i * 2]
    const iy = coordinates[i * 2 + 1]

    for (let j = 0; j < count; j += 1) {
      if (i === j) continue
      const dx = ix - coordinates[j * 2]
      const dy = iy - coordinates[j * 2 + 1]
      const distance = Math.sqrt(dx * dx + dy * dy)
      kDistances.push(distance)
    }

    kDistances.sort((a, b) => a - b)
    distances.push(kDistances[effectiveK - 1])
  }

  distances.sort((a, b) => a - b)

  let maxCurvature = 0
  let elbowIndex = Math.floor(distances.length * 0.9)

  for (let i = 1; i < distances.length - 1; i += 1) {
    const curvature =
      distances[i - 1] - 2 * distances[i] + distances[i + 1]
    if (curvature > maxCurvature) {
      maxCurvature = curvature
      elbowIndex = i
    }
  }

  return distances[elbowIndex]
}

export const computeDBSCAN = (
  coordinates: Float32Array,
  count: number,
  epsilon: number,
  minPoints: number,
): DBSCANResult => {
  const assignments = new Int32Array(count).fill(NOISE_LABEL)
  let currentCluster = 0

  const regionQuery = (pointIndex: number): number[] => {
    const neighbors: number[] = []
    const px = coordinates[pointIndex * 2]
    const py = coordinates[pointIndex * 2 + 1]
    const epsilonSquared = epsilon * epsilon

    for (let j = 0; j < count; j += 1) {
      const dx = px - coordinates[j * 2]
      const dy = py - coordinates[j * 2 + 1]
      if (dx * dx + dy * dy <= epsilonSquared) {
        neighbors.push(j)
      }
    }
    return neighbors
  }

  for (let i = 0; i < count; i += 1) {
    if (assignments[i] !== NOISE_LABEL) continue

    const neighbors = regionQuery(i)
    if (neighbors.length < minPoints) continue

    assignments[i] = currentCluster
    const seedSet = [...neighbors.filter((n) => n !== i)]
    let seedIndex = 0

    while (seedIndex < seedSet.length) {
      const q = seedSet[seedIndex]
      seedIndex += 1

      if (assignments[q] !== NOISE_LABEL && assignments[q] !== -1) continue

      assignments[q] = currentCluster
      const qNeighbors = regionQuery(q)

      if (qNeighbors.length >= minPoints) {
        for (const neighbor of qNeighbors) {
          if (assignments[neighbor] === NOISE_LABEL) {
            seedSet.push(neighbor)
          }
        }
      }
    }

    currentCluster += 1
  }

  return { assignments, clusterCount: currentCluster }
}

export const clusterCentroids = (
  coordinates: Float32Array,
  assignments: Int32Array,
  count: number,
): ClusterCentroid[] => {
  const sums = new Map<number, { x: number; y: number; n: number }>()

  for (let i = 0; i < count; i += 1) {
    const clusterId = assignments[i]
    if (clusterId === NOISE_LABEL) continue

    const existing = sums.get(clusterId) ?? { x: 0, y: 0, n: 0 }
    existing.x += coordinates[i * 2]
    existing.y += coordinates[i * 2 + 1]
    existing.n += 1
    sums.set(clusterId, existing)
  }

  return [...sums.entries()].map(([clusterId, { x, y, n }]) => ({
    x: x / n,
    y: y / n,
    clusterId,
    count: n,
  }))
}
