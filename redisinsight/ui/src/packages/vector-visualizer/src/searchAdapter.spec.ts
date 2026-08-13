import { parseSearchSample, SearchSampleField } from './searchAdapter'

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

const uint8Bytes = (values: number[]): Uint8Array =>
  new Uint8Array(values)

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
