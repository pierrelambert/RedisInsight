import React, { useContext } from 'react'
import { createRoot } from 'react-dom/client'
import styled from 'styled-components'

import {
  ThemeProvider,
  PluginsThemeContext,
} from 'uiSrc/components/base/utils/pluginsThemeContext'

import { Atlas } from './Atlas'
import { AtlasPointStates } from '../renderer/AtlasRenderer'

const Fixture = styled.main`
  min-height: 100vh;
  padding: ${({ theme }) => theme.core.space.space300};
  color: ${({ theme }) => theme.semantic.color.text.primary600};
  background: ${({ theme }) => theme.semantic.color.background.neutral100};
`

const FixtureCopy = styled.p`
  color: ${({ theme }) => theme.semantic.color.text.primary600};
` as unknown as React.FC<
  React.PropsWithChildren<React.HTMLAttributes<HTMLParagraphElement>>
>

const pointStates: AtlasPointStates = {
  b: ['selected'],
  c: ['live-neighbor'],
  d: ['outlier'],
  e: ['duplicate'],
  f: ['selected', 'outlier'],
}

const ProductFixture = () => {
  const { theme } = useContext(PluginsThemeContext)
  return (
    <Fixture>
      <h1>Atlas product fixture</h1>
      <FixtureCopy data-testid="atlas-copy">
        Theme-backed Atlas point states
      </FixtureCopy>
      <output data-testid="resolved-theme">
        {theme.semantic.color.text.primary600}
      </output>
      <Atlas
        coordinates={
          new Float32Array([0, 0, 0.2, 0.2, 0.4, 0.4, 0.6, 0.6, 0.8, 0.8, 1, 1])
        }
        sampleIds={['a', 'b', 'c', 'd', 'e', 'f']}
        provenance={{
          sourceCount: 8,
          sampleCount: 6,
          method: 'UMAP',
          seed: 7,
          freshness: 'fresh',
          exactness: 'approximate',
          quality: { kind: 'unknown', reason: 'not-measured' },
        }}
        pointStates={pointStates}
        onSelectionChange={() => undefined}
        renderAccessibleSelection={(_selected, hoveredId, states) => (
          <section aria-label="Linked accessible selection">
            <p>{hoveredId ? `Hovered ${hoveredId}` : 'No hovered point'}</p>
            <ul>
              {['a', 'b', 'c', 'd', 'e', 'f'].map((id) => (
                <li key={id}>
                  {id}: {states?.[id]?.join(', ') ?? 'plotted'}
                </li>
              ))}
            </ul>
          </section>
        )}
      />
    </Fixture>
  )
}

const theme = new URLSearchParams(window.location.search).get('theme')
document.body.className = theme === 'theme_DARK' ? 'theme_DARK' : 'theme_LIGHT'

createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <ProductFixture />
  </ThemeProvider>,
)
