import React from 'react'
import { render, screen, userEvent } from 'uiSrc/utils/test-utils'
import { FieldTypes } from 'uiSrc/pages/browser/components/create-redisearch-index/constants'
import type { IndexInfo } from 'uiSrc/pages/vector-search/hooks/useIndexInfo/useIndexInfo.types'

import { useIndexInfo } from 'uiSrc/pages/vector-search/hooks/useIndexInfo/useIndexInfo'
import { VectorFieldPicker } from './VectorFieldPicker'

jest.mock('uiSrc/pages/vector-search/hooks/useIndexInfo/useIndexInfo', () => ({
  useIndexInfo: jest.fn(),
}))

const mockedUseIndexInfo = jest.mocked(useIndexInfo)
const onCancel = jest.fn()
const onSelect = jest.fn()
const indexInfo = (attributes: IndexInfo['attributes']): IndexInfo => ({
  indexDefinition: { keyType: 'HASH', prefixes: [] },
  attributes,
  numDocs: 0,
  maxDocId: 0,
  numRecords: 0,
  numTerms: 0,
})

const renderComponent = () =>
  render(
    <VectorFieldPicker
      indexName="idx-products"
      onCancel={onCancel}
      onSelect={onSelect}
    />,
  )

describe('VectorFieldPicker', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows loading and error states without offering a stale field', () => {
    mockedUseIndexInfo.mockReturnValue({
      indexInfo: null,
      loading: true,
      error: null,
      refetch: jest.fn(),
    })
    const { rerender } = renderComponent()

    expect(
      screen.getByTestId('vector-search-vector-field-loading'),
    ).toBeVisible()
    expect(
      screen.queryByTestId(/vector-search-visualize-field/),
    ).not.toBeInTheDocument()

    mockedUseIndexInfo.mockReturnValue({
      indexInfo: null,
      loading: false,
      error: 'failed',
      refetch: jest.fn(),
    })
    rerender(
      <VectorFieldPicker
        indexName="idx-products"
        onCancel={onCancel}
        onSelect={onSelect}
      />,
    )

    expect(screen.getByTestId('vector-search-vector-field-error')).toBeVisible()
  })

  it('explains when there are no vector fields and supports cancellation', async () => {
    mockedUseIndexInfo.mockReturnValue({
      indexInfo: indexInfo([]),
      loading: false,
      error: null,
      refetch: jest.fn(),
    })
    renderComponent()

    expect(screen.getByTestId('vector-search-vector-field-empty')).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('offers every vector field and sends the selected field unchanged', async () => {
    mockedUseIndexInfo.mockReturnValue({
      indexInfo: indexInfo([
        { identifier: 'title', attribute: 'title', type: FieldTypes.TEXT },
        {
          identifier: 'embedding',
          attribute: 'embedding',
          type: FieldTypes.VECTOR,
        },
        {
          identifier: 'image_embedding',
          attribute: 'image_embedding',
          type: FieldTypes.VECTOR,
        },
      ]),
      loading: false,
      error: null,
      refetch: jest.fn(),
    })
    renderComponent()

    await userEvent.click(
      screen.getByTestId('vector-search-visualize-field-image_embedding'),
    )
    expect(onSelect).toHaveBeenCalledWith('image_embedding')
  })
})
