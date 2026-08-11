import {
  createNativeVisualizerSession,
  consumeVectorVisualizerSource,
  setVectorVisualizerSource,
} from './nativeHandoff'

describe('native Vector Visualizer handoff', () => {
  afterEach(() => {
    consumeVectorVisualizerSource()
  })

  it('keeps a Vector Set key binary-safe and consumes it without serializing it', () => {
    const key = new Uint8Array([0, 255, 10])

    setVectorVisualizerSource({ kind: 'vector-set', key })

    const source = consumeVectorVisualizerSource()

    expect(source).toEqual({ kind: 'vector-set', key })
    expect(source?.kind === 'vector-set' && source.key).toBe(key)
    expect(consumeVectorVisualizerSource()).toBeUndefined()
  })

  it('keeps the selected Search vector field with its index source', () => {
    setVectorVisualizerSource({
      kind: 'search-index',
      index: 'idx-products',
      vectorField: 'embedding',
    })

    expect(consumeVectorVisualizerSource()).toEqual({
      kind: 'search-index',
      index: 'idx-products',
      vectorField: 'embedding',
    })
  })

  it('cancels and stale-rejects prior source work, clears raw vectors, and keeps only workflow preference', () => {
    const session = createNativeVisualizerSession({ workflow: 'query-lab' })
    session.setSource({
      kind: 'search-index',
      index: 'idx-products',
      vectorField: 'embedding',
    })
    const firstWork = session.beginWork()
    session.storeRawVector('doc:1', new Float32Array([0.1, 0.2]))

    session.setSource({ kind: 'vector-set', key: new Uint8Array([0, 255]) })

    expect(firstWork.signal.aborted).toBe(true)
    expect(session.rawVectorCount()).toBe(0)
    expect(session.accept(firstWork.generation, 'stale result')).toEqual({
      accepted: false,
      value: undefined,
    })
    expect(session.getPreferences()).toEqual({ workflow: 'query-lab' })
    expect(session.getSource()).toEqual({
      kind: 'vector-set',
      key: new Uint8Array([0, 255]),
    })
  })

  it('exposes a copy of a session-only selected anchor without serializing it into preferences', () => {
    const session = createNativeVisualizerSession()
    const anchor = new Float32Array([1, 0])

    session.storeRawVector('doc:anchor', anchor)

    const stored = session.getRawVector('doc:anchor')
    expect(stored).toEqual(anchor)
    expect(stored).not.toBe(anchor)
    expect(session.getPreferences()).toEqual({ workflow: 'explore' })
  })
})
