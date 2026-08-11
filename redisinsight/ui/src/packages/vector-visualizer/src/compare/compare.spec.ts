import {
  buildBenchmarkPreview,
  compareManifests,
  createLocalManifestStorage,
  loadLocalManifest,
  toParetoPoints,
  toLocalManifest,
} from './compare'

describe('compare contracts', () => {
  const base = toLocalManifest({
    version: 1,
    sourceKind: 'search-index',
    sourceId: 'idx',
    dimensions: 3,
    metric: 'cosine',
    vectorField: 'embedding',
    sampleCount: 10,
    sourceCount: 100,
    sampleIdDigest: 'hash31:base',
    rawVectors: new Float32Array([1, 2, 3]),
    payload: { secret: 'no' },
  })
  it('redacts raw vectors and payloads from local manifest serialization', () => {
    expect(JSON.stringify(base)).not.toContain('rawVectors')
    expect(JSON.stringify(base)).not.toContain('secret')
    expect(base.version).toBe(1)
  })
  it('rejects incompatible dimensions without coercion', () => {
    expect(compareManifests(base, { ...base, dimensions: 4 })).toEqual({
      compatible: false,
      reasons: ['dimensions differ'],
    })
  })
  it('returns provenance-backed drift evidence and unavailable metric reasons', () => {
    expect(
      compareManifests(
        {
          ...base,
          driftEvidence: {
            clusterPopulation: {
              value: 10,
              provenance: 'sampled',
              unit: 'records',
            },
            vectorNorm: { value: 0.9, provenance: 'measured' },
          },
        },
        {
          ...base,
          driftEvidence: {
            clusterPopulation: {
              value: 12,
              provenance: 'sampled',
              unit: 'records',
            },
            vectorNorm: { value: 0.98, provenance: 'measured' },
            neighborOverlap: {
              provenance: 'unavailable',
              reason: 'no-shared-query',
            },
          },
        },
      ),
    ).toEqual(
      expect.objectContaining({
        compatible: true,
        drift: expect.arrayContaining([
          expect.objectContaining({
            metric: 'cluster population',
            delta: 2,
            provenance: 'sampled',
            unit: 'records',
          }),
          expect.objectContaining({
            metric: 'neighbor overlap',
            provenance: 'unavailable',
            reason: 'no-shared-query',
          }),
        ]),
      }),
    )
  })
  it('previews only read-only truth work and requires confirmation', () => {
    expect(
      buildBenchmarkPreview({
        sourceKind: 'vector-set',
        truth: true,
        sampleCount: 50,
      }),
    ).toEqual(
      expect.objectContaining({
        requiresConfirmation: true,
        commands: ['VSIM TRUTH'],
        estimatedWork: '50 bounded comparisons',
      }),
    )
  })
  it('rejects malformed or unsupported local-only manifest storage', () => {
    expect(loadLocalManifest('{bad')).toEqual({ kind: 'invalid' })
    expect(loadLocalManifest(JSON.stringify({ ...base, version: 2 }))).toEqual({
      kind: 'unsupported-version',
    })

    const loaded = loadLocalManifest(
      JSON.stringify({
        ...base,
        rawVectors: [1, 2, 3],
        payload: { secret: 'never persist' },
        projection: {
          algorithm: 'umap',
          seed: 7,
          rawVectors: [4, 5, 6],
          payload: { secret: 'nested secret' },
        },
        sampling: {
          method: 'ft-search-limit',
          sourceCommand: 'FT.SEARCH',
          seed: 'unavailable',
          determinism: 'ordering-unspecified',
          exactness: 'unknown',
          rawSampleIds: ['private:key'],
        },
      }),
    )
    expect(loaded.kind).toBe('ready')
    expect(JSON.stringify(loaded)).not.toContain('rawVectors')
    expect(JSON.stringify(loaded)).not.toContain('never persist')
    expect(JSON.stringify(loaded)).not.toContain('nested secret')
    expect(JSON.stringify(loaded)).not.toContain('private:key')
  })

  it('maps measured latency/recall Pareto coordinates with fixed markers when memory is unavailable', () => {
    const run = (
      id: string,
      recall: number,
      latencyMs: number,
      memoryMb?: number,
    ) => ({
      version: 1 as const,
      id,
      manifest: base,
      recall: { value: recall, evidence: 'measured' as const },
      latencyMs: { value: latencyMs, evidence: 'measured' as const },
      memoryMb:
        memoryMb === undefined
          ? { evidence: 'unavailable' as const }
          : { value: memoryMb, evidence: 'measured' as const },
    })

    expect(
      toParetoPoints([run('fast', 0.8, 10), run('slow', 0.9, 30)]),
    ).toEqual([
      { id: 'fast', x: 44, y: 142, radius: 7 },
      { id: 'slow', x: 304, y: 12, radius: 7 },
    ])
  })

  it('stores and removes manifests only through the local versioned namespace', () => {
    const values = new Map<string, string>()
    const storage = createLocalManifestStorage({
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key),
    })

    storage.save('baseline', base)
    expect([...values.keys()]).toEqual([
      'vector-visualizer:manifest:v1:baseline',
    ])
    expect(storage.load('baseline')).toEqual({ kind: 'ready', manifest: base })
    storage.remove('baseline')
    expect(storage.load('baseline')).toEqual({ kind: 'missing' })
  })
})
