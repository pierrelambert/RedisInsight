import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'

import { ThemeProvider } from 'uiSrc/components/base/utils/pluginsThemeContext'

import { CompareTune, CompareTuneStatus } from './CompareTune'
import { LocalManifestV1 } from './compare'

const base: LocalManifestV1 = {
  version: 1,
  sourceKind: 'search-index',
  sourceId: 'idx-products',
  dimensions: 3,
  metric: 'cosine',
  vectorField: 'embedding',
  sampleCount: 100,
  sourceCount: 1000,
  sampleIdDigest: 'hash31:00112233',
  sampling: { method: 'deterministic-id-hash', seed: 7 },
  freshness: 'fresh',
  databaseId: 'database-1',
  schemaDigest: 'hash31:schema',
  metricConversion: 'distance',
  projection: {
    algorithm: 'umap',
    version: 'umap-js@1.4.0',
    dimensions: 2,
    seed: 7,
    parameters: { nNeighbors: 15, minDist: 0.1 },
  },
  driftEvidence: {
    clusterPopulation: {
      value: 10,
      provenance: 'sampled',
      unit: 'records',
    },
    vectorNorm: { value: 0.9, provenance: 'measured', unit: 'mean L2 norm' },
    neighborOverlap: { provenance: 'unavailable', reason: 'no-shared-query' },
    duplicateRate: { value: 0.02, provenance: 'sampled', unit: 'ratio' },
    outlierRate: { value: 0.01, provenance: 'sampled', unit: 'ratio' },
    metadataCoverage: { value: 0.8, provenance: 'sampled', unit: 'ratio' },
    sourceConfiguration: {
      value: 1,
      provenance: 'measured',
      unit: 'changed fields',
    },
  },
}

const Fixture = () => {
  const [incompatible, setIncompatible] = useState(false)
  const [status, setStatus] = useState<CompareTuneStatus>('ready')
  const [confirmed, setConfirmed] = useState(false)
  return (
    <main>
      <h1>Compare and Tune fixture</h1>
      <button
        type="button"
        onClick={() => {
          setIncompatible(false)
          setStatus('ready')
        }}
      >
        Compatible drift
      </button>
      <button
        type="button"
        onClick={() => {
          setIncompatible(true)
          setStatus('ready')
        }}
      >
        Incompatible drift
      </button>
      <button type="button" onClick={() => setStatus('empty')}>
        Empty state
      </button>
      <button type="button" onClick={() => setStatus('unsupported')}>
        Unsupported state
      </button>
      <button type="button" onClick={() => setStatus('recoverable-error')}>
        Error state
      </button>
      <CompareTune
        left={base}
        right={
          incompatible
            ? { ...base, dimensions: 4 }
            : {
                ...base,
                sampleCount: 120,
                sourceCount: 1040,
                driftEvidence: {
                  ...base.driftEvidence,
                  clusterPopulation: {
                    value: 12,
                    provenance: 'sampled',
                    unit: 'records',
                  },
                  vectorNorm: {
                    value: 0.98,
                    provenance: 'measured',
                    unit: 'mean L2 norm',
                  },
                },
              }
        }
        runs={[
          {
            version: 1,
            id: 'baseline',
            manifest: base,
            recall: { value: 0.98, evidence: 'measured' },
            latencyMs: { value: 12, evidence: 'measured' },
            memoryMb: { value: 24, evidence: 'measured' },
          },
          {
            version: 1,
            id: 'sampled',
            manifest: base,
            recall: { value: 0.94, evidence: 'sampled' },
            latencyMs: { value: 9, evidence: 'estimated' },
            memoryMb: { value: 18, evidence: 'estimated' },
          },
        ]}
        status={status}
        onConfirmBenchmark={() => setConfirmed(true)}
      />
      <output aria-live="polite">
        {confirmed
          ? 'Read-only benchmark confirmation captured'
          : 'No benchmark executed'}
      </output>
    </main>
  )
}

document.body.className =
  new URLSearchParams(window.location.search).get('theme') === 'dark'
    ? 'theme_DARK'
    : 'theme_LIGHT'
createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <Fixture />
  </ThemeProvider>,
)
