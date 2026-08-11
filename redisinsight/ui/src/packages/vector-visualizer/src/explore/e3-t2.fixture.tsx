import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'

import { ThemeProvider } from 'uiSrc/components/base/utils/pluginsThemeContext'

import {
  DuplicateExplorer,
  OutlierExplorer,
  XRay,
} from '../health/HealthExplorers'
import { MetadataMatrix } from './MetadataMatrix'

const records = [
  { id: 'a', clusterId: 'cluster-a', metadata: { region: 'eu' } },
  { id: 'b', clusterId: 'cluster-a', metadata: { region: 'eu' } },
  { id: 'c', clusterId: 'cluster-b', metadata: { region: 'us' } },
]

const Fixture = () => {
  const [selected, setSelected] = useState<string[]>([])
  const [empty, setEmpty] = useState(false)
  const [unknown, setUnknown] = useState(false)
  const [matrixStatus, setMatrixStatus] = useState<
    'loading' | 'error' | 'partial' | 'stale' | 'unsupported' | undefined
  >()
  return (
    <main>
      <h1>Explore and Health fixture</h1>
      <button
        type="button"
        onClick={() => {
          setMatrixStatus(undefined)
          setEmpty(false)
          setUnknown(false)
        }}
      >
        Ready
      </button>
      <button type="button" onClick={() => setMatrixStatus('stale')}>
        Stale
      </button>
      <button type="button" onClick={() => setMatrixStatus('loading')}>
        Loading
      </button>
      <button type="button" onClick={() => setEmpty(true)}>
        Empty
      </button>
      <button type="button" onClick={() => setUnknown(true)}>
        Unknown
      </button>
      <MetadataMatrix
        records={empty ? [] : records}
        field="region"
        status={matrixStatus}
        onSelectionChange={setSelected}
      />
      <DuplicateExplorer
        evidence={
          unknown
            ? {
                kind: 'unknown',
                reason: 'missing-original-space-neighbor-evidence',
              }
            : {
                kind: 'known',
                groups: [{ ids: ['a', 'b'] }],
                sampleCount: 3,
                similarityThreshold: 0.995,
                freshness: 'fresh',
                coverage: 'partial-neighbor-graph',
                formula:
                  'connected components over original-space cosine similarity',
              }
        }
        onSelectionChange={setSelected}
      />
      <OutlierExplorer
        evidence={
          unknown
            ? {
                kind: 'unknown',
                reason: 'missing-original-space-neighbor-evidence',
              }
            : {
                kind: 'known',
                ids: ['c'],
                sampleCount: 12,
                k: 10,
                robustDeviationThreshold: 3.5,
                medianDistance: 0.1,
                mad: 0.01,
                freshness: 'stale',
                exactness: 'sample-exact',
                formula: 'median/MAD over kth-neighbor cosine distances',
              }
        }
        onSelectionChange={setSelected}
      />
      <XRay
        facts={[
          {
            label: 'Metadata coverage',
            value: '3 / 3',
            formula: 'present/non-empty values',
            sampleCount: 3,
            freshness: 'fresh',
            status: 'candidate',
          },
        ]}
      />
      <output aria-live="polite">
        Selected: {selected.join(',') || 'none'}
      </output>
    </main>
  )
}

document.body.className =
  new URLSearchParams(window.location.search).get('theme') === 'theme_DARK'
    ? 'theme_DARK'
    : 'theme_LIGHT'
createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <Fixture />
  </ThemeProvider>,
)
