const SILVERMAN_COEFFICIENT = 0.9
const SILVERMAN_EXPONENT = -1 / 5
const GAUSSIAN_KERNEL_EXPONENT = -0.5
const KERNEL_CUTOFF_STD_DEVS = 3
const LARGE_POINT_COUNT_THRESHOLD = 5000
const SMALL_GRID_SIZE = 64
const LARGE_GRID_SIZE = 128

interface NormalizedPoints {
  xs: Float64Array
  ys: Float64Array
}

const normalizeDensityCoordinates = (
  coordinates: Float32Array,
  count: number,
): NormalizedPoints => {
  const xs = new Float64Array(count)
  const ys = new Float64Array(count)
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity

  for (let index = 0; index < count; index += 1) {
    const x = coordinates[index * 2]
    const y = coordinates[index * 2 + 1]
    xs[index] = x
    ys[index] = y
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }

  const rangeX = maxX - minX
  const rangeY = maxY - minY

  for (let index = 0; index < count; index += 1) {
    xs[index] = rangeX > 0 ? (xs[index] - minX) / rangeX : 0.5
    ys[index] = rangeY > 0 ? (ys[index] - minY) / rangeY : 0.5
  }

  return { xs, ys }
}

const standardDeviation = (values: Float64Array): number => {
  const { length } = values
  if (length === 0) return 0
  let mean = 0
  for (let index = 0; index < length; index += 1) mean += values[index]
  mean /= length
  let variance = 0
  for (let index = 0; index < length; index += 1) {
    const diff = values[index] - mean
    variance += diff * diff
  }
  variance /= length
  return Math.sqrt(variance)
}

const computeSilvermanBandwidth = (
  xs: Float64Array,
  ys: Float64Array,
  count: number,
): number => {
  const minStd = Math.min(standardDeviation(xs), standardDeviation(ys))
  return SILVERMAN_COEFFICIENT * minStd * count ** SILVERMAN_EXPONENT
}

export const recommendGridSize = (count: number): number =>
  count > LARGE_POINT_COUNT_THRESHOLD ? LARGE_GRID_SIZE : SMALL_GRID_SIZE

export const computeDensityGrid = (
  coordinates: Float32Array,
  count: number,
  gridSize: number,
  bandwidth?: number,
): Float32Array => {
  const grid = new Float32Array(gridSize * gridSize)

  if (count <= 0) return grid

  const { xs, ys } = normalizeDensityCoordinates(coordinates, count)
  const resolvedBandwidth =
    bandwidth ?? computeSilvermanBandwidth(xs, ys, count)
  const safeBandwidth = Math.max(resolvedBandwidth, 1 / gridSize)
  const cutoff = KERNEL_CUTOFF_STD_DEVS * safeBandwidth
  const cutoffSquared = cutoff * cutoff
  const inverseBandwidthSquared = 1 / (safeBandwidth * safeBandwidth)
  const lastIndex = gridSize - 1
  const kernelWeightsX = new Float64Array(gridSize)

  for (let pointIndex = 0; pointIndex < count; pointIndex += 1) {
    const px = xs[pointIndex]
    const py = ys[pointIndex]

    const colMin = Math.max(0, Math.floor((px - cutoff) * gridSize))
    const colMax = Math.min(lastIndex, Math.ceil((px + cutoff) * gridSize))
    const rowMin = Math.max(0, Math.floor((py - cutoff) * gridSize))
    const rowMax = Math.min(lastIndex, Math.ceil((py + cutoff) * gridSize))

    for (let col = colMin; col <= colMax; col += 1) {
      const cx = (col + 0.5) / gridSize
      const dx = cx - px
      kernelWeightsX[col] = Math.exp(
        GAUSSIAN_KERNEL_EXPONENT * dx * dx * inverseBandwidthSquared,
      )
    }

    for (let row = rowMin; row <= rowMax; row += 1) {
      const cy = (row + 0.5) / gridSize
      const dy = cy - py
      const dySquared = dy * dy
      if (dySquared > cutoffSquared) continue
      const weightY = Math.exp(
        GAUSSIAN_KERNEL_EXPONENT * dySquared * inverseBandwidthSquared,
      )
      const maxDx = Math.sqrt(Math.max(0, cutoffSquared - dySquared))
      const rowColMin = Math.max(colMin, Math.floor((px - maxDx) * gridSize))
      const rowColMax = Math.min(colMax, Math.ceil((px + maxDx) * gridSize))
      const rowOffset = row * gridSize
      for (let col = rowColMin; col <= rowColMax; col += 1) {
        grid[rowOffset + col] += weightY * kernelWeightsX[col]
      }
    }
  }

  let maxDensity = 0
  for (let index = 0; index < grid.length; index += 1) {
    if (grid[index] > maxDensity) maxDensity = grid[index]
  }

  if (maxDensity > 0) {
    for (let index = 0; index < grid.length; index += 1) {
      grid[index] /= maxDensity
    }
  }

  return grid
}
