import React, { useState } from 'react'

import { RiBadge } from 'uiSrc/components/base/display/badge/RiBadge'
import { Button } from 'uiSrc/components/base/forms/buttons'
import { Col, Row } from 'uiSrc/components/base/layout/flex'
import { Text, Title } from 'uiSrc/components/base/text'

import type { SearchExecutionEvidence, VectorSetProfile } from '../advanced'
import * as S from './AdvancedView.styles'
import type { AdvancedProps } from './AdvancedView.types'

const TechnicalValue = Text

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
  const [selectedId, setSelectedId] = useState<string | undefined>()

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
      {topology.layers.map((layer) => (
        <Col gap="s" key={`${layer.layer}-${layer.source}`}>
          <TechnicalValue size="s">Layer {layer.layer}</TechnicalValue>
          <Button
            aria-pressed={selectedId === layer.source}
            onClick={() => setSelectedId(layer.source)}
            size="s"
          >
            Select {layer.source}
          </Button>
          {selectedId === layer.source && (
            <Text role="status">Selected {layer.source}</Text>
          )}
          <TechnicalValue size="s">{layer.targets.join(', ')}</TechnicalValue>
        </Col>
      ))}
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
