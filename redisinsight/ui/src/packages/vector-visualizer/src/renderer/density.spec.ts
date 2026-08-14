import { recommendGridSize, computeDensityGrid } from './density'

const makeCoordinates = (points: [number, number][]): Float32Array => {
  const coords = new Float32Array(points.length * 2)
  points.forEach(([x, y], i) => {
    coords[i * 2] = x
    coords[i * 2 + 1] = y
  })
  return coords
}

describe('recommendGridSize', () => {
  it.each([
    [0, 64],
    [100, 64],
    [499, 64],
    [500, 64],
    [4999, 64],
    [5000, 64],
    [5001, 128],
    [100_000, 128],
  ] as const)('returns %i → %i', (count, expected) => {
    expect(recommendGridSize(count)).toBe(expected)
  })
})

describe('computeDensityGrid', () => {
  it('returns a grid of the expected size', () => {
    const coords = makeCoordinates([[0.5, 0.5]])
    const grid = computeDensityGrid(coords, 1, 16)
    expect(grid.length).toBe(16 * 16)
  })

  it('produces a zero grid for zero points', () => {
    const grid = computeDensityGrid(new Float32Array(0), 0, 8)
    expect(grid.length).toBe(64)
    expect(Math.max(...grid)).toBe(0)
  })

  it('normalizes the peak density to 1.0 for a single point', () => {
    const coords = makeCoordinates([[0.5, 0.5]])
    const grid = computeDensityGrid(coords, 1, 16)
    const max = Math.max(...grid)
    expect(max).toBeCloseTo(1.0)
  })

  it('has higher density near the point than at the edge', () => {
    const coords = makeCoordinates([[0.5, 0.5]])
    const gridSize = 32
    const grid = computeDensityGrid(coords, 1, gridSize)

    const centerCell = Math.floor(0.5 * gridSize)
    const centerDensity = grid[centerCell * gridSize + centerCell]
    const edgeDensity = grid[0]

    expect(centerDensity).toBeGreaterThan(edgeDensity)
  })

  it('produces higher peak density for two co-located points than one', () => {
    const single = makeCoordinates([[0.5, 0.5]])
    const double = makeCoordinates([
      [0.5, 0.5],
      [0.5, 0.5],
    ])
    const gridSize = 16

    const gridSingle = computeDensityGrid(single, 1, gridSize)
    const gridDouble = computeDensityGrid(double, 2, gridSize)

    const peakSingle = Math.max(...gridSingle)
    const peakDouble = Math.max(...gridDouble)

    expect(peakSingle).toBeCloseTo(1.0)
    expect(peakDouble).toBeCloseTo(1.0)
  })

  it('reflects two separate clusters as two density peaks', () => {
    const coords = makeCoordinates([
      [0.2, 0.2],
      [0.21, 0.2],
      [0.8, 0.8],
      [0.81, 0.8],
    ])
    const gridSize = 32
    const grid = computeDensityGrid(coords, 4, gridSize, 0.05)

    const nearFirstCluster = grid[0]
    const nearSecondCluster = grid[grid.length - 1]
    const midpoint =
      grid[Math.floor(0.5 * gridSize) * gridSize + Math.floor(0.5 * gridSize)]

    expect(nearFirstCluster).toBeGreaterThan(midpoint)
    expect(nearSecondCluster).toBeGreaterThan(midpoint)
  })

  it('respects a custom bandwidth parameter', () => {
    const coords = makeCoordinates([[0.5, 0.5]])
    const gridSize = 32

    const narrowGrid = computeDensityGrid(coords, 1, gridSize, 0.02)
    const wideGrid = computeDensityGrid(coords, 1, gridSize, 0.2)

    const narrowNonZero = [...narrowGrid].filter((v) => v > 0.01).length
    const wideNonZero = [...wideGrid].filter((v) => v > 0.01).length

    expect(wideNonZero).toBeGreaterThan(narrowNonZero)
  })

  it('uses a circular cutoff instead of filling a square kernel box', () => {
    const coords = makeCoordinates([[0.5, 0.5]])
    const gridSize = 32
    const grid = computeDensityGrid(coords, 1, gridSize, 0.1)
    const center = Math.floor(0.5 * gridSize)
    const offset = Math.ceil(0.27 * gridSize)

    const horizontal =
      grid[center * gridSize + Math.min(gridSize - 1, center + offset)]
    const diagonal =
      grid[
        Math.min(gridSize - 1, center + offset) * gridSize +
          Math.min(gridSize - 1, center + offset)
      ]

    expect(horizontal).toBeGreaterThan(0)
    expect(diagonal).toBe(0)
  })
})
