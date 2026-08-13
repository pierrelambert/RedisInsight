import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'

import { ThemeProvider } from 'uiSrc/components/base/utils/pluginsThemeContext'

import { MiniAtlas } from './MiniAtlas'

const buildCoordinates = (count: number): Float32Array =>
  Float32Array.from({ length: count * 2 }, (_, index) => index % 7)

const renderComponent = (
  props: Partial<React.ComponentProps<typeof MiniAtlas>> = {},
) =>
  render(
    <ThemeProvider>
      <MiniAtlas coordinates={buildCoordinates(5)} count={5} {...props} />
    </ThemeProvider>,
  )

describe('MiniAtlas', () => {
  let getContextSpy: jest.SpyInstance

  beforeEach(() => {
    const context = {
      clearRect: jest.fn(),
      beginPath: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      fillStyle: '',
    }
    getContextSpy = jest
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue(context as unknown as CanvasRenderingContext2D)
  })

  afterEach(() => {
    getContextSpy.mockRestore()
  })

  it('renders a canvas element', () => {
    const { container } = renderComponent()

    expect(container.querySelector('canvas')).toBeInTheDocument()
  })

  it('shows the label and quality when provided', () => {
    renderComponent({ label: 'K=15', quality: 0.87 })

    expect(screen.getByText('K=15')).toBeInTheDocument()
    expect(screen.getByText('87%')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const onClick = jest.fn()
    renderComponent({ onClick, label: 'K=5' })

    fireEvent.click(screen.getByRole('button', { name: 'MiniAtlas K=5' }))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('shows the empty state with null coordinates', () => {
    renderComponent({ coordinates: null, count: 0 })

    expect(screen.getByRole('status')).toHaveTextContent('No layout data')
  })

  it('renders with a selected border style when selected', () => {
    const onClick = jest.fn()
    const { container: unselected } = renderComponent({
      onClick,
      selected: false,
    })
    const { container: selected } = renderComponent({
      onClick,
      selected: true,
    })

    expect(unselected.firstChild).toHaveAttribute('aria-pressed', 'false')
    expect(selected.firstChild).toHaveAttribute('aria-pressed', 'true')
  })
})
