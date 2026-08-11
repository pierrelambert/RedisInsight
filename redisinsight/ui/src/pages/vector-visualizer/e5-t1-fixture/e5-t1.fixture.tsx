import React from 'react'
import { createRoot } from 'react-dom/client'

import { ThemeProvider } from 'uiSrc/components/base/utils/pluginsThemeContext'

import { setVectorVisualizerSource } from '../nativeHandoff'
import { VectorVisualizerPage } from '../VectorVisualizerPage'

declare global {
  interface Window {
    __E5_T1_COMMAND_COUNT__?: number
  }
}

const parameters = new URLSearchParams(window.location.search)
const source =
  parameters.get('source') === 'vector-set' ? 'vector-set' : 'search'

document.body.className =
  parameters.get('theme') === 'dark' ? 'theme_DARK' : 'theme_LIGHT'
window.__E5_T1_COMMAND_COUNT__ = 0

setVectorVisualizerSource(
  source === 'search'
    ? {
        kind: 'search-index',
        index: 'idx-products',
        vectorField: 'embedding',
      }
    : { kind: 'vector-set', key: new Uint8Array([0, 255, 10]) },
)

createRoot(document.getElementById('app')!).render(
  <ThemeProvider>
    <VectorVisualizerPage />
  </ThemeProvider>,
)
