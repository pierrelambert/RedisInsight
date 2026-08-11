import React from 'react'
import { fireEvent, render, screen } from 'uiSrc/utils/test-utils'
import { anyToBuffer, stringToBuffer } from 'uiSrc/utils'
import { vectorSetSimilaritySearchSelector } from 'uiSrc/slices/browser/vectorSet'
import { VectorSetSimilaritySearchResponse } from 'uiSrc/slices/interfaces/vectorSet'
import { FeatureFlags } from 'uiSrc/constants'
import { appFeatureFlagsFeaturesSelector } from 'uiSrc/slices/app/features'
import { selectedKeyDataSelector } from 'uiSrc/slices/browser/keys'
import { consumeVectorVisualizerSource } from 'uiSrc/pages/vector-visualizer'

import { Props, VectorSetDetails } from './VectorSetDetails'

const mockedVectorSetSimilaritySearchSelector = jest.mocked(
  vectorSetSimilaritySearchSelector,
)
const mockedFeatureFlagsSelector = jest.mocked(appFeatureFlagsFeaturesSelector)
const mockedSelectedKeyDataSelector = jest.mocked(selectedKeyDataSelector)

const defaultProps: Props = {
  onRemoveKey: jest.fn(),
  onOpenAddItemPanel: jest.fn(),
  onCloseAddItemPanel: jest.fn(),
  onCloseKey: jest.fn(),
  onEditKey: jest.fn(),
  isFullScreen: false,
  arePanelsCollapsed: false,
  onToggleFullScreen: jest.fn(),
}

const renderComponent = (propsOverride?: Partial<Props>) =>
  render(<VectorSetDetails {...defaultProps} {...propsOverride} />)

jest.mock('uiSrc/slices/browser/vectorSet', () => {
  const defaultState = jest.requireActual(
    'uiSrc/slices/browser/vectorSet',
  ).initialState
  return {
    ...jest.requireActual('uiSrc/slices/browser/vectorSet'),
    vectorSetSelector: jest.fn().mockReturnValue(defaultState),
    vectorSetDataSelector: jest.fn().mockReturnValue(defaultState.data),
    addVectorSetElementsStateSelector: jest
      .fn()
      .mockReturnValue(defaultState.adding),
    vectorSetSimilaritySearchSelector: jest
      .fn()
      .mockReturnValue(defaultState.similaritySearch),
    vectorSetSimilaritySearchPreviewSelector: jest
      .fn()
      .mockReturnValue(defaultState.similaritySearchPreview),
    fetchMoreVectorSetElements: () => jest.fn(),
    fetchVectorSetElements: () => jest.fn(),
    addVectorSetElements: () => jest.fn(),
    fetchVectorSetSimilaritySearch: () => jest.fn(),
    fetchVectorSetSimilaritySearchPreview: () => jest.fn(),
  }
})

jest.mock('uiSrc/slices/app/features', () => ({
  ...jest.requireActual('uiSrc/slices/app/features'),
  appFeatureFlagsFeaturesSelector: jest.fn(),
}))

jest.mock('uiSrc/slices/browser/keys', () => ({
  ...jest.requireActual('uiSrc/slices/browser/keys'),
  selectedKeyDataSelector: jest.fn(),
}))

const setSimilaritySearchData = (data?: VectorSetSimilaritySearchResponse) => {
  mockedVectorSetSimilaritySearchSelector.mockReturnValue({
    loading: false,
    error: '',
    data,
  })
}

describe('VectorSetDetails', () => {
  beforeEach(() => {
    setSimilaritySearchData(undefined)
    mockedFeatureFlagsSelector.mockReturnValue({})
    mockedSelectedKeyDataSelector.mockReturnValue(null)
    consumeVectorVisualizerSource()
  })

  it('should render', () => {
    expect(renderComponent()).toBeTruthy()
  })

  it('should render key details header', () => {
    renderComponent()
    expect(screen.getByTestId('key-details-header')).toBeInTheDocument()
  })

  it('should render subheader with format selector', () => {
    renderComponent()
    expect(screen.getByTestId('select-format-key-value')).toBeInTheDocument()
  })

  it('should render add elements button', () => {
    renderComponent()
    expect(screen.getByTestId('add-key-value-items-btn')).toBeInTheDocument()
  })

  it('hides Visualize while the development flag is off', () => {
    renderComponent()

    expect(
      screen.queryByTestId('vector-set-visualize-btn'),
    ).not.toBeInTheDocument()
  })

  it('should open add element panel when add button is clicked', () => {
    renderComponent()

    expect(screen.queryByTestId('save-elements-btn')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('add-key-value-items-btn'))

    expect(screen.getByTestId('save-elements-btn')).toBeInTheDocument()
    expect(screen.getByTestId('cancel-elements-btn')).toBeInTheDocument()
  })

  it('should close add element panel when cancel is clicked', () => {
    renderComponent()

    fireEvent.click(screen.getByTestId('add-key-value-items-btn'))
    expect(screen.getByTestId('save-elements-btn')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('cancel-elements-btn'))
    expect(screen.queryByTestId('save-elements-btn')).not.toBeInTheDocument()
  })

  it('shows the regular elements list when no similarity search has run', () => {
    renderComponent()
    expect(screen.getByTestId('vector-set-details')).toBeInTheDocument()
    expect(
      screen.queryByTestId('vector-set-similarity-results'),
    ).not.toBeInTheDocument()
  })

  it('replaces the elements list with the similarity results table once a search succeeds', () => {
    setSimilaritySearchData({
      keyName: stringToBuffer('mykey'),
      elements: [
        { name: stringToBuffer('alpha'), score: 0.9 },
        { name: stringToBuffer('beta'), score: 0.5 },
      ],
    })

    renderComponent()

    expect(
      screen.getByTestId('vector-set-similarity-results'),
    ).toBeInTheDocument()
    expect(screen.getByText('90.00 %')).toBeInTheDocument()
    expect(screen.getByText('50.00 %')).toBeInTheDocument()
  })

  it('encodes a string Vector Set key before handing it to the native host', () => {
    const key = 'vector-set:alpha'
    mockedFeatureFlagsSelector.mockReturnValue({
      [FeatureFlags.devVectorVisualizer]: { flag: true },
    })
    mockedSelectedKeyDataSelector.mockReturnValue({ name: key } as never)

    renderComponent()
    fireEvent.click(screen.getByTestId('vector-set-visualize-btn'))

    const source = consumeVectorVisualizerSource()
    expect(source).toEqual({
      kind: 'vector-set',
      key: new TextEncoder().encode(key),
    })
  })

  it('preserves every RedisResponseBuffer key byte for the native host', () => {
    const key = anyToBuffer(new Uint8Array([0, 255, 10]))
    mockedFeatureFlagsSelector.mockReturnValue({
      [FeatureFlags.devVectorVisualizer]: { flag: true },
    })
    mockedSelectedKeyDataSelector.mockReturnValue({ name: key } as never)

    renderComponent()
    fireEvent.click(screen.getByTestId('vector-set-visualize-btn'))

    const source = consumeVectorVisualizerSource()
    expect(source).toEqual({
      kind: 'vector-set',
      key: new Uint8Array([0, 255, 10]),
    })
    expect(source?.kind === 'vector-set' && source.key).not.toBe(key.data)
  })
})
