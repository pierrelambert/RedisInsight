import type { ReactNode } from 'react'

import type { RiSelectOption } from 'uiSrc/components/base/forms/select/RiSelect'

export type VectorVisualizerControlOption = RiSelectOption

type VectorVisualizerEnabledControl<Value> = {
  disabled?: false
  disabledReason?: never
  onChange: (value: Value) => void
}

type VectorVisualizerDisabledControl = {
  disabled: true
  disabledReason?: string
  onChange?: never
}

export type VectorVisualizerControlSelect = {
  label: string
  value: string
  options: VectorVisualizerControlOption[]
  loading?: boolean
} & (VectorVisualizerEnabledControl<string> | VectorVisualizerDisabledControl)

export type VectorVisualizerActiveFilter = {
  id: string
  label: string
}

export type VectorVisualizerFilterSyntaxHelp = {
  content: ReactNode
}

export type VectorVisualizerFilterControl = {
  value: string
  placeholder?: string
  activeFilters?: VectorVisualizerActiveFilter[]
  onRemove?: (filterId: string) => void
  syntaxHelp?: VectorVisualizerFilterSyntaxHelp
  loading?: boolean
} & (VectorVisualizerEnabledControl<string> | VectorVisualizerDisabledControl)

export type VectorVisualizerMetadataFieldControl = {
  value: string
  placeholder?: string
} & (VectorVisualizerEnabledControl<string> | VectorVisualizerDisabledControl)

export type VectorVisualizerSampleBudget = {
  value: number
  min: number
  max: number
  loading?: boolean
} & (
  | VectorVisualizerEnabledControl<number | null>
  | VectorVisualizerDisabledControl
)

export type VectorVisualizerVisibilityControl = {
  checked: boolean
} & (VectorVisualizerEnabledControl<boolean> | VectorVisualizerDisabledControl)

export type VectorVisualizerClusterLabelLimitControl =
  VectorVisualizerControlSelect

export type VectorVisualizerControlsSummary = {
  sampleCount?: number
  sourceCount?: number
  samplingMethod?: string
  projectionAlgorithm?: string
  seed?: number
  freshness?: string
  quality?: string
}

export type VectorVisualizerControlsProps = {
  source: VectorVisualizerControlSelect
  colorBy?: VectorVisualizerControlSelect
  metadataField?: VectorVisualizerMetadataFieldControl
  filter?: VectorVisualizerFilterControl
  sampleBudget: VectorVisualizerSampleBudget
  clusterLabels?: VectorVisualizerVisibilityControl
  clusterLabelLimit?: VectorVisualizerClusterLabelLimitControl
  outliers?: VectorVisualizerVisibilityControl
  summary?: VectorVisualizerControlsSummary
  loading?: boolean
}
