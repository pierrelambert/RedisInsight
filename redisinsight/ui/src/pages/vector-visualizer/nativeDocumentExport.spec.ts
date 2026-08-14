import {
  parseNativeDocumentExport,
  planSearchDocumentExport,
  planVectorSetDocumentExport,
} from './nativeDocumentExport'

describe('native document export', () => {
  it('plans HASH and JSON document reads as read-only commands', () => {
    expect(
      planSearchDocumentExport({ id: 'bikes:1', storage: 'hash' }),
    ).toEqual(
      expect.objectContaining({
        command: 'HGETALL',
        arguments: ['bikes:1'],
        readOnly: true,
      }),
    )
    expect(
      planSearchDocumentExport({ id: 'bikes:1', storage: 'json' }),
    ).toEqual(
      expect.objectContaining({
        command: 'JSON.GET',
        arguments: ['bikes:1'],
        readOnly: true,
      }),
    )
  })

  it('exports Search HASH fields as the Redis document instead of chart rows', () => {
    expect(
      parseNativeDocumentExport({
        id: 'bikes:10088',
        source: {
          kind: 'search-index',
          index: 'idx:bikes_vss',
          vectorField: 'description_embeddings',
        },
        storage: 'hash',
        reply: ['model', 'Ncc1702', 'brand', 'Nord', 'price', '3599'],
      }),
    ).toEqual({
      id: 'bikes:10088',
      source: {
        kind: 'search-index',
        index: 'idx:bikes_vss',
        storage: 'hash',
      },
      document: {
        model: 'Ncc1702',
        brand: 'Nord',
        price: '3599',
      },
    })
  })

  it('exports Search JSON values as parsed documents', () => {
    expect(
      parseNativeDocumentExport({
        id: 'bike:json',
        source: {
          kind: 'search-index',
          index: 'idx:bikes_json',
          vectorField: '$.description_embeddings',
        },
        storage: 'json',
        reply: '{"model":"Ncc1702","brand":"Nord"}',
      }),
    ).toEqual({
      id: 'bike:json',
      source: {
        kind: 'search-index',
        index: 'idx:bikes_json',
        storage: 'json',
      },
      document: {
        model: 'Ncc1702',
        brand: 'Nord',
      },
    })
  })

  it('exports Vector Set member attributes because members are not Redis documents', () => {
    expect(
      planVectorSetDocumentExport({
        key: 'bikes-vectors',
        member: 'bike:1',
      }),
    ).toEqual(
      expect.objectContaining({
        command: 'VGETATTR',
        arguments: ['bikes-vectors', 'bike:1'],
        readOnly: true,
      }),
    )
    expect(
      parseNativeDocumentExport({
        id: 'bike:1',
        source: {
          kind: 'vector-set',
          key: new TextEncoder().encode('bikes-vectors'),
        },
        reply: '{"brand":"Nord"}',
      }),
    ).toEqual({
      id: 'bike:1',
      source: {
        kind: 'vector-set',
      },
      attributes: {
        brand: 'Nord',
      },
    })
  })
})
