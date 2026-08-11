import { FeatureFlags } from 'uiSrc/constants'

const key = new Uint8Array([0, 255, 10])

const state = {
  app: {
    features: {
      featureFlags: {
        get features() {
          return window.__E2T2_FIXTURE__.enabled
            ? { [FeatureFlags.devVectorVisualizer]: { flag: true } }
            : {}
        },
      },
    },
  },
  browser: {
    redisearch: {
      list: {
        data: [
          {
            type: 'Buffer',
            data: Array.from(new TextEncoder().encode('idx-products')),
          },
        ],
      },
    },
    keys: {
      selectedKey: {
        loading: false,
        data: {
          name: key,
          quantType: 'NOQUANT',
          vectorDim: 3,
          length: 2,
        },
      },
    },
    vectorSet: {
      data: {
        total: 2,
        elements: [],
        isPaginationSupported: false,
        attributeKeys: [],
      },
      adding: { loading: false },
      similaritySearch: { loading: false, error: '', data: undefined },
      similaritySearchPreview: { loading: false, error: '', data: undefined },
    },
  },
  connections: { instances: { connectedInstance: { id: 'database-1' } } },
}

export const useAppDispatch = () => () => undefined
export const useAppSelector = (selector: (value: typeof state) => unknown) =>
  selector(state)
