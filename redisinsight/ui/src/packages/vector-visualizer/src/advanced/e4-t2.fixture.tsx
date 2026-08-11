import React from 'react'
import { createRoot } from 'react-dom/client'

import { ThemeProvider } from 'uiSrc/components/base/utils/pluginsThemeContext'

import { Advanced, type AdvancedStatus } from './AdvancedView'

const parameters = new URLSearchParams(window.location.search)
const sourceKind =
  parameters.get('source') === 'search' ? 'search-index' : 'vector-set'
const status = (parameters.get('status') ?? 'ready') as AdvancedStatus

document.body.className =
  parameters.get('theme') === 'dark' ? 'theme_DARK' : 'theme_LIGHT'

createRoot(document.getElementById('app')!).render(
  <ThemeProvider>
    <Advanced
      sourceKind={sourceKind}
      status={status}
      topology={{
        kind: 'ready',
        totalAdjacencies: 2,
        shownAdjacencies: 1,
        layers: [{ layer: 0, source: 'node:a', targets: ['node:b', 'node:c'] }],
        memberArguments: new Map(),
      }}
      searchProfile={{
        kind: 'ready',
        facts: { 'Vector mode': 'BATCHES', 'Total profile time': '1.2' },
      }}
      vectorSetProfile={{
        kind: 'reduced',
        facts: { 'Result count': '2', EF: 'Unavailable' },
      }}
    />
  </ThemeProvider>,
)
