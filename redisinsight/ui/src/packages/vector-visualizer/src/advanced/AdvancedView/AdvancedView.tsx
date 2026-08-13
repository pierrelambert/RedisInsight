import React, { useMemo, useState } from 'react'

import { RiBadge } from 'uiSrc/components/base/display/badge/RiBadge'
import { Row } from 'uiSrc/components/base/layout/flex'
import { Text, Title } from 'uiSrc/components/base/text'

import type {
  SearchExecutionEvidence,
  TopologyAdjacency,
  VectorSetProfile,
} from '../advanced'
import { TopologyGraph } from '../TopologyGraph'
import type { TopologyLayer } from '../TopologyGraph'
import * as S from './AdvancedView.styles'
import type { AdvancedProps } from './AdvancedView.types'

const TechnicalValue = Text

/**
 * VLINKS returns one adjacency entry per (layer, source) pair. Group those
 * entries into per-layer node/edge sets so TopologyGraph can lay each HNSW
 * layer out as a graph rather than a flat list.
 */
const toTopologyLayers = (
  adjacencies: TopologyAdjacency[],
): TopologyLayer[] => {
  const layerEntries = new Map<
    number,
    { edges: TopologyLayer['edges']; nodeIds: Set<string> }
  >()

  adjacencies.forEach(({ layer, source, targets }) => {
    const entry = layerEntries.get(layer) ?? {
      edges: [],
      nodeIds: new Set<string>(),
    }
    entry.nodeIds.add(source)
    targets.forEach((target) => {
      entry.nodeIds.add(target)
      entry.edges.push({ source, target })
    })
    layerEntries.set(layer, entry)
  })

  return [...layerEntries.entries()]
    .sort(([layerA], [layerB]) => layerA - layerB)
    .map(([layer, { edges, nodeIds }]) => {
      const degreeById = new Map<string, number>()
      edges.forEach(({ source, target }) => {
        degreeById.set(source, (degreeById.get(source) ?? 0) + 1)
        degreeById.set(target, (degreeById.get(target) ?? 0) + 1)
      })

      return {
        edges,
        layer,
        nodes: [...nodeIds].map((id) => ({
          degree: degreeById.get(id) ?? 0,
          id,
        })),
      }
    })
}

const statusCopy: Record<Exclude<AdvancedProps['status'], 'ready'>, string> = {
  'acl-unavailable': 'Redis ACLs do not allow this Advanced evidence.',
  cancelled: 'Advanced evidence retrieval was cancelled.',
  'recoverable-error': 'Advanced evidence could not be loaded. Retry.',
  unsupported: 'This source does not support this Advanced evidence.',
}

const StatusPanel = ({ status }: Pick<AdvancedProps, 'status'>) => {
  if (status === 'ready') return null

  return (
    <S.Panel aria-live="polite">
      <RiBadge variant="light">{status}</RiBadge>
      <Text role="status">{statusCopy[status]}</Text>
    </S.Panel>
  )
}

const VectorSetTopology = ({ topology }: Pick<AdvancedProps, 'topology'>) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>()
  const layers = useMemo(
    () => (topology.kind === 'ready' ? toTopologyLayers(topology.layers) : []),
    [topology],
  )

  if (topology.kind !== 'ready') {
    return (
      <S.Panel>
        <Title size="S">VLINKS topology</Title>
        <Text>
          {topology.kind === 'unsupported'
            ? 'VLINKS topology is unavailable for this Redis capability/version.'
            : 'VLINKS response was malformed, so no topology is shown.'}
        </Text>
      </S.Panel>
    )
  }

  return (
    <S.Panel>
      <Title size="S">VLINKS topology</Title>
      <Text>HNSW layer adjacency, not semantic nearest-neighbor truth.</Text>
      <Text>
        Showing {topology.shownAdjacencies} of {topology.totalAdjacencies}{' '}
        adjacencies.
      </Text>
      <TopologyGraph
        layers={layers}
        onNodeSelect={setSelectedNodeId}
        selectedNodeId={selectedNodeId}
      />
    </S.Panel>
  )
}

const SearchEvidence = ({
  evidence,
}: {
  evidence?: SearchExecutionEvidence
}) => (
  <S.Panel>
    <Title size="S">Search topology unavailable</Title>
    <Text>
      Redis has not returned authoritative topology or traversal evidence.
    </Text>
    <Title size="S">Measured Search execution evidence</Title>
    {evidence?.kind === 'ready' ? (
      <>
        <Text>Execution profile, not HNSW traversal.</Text>
        {evidence.vectorMode && (
          <TechnicalValue size="s">
            Vector mode: {evidence.vectorMode}
          </TechnicalValue>
        )}
        {Object.entries(evidence.facts).map(([name, value]) => (
          <Row gap="m" justify="between" key={`${name}-${value}`}>
            <Text size="s">{name}</Text>
            <TechnicalValue size="s">{value}</TechnicalValue>
          </Row>
        ))}
      </>
    ) : (
      <Text>
        Unavailable: Redis did not return a measurable FT.PROFILE response.
      </Text>
    )}
  </S.Panel>
)

const VectorSetEvidence = ({ profile }: { profile?: VectorSetProfile }) => (
  <S.Panel>
    <Title size="S">Reduced Vector Set profile</Title>
    <Text>VSIM inputs and results only</Text>
    {profile?.kind === 'reduced' ? (
      Object.entries(profile.facts).map(([name, value]) => (
        <Row gap="m" justify="between" key={`${name}-${value}`}>
          <Text size="s">{name}</Text>
          <TechnicalValue size="s">{value}</TechnicalValue>
        </Row>
      ))
    ) : (
      <Text>Unavailable: Vector Set profile facts were not returned.</Text>
    )}
  </S.Panel>
)

export const Advanced = ({
  sourceKind,
  status,
  topology,
  searchProfile,
  vectorSetProfile,
}: AdvancedProps) => (
  <S.Shell data-testid="vector-visualizer-advanced">
    <Row align="center" justify="between">
      <Title size="M">Advanced evidence</Title>
      <RiBadge variant="light">{sourceKind}</RiBadge>
    </Row>
    <StatusPanel status={status} />
    {sourceKind === 'vector-set' ? (
      <>
        <VectorSetTopology topology={topology} />
        <VectorSetEvidence profile={vectorSetProfile} />
      </>
    ) : (
      <SearchEvidence evidence={searchProfile} />
    )}
  </S.Shell>
)
