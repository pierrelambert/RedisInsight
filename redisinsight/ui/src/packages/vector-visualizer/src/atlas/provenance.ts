import type { LayoutQuality } from '../worker/layout'

export interface AtlasProvenance {
  sourceCount: number
  sampleCount: number
  method: 'UMAP'
  seed: number
  sourceFilter?: string
  freshness: 'fresh' | 'changed-while-sampled'
  exactness: 'exact' | 'approximate' | 'sample-exact' | 'unknown'
  quality: LayoutQuality
}

export const atlasProvenanceRows = (
  provenance: AtlasProvenance,
): [string, string][] => [
  ['Projection', '2D projection of a sample'],
  ['Source / sample', `${provenance.sourceCount} / ${provenance.sampleCount}`],
  ['Method', provenance.method],
  ['Seed', String(provenance.seed)],
  ['Source filter', provenance.sourceFilter || 'None'],
  [
    'Freshness',
    provenance.freshness === 'fresh' ? 'Fresh' : 'Changed while sampled',
  ],
  ['Exactness', provenance.exactness.replace('-', ' ')],
  [
    'Quality',
    provenance.quality.kind === 'measured'
      ? `${provenance.quality.name} (${provenance.quality.value.toFixed(3)} at k=${provenance.quality.k}; sample ${provenance.quality.sampleSize}; ${provenance.quality.exactness.replaceAll('-', ' ')}; freshness ${provenance.quality.freshness})`
      : `Unknown (${provenance.quality.reason.replaceAll('-', ' ')})`,
  ],
  ['Warning', 'Projection positions do not preserve exact global geometry.'],
]
