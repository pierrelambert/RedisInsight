import React from 'react'
import { render, screen } from '@testing-library/react'

import { ThemeProvider } from 'uiSrc/components/base/utils/pluginsThemeContext'

import { CompareAtlas } from './CompareAtlas'
import type { CompareAtlasProps } from './CompareAtlas.types'

interface RendererInstance {
  options: { interactionMode?: 'pan' | 'region' }
  setPoints: jest.Mock
}

let mockInstances: RendererInstance[] = []

jest.mock('../../renderer/AtlasRenderer', () => ({
  AtlasRenderer: jest
    .fn()
    .mockImplementation(
      (_canvas: HTMLCanvasElement, options: RendererInstance['options']) => {
        const setPoints = jest.fn()
        mockInstances.push({ options, setPoints })
        return {
          setPoints,
          resize: jest.fn(),
          setDensityGrid: jest.fn(),
          setDensityVisible: jest.fn(),
          destroy: jest.fn(),
        }
      },
    ),
}))

const provenance = (method: 'UMAP' | 'PCA') => ({
  sourceCount: 2,
  sampleCount: 2,
  method,
  seed: 7,
  freshness: 'fresh' as const,
  exactness: 'approximate' as const,
  quality: { kind: 'unknown' as const, reason: 'not-measured' as const },
})

const renderComponent = (props: Partial<CompareAtlasProps> = {}) =>
  render(
    <ThemeProvider>
      <CompareAtlas
        left={{
          coordinates: new Float32Array([0, 0, 1, 1]),
          provenance: provenance('UMAP'),
          title: 'UMAP',
        }}
        right={{
          coordinates: new Float32Array([2, 2, 3, 3]),
          provenance: provenance('PCA'),
          title: 'PCA',
        }}
        sampleIds={['a', 'b']}
        onSelectionChange={jest.fn()}
        {...props}
      />
    </ThemeProvider>,
  )

describe('CompareAtlas', () => {
  beforeEach(() => {
    mockInstances = []
    global.ResizeObserver = class {
      observe(): void {}

      disconnect(): void {}
    } as unknown as typeof ResizeObserver
  })

  it('renders two Atlas instances', () => {
    renderComponent()

    expect(mockInstances).toHaveLength(2)
  })

  it('gives both panels the same sample IDs', () => {
    renderComponent({ sampleIds: ['a', 'b', 'c'] })

    const [left, right] = mockInstances
    expect(left.setPoints.mock.calls.at(-1)?.[1]).toEqual(['a', 'b', 'c'])
    expect(right.setPoints.mock.calls.at(-1)?.[1]).toEqual(['a', 'b', 'c'])
  })

  it('gives both panels the same selected IDs', () => {
    renderComponent({ selectedIds: ['b'] })

    const [left, right] = mockInstances
    expect(left.setPoints.mock.calls.at(-1)?.[3]).toMatchObject({
      b: ['selected'],
    })
    expect(right.setPoints.mock.calls.at(-1)?.[3]).toMatchObject({
      b: ['selected'],
    })
  })

  it('gives both panels the same point colors', () => {
    renderComponent({ pointColors: { a: '#aabbcc' } })

    const [left, right] = mockInstances
    expect(left.setPoints.mock.calls.at(-1)?.[4]).toEqual({ a: '#aabbcc' })
    expect(right.setPoints.mock.calls.at(-1)?.[4]).toEqual({ a: '#aabbcc' })
  })

  it('gives each panel a different title', () => {
    renderComponent()

    expect(screen.getByText('UMAP')).toBeInTheDocument()
    expect(screen.getByText('PCA')).toBeInTheDocument()
  })

  it('gives each panel different coordinates', () => {
    renderComponent()

    const [left, right] = mockInstances
    expect(left.setPoints.mock.calls.at(-1)?.[0]).toEqual(
      new Float32Array([0, 0, 1, 1]),
    )
    expect(right.setPoints.mock.calls.at(-1)?.[0]).toEqual(
      new Float32Array([2, 2, 3, 3]),
    )
  })

  it('always uses pan interaction, never region selection', () => {
    renderComponent()

    expect(mockInstances[0].options.interactionMode).toBe('pan')
    expect(mockInstances[1].options.interactionMode).toBe('pan')
  })
})
