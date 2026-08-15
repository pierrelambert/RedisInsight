import type React from 'react'

export const vectorVisualizerCanvasModes = [
  'atlas',
  'neighbors',
  'selection',
] as const

export type VectorVisualizerCanvasMode =
  (typeof vectorVisualizerCanvasModes)[number]

export type VectorVisualizerCanvasState =
  | 'ready'
  | 'loading'
  | 'empty'
  | 'unsupported'
  | 'acl-unavailable'
  | 'cancelled'
  | 'error'

export interface VectorVisualizerCanvasViews {
  atlas: React.ReactNode
  neighbors: React.ReactNode
  selection: React.ReactNode
}

export interface VectorVisualizerCanvasUtilityAction {
  id: string
  label: string
  disabled?: boolean
  variant?: 'primary' | 'secondary-ghost'
  onClick(): void
}

export interface VectorVisualizerModeTabsProps {
  mode: VectorVisualizerCanvasMode
  onModeChange(mode: VectorVisualizerCanvasMode): void
  utilityActions?: readonly VectorVisualizerCanvasUtilityAction[]
  idPrefix?: string
}

export interface VectorVisualizerCanvasProps {
  mode: VectorVisualizerCanvasMode
  onModeChange(mode: VectorVisualizerCanvasMode): void
  views: VectorVisualizerCanvasViews
  status: string
  selectionCount: number
  selectedId?: string
  idPrefix?: string
  showModeChrome?: boolean
  state?: VectorVisualizerCanvasState
  utilityActions?: readonly VectorVisualizerCanvasUtilityAction[]
  loadingSlot?: React.ReactNode
  errorSlot?: React.ReactNode
  stateSlot?: React.ReactNode
}
