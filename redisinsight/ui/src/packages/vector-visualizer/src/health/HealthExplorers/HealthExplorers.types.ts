import type {
  DuplicateCandidateEvidence,
  OutlierCandidateEvidence,
  UnknownHealthEvidence,
} from '../calculations'

export type Freshness = 'fresh' | 'stale' | 'changed-while-sampled'

export type XRayFactSeverity =
  | 'success'
  | 'notice'
  | 'attention'
  | 'danger'
  | 'neutral'

export interface XRayFact {
  label: string
  value: string
  formula: string
  sampleCount: number
  freshness: Freshness
  status: 'candidate' | 'unknown' | 'unavailable'
  severity?: XRayFactSeverity
}

export interface DuplicateExplorerProps {
  evidence: DuplicateCandidateEvidence | UnknownHealthEvidence
  onSelectionChange(ids: string[]): void
  onConfigChange?(similarityThreshold: number): void
}

export interface OutlierExplorerProps {
  evidence: OutlierCandidateEvidence | UnknownHealthEvidence
  onSelectionChange(ids: string[]): void
  onConfigChange?(config: { k: number; robustDeviationThreshold: number }): void
}
