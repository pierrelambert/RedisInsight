import {
  pickPointIds,
  pointToScreen,
  zoomAt,
  type AtlasTransform,
} from './interaction'

describe('Atlas interactions', () => {
  const transform: AtlasTransform = { scale: 1, offsetX: 0, offsetY: 0 }
  const points = new Float32Array([0, 0, 0.2, 0.2, 0.8, 0.8])

  it('selects only plotted point IDs inside a Shift-drag rectangle', () => {
    expect(
      pickPointIds(
        points,
        ['a', 'b', 'c'],
        transform,
        { width: 100, height: 100 },
        { x: 10, y: 70, width: 20, height: 20 },
      ),
    ).toEqual(['b'])
  })

  it('converts the WebGL bottom-left Y axis to the DOM top-left Y axis', () => {
    const screenPoint = pointToScreen(points, 1, transform, {
      width: 100,
      height: 100,
    })

    expect(screenPoint.x).toBeCloseTo(20)
    expect(screenPoint.y).toBeCloseTo(80)
  })

  it('zooms around the pointer instead of shifting its world coordinate', () => {
    expect(zoomAt(transform, { x: 30, y: 20 }, 2)).toEqual({
      scale: 2,
      offsetX: -30,
      offsetY: -20,
    })
  })
})
