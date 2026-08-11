const vectorBytes = (...values: number[]) =>
  Array.from(new Uint8Array(new Float32Array(values).buffer))
    .map((byte) => `\\x${byte.toString(16).padStart(2, '0')}`)
    .join('')

// Native executor hex-escapes every argument. The second escaped argument is
// the Search query; deliberately never inspect PARAMS, which holds the anchor.
const searchQuery = (command: string) => {
  const encoded = [...command.matchAll(/"((?:\\x[0-9a-f]{2})*)"/gi)][1]?.[1]
  if (!encoded) return ''
  const bytes = [...encoded.matchAll(/\\x([0-9a-f]{2})/gi)].map((match) =>
    Number.parseInt(match[1], 16),
  )
  return new TextDecoder().decode(new Uint8Array(bytes))
}

const SAMPLE_COUNT = 96

const searchInfo = [
  'num_docs',
  SAMPLE_COUNT,
  'attributes',
  [
    [
      'identifier',
      'embedding',
      'attribute',
      'embedding',
      'type',
      'VECTOR',
      'data_type',
      'FLOAT32',
      'dim',
      2,
      'distance_metric',
      'COSINE',
      'algorithm',
      'HNSW',
    ],
    ['identifier', 'region', 'attribute', 'region', 'type', 'TAG'],
    ['identifier', 'cluster', 'attribute', 'cluster', 'type', 'TEXT'],
  ],
]

const searchSampleRows = Array.from({ length: SAMPLE_COUNT }, (_, index) => {
  const cluster = Math.floor(index / 24)
  const row = Math.floor((index % 24) / 6)
  const column = index % 6
  const centers: Array<[number, number]> = [
    [-0.8, -0.55],
    [0.8, -0.5],
    [-0.55, 0.65],
    [0.55, 0.65],
  ]
  const [centerX, centerY] = centers[cluster]
  return [
    `doc:${index + 1}`,
    [
      'embedding',
      vectorBytes(
        centerX + (column - 2.5) * 0.08 + (row % 2) * 0.012,
        centerY + (row - 1.5) * 0.1 + (column % 2) * 0.012,
      ),
      'region',
      ['catalog', 'support', 'document', 'product'][cluster],
      'cluster',
      `response-cluster-${cluster + 1}`,
    ],
  ]
}).flat()

const neighborResponse = Array.from({ length: 50 }, (_, index) => [
  `doc:${index + 1}`,
  ['__vv_metric', Number((index * 0.018).toFixed(3))],
]).flat()

const response = (command: string) => {
  if (command.startsWith('FT.INFO')) return searchInfo
  if (command.startsWith('FT.SEARCH')) {
    if (searchQuery(command).includes('KNN')) return [50, ...neighborResponse]
    return [SAMPLE_COUNT, ...searchSampleRows]
  }
  if (command.startsWith('VCARD')) return 4
  if (command.startsWith('VDIM')) return 2
  if (command.startsWith('VINFO'))
    return ['quant-type', 'int8', 'vector-dim', 2, 'max-level', 3]
  if (command.startsWith('VRANGE'))
    return ['member:1', 'member:2', 'member:3', 'member:4']
  if (command.startsWith('VEMB')) {
    if (command.includes('\\x6d\\x65\\x6d\\x62\\x65\\x72\\x3a\\x33'))
      return [2, 1]
    if (command.includes('\\x6d\\x65\\x6d\\x62\\x65\\x72\\x3a\\x34'))
      return [-1, 0]
    return [1, 2]
  }
  if (command.startsWith('VGETATTR')) {
    if (command.includes('\\x6d\\x65\\x6d\\x62\\x65\\x72\\x3a\\x33'))
      return '{"category":"Support","published":true}'
    if (command.includes('\\x6d\\x65\\x6d\\x62\\x65\\x72\\x3a\\x34'))
      return '{"category":"Product","published":true}'
    return '{"category":"Documentation","published":true}'
  }
  if (command.startsWith('VSIM'))
    return command.endsWith('"\\x54\\x52\\x55\\x54\\x48"')
      ? ['member:neighbor', 1]
      : ['member:neighbor', 0.99]
  if (command.startsWith('VLINKS')) return [['member:neighbor'], ['member:2']]
  return []
}

export const apiService = {
  post: (
    _url: string,
    body: { command: string },
    config?: { signal?: AbortSignal },
  ) => {
    window.__E5_T1_COMMAND_COUNT__ = (window.__E5_T1_COMMAND_COUNT__ ?? 0) + 1
    const mode = new URLSearchParams(window.location.search).get('mode')
    if (mode === 'acl')
      return Promise.resolve({
        data: { status: 'fail', response: 'NOPERM fixture ACL denial' },
      })
    if (mode === 'cancel')
      return new Promise((_, reject) =>
        config?.signal?.addEventListener('abort', () =>
          reject(new Error('cancelled')),
        ),
      )
    return Promise.resolve({
      data: { status: 'success', response: response(body.command) },
    })
  },
}

export default apiService

export const getBaseUrl = () => 'http://127.0.0.1:4185'

export const setApiCsrfHeader = () => undefined
