import { pointToScreen, pickPointIds, zoomAt } from './interaction'
import type { AtlasTransform, Viewport } from './interaction'

export interface AtlasRendererOptions {
  interactionMode?: 'pan' | 'region'
  onSelect(ids: string[]): void
  onHover(id?: string): void
  onSelectionBoxChange?(box?: AtlasSelectionBox): void
  onTransformChange?(transform: AtlasTransform): void
  onUnsupported(): void
  onContextLost(): void
  onContextRestored(): void
}

export interface AtlasSelectionBox {
  x: number
  y: number
  width: number
  height: number
}

export type AtlasPointState =
  | 'selected'
  | 'live-neighbor'
  | 'outlier'
  | 'duplicate'

export type AtlasPointStates = Record<
  string,
  readonly AtlasPointState[] | undefined
>
export type AtlasPointColors = Record<string, string | undefined>

export interface AtlasRendererPalette {
  default: string
  selected: string
  liveNeighbor: string
  outlier: string
  duplicate: string
  hovered: string
  pointSize: number
}

const VERTEX_SOURCE = `#version 300 es
in vec2 position;
in vec3 pointColor;
in vec3 accentColor;
in float marker;
uniform vec3 transform;
uniform float pointSize;
out vec3 pointColorVarying;
out vec3 accentColorVarying;
flat out float shapeVarying;
void main() {
  vec2 p = position * transform.x + transform.yz;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
  float selected = floor(mod(marker / 4.0, 2.0));
  gl_PointSize = pointSize * (1.0 + selected * 0.6);
  pointColorVarying = pointColor;
  accentColorVarying = accentColor;
  shapeVarying = marker;
}`

const DENSITY_VERTEX_SOURCE = `#version 300 es
in vec2 position;
uniform vec3 transform;
out vec2 texCoord;
void main() {
  vec2 p = position * transform.x + transform.yz;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
  texCoord = position;
}`

const DENSITY_FRAGMENT_SOURCE = `#version 300 es
precision highp float;
in vec2 texCoord;
uniform sampler2D densityMap;
out vec4 fragmentColor;
void main() {
  float density = texture(densityMap, texCoord).r;
  if (density < 0.05) discard;
  fragmentColor = vec4(0.2, 0.4, 0.8, density * 0.6);
}`

const CLICK_DRAG_THRESHOLD = 4
const PICK_DISTANCE_SQUARED = 144
const WHEEL_ZOOM_FACTOR = 1.15
const FRAGMENT_SOURCE = `#version 300 es
precision highp float;
in vec3 pointColorVarying;
in vec3 accentColorVarying;
flat in float shapeVarying;
out vec4 fragmentColor;
void main() {
  vec2 centered = gl_PointCoord - vec2(0.5);
  float circle = distance(centered, vec2(0.0));
  float square = max(abs(centered.x), abs(centered.y));
  float baseShape = mod(shapeVarying, 4.0);
  float selectedRing = floor(mod(shapeVarying / 4.0, 2.0));
  float hoverRing = floor(mod(shapeVarying / 8.0, 2.0));
  if (baseShape < 0.5 && circle > 0.5) discard;
  if (baseShape > 0.5 && baseShape < 1.5 && abs(centered.x) + abs(centered.y) > 0.5) discard;
  if (baseShape > 1.5 && baseShape < 2.5 && (centered.y < -0.5 || centered.y > 0.5 - abs(centered.x))) discard;
  if (baseShape > 2.5 && square > 0.5) discard;
  bool outerRing = (selectedRing > 0.5 || hoverRing > 0.5) && circle > 0.35;
  fragmentColor = vec4(outerRing ? accentColorVarying : pointColorVarying, 1.0);
}`

export class AtlasRenderer {
  private gl: WebGL2RenderingContext | null = null

  private program: WebGLProgram | null = null

  private buffer: WebGLBuffer | null = null

  private colorBuffer: WebGLBuffer | null = null

  private accentColorBuffer: WebGLBuffer | null = null

  private markerBuffer: WebGLBuffer | null = null

  private points = new Float32Array()

  private ids: string[] = []

  private pointStates: AtlasPointStates = {}

  private pointColors: AtlasPointColors = {}

  private palette?: AtlasRendererPalette

  private hoveredId?: string

  private transform: AtlasTransform = { scale: 1, offsetX: 0, offsetY: 0 }

  private dragStart?: {
    originX: number
    originY: number
    previousX: number
    previousY: number
    isSelecting: boolean
  }

  private densityProgram: WebGLProgram | null = null

  private densityBuffer: WebGLBuffer | null = null

  private densityTexture: WebGLTexture | null = null

  private densityVisible = false

  private densityGridSize = 0

  private readonly listeners: Array<{ type: string; listener: EventListener }> =
    []

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly options: AtlasRendererOptions,
  ) {
    this.gl = canvas.getContext('webgl2')
    if (!this.gl) {
      options.onUnsupported()
      return
    }
    this.bindEvents()
    if (!this.createResources()) options.onUnsupported()
  }

  setPoints(
    points: Float32Array,
    ids: readonly string[],
    palette: AtlasRendererPalette,
    pointStates: AtlasPointStates = {},
    pointColors: AtlasPointColors = {},
  ): void {
    if (points.length !== ids.length * 2)
      throw new Error('Atlas coordinates must map exactly to sample IDs')
    this.points = normalizeCoordinates(points)
    this.ids = [...ids]
    this.palette = palette
    this.pointStates = pointStates
    this.pointColors = pointColors
    this.upload()
    this.draw()
  }

  resize(
    width: number,
    height: number,
    devicePixelRatio = window.devicePixelRatio,
  ): void {
    this.canvas.width = Math.max(1, Math.round(width * devicePixelRatio))
    this.canvas.height = Math.max(1, Math.round(height * devicePixelRatio))
    this.gl?.viewport(0, 0, this.canvas.width, this.canvas.height)
    this.draw()
  }

  setDensityGrid(grid: Float32Array, gridSize: number): void {
    const gl = this.gl
    if (!gl) return
    if (!this.densityTexture) {
      this.densityTexture = gl.createTexture()
    }
    this.densityGridSize = gridSize
    gl.bindTexture(gl.TEXTURE_2D, this.densityTexture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    const pixels = new Uint8Array(gridSize * gridSize)
    for (let i = 0; i < grid.length; i += 1) {
      pixels[i] = Math.min(255, Math.round(grid[i] * 255))
    }
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.LUMINANCE,
      gridSize,
      gridSize,
      0,
      gl.LUMINANCE,
      gl.UNSIGNED_BYTE,
      pixels,
    )
    gl.bindTexture(gl.TEXTURE_2D, null)
    this.draw()
  }

  setDensityVisible(visible: boolean): void {
    this.densityVisible = visible
    this.draw()
  }

  destroy(): void {
    this.listeners.forEach(({ type, listener }) =>
      this.canvas.removeEventListener(type, listener),
    )
    this.listeners.length = 0
    this.gl?.deleteBuffer(this.buffer)
    this.gl?.deleteBuffer(this.colorBuffer)
    this.gl?.deleteBuffer(this.accentColorBuffer)
    this.gl?.deleteBuffer(this.markerBuffer)
    this.gl?.deleteProgram(this.program)
    this.gl?.deleteBuffer(this.densityBuffer)
    this.gl?.deleteProgram(this.densityProgram)
    this.gl?.deleteTexture(this.densityTexture)
    this.gl = null
  }

  private bindEvents(): void {
    this.listen('webglcontextlost', (event) => {
      event.preventDefault()
      this.options.onContextLost()
    })
    this.listen('webglcontextrestored', () => {
      this.gl = this.canvas.getContext('webgl2')
      if (!this.gl || !this.createResources())
        return this.options.onUnsupported()
      this.upload()
      this.draw()
      this.options.onContextRestored()
    })
    this.listen('pointerdown', (event) => {
      const pointer = event as PointerEvent
      this.canvas.setPointerCapture(pointer.pointerId)
      this.dragStart = {
        originX: pointer.offsetX,
        originY: pointer.offsetY,
        previousX: pointer.offsetX,
        previousY: pointer.offsetY,
        isSelecting:
          this.options.interactionMode === 'region' || pointer.shiftKey,
      }
    })
    this.listen('pointermove', (event) => {
      const pointer = event as PointerEvent
      if (!this.dragStart) {
        const hoveredId = this.pickNearest(pointer.offsetX, pointer.offsetY)[0]
        if (hoveredId !== this.hoveredId) {
          this.hoveredId = hoveredId
          this.uploadVisuals()
          this.draw()
          this.options.onHover(hoveredId)
        }
        return
      }
      if (this.dragStart.isSelecting) {
        this.options.onSelectionBoxChange?.(
          this.selectionBox(
            this.dragStart.originX,
            this.dragStart.originY,
            pointer.offsetX,
            pointer.offsetY,
          ),
        )
        return
      }
      this.transform.offsetX += pointer.offsetX - this.dragStart.previousX
      this.transform.offsetY -= pointer.offsetY - this.dragStart.previousY
      this.dragStart = {
        ...this.dragStart,
        previousX: pointer.offsetX,
        previousY: pointer.offsetY,
      }
      this.options.onTransformChange?.({ ...this.transform })
      this.draw()
    })
    this.listen('pointerleave', () => {
      if (!this.hoveredId) return
      this.hoveredId = undefined
      this.uploadVisuals()
      this.draw()
      this.options.onHover(undefined)
    })
    this.listen('pointerup', (event) => {
      const pointer = event as PointerEvent
      if (!this.dragStart) return
      const start = this.dragStart
      this.dragStart = undefined
      const horizontalDistance = pointer.offsetX - start.originX
      const verticalDistance = pointer.offsetY - start.originY
      if (
        Math.abs(horizontalDistance) < CLICK_DRAG_THRESHOLD &&
        Math.abs(verticalDistance) < CLICK_DRAG_THRESHOLD
      ) {
        this.options.onSelectionBoxChange?.(undefined)
        this.options.onSelect(
          this.pickNearest(pointer.offsetX, pointer.offsetY),
        )
      } else if (start.isSelecting) {
        this.options.onSelectionBoxChange?.(
          this.selectionBox(
            start.originX,
            start.originY,
            pointer.offsetX,
            pointer.offsetY,
          ),
        )
        this.options.onSelect(
          pickPointIds(
            this.points,
            this.ids,
            this.transform,
            {
              ...this.viewport(),
            },
            {
              x: start.originX,
              y: start.originY,
              width: horizontalDistance,
              height: verticalDistance,
            },
          ),
        )
      }
    })
    this.listen('wheel', (event) => {
      const wheel = event as WheelEvent
      wheel.preventDefault()
      this.transform = zoomAt(
        this.transform,
        {
          x: wheel.offsetX,
          y: this.viewport().height - wheel.offsetY,
        },
        wheel.deltaY < 0 ? WHEEL_ZOOM_FACTOR : 1 / WHEEL_ZOOM_FACTOR,
      )
      this.options.onTransformChange?.({ ...this.transform })
      this.draw()
    })
  }

  private createResources(): boolean {
    const gl = this.gl
    if (!gl) return false
    const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SOURCE)
    const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SOURCE)
    if (!vertex || !fragment) return false
    const program = gl.createProgram()
    if (!program) return false
    gl.attachShader(program, vertex)
    gl.attachShader(program, fragment)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return false
    this.program = program
    this.buffer = gl.createBuffer()
    this.colorBuffer = gl.createBuffer()
    this.accentColorBuffer = gl.createBuffer()
    this.markerBuffer = gl.createBuffer()

    const densityVertex = compileShader(
      gl,
      gl.VERTEX_SHADER,
      DENSITY_VERTEX_SOURCE,
    )
    const densityFragment = compileShader(
      gl,
      gl.FRAGMENT_SHADER,
      DENSITY_FRAGMENT_SOURCE,
    )
    if (densityVertex && densityFragment) {
      const densityProgram = gl.createProgram()
      if (densityProgram) {
        gl.attachShader(densityProgram, densityVertex)
        gl.attachShader(densityProgram, densityFragment)
        gl.linkProgram(densityProgram)
        if (gl.getProgramParameter(densityProgram, gl.LINK_STATUS)) {
          this.densityProgram = densityProgram
        }
      }
    }
    this.densityBuffer = gl.createBuffer()
    if (this.densityBuffer) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.densityBuffer)
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]),
        gl.STATIC_DRAW,
      )
    }

    return Boolean(
      this.buffer &&
        this.colorBuffer &&
        this.accentColorBuffer &&
        this.markerBuffer,
    )
  }

  private upload(): void {
    const gl = this.gl
    if (!gl || !this.buffer || !this.markerBuffer) return
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
    gl.bufferData(gl.ARRAY_BUFFER, this.points, gl.STATIC_DRAW)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.markerBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, this.markers(), gl.STATIC_DRAW)
    this.uploadColors()
  }

  private uploadVisuals(): void {
    const gl = this.gl
    if (gl && this.markerBuffer) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.markerBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, this.markers(), gl.DYNAMIC_DRAW)
    }
    this.uploadColors()
  }

  private uploadColors(): void {
    const gl = this.gl
    if (!gl || !this.colorBuffer || !this.accentColorBuffer || !this.palette)
      return
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, this.baseColors(), gl.DYNAMIC_DRAW)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.accentColorBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, this.accentColors(), gl.DYNAMIC_DRAW)
  }

  private draw(): void {
    const gl = this.gl
    if (
      !gl ||
      !this.program ||
      !this.buffer ||
      !this.colorBuffer ||
      !this.accentColorBuffer ||
      !this.markerBuffer
    )
      return
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    this.drawDensity()

    gl.useProgram(this.program)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
    const location = gl.getAttribLocation(this.program, 'position')
    gl.enableVertexAttribArray(location)
    gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer)
    const colorLocation = gl.getAttribLocation(this.program, 'pointColor')
    gl.enableVertexAttribArray(colorLocation)
    gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.accentColorBuffer)
    const accentColorLocation = gl.getAttribLocation(
      this.program,
      'accentColor',
    )
    gl.enableVertexAttribArray(accentColorLocation)
    gl.vertexAttribPointer(accentColorLocation, 3, gl.FLOAT, false, 0, 0)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.markerBuffer)
    const markerLocation = gl.getAttribLocation(this.program, 'marker')
    gl.enableVertexAttribArray(markerLocation)
    gl.vertexAttribPointer(markerLocation, 1, gl.FLOAT, false, 0, 0)
    const transform = gl.getUniformLocation(this.program, 'transform')
    gl.uniform3f(
      transform,
      this.transform.scale,
      this.transform.offsetX / this.canvas.clientWidth,
      this.transform.offsetY / this.canvas.clientHeight,
    )
    const pointSize = gl.getUniformLocation(this.program, 'pointSize')
    gl.uniform1f(pointSize, this.palette?.pointSize ?? 1)
    gl.drawArrays(gl.POINTS, 0, this.ids.length)

    gl.disable(gl.BLEND)
  }

  private drawDensity(): void {
    const gl = this.gl
    if (
      !gl ||
      !this.densityVisible ||
      !this.densityProgram ||
      !this.densityBuffer ||
      !this.densityTexture ||
      !this.densityGridSize
    )
      return

    gl.useProgram(this.densityProgram)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.densityBuffer)
    const positionLocation = gl.getAttribLocation(
      this.densityProgram,
      'position',
    )
    gl.enableVertexAttribArray(positionLocation)
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

    const densityTransform = gl.getUniformLocation(
      this.densityProgram,
      'transform',
    )
    gl.uniform3f(
      densityTransform,
      this.transform.scale,
      this.transform.offsetX / this.canvas.clientWidth,
      this.transform.offsetY / this.canvas.clientHeight,
    )

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.densityTexture)
    const densityMapLocation = gl.getUniformLocation(
      this.densityProgram,
      'densityMap',
    )
    gl.uniform1i(densityMapLocation, 0)

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }

  private pickNearest(x: number, y: number): string[] {
    let closest = -1
    let distance = Number.POSITIVE_INFINITY
    for (let index = 0; index < this.ids.length; index += 1) {
      const point = pointToScreen(
        this.points,
        index,
        this.transform,
        this.viewport(),
      )
      const dx = point.x - x
      const dy = point.y - y
      const nextDistance = dx * dx + dy * dy
      if (nextDistance < distance) {
        closest = index
        distance = nextDistance
      }
    }
    return closest >= 0 && distance < PICK_DISTANCE_SQUARED
      ? [this.ids[closest]]
      : []
  }

  private selectionBox(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
  ): AtlasSelectionBox {
    const { width, height } = this.viewport()
    const minX = Math.max(0, Math.min(startX, endX, width))
    const minY = Math.max(0, Math.min(startY, endY, height))
    const maxX = Math.max(0, Math.min(Math.max(startX, endX), width))
    const maxY = Math.max(0, Math.min(Math.max(startY, endY), height))
    return {
      x: minX / width,
      y: minY / height,
      width: (maxX - minX) / width,
      height: (maxY - minY) / height,
    }
  }

  private viewport(): Viewport {
    return {
      width: this.canvas.clientWidth || this.canvas.width || 1,
      height: this.canvas.clientHeight || this.canvas.height || 1,
    }
  }

  private listen(type: string, listener: EventListener): void {
    this.canvas.addEventListener(type, listener)
    this.listeners.push({ type, listener })
  }

  private baseColors(): Float32Array {
    if (!this.palette) return new Float32Array()
    return Float32Array.from(
      this.ids.flatMap((id) => parseColor(this.baseColorFor(id)).slice(0, 3)),
    )
  }

  private accentColors(): Float32Array {
    if (!this.palette) return new Float32Array()
    return Float32Array.from(
      this.ids.flatMap((id) => parseColor(this.accentColorFor(id)).slice(0, 3)),
    )
  }

  private baseColorFor(id: string): string {
    if (!this.palette) throw new Error('Atlas palette is required')
    const states = this.statesFor(id)
    if (states.includes('live-neighbor')) return this.palette.liveNeighbor
    if (states.includes('outlier')) return this.palette.outlier
    if (states.includes('duplicate')) return this.palette.duplicate
    return this.pointColors[id] ?? this.palette.default
  }

  private accentColorFor(id: string): string {
    if (!this.palette) throw new Error('Atlas palette is required')
    if (id === this.hoveredId) return this.palette.hovered
    return this.statesFor(id).includes('selected')
      ? this.palette.selected
      : this.baseColorFor(id)
  }

  private statesFor(id: string): readonly AtlasPointState[] {
    return this.pointStates[id] ?? []
  }

  private markers(): Float32Array {
    return Float32Array.from(
      this.ids.map((id) => {
        const states = this.statesFor(id)
        const base = states.includes('live-neighbor')
          ? 1
          : states.includes('outlier')
            ? 2
            : states.includes('duplicate')
              ? 3
              : 0
        const selected = states.includes('selected') ? 4 : 0
        const hovered = id === this.hoveredId ? 8 : 0
        return base + selected + hovered
      }),
    )
  }
}

const COLOR_FALLBACK: [number, number, number, number] = [0.5, 0.5, 0.5, 1.0]

export const parseColor = (value: string): [number, number, number, number] => {
  try {
    const hex = value.replace('#', '')
    if (/^[\da-f]{6}$/i.test(hex))
      return [
        parseInt(hex.slice(0, 2), 16) / 255,
        parseInt(hex.slice(2, 4), 16) / 255,
        parseInt(hex.slice(4, 6), 16) / 255,
        1.0,
      ]
    const components = value.match(
      /^rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)/i,
    )
    if (components)
      return [
        Number(components[1]) / 255,
        Number(components[2]) / 255,
        Number(components[3]) / 255,
        1.0,
      ]
    throw new Error(`Unsupported semantic color ${value}`)
  } catch {
    return COLOR_FALLBACK
  }
}

const PLOT_INSET = 0.06

const percentileBounds = (values: number[], lo: number, hi: number) => {
  const sorted = Float64Array.from(values).sort()
  const low = sorted[Math.floor(lo * (sorted.length - 1))]
  const high = sorted[Math.ceil(hi * (sorted.length - 1))]
  return { low, high }
}

export const normalizeCoordinates = (coordinates: Float32Array) => {
  if (!coordinates.length) return coordinates
  const count = coordinates.length / 2
  if (count < 4) {
    let minX = coordinates[0]
    let maxX = coordinates[0]
    let minY = coordinates[1]
    let maxY = coordinates[1]
    for (let i = 2; i < coordinates.length; i += 2) {
      minX = Math.min(minX, coordinates[i])
      maxX = Math.max(maxX, coordinates[i])
      minY = Math.min(minY, coordinates[i + 1])
      maxY = Math.max(maxY, coordinates[i + 1])
    }
    const width = maxX - minX || 1
    const height = maxY - minY || 1
    return Float32Array.from(coordinates, (value, i) => {
      const normalized =
        i % 2 ? (value - minY) / height : (value - minX) / width
      return PLOT_INSET + normalized * (1 - PLOT_INSET * 2)
    })
  }
  const xs: number[] = []
  const ys: number[] = []
  for (let i = 0; i < coordinates.length; i += 2) {
    xs.push(coordinates[i])
    ys.push(coordinates[i + 1])
  }
  const xBounds = percentileBounds(xs, 0.02, 0.98)
  const yBounds = percentileBounds(ys, 0.02, 0.98)
  return Float32Array.from(coordinates, (value, i) => {
    const { low, high } =
      i % 2 ? { low: yBounds.low, high: yBounds.high } : xBounds
    const clamped = Math.max(low, Math.min(high, value))
    const normalized = (clamped - low) / (high - low || 1)
    return PLOT_INSET + normalized * (1 - PLOT_INSET * 2)
  })
}

const compileShader = (
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
) => {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null
}
