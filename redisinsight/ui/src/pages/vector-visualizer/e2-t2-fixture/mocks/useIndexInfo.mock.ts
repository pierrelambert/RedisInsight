import { FieldTypes } from 'uiSrc/pages/browser/components/create-redisearch-index/constants'

export const useIndexInfo = () => ({
  loading: false,
  error: null,
  indexInfo: {
    attributes: [
      { attribute: 'title', type: FieldTypes.TEXT },
      { attribute: 'embedding', type: FieldTypes.VECTOR },
      { attribute: 'image_embedding', type: FieldTypes.VECTOR },
    ],
  },
})
