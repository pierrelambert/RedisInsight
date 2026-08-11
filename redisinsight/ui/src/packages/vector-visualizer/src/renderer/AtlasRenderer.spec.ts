import {
  AtlasRenderer,
  normalizeCoordinates,
  parseColor,
} from './AtlasRenderer'

const createGl = () =>
  ({
    VERTEX_SHADER: 1,
    FRAGMENT_SHADER: 2,
    COMPILE_STATUS: 3,
    LINK_STATUS: 4,
    ARRAY_BUFFER: 5,
    STATIC_DRAW: 6,
    DYNAMIC_DRAW: 7,
    COLOR_BUFFER_BIT: 8,
    FLOAT: 9,
    POINTS: 10,
    createShader: jest.fn(() => ({})),
    shaderSource: jest.fn(),
    compileShader: jest.fn(),
    getShaderParameter: jest.fn(() => true),
    createProgram: jest.fn(() => ({})),
    attachShader: jest.fn(),
    linkProgram: jest.fn(),
    getProgramParameter: jest.fn(() => true),
    createBuffer: jest.fn(() => ({})),
    bindBuffer: jest.fn(),
    bufferData: jest.fn(),
    clearColor: jest.fn(),
    clear: jest.fn(),
    useProgram: jest.fn(),
    getAttribLocation: jest.fn(() => 0),
    enableVertexAttribArray: jest.fn(),
    vertexAttribPointer: jest.fn(),
    getUniformLocation: jest.fn(() => ({})),
    uniform3f: jest.fn(),
    uniform1f: jest.fn(),
    drawArrays: jest.fn(),
    viewport: jest.fn(),
    deleteBuffer: jest.fn(),
    deleteProgram: jest.fn(),
  }) as unknown as WebGL2RenderingContext

describe('AtlasRenderer lifecycle', () => {
  it.each(['oklch(60% 0.2 30)', 'var(--x)'])(
    'uses the stable fallback for unsupported color %s',
    (color) => {
      expect(parseColor(color)).toEqual([0.5, 0.5, 0.5, 1.0])
    },
  )

  it('insets normalized extrema so every plotted marker remains visible', () => {
    expect(normalizeCoordinates(new Float32Array([0, 0, 10, 10]))).toEqual(
      new Float32Array([0.04, 0.04, 0.96, 0.96]),
    )
  })

  it('removes input listeners and distinguishes context loss from unsupported WebGL', () => {
    const canvas = document.createElement('canvas')
    const gl = createGl()
    jest.spyOn(canvas, 'getContext').mockReturnValue(gl)
    const removed = jest.spyOn(canvas, 'removeEventListener')
    const onContextLost = jest.fn()
    const onContextRestored = jest.fn()
    const onUnsupported = jest.fn()
    const renderer = new AtlasRenderer(canvas, {
      onSelect: jest.fn(),
      onHover: jest.fn(),
      onContextLost,
      onContextRestored,
      onUnsupported,
    })

    canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }))
    canvas.dispatchEvent(new Event('webglcontextrestored'))
    expect(onContextLost).toHaveBeenCalledTimes(1)
    expect(onContextRestored).toHaveBeenCalledTimes(1)
    expect(onUnsupported).not.toHaveBeenCalled()

    renderer.destroy()
    expect(removed).toHaveBeenCalledTimes(7)
  })

  it('uses indexed hover picking and uploads semantic state colors in one draw path', () => {
    const canvas = document.createElement('canvas')
    const gl = createGl()
    const glMock = gl as unknown as {
      bufferData: jest.Mock
      drawArrays: jest.Mock
    }
    jest.spyOn(canvas, 'getContext').mockReturnValue(gl)
    Object.defineProperty(canvas, 'clientWidth', { value: 100 })
    Object.defineProperty(canvas, 'clientHeight', { value: 100 })
    const onHover = jest.fn()
    const renderer = new AtlasRenderer(canvas, {
      onSelect: jest.fn(),
      onHover,
      onContextLost: jest.fn(),
      onContextRestored: jest.fn(),
      onUnsupported: jest.fn(),
    })

    renderer.setPoints(
      new Float32Array([0, 0, 1, 1]),
      ['a', 'b'],
      {
        default: '#123456',
        selected: '#234567',
        liveNeighbor: '#345678',
        outlier: '#456789',
        duplicate: '#56789a',
        hovered: '#6789ab',
        pointSize: 12,
      },
      { b: ['selected', 'outlier'] },
      { a: '#010203', b: '#aabbcc' },
    )
    const pointerMove = new Event('pointermove')
    Object.defineProperty(pointerMove, 'offsetX', { value: 0 })
    Object.defineProperty(pointerMove, 'offsetY', { value: 100 })
    canvas.dispatchEvent(pointerMove)

    expect(onHover).toHaveBeenCalledWith('a')
    expect(glMock.bufferData.mock.calls).toContainEqual([
      gl.ARRAY_BUFFER,
      new Float32Array([0, 6]),
      gl.STATIC_DRAW,
    ])
    expect(glMock.bufferData.mock.calls).toContainEqual([
      gl.ARRAY_BUFFER,
      new Float32Array([8, 6]),
      gl.DYNAMIC_DRAW,
    ])
    expect(glMock.bufferData.mock.calls).toContainEqual([
      gl.ARRAY_BUFFER,
      new Float32Array([
        1 / 255,
        2 / 255,
        3 / 255,
        69 / 255,
        103 / 255,
        137 / 255,
      ]),
      gl.DYNAMIC_DRAW,
    ])
    expect(glMock.drawArrays.mock.calls).toEqual([
      [gl.POINTS, 0, 2],
      [gl.POINTS, 0, 2],
    ])
  })

  it('uses an ordinary drag for a persistent region selection in Selection mode', () => {
    const canvas = document.createElement('canvas')
    const gl = createGl()
    jest.spyOn(canvas, 'getContext').mockReturnValue(gl)
    Object.defineProperties(canvas, {
      clientWidth: { value: 100 },
      clientHeight: { value: 100 },
      setPointerCapture: { value: jest.fn() },
    })
    const onSelect = jest.fn()
    const onSelectionBoxChange = jest.fn()
    const renderer = new AtlasRenderer(canvas, {
      interactionMode: 'region',
      onSelect,
      onSelectionBoxChange,
      onHover: jest.fn(),
      onContextLost: jest.fn(),
      onContextRestored: jest.fn(),
      onUnsupported: jest.fn(),
    })
    renderer.setPoints(new Float32Array([0, 0, 1, 1]), ['a', 'b'], {
      default: '#123456',
      selected: '#234567',
      liveNeighbor: '#345678',
      outlier: '#456789',
      duplicate: '#56789a',
      hovered: '#6789ab',
      pointSize: 12,
    })

    const dispatchPointer = (
      type: 'pointerdown' | 'pointermove' | 'pointerup',
      offsetX: number,
      offsetY: number,
    ) => {
      const event = new Event(type)
      Object.defineProperties(event, {
        offsetX: { value: offsetX },
        offsetY: { value: offsetY },
        pointerId: { value: 1 },
        shiftKey: { value: false },
      })
      canvas.dispatchEvent(event)
    }

    dispatchPointer('pointerdown', 50, 0)
    dispatchPointer('pointermove', 100, 50)
    dispatchPointer('pointerup', 100, 50)

    expect(onSelectionBoxChange).toHaveBeenLastCalledWith({
      x: 0.5,
      y: 0,
      width: 0.5,
      height: 0.5,
    })
    expect(onSelect).toHaveBeenCalledWith(['b'])
  })

  it('keeps response-backed cluster labels aligned while the Atlas pans', () => {
    const canvas = document.createElement('canvas')
    const gl = createGl()
    jest.spyOn(canvas, 'getContext').mockReturnValue(gl)
    Object.defineProperties(canvas, {
      clientWidth: { value: 100 },
      clientHeight: { value: 100 },
      setPointerCapture: { value: jest.fn() },
    })
    const onTransformChange = jest.fn()
    new AtlasRenderer(canvas, {
      onSelect: jest.fn(),
      onHover: jest.fn(),
      onTransformChange,
      onContextLost: jest.fn(),
      onContextRestored: jest.fn(),
      onUnsupported: jest.fn(),
    })

    const pointerDown = new Event('pointerdown')
    Object.defineProperties(pointerDown, {
      offsetX: { value: 10 },
      offsetY: { value: 10 },
      pointerId: { value: 1 },
      shiftKey: { value: false },
    })
    const pointerMove = new Event('pointermove')
    Object.defineProperties(pointerMove, {
      offsetX: { value: 20 },
      offsetY: { value: 25 },
    })

    canvas.dispatchEvent(pointerDown)
    canvas.dispatchEvent(pointerMove)

    expect(onTransformChange).toHaveBeenCalledWith({
      scale: 1,
      offsetX: 10,
      offsetY: -15,
    })
  })
})
