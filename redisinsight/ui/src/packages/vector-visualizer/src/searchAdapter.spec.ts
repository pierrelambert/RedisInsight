import { AggregateQueryInput, HybridQueryInput } from './contracts'
import {
  parseAggregateResponse,
  parseHybridResponse,
  parseSearchInfo,
  parseSearchSample,
  planAggregateQuery,
  planHybridQuery,
  planProfileAggregateQuery,
  planProfileHybridQuery,
  planProfileRangeQuery,
  planProfileSearchNeighbors,
  planRangeQuery,
  SearchSampleField,
} from './searchAdapter'

const encodeAsRedisEscaped = (bytes: Uint8Array): string =>
  [...bytes]
    .map((b) =>
      b >= 32 && b <= 126 && b !== 92
        ? String.fromCharCode(b)
        : `\\x${b.toString(16).padStart(2, '0')}`,
    )
    .join('')

const float32Bytes = (values: number[]): Uint8Array => {
  const buf = new ArrayBuffer(values.length * 4)
  const view = new DataView(buf)
  values.forEach((v, i) => view.setFloat32(i * 4, v, true))
  return new Uint8Array(buf)
}

const float64Bytes = (values: number[]): Uint8Array => {
  const buf = new ArrayBuffer(values.length * 8)
  const view = new DataView(buf)
  values.forEach((v, i) => view.setFloat64(i * 8, v, true))
  return new Uint8Array(buf)
}

const float16Bytes = (values: number[]): Uint8Array => {
  const buf = new ArrayBuffer(values.length * 2)
  const view = new DataView(buf)
  values.forEach((v, i) => {
    const sign = v < 0 ? 1 : 0
    const abs = Math.abs(v)
    let bits: number
    if (abs === 0) {
      bits = sign << 15
    } else if (!Number.isFinite(abs)) {
      bits = (sign << 15) | (0x1f << 10)
    } else {
      const exp = Math.floor(Math.log2(abs))
      const biasedExp = exp + 15
      const mantissa = Math.round((abs / 2 ** exp - 1) * 1024)
      bits = (sign << 15) | (biasedExp << 10) | (mantissa & 0x3ff)
    }
    view.setUint16(i * 2, bits, true)
  })
  return new Uint8Array(buf)
}

const bfloat16Bytes = (values: number[]): Uint8Array => {
  const buf = new ArrayBuffer(values.length * 2)
  const view = new DataView(buf)
  values.forEach((v, i) => {
    const f32Buf = new ArrayBuffer(4)
    new DataView(f32Buf).setFloat32(0, v, false)
    const f32Bits = new DataView(f32Buf).getUint32(0, false)
    view.setUint16(i * 2, (f32Bits >> 16) & 0xffff, true)
  })
  return new Uint8Array(buf)
}

const int8Bytes = (values: number[]): Uint8Array => {
  const buf = new ArrayBuffer(values.length)
  const view = new DataView(buf)
  values.forEach((v, i) => view.setInt8(i, v))
  return new Uint8Array(buf)
}

const uint8Bytes = (values: number[]): Uint8Array => new Uint8Array(values)

const makeResp2Reply = (
  id: string,
  vectorField: string,
  vectorBlob: string,
): unknown[] => [1, id, [vectorField, vectorBlob]]

const makeField = (
  dataType: string,
  dimensions: number,
  vectorField = 'vec',
): SearchSampleField => ({ vectorField, dimensions, dataType })

describe('parseSearchSample', () => {
  it('decodes FLOAT32 vectors', () => {
    const raw = float32Bytes([1.5, -0.5, 3.0])
    const reply = makeResp2Reply('doc:1', 'vec', encodeAsRedisEscaped(raw))
    const result = parseSearchSample(reply, makeField('FLOAT32', 3))

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('doc:1')
    expect(result[0].vector[0]).toBeCloseTo(1.5)
    expect(result[0].vector[1]).toBeCloseTo(-0.5)
    expect(result[0].vector[2]).toBeCloseTo(3.0)
  })

  it('decodes FLOAT64 vectors', () => {
    const raw = float64Bytes([1.5, -0.5])
    const reply = makeResp2Reply('doc:2', 'vec', encodeAsRedisEscaped(raw))
    const result = parseSearchSample(reply, makeField('FLOAT64', 2))

    expect(result).toHaveLength(1)
    expect(result[0].vector[0]).toBeCloseTo(1.5)
    expect(result[0].vector[1]).toBeCloseTo(-0.5)
  })

  it('decodes FLOAT16 vectors', () => {
    const raw = float16Bytes([1.0, 2.0, -1.0])
    const reply = makeResp2Reply('doc:3', 'vec', encodeAsRedisEscaped(raw))
    const result = parseSearchSample(reply, makeField('FLOAT16', 3))

    expect(result).toHaveLength(1)
    expect(result[0].vector[0]).toBeCloseTo(1.0, 1)
    expect(result[0].vector[1]).toBeCloseTo(2.0, 1)
    expect(result[0].vector[2]).toBeCloseTo(-1.0, 1)
  })

  it('decodes BFLOAT16 vectors', () => {
    const raw = bfloat16Bytes([1.0, -2.0, 0.5])
    const reply = makeResp2Reply('doc:4', 'vec', encodeAsRedisEscaped(raw))
    const result = parseSearchSample(reply, makeField('BFLOAT16', 3))

    expect(result).toHaveLength(1)
    expect(result[0].vector[0]).toBeCloseTo(1.0, 1)
    expect(result[0].vector[1]).toBeCloseTo(-2.0, 1)
    expect(result[0].vector[2]).toBeCloseTo(0.5, 1)
  })

  it('decodes INT8 vectors', () => {
    const raw = int8Bytes([127, -128, 0, 42])
    const reply = makeResp2Reply('doc:5', 'vec', encodeAsRedisEscaped(raw))
    const result = parseSearchSample(reply, makeField('INT8', 4))

    expect(result).toHaveLength(1)
    expect(result[0].vector[0]).toBe(127)
    expect(result[0].vector[1]).toBe(-128)
    expect(result[0].vector[2]).toBe(0)
    expect(result[0].vector[3]).toBe(42)
  })

  it('decodes UINT8 vectors', () => {
    const raw = uint8Bytes([0, 128, 255])
    const reply = makeResp2Reply('doc:6', 'vec', encodeAsRedisEscaped(raw))
    const result = parseSearchSample(reply, makeField('UINT8', 3))

    expect(result).toHaveLength(1)
    expect(result[0].vector[0]).toBe(0)
    expect(result[0].vector[1]).toBe(128)
    expect(result[0].vector[2]).toBe(255)
  })

  it('returns empty for an unknown data type', () => {
    const raw = float32Bytes([1.0])
    const reply = makeResp2Reply('doc:7', 'vec', encodeAsRedisEscaped(raw))
    const result = parseSearchSample(reply, makeField('UNKNOWN', 1))

    expect(result).toHaveLength(0)
  })

  it('returns empty when byte length mismatches dimensions', () => {
    const raw = float32Bytes([1.0, 2.0])
    const reply = makeResp2Reply('doc:8', 'vec', encodeAsRedisEscaped(raw))
    const result = parseSearchSample(reply, makeField('FLOAT32', 3))

    expect(result).toHaveLength(0)
  })
})

const makeVectorFieldRow = (overrides: (string | number)[] = []): unknown[] => [
  'identifier',
  'embedding',
  'attribute',
  'embedding',
  'type',
  'VECTOR',
  'algorithm',
  'HNSW',
  'data_type',
  'FLOAT32',
  'dim',
  '128',
  'distance_metric',
  'COSINE',
  ...overrides,
]

const makeSearchInfoReply = (attributeRows: unknown[][]): unknown[] => [
  'index_definition',
  ['key_type', 'HASH'],
  'attributes',
  attributeRows,
  'num_docs',
  '3',
]

describe('parseSearchInfo', () => {
  it('extracts SVS-VAMANA fields from FT.INFO', () => {
    const row = makeVectorFieldRow([
      'algorithm',
      'SVS-VAMANA',
      'compression',
      'LVQ8',
      'graph_max_degree',
      '40',
      'construction_window_size',
      '250',
      'search_window_size',
      '20',
      'training_threshold',
      '100',
    ])
    const reply = makeSearchInfoReply([row])
    const result = parseSearchInfo(reply)

    expect(result.vectorFields).toHaveLength(1)
    const field = result.vectorFields[0]
    expect(field.algorithm).toBe('svs-vamana')
    expect(field.compression).toBe('LVQ8')
    expect(field.graphMaxDegree).toBe(40)
    expect(field.constructionWindowSize).toBe(250)
    expect(field.searchWindowSize).toBe(20)
    expect(field.trainingThreshold).toBe(100)
  })

  it.each(['LVQ4', 'LVQ4x4', 'LVQ4x8', 'LeanVec4x8', 'LeanVec8x8'])(
    'extracts SVS-VAMANA compression type %s',
    (compression) => {
      const row = makeVectorFieldRow([
        'algorithm',
        'SVS-VAMANA',
        'compression',
        compression,
      ])
      const reply = makeSearchInfoReply([row])
      const result = parseSearchInfo(reply)

      expect(result.vectorFields[0].compression).toBe(compression.toUpperCase())
    },
  )

  it('leaves SVS-VAMANA fields undefined for HNSW indexes', () => {
    const row = makeVectorFieldRow([
      'm',
      '32',
      'ef_construction',
      '300',
      'ef_runtime',
      '150',
    ])
    const reply = makeSearchInfoReply([row])
    const result = parseSearchInfo(reply)

    const field = result.vectorFields[0]
    expect(field.algorithm).toBe('hnsw')
    expect(field.m).toBe(32)
    expect(field.efConstruction).toBe(300)
    expect(field.efRuntime).toBe(150)
    expect(field.compression).toBeUndefined()
    expect(field.graphMaxDegree).toBeUndefined()
    expect(field.constructionWindowSize).toBeUndefined()
    expect(field.searchWindowSize).toBeUndefined()
    expect(field.trainingThreshold).toBeUndefined()
  })

  it('leaves compression undefined for SVS-VAMANA without a compression field', () => {
    const row = makeVectorFieldRow([
      'algorithm',
      'SVS-VAMANA',
      'graph_max_degree',
      '40',
      'construction_window_size',
      '250',
      'search_window_size',
      '20',
      'training_threshold',
      '100',
    ])
    const reply = makeSearchInfoReply([row])
    const result = parseSearchInfo(reply)

    const field = result.vectorFields[0]
    expect(field.algorithm).toBe('svs-vamana')
    expect(field.compression).toBeUndefined()
    expect(field.graphMaxDegree).toBe(40)
    expect(field.constructionWindowSize).toBe(250)
    expect(field.searchWindowSize).toBe(20)
    expect(field.trainingThreshold).toBe(100)
  })
})

describe('planRangeQuery', () => {
  it('builds VECTOR_RANGE syntax with YIELD_DISTANCE_AS', () => {
    const result = planRangeQuery({
      index: 'test-idx',
      vectorField: 'embedding',
      queryParameter: 'vv_anchor',
      vector: new Uint8Array([1, 2, 3, 4]),
      radius: 0.5,
    })

    expect(result.command).toBe('FT.SEARCH')
    expect(result.arguments[0]).toBe('test-idx')
    const query = result.arguments[1] as string
    expect(query).toContain('VECTOR_RANGE')
    expect(query).toContain('$YIELD_DISTANCE_AS: __vv_metric')
    expect(query).toContain('@embedding:[VECTOR_RANGE 0.5 $vv_anchor]')
    expect(result.arguments).toContain('PARAMS')
    expect(result.arguments).toContain('vv_anchor')
    expect(result.arguments).toContain('SORTBY')
    expect(result.arguments).toContain('__vv_metric')
    expect(result.arguments).toContain('LIMIT')
    expect(result.arguments).toContain('200')
  })

  it('includes EPSILON in the query attributes', () => {
    const result = planRangeQuery({
      index: 'test-idx',
      vectorField: 'embedding',
      queryParameter: 'vv_anchor',
      vector: new Uint8Array([1, 2, 3, 4]),
      radius: 0.5,
      epsilon: 0.01,
    })

    const query = result.arguments[1] as string
    expect(query).toContain('$EPSILON: 0.01')
    expect(query).toContain('$YIELD_DISTANCE_AS: __vv_metric')
    // EPSILON must not leak into PARAMS (that's the KNN delivery mechanism).
    expect(result.arguments).not.toContain('0.01')
  })

  it('places the pre-filter before the range clause', () => {
    const result = planRangeQuery({
      index: 'test-idx',
      vectorField: 'embedding',
      filter: '@category:{news}',
      queryParameter: 'vv_anchor',
      vector: new Uint8Array([1, 2, 3, 4]),
      radius: 0.5,
    })

    const query = result.arguments[1] as string
    expect(query).toBe(
      '(@category:{news}) @embedding:[VECTOR_RANGE 0.5 $vv_anchor]=>{$YIELD_DISTANCE_AS: __vv_metric}',
    )
  })

  it('defaults LIMIT to 200 when not specified', () => {
    const result = planRangeQuery({
      index: 'test-idx',
      vectorField: 'embedding',
      queryParameter: 'vv_anchor',
      vector: new Uint8Array([1, 2, 3, 4]),
      radius: 0.5,
    })

    const limitIndex = result.arguments.indexOf('LIMIT')
    expect(result.arguments[limitIndex + 1]).toBe('0')
    expect(result.arguments[limitIndex + 2]).toBe('200')
  })

  it('honors a custom LIMIT', () => {
    const result = planRangeQuery({
      index: 'test-idx',
      vectorField: 'embedding',
      queryParameter: 'vv_anchor',
      vector: new Uint8Array([1, 2, 3, 4]),
      radius: 0.5,
      limit: 50,
    })

    const limitIndex = result.arguments.indexOf('LIMIT')
    expect(result.arguments[limitIndex + 1]).toBe('0')
    expect(result.arguments[limitIndex + 2]).toBe('50')
  })
})

describe('planProfileRangeQuery', () => {
  it('wraps the range query in FT.PROFILE SEARCH LIMITED QUERY', () => {
    const result = planProfileRangeQuery({
      index: 'test-idx',
      vectorField: 'embedding',
      queryParameter: 'vv_anchor',
      vector: new Uint8Array([1, 2, 3, 4]),
      radius: 0.5,
    })

    expect(result.command).toBe('FT.PROFILE')
    expect(result.arguments[0]).toBe('test-idx')
    expect(result.arguments[1]).toBe('SEARCH')
    expect(result.arguments[2]).toBe('LIMITED')
    expect(result.arguments[3]).toBe('QUERY')
    const query = result.arguments[4] as string
    expect(query).toContain('@embedding:[VECTOR_RANGE 0.5 $vv_anchor]')
    expect(query).toContain('$YIELD_DISTANCE_AS: __vv_metric')
    expect(result.arguments).toContain('PARAMS')
    expect(result.arguments).toContain('SORTBY')
    expect(result.arguments).toContain('LIMIT')
    expect(result.arguments).toContain('200')
  })

  it('is marked read-only with unknown-exactness provenance', () => {
    const result = planProfileRangeQuery({
      index: 'test-idx',
      vectorField: 'embedding',
      queryParameter: 'vv_anchor',
      vector: new Uint8Array([1, 2, 3, 4]),
      radius: 0.5,
    })

    expect(result.readOnly).toBe(true)
    expect(result.provenance).toEqual({
      kind: 'measured',
      exactness: 'unknown',
    })
  })
})

const baseAggregateInput: AggregateQueryInput = {
  index: 'test-idx',
  baseQuery: '*=>[KNN 100 @embedding $vv_anchor AS __vv_metric]',
  queryParameter: 'vv_anchor',
  vector: new Uint8Array([1, 2, 3, 4]),
  loadFields: ['category'],
  groupByFields: ['category'],
  reduceOps: [{ function: 'COUNT', alias: 'count' }],
}

describe('planAggregateQuery', () => {
  it('builds KNN + GROUPBY + COUNT syntax', () => {
    const result = planAggregateQuery(baseAggregateInput)

    expect(result.command).toBe('FT.AGGREGATE')
    expect(result.arguments[0]).toBe('test-idx')
    expect(result.arguments[1]).toBe(
      '*=>[KNN 100 @embedding $vv_anchor AS __vv_metric]',
    )
    expect(result.arguments).toEqual(
      expect.arrayContaining([
        'LOAD',
        '1',
        '@category',
        'GROUPBY',
        '1',
        '@category',
        'REDUCE',
        'COUNT',
        '0',
        'AS',
        'count',
      ]),
    )
  })

  it('builds AVG reduce on a distance field with alias', () => {
    const result = planAggregateQuery({
      ...baseAggregateInput,
      reduceOps: [{ function: 'AVG', field: '__vv_metric', alias: 'avg_dist' }],
    })

    const reduceIndex = result.arguments.indexOf('REDUCE')
    expect(result.arguments[reduceIndex + 1]).toBe('AVG')
    expect(result.arguments[reduceIndex + 2]).toBe('1')
    expect(result.arguments[reduceIndex + 3]).toBe('@__vv_metric')
    expect(result.arguments[reduceIndex + 4]).toBe('AS')
    expect(result.arguments[reduceIndex + 5]).toBe('avg_dist')
  })

  it('works with a RANGE base query', () => {
    const rangeQuery =
      '@embedding:[VECTOR_RANGE 0.5 $vv_anchor]=>{$YIELD_DISTANCE_AS: __vv_metric}'
    const result = planAggregateQuery({
      ...baseAggregateInput,
      baseQuery: rangeQuery,
    })

    expect(result.command).toBe('FT.AGGREGATE')
    expect(result.arguments[1]).toBe(rangeQuery)
  })

  it('supports multiple REDUCE ops in a single query', () => {
    const result = planAggregateQuery({
      ...baseAggregateInput,
      reduceOps: [
        { function: 'COUNT', alias: 'count' },
        { function: 'AVG', field: '__vv_metric', alias: 'avg_dist' },
        { function: 'MIN', field: '__vv_metric', alias: 'min_dist' },
      ],
    })

    const reduceIndices = result.arguments.flatMap((value, index) =>
      value === 'REDUCE' ? [index] : [],
    )
    expect(reduceIndices).toHaveLength(3)
    expect(result.arguments[reduceIndices[0] + 1]).toBe('COUNT')
    expect(result.arguments[reduceIndices[1] + 1]).toBe('AVG')
    expect(result.arguments[reduceIndices[2] + 1]).toBe('MIN')
  })

  it('builds SORTBY with the nargs convention', () => {
    const result = planAggregateQuery({
      ...baseAggregateInput,
      sortBy: { field: 'avg_dist', order: 'ASC' },
    })

    const sortIndex = result.arguments.indexOf('SORTBY')
    expect(result.arguments[sortIndex + 1]).toBe('2')
    expect(result.arguments[sortIndex + 2]).toBe('@avg_dist')
    expect(result.arguments[sortIndex + 3]).toBe('ASC')
  })

  it('always sends PARAMS with count 2 (paramName + vector)', () => {
    const result = planAggregateQuery(baseAggregateInput)

    const paramsIndex = result.arguments.indexOf('PARAMS')
    expect(result.arguments[paramsIndex + 1]).toBe('2')
    expect(result.arguments[paramsIndex + 2]).toBe('vv_anchor')
    expect(result.arguments[paramsIndex + 3]).toBe(baseAggregateInput.vector)
  })

  it('includes LIMIT when provided', () => {
    const result = planAggregateQuery({
      ...baseAggregateInput,
      limit: 25,
    })

    const limitIndex = result.arguments.indexOf('LIMIT')
    expect(result.arguments[limitIndex + 1]).toBe('0')
    expect(result.arguments[limitIndex + 2]).toBe('25')
  })

  it('omits LIMIT when not provided', () => {
    const result = planAggregateQuery(baseAggregateInput)

    expect(result.arguments).not.toContain('LIMIT')
  })
})

describe('planProfileAggregateQuery', () => {
  it('wraps FT.AGGREGATE in FT.PROFILE AGGREGATE LIMITED QUERY', () => {
    const result = planProfileAggregateQuery(baseAggregateInput)

    expect(result.command).toBe('FT.PROFILE')
    expect(result.arguments.slice(0, 5)).toEqual([
      'test-idx',
      'AGGREGATE',
      'LIMITED',
      'QUERY',
      '*=>[KNN 100 @embedding $vv_anchor AS __vv_metric]',
    ])
    expect(result.arguments).toEqual(
      expect.arrayContaining(['GROUPBY', '1', '@category', 'PARAMS', '2']),
    )
  })
})

describe('parseAggregateResponse', () => {
  it('parses RESP2 flat format groups', () => {
    const reply = [
      2,
      ['category', 'electronics', 'count', '23', 'avg_dist', '0.12'],
      ['category', 'books', 'count', '15', 'avg_dist', '0.34'],
    ]
    const result = parseAggregateResponse(reply)

    expect(result.totalGroups).toBe(2)
    expect(result.groups).toEqual([
      { category: 'electronics', count: 23, avg_dist: 0.12 },
      { category: 'books', count: 15, avg_dist: 0.34 },
    ])
  })

  it('parses RESP3 keyed format groups', () => {
    const reply = {
      total_results: 2,
      results: [
        {
          extra_attributes: {
            category: 'electronics',
            count: 23,
            avg_dist: 0.12,
          },
        },
        {
          extra_attributes: { category: 'books', count: 15, avg_dist: 0.34 },
        },
      ],
    }
    const result = parseAggregateResponse(reply)

    expect(result.totalGroups).toBe(2)
    expect(result.groups).toEqual([
      { category: 'electronics', count: 23, avg_dist: 0.12 },
      { category: 'books', count: 15, avg_dist: 0.34 },
    ])
  })

  it('coerces numeric strings to numbers while leaving non-numeric strings as text', () => {
    const reply = [
      1,
      ['category', 'electronics', 'count', '23', 'label', 'not-a-number'],
    ]
    const result = parseAggregateResponse(reply)

    expect(result.groups[0].category).toBe('electronics')
    expect(result.groups[0].count).toBe(23)
    expect(typeof result.groups[0].count).toBe('number')
    expect(result.groups[0].label).toBe('not-a-number')
    expect(typeof result.groups[0].label).toBe('string')
  })

  it('returns an empty groups array with zero total for an empty RESP2 reply', () => {
    const result = parseAggregateResponse([0])

    expect(result.groups).toEqual([])
    expect(result.totalGroups).toBe(0)
  })
})

const baseHybridInput: HybridQueryInput = {
  index: 'test-idx',
  textQuery: 'wireless headphones',
  vectorField: 'embedding',
  queryParameter: 'vv_anchor',
  vector: new Uint8Array([1, 2, 3, 4]),
  vsimMode: 'knn',
  limit: 50,
  fusionMethod: 'rrf',
}

describe('planHybridQuery', () => {
  it('builds the SEARCH clause, VSIM KNN clause, COMBINE RRF clause, score LOAD, and PARAMS', () => {
    const result = planHybridQuery(baseHybridInput)

    expect(result.command).toBe('FT.HYBRID')
    expect(result.arguments[0]).toBe('test-idx')
    expect(result.arguments).toEqual(
      expect.arrayContaining([
        'SEARCH',
        'wireless headphones',
        'VSIM',
        '@embedding',
        '$vv_anchor',
        'KNN',
        'LOAD',
        '4',
        '@__key',
        '@text_score',
        '@vector_score',
        '@__combined_score',
        'PARAMS',
        '2',
        'vv_anchor',
        baseHybridInput.vector,
      ]),
    )
  })

  it('yields text and vector scores and loads the Redis combined score', () => {
    const result = planHybridQuery(baseHybridInput)

    const yieldIndices = result.arguments.flatMap((value, index) =>
      value === 'YIELD_SCORE_AS' ? [index] : [],
    )
    expect(yieldIndices).toHaveLength(2)
    expect(result.arguments[yieldIndices[0] + 1]).toBe('text_score')
    expect(result.arguments[yieldIndices[1] + 1]).toBe('vector_score')
    expect(result.arguments).toEqual(
      expect.arrayContaining(['@__combined_score']),
    )
  })

  it('preserves requested load fields after the required score aliases', () => {
    const result = planHybridQuery({
      ...baseHybridInput,
      loadFields: ['brand', 'text_score'],
    })

    const loadIndex = result.arguments.indexOf('LOAD')
    expect(result.arguments.slice(loadIndex, loadIndex + 7)).toEqual([
      'LOAD',
      '5',
      '@__key',
      '@text_score',
      '@vector_score',
      '@__combined_score',
      '@brand',
    ])
  })

  it('builds COMBINE RRF with CONSTANT and WINDOW using the nargs convention', () => {
    const result = planHybridQuery({
      ...baseHybridInput,
      rrfConstant: 60,
      rrfWindow: 20,
    })

    const combineIndex = result.arguments.indexOf('COMBINE')
    expect(result.arguments.slice(combineIndex, combineIndex + 7)).toEqual([
      'COMBINE',
      'RRF',
      '4',
      'CONSTANT',
      '60',
      'WINDOW',
      '20',
    ])
    expect(result.arguments[combineIndex + 7]).not.toBe('YIELD_SCORE_AS')
  })

  it('sends Redis RRF defaults when no RRF overrides are provided', () => {
    const result = planHybridQuery(baseHybridInput)

    const combineIndex = result.arguments.indexOf('COMBINE')
    expect(result.arguments.slice(combineIndex, combineIndex + 7)).toEqual([
      'COMBINE',
      'RRF',
      '4',
      'CONSTANT',
      '60',
      'WINDOW',
      '20',
    ])
    expect(result.arguments[combineIndex + 7]).not.toBe('YIELD_SCORE_AS')
  })

  it('builds COMBINE LINEAR with ALPHA and BETA using the nargs convention', () => {
    const result = planHybridQuery({
      ...baseHybridInput,
      fusionMethod: 'linear',
      linearAlpha: 0.7,
      linearBeta: 0.3,
    })

    const combineIndex = result.arguments.indexOf('COMBINE')
    expect(result.arguments.slice(combineIndex, combineIndex + 7)).toEqual([
      'COMBINE',
      'LINEAR',
      '4',
      'ALPHA',
      '0.7',
      'BETA',
      '0.3',
    ])
    expect(result.arguments[combineIndex + 7]).not.toBe('YIELD_SCORE_AS')
  })

  it('sends balanced LINEAR defaults when no LINEAR weights are provided', () => {
    const result = planHybridQuery({
      ...baseHybridInput,
      fusionMethod: 'linear',
    })

    const combineIndex = result.arguments.indexOf('COMBINE')
    expect(result.arguments.slice(combineIndex, combineIndex + 7)).toEqual([
      'COMBINE',
      'LINEAR',
      '4',
      'ALPHA',
      '0.5',
      'BETA',
      '0.5',
    ])
    expect(result.arguments[combineIndex + 7]).not.toBe('YIELD_SCORE_AS')
  })

  it('builds KNN with EF_RUNTIME using the nargs convention', () => {
    const result = planHybridQuery({
      ...baseHybridInput,
      efRuntime: 200,
    })

    const knnIndex = result.arguments.indexOf('KNN')
    expect(result.arguments.slice(knnIndex, knnIndex + 6)).toEqual([
      'KNN',
      '4',
      'K',
      '50',
      'EF_RUNTIME',
      '200',
    ])
    expect(result.arguments.slice(knnIndex + 6, knnIndex + 8)).toEqual([
      'YIELD_SCORE_AS',
      'vector_score',
    ])
  })

  it('builds KNN without EF_RUNTIME using the nargs convention', () => {
    const result = planHybridQuery(baseHybridInput)

    const knnIndex = result.arguments.indexOf('KNN')
    expect(result.arguments.slice(knnIndex, knnIndex + 4)).toEqual([
      'KNN',
      '2',
      'K',
      '50',
    ])
    expect(result.arguments.slice(knnIndex + 4, knnIndex + 6)).toEqual([
      'YIELD_SCORE_AS',
      'vector_score',
    ])
  })

  it('builds VSIM RANGE with RADIUS using the nargs convention', () => {
    const result = planHybridQuery({
      ...baseHybridInput,
      vsimMode: 'range',
      radius: 0.5,
    })

    const rangeIndex = result.arguments.indexOf('RANGE')
    expect(result.arguments.slice(rangeIndex, rangeIndex + 4)).toEqual([
      'RANGE',
      '2',
      'RADIUS',
      '0.5',
    ])
    expect(result.arguments.slice(rangeIndex + 4, rangeIndex + 6)).toEqual([
      'YIELD_SCORE_AS',
      'vector_score',
    ])
  })

  it('builds VSIM RANGE with RADIUS and EPSILON using the nargs convention', () => {
    const result = planHybridQuery({
      ...baseHybridInput,
      vsimMode: 'range',
      radius: 0.5,
      epsilon: 0.01,
    })

    const rangeIndex = result.arguments.indexOf('RANGE')
    expect(result.arguments.slice(rangeIndex, rangeIndex + 6)).toEqual([
      'RANGE',
      '4',
      'RADIUS',
      '0.5',
      'EPSILON',
      '0.01',
    ])
    expect(result.arguments.slice(rangeIndex + 6, rangeIndex + 8)).toEqual([
      'YIELD_SCORE_AS',
      'vector_score',
    ])
  })

  it('includes a FILTER clause when provided', () => {
    const result = planHybridQuery({
      ...baseHybridInput,
      filter: '@price:[100 500]',
    })

    const filterIndex = result.arguments.indexOf('FILTER')
    expect(filterIndex).toBeGreaterThan(-1)
    expect(result.arguments[filterIndex + 1]).toBe('@price:[100 500]')
  })

  it('omits FILTER when not provided', () => {
    const result = planHybridQuery(baseHybridInput)

    expect(result.arguments).not.toContain('FILTER')
  })

  it('supports a wildcard SEARCH for vector-only hybrid queries', () => {
    const result = planHybridQuery({ ...baseHybridInput, textQuery: '*' })

    const searchIndex = result.arguments.indexOf('SEARCH')
    expect(result.arguments[searchIndex + 1]).toBe('*')
  })

  it('always sends PARAMS with count 2 (paramName + vector)', () => {
    const result = planHybridQuery(baseHybridInput)

    const paramsIndex = result.arguments.indexOf('PARAMS')
    expect(result.arguments[paramsIndex + 1]).toBe('2')
    expect(result.arguments[paramsIndex + 2]).toBe('vv_anchor')
    expect(result.arguments[paramsIndex + 3]).toBe(baseHybridInput.vector)
  })

  it('sorts by the loaded Redis combined score using the FT.HYBRID nargs convention', () => {
    const result = planHybridQuery(baseHybridInput)

    const sortIndex = result.arguments.indexOf('SORTBY')
    expect(result.arguments.slice(sortIndex, sortIndex + 4)).toEqual([
      'SORTBY',
      '2',
      '@__combined_score',
      'ASC',
    ])
  })

  it('does not send SEARCH_WINDOW_SIZE in FT.HYBRID KNN arguments', () => {
    const result = planHybridQuery({
      ...baseHybridInput,
      searchWindowSize: 50,
    })

    const knnIndex = result.arguments.indexOf('KNN')
    const knnNargs = Number(result.arguments[knnIndex + 1])
    const knnArgs = result.arguments.slice(
      knnIndex + 2,
      knnIndex + 2 + knnNargs,
    )
    expect(knnArgs).not.toContain('SEARCH_WINDOW_SIZE')
  })

  it('builds KNN with SHARD_K_RATIO using the nargs convention', () => {
    const result = planHybridQuery({
      ...baseHybridInput,
      shardKRatio: 0.5,
    })

    const knnIndex = result.arguments.indexOf('KNN')
    const knnNargs = Number(result.arguments[knnIndex + 1])
    const knnArgs = result.arguments.slice(
      knnIndex + 2,
      knnIndex + 2 + knnNargs,
    )
    expect(knnArgs).toContain('SHARD_K_RATIO')
    expect(knnArgs[knnArgs.indexOf('SHARD_K_RATIO') + 1]).toBe('0.5')
  })
})

describe('planProfileHybridQuery', () => {
  it('wraps FT.HYBRID in FT.PROFILE HYBRID LIMITED QUERY', () => {
    const result = planProfileHybridQuery(baseHybridInput)

    expect(result.command).toBe('FT.PROFILE')
    expect(result.arguments.slice(0, 6)).toEqual([
      'test-idx',
      'HYBRID',
      'LIMITED',
      'QUERY',
      'SEARCH',
      'wireless headphones',
    ])
    expect(result.arguments).toEqual(
      expect.arrayContaining(['VSIM', '@embedding', '$vv_anchor', 'COMBINE']),
    )
  })
})

describe('buildRuntimeParamTokens via planProfileSearchNeighbors', () => {
  const basePlanInput = {
    index: 'idx',
    vectorField: 'embedding',
    queryParameter: 'vv_anchor',
    vector: new Uint8Array([0, 0, 128, 63]),
    limit: 10,
  }

  const paramTokens = (plan: { arguments: unknown[] }) => {
    const args = plan.arguments
    const paramsIndex = args.indexOf('PARAMS')
    const count = Number(args[paramsIndex + 1])
    return args.slice(paramsIndex + 2, paramsIndex + 2 + count)
  }

  it('adds an explicit FT.SEARCH LIMIT matching the KNN neighbor limit', () => {
    const result = planProfileSearchNeighbors({
      ...basePlanInput,
      limit: 20,
    })

    const query = result.arguments[result.arguments.indexOf('QUERY') + 1]
    const limitIndex = result.arguments.indexOf('LIMIT')

    expect(query).toBe('*=>[KNN 20 @embedding $vv_anchor AS __vv_metric]')
    expect(result.arguments.slice(limitIndex, limitIndex + 3)).toEqual([
      'LIMIT',
      '0',
      '20',
    ])
  })

  it('includes $SHARD_K_RATIO with $ prefix in FT.SEARCH PARAMS', () => {
    const result = planProfileSearchNeighbors({
      ...basePlanInput,
      runtimeParams: { shardKRatio: 0.5 },
    })
    // planProfileSearchNeighbors wraps in FT.PROFILE, the inner args contain PARAMS
    // Access the arguments which are [index, 'SEARCH', 'LIMITED', 'QUERY', query, 'LIMIT', '0', limit, 'PARAMS', count, ...]
    const tokens = paramTokens(result)
    expect(tokens).toContain('$SHARD_K_RATIO')
    expect(tokens[tokens.indexOf('$SHARD_K_RATIO') + 1]).toBe('0.5')
  })

  it('includes USE_SEARCH_HISTORY in FT.SEARCH PARAMS', () => {
    const result = planProfileSearchNeighbors({
      ...basePlanInput,
      runtimeParams: { useSearchHistory: 'ON' },
    })
    const tokens = paramTokens(result)
    expect(tokens).toContain('USE_SEARCH_HISTORY')
    expect(tokens[tokens.indexOf('USE_SEARCH_HISTORY') + 1]).toBe('ON')
  })

  it('includes SEARCH_BUFFER_CAPACITY in FT.SEARCH PARAMS', () => {
    const result = planProfileSearchNeighbors({
      ...basePlanInput,
      runtimeParams: { searchBufferCapacity: 128 },
    })
    const tokens = paramTokens(result)
    expect(tokens).toContain('SEARCH_BUFFER_CAPACITY')
    expect(tokens[tokens.indexOf('SEARCH_BUFFER_CAPACITY') + 1]).toBe('128')
  })
})

describe('parseHybridResponse', () => {
  it('extracts all 3 scores per document from RESP2 format', () => {
    const reply = [
      2,
      'doc:1',
      ['text_score', '0.5', 'vector_score', '0.3', '__combined_score', '0.8'],
      'doc:2',
      ['text_score', '0.4', 'vector_score', '0.6', '__combined_score', '0.7'],
    ]
    const result = parseHybridResponse(reply)

    expect(result.totalResults).toBe(2)
    expect(result.documents).toEqual([
      { id: 'doc:1', textScore: 0.5, vectorScore: 0.3, hybridScore: 0.8 },
      { id: 'doc:2', textScore: 0.4, vectorScore: 0.6, hybridScore: 0.7 },
    ])
  })

  it('extracts all 3 scores per document from RESP3 keyed format', () => {
    const reply = {
      total_results: 1,
      results: [
        {
          extra_attributes: {
            __key: 'doc:1',
            text_score: '0.5',
            vector_score: '0.3',
            __combined_score: '0.8',
          },
        },
      ],
    }
    const result = parseHybridResponse(reply)

    expect(result.totalResults).toBe(1)
    expect(result.documents).toEqual([
      { id: 'doc:1', textScore: 0.5, vectorScore: 0.3, hybridScore: 0.8 },
    ])
  })

  it('extracts flat FT.PROFILE HYBRID rows loaded with Redis reserved __key', () => {
    const reply = {
      total_results: 1,
      results: [
        [
          '__key',
          'doc:1',
          'text_score',
          '0.5',
          'vector_score',
          '0.3',
          '__combined_score',
          '0.8',
        ],
      ],
    }
    const result = parseHybridResponse(reply)

    expect(result.totalResults).toBe(1)
    expect(result.documents).toEqual([
      { id: 'doc:1', textScore: 0.5, vectorScore: 0.3, hybridScore: 0.8 },
    ])
  })

  it('keeps HYBRID documents when Redis returns only one score channel for a row', () => {
    const reply = {
      total_results: 2,
      results: [
        ['__key', 'doc:vector', 'vector_score', '0.750610458745'],
        ['__key', 'doc:text', 'text_score', '3.30244346072'],
      ],
    }
    const result = parseHybridResponse(reply)

    expect(result.totalResults).toBe(2)
    expect(result.documents).toEqual([
      { id: 'doc:vector', vectorScore: 0.750610458745 },
      { id: 'doc:text', textScore: 3.30244346072 },
    ])
  })

  it('includes non-score fields in the fields property', () => {
    const reply = {
      total_results: 1,
      results: [
        {
          id: 'doc:1',
          extra_attributes: {
            text_score: '0.5',
            vector_score: '0.3',
            __combined_score: '0.8',
            __key: 'doc:1',
            title: 'Wireless Headphones',
            category: 'electronics',
          },
        },
      ],
    }
    const result = parseHybridResponse(reply)

    expect(result.documents[0].fields).toEqual({
      title: 'Wireless Headphones',
      category: 'electronics',
    })
  })
})
