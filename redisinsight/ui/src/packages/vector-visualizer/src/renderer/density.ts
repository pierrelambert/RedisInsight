const DEFAULT_BANDWIDTH = 0.08

export const recommendGridSize = (count: number): number => {
  if (count < 500) return 32
  if (count < 5000) return 64
  return 128
}

export const computeDensityGrid = (
  coordinates: Float32Array,
  count: number,
  gridSize: number,
  bandwidth = DEFAULT_BANDWIDTH,
): Float32Array => {
  const grid = new Float32Array(gridSize * gridSize)
  const bandwidthSquared = bandwidth * bandwidth
  const inverseBandwidth = 1 / bandwidthSquared

  for (let pointIndex = 0; pointIndex < count; pointIndex += 1) {
    const px = coordinates[pointIndex * 2]
    const py = coordinates[pointIndex * 2 + 1]

    const cellMinX = Math.max(0, Math.floor((px - bandwidth * 3) * gridSize))
    const cellMaxX = Math.min(
      gridSize - 1,
      Math.ceil((px + bandwidth * 3) * gridSize),
    )
    const cellMinY = Math.max(0, Math.floor((py - bandwidth * 3) * gridSize))
    const cellMaxY = Math.min(
      gridSize - 1,
      Math.ceil((py + bandwidth * 3) * gridSize),
    )

    for (let cellY = cellMinY; cellY <= cellMaxY; cellY += 1) {
      for (let cellX = cellMinX; cellX <= cellMaxX; cellX += 1) {
        const cx = (cellX + 0.5) / gridSize
        const cy = (cellY + 0.5) / gridSize
        const dx = cx - px
        const dy = cy - py
        const distanceSquared = dx * dx + dy * dy
        if (distanceSquared < bandwidthSquared * 9) {
          grid[cellY * gridSize + cellX] +=
            Math.exp(-0.5 * distanceSquared * inverseBandwidth)
        }
      }
    }
  }

  let maxDensity = 0
  for (let i = 0; i < grid.length; i += 1) {
    if (grid[i] > maxDensity) maxDensity = grid[i]
  }
  if (maxDensity > 0) {
    const inverseMax = 1 / maxDensity
    for (let i = 0; i < grid.length; i += 1) {
      grid[i] *= inverseMax
    }
  }

  return grid
}
