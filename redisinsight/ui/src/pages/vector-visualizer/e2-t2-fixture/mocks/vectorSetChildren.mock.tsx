import React from 'react'
import { Text } from 'uiSrc/components/base/text'

export type SubmitElement = { name: string }

export const SimilaritySearchForm = () => <Text>Similarity search</Text>
export const VectorSetElementForm = () => <Text>Add element form</Text>
export const VectorSetElementList = () => <Text>Vector Set elements</Text>
export const ElementDetails = () => null
export const SimilarityColumnsPopover = () => null
export const SimilaritySearchResultsTable = () => null

export const useElementDetails = () => ({
  viewedElement: undefined,
  isDetailsPanelOpen: false,
  handleViewElement: () => undefined,
  handleClosePanel: () => undefined,
  handleDrawerDidClose: () => undefined,
})

export const useAddElementPanel = () => ({
  isAddItemPanelOpen: false,
  openAddItemPanel: () => undefined,
  closeAddItemPanel: () => undefined,
})

export const useAddElements = () => ({
  loading: false,
  vectorDim: 3,
  submitElements: () => undefined,
})

export const useSimilaritySearchResults = () => ({
  hasResults: false,
  matches: [],
})

export const useVectorSetActionsConfig = () => ({
  actionsConfig: [],
  similarityPrefill: undefined,
})

export const useSimilarityResultColumns = () => ({
  columns: [],
  columnVisibility: {},
  columnsMap: new Map(),
  shownColumns: [],
  onShownColumnsChange: () => undefined,
  parsedAttributesCache: new Map(),
})
