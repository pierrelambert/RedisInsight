import React from 'react'
import { faker } from '@faker-js/faker'

import { ThemeProvider } from 'uiSrc/components/base/utils/pluginsThemeContext'
import { render, screen } from 'uiSrc/utils/test-utils'

import HybridScoreChart from './HybridScoreChart'
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
})
