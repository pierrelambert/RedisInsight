import React from 'react'
import { faker } from '@faker-js/faker'

import { ThemeProvider } from 'uiSrc/components/base/utils/pluginsThemeContext'
import { render, screen } from 'uiSrc/utils/test-utils'

import { HybridScoreChart } from './HybridScoreChart'
import type { HybridScoreChartProps } from './HybridScoreChart.types'

describe('HybridScoreChart', () => {
  const defaultProps: HybridScoreChartProps = {
    documents: [
      {
        id: faker.string.uuid(),
        textScore: 0.2,
        vectorScore: 0.4,
        hybridScore: 0.3,
      },
      {
        id: faker.string.uuid(),
        textScore: 0.8,
        vectorScore: 0.6,
        hybridScore: 0.7,
      },
    ],
  }

  const renderComponent = (propsOverride?: Partial<HybridScoreChartProps>) => {
    const props = { ...defaultProps, ...propsOverride }
    return render(
      <ThemeProvider>
        <HybridScoreChart {...props} />
      </ThemeProvider>,
    )
  }

  it('should render a canvas when documents are provided', () => {
    renderComponent()
    expect(screen.getByTestId('hybrid-score-chart')).toBeInTheDocument()
  })

  it('should render a canvas even when documents are empty', () => {
    renderComponent({ documents: [] })
    expect(screen.getByTestId('hybrid-score-chart')).toBeInTheDocument()
  })

  it('should render documents with partial HYBRID score channels', () => {
    renderComponent({
      documents: [
        { id: 'doc:vector', vectorScore: 0.750610458745 },
        { id: 'doc:text', textScore: 3.30244346072 },
      ],
    })

    expect(screen.getByLabelText('Hybrid returned documents')).toBeVisible()
    expect(screen.getByText('doc:vector')).toBeVisible()
    expect(screen.getByText('doc:text')).toBeVisible()
    expect(screen.getAllByText('Unavailable')).toHaveLength(4)
  })
})
