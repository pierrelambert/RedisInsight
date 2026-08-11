import type {
  SearchExecutionEvidence,
  VectorSetProfile,
  VlinksTopology,
} from '../advanced'

export type AdvancedStatus =
  | 'ready'
  | 'acl-unavailable'
  | 'cancelled'
  | 'recoverable-error'
  | 'unsupported'

export interface AdvancedProps {
  sourceKind: 'search-index' | 'vector-set'
  status: AdvancedStatus
  topology: VlinksTopology
  searchProfile?: SearchExecutionEvidence
  vectorSetProfile?: VectorSetProfile
}
