export interface AtlasTransform {
  scale: number
  offsetX: number
  offsetY: number
}

export interface Rectangle {
  x: number
  y: number
  width: number
  height: number
}

export interface Viewport {
  width: number
  height: number
}

const bounds = ({ x, y, width, height }: Rectangle) => ({
  minX: Math.min(x, x + width),
  maxX: Math.max(x, x + width),
  minY: Math.min(y, y + height),
  maxY: Math.max(y, y + height),
})

export const pickPointIds = (
  points: Float32Array,
  ids: readonly string[],
  transform: AtlasTransform,
  viewport: Viewport,
  rectangle: Rectangle,
) => {
  const selection = bounds(rectangle)
  const picked: string[] = []
  for (let index = 0; index < ids.length; index += 1) {
    const { x, y } = pointToScreen(points, index, transform, viewport)
    if (
      x >= selection.minX &&
      x <= selection.maxX &&
      y >= selection.minY &&
      y <= selection.maxY
    )
      picked.push(ids[index])
  }
  return picked
}

export const pointToScreen = (
  points: Float32Array,
  index: number,
  transform: AtlasTransform,
  viewport: Viewport,
) => ({
  x: points[index * 2] * viewport.width * transform.scale + transform.offsetX,
  y:
    viewport.height -
    points[index * 2 + 1] * viewport.height * transform.scale -
    transform.offsetY,
})

export const zoomAt = (
  transform: AtlasTransform,
  pointer: { x: number; y: number },
  factor: number,
): AtlasTransform => ({
  scale: transform.scale * factor,
  offsetX: pointer.x - (pointer.x - transform.offsetX) * factor,
  offsetY: pointer.y - (pointer.y - transform.offsetY) * factor,
})
