import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { FixedSizeList, type ListChildComponentProps } from 'react-window'
import styled from 'styled-components'

import { Button } from 'uiSrc/components/base/forms/buttons'
import { Col, Row } from 'uiSrc/components/base/layout/flex'
import { Text, Title } from 'uiSrc/components/base/text'
import { PluginsThemeContext } from 'uiSrc/components/base/utils/pluginsThemeContext'
import { useTranslation } from 'uiSrc/i18n'
import apiService from 'uiSrc/services/apiService'
import {
  cliSettingsSelector,
  createCliClientAction,
} from 'uiSrc/slices/cli/cli-settings'
import { useAppDispatch, useAppSelector } from 'uiSrc/slices/hooks'
import { connectedInstanceSelector } from 'uiSrc/slices/instances/instances'
import { parseVlinksTopology } from 'uiSrc/packages/vector-visualizer/src/advanced/advanced'
import {
  Advanced,
  Atlas,
  AtlasLegend,
  CompareTune,
  DuplicateExplorer,
  OutlierExplorer,
  QueryLab,
  XRay,
} from 'uiSrc/packages/vector-visualizer/src/components'
import type { AtlasLegendEntry } from 'uiSrc/packages/vector-visualizer/src/components'
import {
  computeDensityGrid,
  recommendGridSize,
} from 'uiSrc/packages/vector-visualizer/src/renderer/density'
import {
  autoEpsilon,
  clusterCentroids,
  computeDBSCAN,
  type DBSCANResult,
} from 'uiSrc/packages/vector-visualizer/src/health/clustering'
import {
  createLocalManifestStorage,
  toLocalManifest,
  type BenchmarkRunV1,
  type LocalManifestV1,
} from 'uiSrc/packages/vector-visualizer/src/compare/compare'
import {
  calculateDuplicateCandidates,
  calculateOutlierCandidates,
  defaultDuplicateThresholdForMetric,
  DEFAULT_DUPLICATE_CANDIDATE_CONFIG,
  DEFAULT_OUTLIER_CANDIDATE_CONFIG,
} from 'uiSrc/packages/vector-visualizer/src/health/calculations'
import type {
  CompareTuneStatus,
  QueryLabProps,
} from 'uiSrc/packages/vector-visualizer/src/types'
import type { VisualizerStatus } from 'uiSrc/packages/vector-visualizer/src/contracts'
import type { SelectionRow } from 'uiSrc/packages/vector-visualizer/src/selection/selection'
import {
  LayoutWorkerClient,
  type BoundedMetricEvidenceResult,
  type LayoutQuality,
} from 'uiSrc/packages/vector-visualizer/src/worker/layout'
import { planVectorSetTopology } from 'uiSrc/packages/vector-visualizer/src/vectorSetAdapter'
import { normalizeCoordinates } from 'uiSrc/packages/vector-visualizer/src/renderer/AtlasRenderer'
import type { AtlasClusterLabel } from 'uiSrc/packages/vector-visualizer/src/atlas/Atlas/Atlas.types'

import {
  consumeVectorVisualizerSource,
  createNativeVisualizerSession,
  type NativeVisualizerWorkflow,
  type VectorDataSourceRef,
} from './nativeHandoff'
import { createNativeReadOnlyExecutor } from './nativeExecution'
import { runNativeVectorSetBenchmark } from './nativeBenchmark'
import { buildNativeManifestProvenance } from './nativeManifest'
import { buildNativeQuerySourceSample } from './nativeQueryEvidence'
import {
  orchestrateNativeSample,
  orchestrateNativeQuery,
  type NativeSampleResult,
} from './nativeOrchestration'
import {
  buildNativeDriftEvidence,
  buildNativeXRayFacts,
} from './nativeEvidence'
import {
  VectorVisualizerCanvas,
  VectorVisualizerModeTabs,
} from './components/VectorVisualizerCanvas'
import { VectorVisualizerControls } from './components/VectorVisualizerControls'
import { VectorVisualizerNeighbors } from './components/VectorVisualizerNeighbors'
import { VectorVisualizerResults } from './components/VectorVisualizerResults'
import { VectorVisualizerWorkspace } from './components/VectorVisualizerWorkspace'

const DBSCAN_COLOR_BY_VALUE = '__dbscan_clusters__'
const DBSCAN_MIN_POINTS = 5
const DBSCAN_K = 5

const DEFAULT_SAMPLE_BUDGET = 2_000
const MIN_SAMPLE_BUDGET = 500
const MAX_SAMPLE_BUDGET = 20_000
const MAX_HEALTH_SAMPLE_SIZE = 200
const UMAP_SEED = 42
const NATIVE_QUERY_LIMIT = 50
const MIN_CLUSTER_LABEL_COUNT = 2
const DEFAULT_CLUSTER_LABEL_LIMIT = 'top-12'
const CLUSTER_LABEL_LIMIT_OPTIONS = [
  { labelKey: 'vectorVisualizer.clusterLabels.options.off', value: 'off' },
  { labelKey: 'vectorVisualizer.clusterLabels.options.top5', value: 'top-5' },
  {
    labelKey: 'vectorVisualizer.clusterLabels.options.top12',
    value: DEFAULT_CLUSTER_LABEL_LIMIT,
  },
  {
    labelKey: 'vectorVisualizer.clusterLabels.options.top25',
    value: 'top-25',
  },
  {
    labelKey: 'vectorVisualizer.clusterLabels.options.allVisible',
    value: 'all',
  },
] as const
const CLUSTER_LABEL_MIN_HORIZONTAL_SEPARATION = 0.12
const CLUSTER_LABEL_MIN_VERTICAL_SEPARATION = 0.08
const CLUSTER_LABEL_VERTICAL_OFFSETS = [0, 0.1, -0.1, 0.2, -0.2] as const
const CLUSTER_LABEL_MIN_POSITION = 0.08
const CLUSTER_LABEL_MAX_POSITION = 0.92

type ClusterLabelLimit = (typeof CLUSTER_LABEL_LIMIT_OPTIONS)[number]['value']

const clusterLabelLimitCount = (limit: ClusterLabelLimit) => {
  if (limit === 'off') return 0
  if (limit === 'all') return Number.POSITIVE_INFINITY
  return Number(limit.replace('top-', ''))
}

const isClusterLabelLimit = (value: string): value is ClusterLabelLimit =>
  CLUSTER_LABEL_LIMIT_OPTIONS.some((option) => option.value === value)

const spreadClusterLabels = (labels: AtlasClusterLabel[]) => {
  const placed: AtlasClusterLabel[] = []
  labels.forEach((label) => {
    const offset = CLUSTER_LABEL_VERTICAL_OFFSETS.find((candidateOffset) => {
      const candidateY = Math.min(
        CLUSTER_LABEL_MAX_POSITION,
        Math.max(CLUSTER_LABEL_MIN_POSITION, label.y + candidateOffset),
      )
      return placed.every(
        (placedLabel) =>
          Math.abs(placedLabel.x - label.x) >=
            CLUSTER_LABEL_MIN_HORIZONTAL_SEPARATION ||
          Math.abs(placedLabel.y - candidateY) >=
            CLUSTER_LABEL_MIN_VERTICAL_SEPARATION,
      )
    })
    placed.push({
      ...label,
      y: Math.min(
        CLUSTER_LABEL_MAX_POSITION,
        Math.max(CLUSTER_LABEL_MIN_POSITION, label.y + (offset ?? 0)),
      ),
    })
  })
  return placed
}

const NativeHost = styled.main`
  display: flex;
  flex-direction: column;
  block-size: 100vh;
  min-block-size: 0;
  min-inline-size: 0;
  overflow: hidden;
  padding: ${({ theme }) => theme.core.space.space150};
  gap: ${({ theme }) => theme.core.space.space100};
` as unknown as React.FC<React.HTMLAttributes<HTMLElement>>

const TruthBanner = styled(Text)`
  flex: 0 0 auto;
  padding: ${({ theme }) => theme.core.space.space100};
  border: ${({ theme }) => theme.core.space.space010} solid
    ${({ theme }) => theme.semantic.color.border.neutral500};
  background-color: ${({ theme }) =>
    theme.semantic.color.background.neutral100};
`

const NativeHeader = styled(Row)`
  flex: 0 0 auto;
  min-inline-size: 0;
`

const ModeHeader = styled(Row)`
  flex: 0 0 auto;
  min-inline-size: 0;
  padding: ${({ theme }) => theme.core.space.space075}
    ${({ theme }) => theme.core.space.space100};
  border: ${({ theme }) => theme.core.space.space010} solid
    ${({ theme }) => theme.semantic.color.border.neutral500};
  background-color: ${({ theme }) =>
    theme.semantic.color.background.neutral100};
`

const workflows: NativeVisualizerWorkflow[] = [
  'explore',
  'query-lab',
  'health',
  'compare-tune',
  'advanced',
]

type NativePageStatus =
  | 'ready-not-sampled'
  | 'fetching'
  | 'layouting'
  | 'ready'
  | 'partial'
  | 'empty'
  | 'unsupported'
  | 'acl-unavailable'
  | 'cancelled'
  | 'stale'
  | 'recoverable-error'

interface NativePageSample {
  result: Omit<NativeSampleResult, 'vectors'>
  coordinates: Float32Array
  quality: LayoutQuality
  requestedSampleBudget: number
  layoutMetric: 'cosine' | 'l2' | 'ip'
}

const emptyQuery: Pick<
  QueryLabProps,
  'status' | 'exactness' | 'neighbors' | 'profile'
> = {
  status: 'ready-not-sampled' as const,
  exactness: 'unknown' as const,
  neighbors: [],
  profile: { kind: 'none' as const, facts: {} },
}

const unknownEvidence = {
  kind: 'unknown' as const,
  reason: 'missing-original-space-neighbor-evidence' as const,
}

const errorStatus = (error: unknown): NativePageStatus => {
  const message = error instanceof Error ? error.message : ''
  if (message === 'acl-unavailable') return 'acl-unavailable'
  if (message === 'unsupported-command') return 'unsupported'
  if (message === 'cancelled') return 'cancelled'
  return 'recoverable-error'
}

const toPageSample = (
  result: NativeSampleResult,
  coordinates: Float32Array,
  quality: LayoutQuality,
  requestedSampleBudget: number,
  layoutMetric: NativePageSample['layoutMetric'],
): NativePageSample => {
  const { vectors, ...safeResult } = result
  vectors.fill(0)
  return {
    result: safeResult,
    coordinates,
    quality,
    requestedSampleBudget,
    layoutMetric,
  }
}

const NativeExecutionUnavailable = ({ workflow }: { workflow: string }) => {
  const { t } = useTranslation()
  return (
    <Col gap="l">
      <Text color="subdued" role="status">
        {t('vectorVisualizer.workflows.unavailable', { workflow })}
      </Text>
      <Text color="subdued">
        {t('vectorVisualizer.workflows.unavailableEvidence')}
      </Text>
    </Col>
  )
}

const SampleSelection = ({
  sampleIds,
  selectedIds,
  onSelectedIdsChange,
  description,
}: {
  sampleIds: string[]
  selectedIds: string[]
  onSelectedIdsChange(ids: string[]): void
  description?: string
}) => {
  const { t } = useTranslation()
  const { theme } = useContext(PluginsThemeContext)
  const rowHeightToken = theme.core.space.space400
  const rootFontSize = Number.parseFloat(
    window.getComputedStyle(document.documentElement).fontSize,
  )
  const rowHeight =
    Number.parseFloat(rowHeightToken) *
    (rowHeightToken.endsWith('rem') && Number.isFinite(rootFontSize)
      ? rootFontSize
      : 1)
  const rowData = { sampleIds, selectedIds, onSelectedIdsChange }
  return (
    <Col gap="m">
      <Text
        aria-live="polite"
        aria-label={t('vectorVisualizer.selection.selectedIds')}
        role="status"
      >
        {t('vectorVisualizer.selection.selectedIds')}:{' '}
        {selectedIds.length
          ? selectedIds.join(', ')
          : t('vectorVisualizer.common.none')}
      </Text>
      <Text color="subdued">
        {description ?? t('vectorVisualizer.selection.idsOnly')}
      </Text>
      <div
        aria-label={t('vectorVisualizer.selection.virtualizedSampledIds')}
        aria-rowcount={sampleIds.length}
        role="list"
      >
        <FixedSizeList
          height={Math.min(sampleIds.length, 7) * rowHeight}
          itemCount={sampleIds.length}
          itemData={rowData}
          itemSize={rowHeight}
          width="100%"
        >
          {({
            index,
            style,
            data,
          }: ListChildComponentProps<typeof rowData>) => {
            const id = data.sampleIds[index]
            const selected = data.selectedIds.includes(id)
            return (
              <Row align="center" gap="s" role="listitem" style={style}>
                <Text component="span" title={id}>
                  {id}
                </Text>
                <Button
                  aria-label={t('vectorVisualizer.selection.selectId', { id })}
                  aria-pressed={selected}
                  size="s"
                  onClick={() => data.onSelectedIdsChange([id])}
                >
                  {t('vectorVisualizer.selection.inspectId')}
                </Button>
              </Row>
            )
          }}
        </FixedSizeList>
      </div>
    </Col>
  )
}

const Explore = ({
  sample,
  selectedIds,
  onSelectedIdsChange,
  metadataField,
  colorByValue: colorBySelection,
  showClusterLabels,
  clusterLabelLimit,
  showDensity: densityVisible,
  densityGrid: densityGridData,
  densityGridSize: densitySize,
  dbscanResult: dbscan,
  showMapLabels: mapLabelsVisible,
  mode = 'atlas',
}: {
  sample?: NativePageSample
  selectedIds: string[]
  onSelectedIdsChange(ids: string[]): void
  metadataField: string
  colorByValue: string
  showClusterLabels: boolean
  clusterLabelLimit: ClusterLabelLimit
  showDensity: boolean
  densityGrid: Float32Array | null
  densityGridSize: number
  dbscanResult: DBSCANResult | null
  showMapLabels: boolean
  mode?: 'atlas' | 'selection'
}) => {
  const { t } = useTranslation()
  const { theme } = useContext(PluginsThemeContext)
  if (!sample)
    return (
      <Text color="subdued" role="status">
        {t('vectorVisualizer.explore.readyNotSampled')}
      </Text>
    )
  const { result } = sample
  const metadataPalette = [
    theme.semantic.color.text.informative400,
    theme.semantic.color.text.success500,
    theme.semantic.color.text.attention500,
    theme.semantic.color.text.discovery400,
    theme.semantic.color.text.primary400,
  ]

  const isDbscanColorBy = colorBySelection === DBSCAN_COLOR_BY_VALUE

  const metadataValues = [
    ...new Set(
      result.records.flatMap(({ metadata }) => {
        const value = metadata?.[metadataField]
        return value === undefined || value === '' ? [] : [String(value)]
      }),
    ),
  ].sort()
  const metadataColorMap = new Map(
    metadataValues.map((value, index) => [
      value,
      metadataPalette[index % metadataPalette.length],
    ]),
  )

  const recordsById = new Map(
    result.records.map((record) => [record.id, record]),
  )

  const clusterDominant = new Map<number, string>()
  if (isDbscanColorBy && dbscan && metadataField) {
    const clusterValueCounts = new Map<number, Map<string, number>>()
    for (let i = 0; i < result.ids.length; i += 1) {
      const cid = dbscan.assignments[i]
      if (cid < 0) continue
      const val = recordsById.get(result.ids[i])?.metadata?.[metadataField]
      if (val === undefined || val === '') continue
      const sv = String(val)
      const vc = clusterValueCounts.get(cid) ?? new Map<string, number>()
      vc.set(sv, (vc.get(sv) ?? 0) + 1)
      clusterValueCounts.set(cid, vc)
    }
    for (const [cid, vc] of clusterValueCounts) {
      let topVal = ''
      let topCount = 0
      let total = 0
      for (const [v, c] of vc) {
        total += c
        if (c > topCount) { topCount = c; topVal = v }
      }
      const pct = Math.round((topCount / total) * 100)
      clusterDominant.set(cid, `${topVal} (${pct}%)`)
    }
  }

  let pointColors: Record<string, string | undefined>
  let legendEntries: AtlasLegendEntry[]

  if (isDbscanColorBy && dbscan) {
    const clusterCounts = new Map<number, number>()
    for (let i = 0; i < result.ids.length; i += 1) {
      const clusterId = dbscan.assignments[i]
      if (clusterId >= 0) {
        clusterCounts.set(clusterId, (clusterCounts.get(clusterId) ?? 0) + 1)
      }
    }
    const clusterColorMap = new Map<number, string>()
    let paletteIndex = 0
    for (const clusterId of [...clusterCounts.keys()].sort((a, b) => a - b)) {
      clusterColorMap.set(
        clusterId,
        metadataPalette[paletteIndex % metadataPalette.length],
      )
      paletteIndex += 1
    }

    pointColors = Object.fromEntries(
      result.ids.flatMap((id, index) => {
        const clusterId = dbscan.assignments[index]
        const color = clusterColorMap.get(clusterId)
        return color ? [[id, color]] : []
      }),
    )
    legendEntries = [...clusterColorMap.entries()].map(
      ([clusterId, color]) => {
        const dominant = clusterDominant.get(clusterId)
        return {
          label: dominant
            ? `Cluster ${clusterId} · ${dominant}`
            : `Cluster ${clusterId}`,
          color,
          count: clusterCounts.get(clusterId) ?? 0,
        }
      },
    )
    const noiseCount = result.ids.filter(
      (_, i) => dbscan.assignments[i] < 0,
    ).length
    if (noiseCount > 0) {
      legendEntries.push({
        label: 'Noise',
        color: theme.semantic.color.text.neutral500,
        count: noiseCount,
        dimmed: true,
      })
    }
  } else {
    pointColors = Object.fromEntries(
      result.records.flatMap(({ id, metadata }) => {
        const value = metadata?.[metadataField]
        const color =
          value === undefined ? undefined : metadataColorMap.get(String(value))
        return color ? [[id, color]] : []
      }),
    )
    legendEntries = metadataValues
      .filter((value) => metadataColorMap.has(value))
      .map((value) => ({
        label: value,
        color: metadataColorMap.get(value)!,
        count: result.records.filter(
          (r) =>
            r.metadata?.[metadataField] !== undefined &&
            String(r.metadata[metadataField]) === value,
        ).length,
      }))
  }

  const handleLegendEntryClick = (label: string) => {
    let matchingIds: string[]
    if (isDbscanColorBy && dbscan) {
      if (label === 'Noise') {
        matchingIds = result.ids.filter((_, i) => dbscan.assignments[i] < 0)
      } else {
        const clusterId = Number(label.replace(/^Cluster (\d+).*/, '$1'))
        matchingIds = result.ids.filter(
          (_, i) => dbscan.assignments[i] === clusterId,
        )
      }
    } else {
      matchingIds = result.records
        .filter(
          ({ metadata }) =>
            metadata?.[metadataField] !== undefined &&
            String(metadata[metadataField]) === label,
        )
        .map(({ id }) => id)
    }
    onSelectedIdsChange(matchingIds)
  }

  const normalizedCoordinates = normalizeCoordinates(sample.coordinates)

  let clusterLabels: AtlasClusterLabel[]
  if (isDbscanColorBy && dbscan) {
    const centroids = clusterCentroids(
      normalizedCoordinates,
      dbscan.assignments,
      result.ids.length,
    )
    clusterLabels = spreadClusterLabels(
      centroids.map((c) => {
        const dominant = clusterDominant.get(c.clusterId)
        return {
          id: `dbscan-${c.clusterId}`,
          label: dominant
            ? `Cluster ${c.clusterId} · ${dominant}`
            : `Cluster ${c.clusterId}`,
          x: c.x,
          y: c.y,
          count: c.count,
        }
      }),
    )
  } else {
    const clusterLabelDisplayLimit = clusterLabelLimitCount(clusterLabelLimit)
    const clusterLabelCandidates = metadataValues
      .map((value) => {
        const positions = result.ids.flatMap((id, index) => {
          const metadataValue = recordsById.get(id)?.metadata?.[metadataField]
          return metadataValue !== undefined && String(metadataValue) === value
            ? [
                {
                  x: normalizedCoordinates[index * 2],
                  y: normalizedCoordinates[index * 2 + 1],
                },
              ]
            : []
        })
        return {
          id: value,
          label: value,
          x:
            positions.reduce((total, position) => total + position.x, 0) /
            positions.length,
          y:
            positions.reduce((total, position) => total + position.y, 0) /
            positions.length,
          count: positions.length,
        }
      })
      .filter(({ count }) => count > 0)
      .sort(
        (left, right) =>
          right.count - left.count || left.label.localeCompare(right.label),
      )
    clusterLabels = spreadClusterLabels(
      showClusterLabels &&
        clusterLabelDisplayLimit > 0 &&
        metadataValues.length >= MIN_CLUSTER_LABEL_COUNT
        ? clusterLabelCandidates.slice(0, clusterLabelDisplayLimit)
        : [],
    )
  }

  return (
    <Col gap="l">
      <Atlas
        title={
          mode === 'selection'
            ? t('vectorVisualizer.atlas.title.selection')
            : result.source.kind === 'search-index'
              ? t('vectorVisualizer.atlas.title.index')
              : t('vectorVisualizer.atlas.title.vectorSet')
        }
        coordinates={sample.coordinates}
        sampleIds={result.ids}
        provenance={{
          sourceCount: result.sourceCount,
          sampleCount: result.sampleCount,
          method: 'UMAP',
          seed: UMAP_SEED,
          freshness:
            result.freshness === 'changed-while-sampled'
              ? 'changed-while-sampled'
              : 'fresh',
          exactness: 'unknown',
          quality: sample.quality,
        }}
        pointColors={pointColors}
        clusterLabels={clusterLabels}
        legendEntries={legendEntries}
        onLegendEntryClick={handleLegendEntryClick}
        showMapLabels={mapLabelsVisible}
        showDensity={densityVisible}
        densityGrid={densityGridData}
        densityGridSize={densitySize}
        interactionMode={mode === 'selection' ? 'region' : 'pan'}
        showEvidenceDetails={false}
        selectedIds={selectedIds}
        onSelectionChange={onSelectedIdsChange}
        renderAccessibleSelection={() => (
          <SampleSelection
            sampleIds={result.ids}
            selectedIds={selectedIds}
            onSelectedIdsChange={onSelectedIdsChange}
          />
        )}
      />
    </Col>
  )
}

const Health = ({
  sample,
  evidence,
  selectedIds,
  onSelectedIdsChange,
  metadataField,
  queryValues,
  duplicateThreshold,
  onDuplicateThresholdChange,
  outlierConfig,
  onOutlierConfigChange,
}: {
  sample?: NativePageSample
  evidence?: BoundedMetricEvidenceResult
  selectedIds: string[]
  onSelectedIdsChange(ids: string[]): void
  metadataField: string
  queryValues: number[]
  duplicateThreshold: number
  onDuplicateThresholdChange(value: number): void
  outlierConfig: { k: number; robustDeviationThreshold: number }
  onOutlierConfigChange(value: {
    k: number
    robustDeviationThreshold: number
  }): void
}) => {
  const { t } = useTranslation()
  const records = (sample?.result.records ?? [])
    .filter((record) => evidence?.sampleIds.includes(record.id))
    .map(({ id, metadata }) => ({ id, metadata }))
  const duplicateEvidence =
    evidence && records.length === evidence.sampleIds.length
      ? calculateDuplicateCandidates(
          records,
          {
            metric: evidence.metric,
            sampleIds: evidence.sampleIds,
            freshness: evidence.freshness,
            coverage: 'sample-pair-complete',
            pairMeasure: evidence.pairMeasure,
            duplicateDirection: evidence.duplicateDirection,
            edges: evidence.edges,
          },
          { threshold: duplicateThreshold },
        )
      : unknownEvidence
  const outlierEvidence =
    evidence && records.length === evidence.sampleIds.length
      ? calculateOutlierCandidates(
          {
            metric: evidence.metric,
            distanceMeasure: evidence.neighborDistanceMeasure,
            sampleIds: evidence.sampleIds,
            freshness: evidence.freshness,
            exactness: evidence.exactness,
            k: evidence.k,
            distances: evidence.kthDistances,
          },
          outlierConfig,
        )
      : unknownEvidence
  const duplicateIds =
    duplicateEvidence.kind === 'known'
      ? duplicateEvidence.groups.flatMap(({ ids }) => ids)
      : []
  const outlierIds = outlierEvidence.kind === 'known' ? outlierEvidence.ids : []
  const selectedRecords = records.filter(({ id }) => selectedIds.includes(id))
  return (
    <Col gap="l">
      <XRay
        facts={
          sample
            ? buildNativeXRayFacts({
                sample: sample.result,
                metadataField,
                duplicateIds,
                outlierIds,
                queryValues,
                evidenceSampleCount: evidence?.sampleIds.length,
                evidenceK: evidence?.k,
                evidenceExactness: evidence?.exactness,
              })
            : []
        }
      />
      {evidence && (
        <Text color="subdued">
          Exact original-space {evidence.pairMeasure} and{' '}
          {evidence.neighborDistanceMeasure} evidence is capped to{' '}
          {evidence.sampleIds.length} sampled records (maximum{' '}
          {MAX_HEALTH_SAMPLE_SIZE}); the full Atlas is never compared pairwise.
        </Text>
      )}
      <DuplicateExplorer
        evidence={duplicateEvidence}
        onSelectionChange={onSelectedIdsChange}
        onConfigChange={onDuplicateThresholdChange}
      />
      <OutlierExplorer
        evidence={outlierEvidence}
        onSelectionChange={onSelectedIdsChange}
        onConfigChange={onOutlierConfigChange}
      />
      {sample && (
        <SampleSelection
          sampleIds={records.map(({ id }) => id)}
          selectedIds={selectedIds}
          onSelectedIdsChange={onSelectedIdsChange}
          description={t('vectorVisualizer.health.selectionDescription')}
        />
      )}
      <Col
        gap="xs"
        aria-label={t('vectorVisualizer.health.selectedRecordInspector')}
      >
        <Title component="h2" size="S">
          {t('vectorVisualizer.health.selectedEvidence')}
        </Title>
        {selectedRecords.length ? (
          selectedRecords.map(({ id, metadata }) => (
            <Col gap="xs" key={id}>
              <Text>{id}</Text>
              <Text
                color="subdued"
                aria-label={t('vectorVisualizer.health.candidateRule')}
              >
                {duplicateIds.includes(id)
                  ? `${duplicateEvidence.kind === 'known' ? duplicateEvidence.formula : t('vectorVisualizer.health.duplicateRuleUnavailable')}; threshold ${duplicateThreshold}; bounded sample ${evidence?.sampleIds.length ?? 0}; freshness ${evidence?.freshness ?? 'unknown'}.`
                  : outlierIds.includes(id)
                    ? `${outlierEvidence.kind === 'known' ? outlierEvidence.formula : t('vectorVisualizer.health.outlierRuleUnavailable')}; k=${evidence?.k ?? 'unknown'}; exactness ${evidence?.exactness ?? 'unknown'}; freshness ${evidence?.freshness ?? 'unknown'}.`
                    : t('vectorVisualizer.health.noCandidateRule')}
              </Text>
              <Text color="subdued">
                {t('vectorVisualizer.health.metadataFields')}:{' '}
                {Object.keys(metadata ?? {}).join(', ') ||
                  t('vectorVisualizer.common.none')}
              </Text>
            </Col>
          ))
        ) : (
          <Text color="subdued" role="status">
            {t('vectorVisualizer.health.selectToInspect')}
          </Text>
        )}
      </Col>
    </Col>
  )
}

export const VectorVisualizerPage = () => {
  const { t } = useTranslation()
  const [source, setSource] = useState<VectorDataSourceRef>()
  const dispatch = useAppDispatch()
  const connectedInstance = useAppSelector(connectedInstanceSelector)
  const cliSettings = useAppSelector(cliSettingsSelector)
  const [session] = useState(() =>
    createNativeVisualizerSession({ workflow: 'explore' }),
  )
  const layoutWorker = useRef<LayoutWorkerClient>()
  const layoutWorkerPromise = useRef<Promise<LayoutWorkerClient>>()
  const disposed = useRef(false)
  const cliInitializationAttempted = useRef(false)
  const [workflow, setWorkflow] = useState(
    () => session.getPreferences().workflow,
  )
  const [workspaceMode, setWorkspaceMode] = useState<
    'atlas' | 'neighbors' | 'selection'
  >('atlas')
  const [additionalWorkflowsOpen, setAdditionalWorkflowsOpen] = useState(false)
  const [sampleBudget, setSampleBudget] = useState(DEFAULT_SAMPLE_BUDGET)
  const [status, setStatus] = useState<NativePageStatus>('ready-not-sampled')
  const [sample, setSample] = useState<NativePageSample>()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [metadataField, setMetadataField] = useState('')
  const [filterExpression, setFilterExpression] = useState('')
  const [sampledFilterExpression, setSampledFilterExpression] = useState('')
  const [showClusterLabels, setShowClusterLabels] = useState(true)
  const [clusterLabelLimit, setClusterLabelLimit] = useState<ClusterLabelLimit>(
    DEFAULT_CLUSTER_LABEL_LIMIT,
  )
  const [healthEvidence, setHealthEvidence] =
    useState<BoundedMetricEvidenceResult>()
  const [duplicateThreshold, setDuplicateThreshold] = useState<number>(
    DEFAULT_DUPLICATE_CANDIDATE_CONFIG.similarityThreshold,
  )
  const [outlierConfig, setOutlierConfig] = useState<{
    k: number
    robustDeviationThreshold: number
  }>({
    ...DEFAULT_OUTLIER_CANDIDATE_CONFIG,
  })
  const [query, setQuery] = useState(emptyQuery)
  const [queryAnchorId, setQueryAnchorId] = useState<string>()
  const [manifests, setManifests] = useState<LocalManifestV1[]>([])
  const [benchmarkRuns, setBenchmarkRuns] = useState<BenchmarkRunV1[]>([])
  const [compareStatus, setCompareStatus] = useState<
    CompareTuneStatus | undefined
  >('empty')
  const [showDensity, setShowDensity] = useState(false)
  const [densityGrid, setDensityGrid] = useState<Float32Array | null>(null)
  const [densityGridSize, setDensityGridSize] = useState(64)
  const [dbscanResult, setDbscanResult] = useState<DBSCANResult | null>(null)
  const [showMapLabels, setShowMapLabels] = useState(false)

  const [advanced, setAdvanced] = useState<{
    status:
      | 'ready'
      | 'acl-unavailable'
      | 'cancelled'
      | 'recoverable-error'
      | 'unsupported'
    topology: ReturnType<typeof parseVlinksTopology>
  }>({ status: 'ready', topology: { kind: 'unsupported' } })

  const statusCopy = useMemo<Record<NativePageStatus, string>>(
    () => ({
      'ready-not-sampled': t('vectorVisualizer.status.readyNotSampled'),
      fetching: t('vectorVisualizer.status.fetching'),
      layouting: t('vectorVisualizer.status.layouting'),
      ready: t('vectorVisualizer.status.ready'),
      partial: t('vectorVisualizer.status.partial'),
      empty: t('vectorVisualizer.status.empty'),
      unsupported: t('vectorVisualizer.status.unsupported'),
      'acl-unavailable': t('vectorVisualizer.status.aclUnavailable'),
      cancelled: t('vectorVisualizer.status.cancelled'),
      stale: t('vectorVisualizer.status.stale'),
      'recoverable-error': t('vectorVisualizer.status.recoverableError'),
    }),
    [t],
  )

  const workflowLabels = useMemo<Record<NativeVisualizerWorkflow, string>>(
    () => ({
      explore: t('vectorVisualizer.workflows.explore'),
      'query-lab': t('vectorVisualizer.workflows.queryLab'),
      health: t('vectorVisualizer.workflows.health'),
      'compare-tune': t('vectorVisualizer.workflows.compareTune'),
      advanced: t('vectorVisualizer.workflows.advanced'),
    }),
    [t],
  )

  useEffect(() => {
    if (!sample) {
      setDensityGrid(null)
      setDbscanResult(null)
      return
    }
    const { coordinates } = sample
    const count = sample.result.ids.length
    if (count < 2) return

    const normalized = normalizeCoordinates(coordinates)
    const gridSize = recommendGridSize(count)
    setDensityGrid(computeDensityGrid(normalized, count, gridSize))
    setDensityGridSize(gridSize)

    const epsilon = autoEpsilon(normalized, count, DBSCAN_K)
    setDbscanResult(computeDBSCAN(normalized, count, epsilon, DBSCAN_MIN_POINTS))
  }, [sample])

  useEffect(() => {
    const nextSource = consumeVectorVisualizerSource()
    if (!nextSource) return
    session.setSource(nextSource)
    setSource(nextSource)
  }, [session])

  useEffect(() => {
    if (
      !source ||
      !connectedInstance.id ||
      cliSettings.cliClientUuid ||
      cliSettings.loading ||
      cliInitializationAttempted.current
    )
      return
    cliInitializationAttempted.current = true
    dispatch(createCliClientAction(connectedInstance.id))
  }, [
    cliSettings.cliClientUuid,
    cliSettings.loading,
    connectedInstance.id,
    dispatch,
    source,
  ])

  useEffect(() => {
    disposed.current = false
    return () => {
      disposed.current = true
      layoutWorker.current?.dispose()
      session.dispose()
    }
  }, [session])

  if (!source) {
    return (
      <Col gap="m" data-testid="vector-visualizer-source-missing">
        <Title component="h1" size="M">
          {t('vectorVisualizer.page.title')}
        </Title>
        <Text>{t('vectorVisualizer.page.sourceMissing')}</Text>
      </Col>
    )
  }

  const sourceKind = source.kind
  const selectWorkflow = (nextWorkflow: NativeVisualizerWorkflow) => {
    session.setPreferences({ workflow: nextWorkflow })
    setWorkflow(nextWorkflow)
    setAdditionalWorkflowsOpen(true)
  }
  const cancel = () => {
    layoutWorker.current?.cancel()
    session.cancel()
    setSample(undefined)
    setSelectedIds([])
    setHealthEvidence(undefined)
    setQuery(emptyQuery)
    setQueryAnchorId(undefined)
    setStatus('cancelled')
  }
  const sampleVectors = async () => {
    if (
      !Number.isInteger(sampleBudget) ||
      sampleBudget < MIN_SAMPLE_BUDGET ||
      sampleBudget > MAX_SAMPLE_BUDGET
    ) {
      setStatus('recoverable-error')
      return
    }
    if (!connectedInstance.id) {
      setStatus('recoverable-error')
      return
    }
    const work = session.beginWork()
    setSample(undefined)
    setSelectedIds([])
    setHealthEvidence(undefined)
    setQuery(emptyQuery)
    setQueryAnchorId(undefined)
    setStatus('fetching')
    try {
      const execute = createNativeReadOnlyExecutor({
        instanceId: connectedInstance.id,
        cliClientUuid: cliSettings.cliClientUuid,
        post: apiService.post,
      })
      const result = await orchestrateNativeSample({
        source,
        limit: sampleBudget,
        execute,
        signal: work.signal,
        generation: work.generation,
        accept: (generation) => session.accept(generation, null),
        allowListedFields:
          source.kind === 'search-index'
            ? [metadataField].filter(Boolean)
            : metadataField
              ? [metadataField]
              : [],
        filter:
          source.kind === 'search-index'
            ? filterExpression.trim() || undefined
            : undefined,
      })
      if (result.kind === 'cancelled' || result.kind === 'stale') {
        session.cancel()
        setStatus(result.kind)
        return
      }
      if (result.kind === 'unsupported' || result.kind === 'empty') {
        setStatus(result.kind)
        return
      }
      if (result.metadataField) setMetadataField(result.metadataField)
      else if (
        result.availableMetadataFields?.length &&
        !result.availableMetadataFields.includes(metadataField)
      )
        setMetadataField(result.availableMetadataFields[0])
      if (!session.accept(work.generation, result).accepted) {
        session.cancel()
        setStatus('stale')
        return
      }
      result.ids.forEach((id, index) => {
        const start = index * result.dimensions
        session.storeRawVector(
          id,
          result.vectors.slice(start, start + result.dimensions),
        )
      })
      setStatus('layouting')
      const workerVectors = new Float32Array(result.vectors)
      const layoutMetric =
        result.source.kind === 'search-index' && result.metric !== 'unknown'
          ? result.metric
          : 'cosine'
      if (!layoutWorkerPromise.current) {
        layoutWorkerPromise.current = import(
          'uiSrc/packages/vector-visualizer/src/worker/browserWorker'
        ).then(({ createBrowserLayoutWorker }) => {
          const client = new LayoutWorkerClient(createBrowserLayoutWorker)
          layoutWorker.current = client
          if (disposed.current) client.dispose()
          return client
        })
      }
      const worker = await layoutWorkerPromise.current
      if (!session.accept(work.generation, null).accepted) {
        setStatus('stale')
        return
      }
      const layout = await worker.start({
        version: 1,
        jobId: `native-${work.generation}`,
        algorithm: 'umap',
        metric: layoutMetric,
        count: result.sampleCount,
        dimensions: result.dimensions,
        vectors: workerVectors,
        seed: UMAP_SEED,
        parameters: { nNeighbors: 15 },
      })
      if (!session.accept(work.generation, layout).accepted) {
        session.cancel()
        setStatus('stale')
        return
      }
      if (layout.type !== 'complete') {
        session.cancel()
        setStatus('unsupported')
        return
      }
      setSample(
        toPageSample(
          result,
          layout.coordinates,
          layout.quality,
          sampleBudget,
          layoutMetric,
        ),
      )
      setSampledFilterExpression(
        source.kind === 'search-index' ? filterExpression.trim() : '',
      )
      setStatus(result.kind === 'partial' ? 'partial' : 'ready')
      if (result.metric !== 'unknown') {
        setDuplicateThreshold(defaultDuplicateThresholdForMetric(result.metric))
        const healthIds = result.ids.slice(0, MAX_HEALTH_SAMPLE_SIZE)
        const healthVectors = new Float32Array(
          healthIds.length * result.dimensions,
        )
        healthIds.forEach((id, index) => {
          const vector = session.getRawVector(id)
          if (vector) healthVectors.set(vector, index * result.dimensions)
        })
        void worker
          .startHealth({
            jobId: `native-health-${work.generation}`,
            ids: healthIds,
            vectors: healthVectors,
            dimensions: result.dimensions,
            metric: result.metric,
            maxSampleSize: MAX_HEALTH_SAMPLE_SIZE,
            k: DEFAULT_OUTLIER_CANDIDATE_CONFIG.k,
            freshness:
              result.freshness === 'changed-while-sampled'
                ? 'changed-while-sampled'
                : 'fresh',
          })
          .then((health) => {
            if (session.accept(work.generation, health).accepted)
              setHealthEvidence(health)
          })
          .catch(() => undefined)
      }
    } catch (error) {
      session.cancel()
      setSample(undefined)
      setSelectedIds([])
      setStatus(errorStatus(error))
    }
  }

  const runQuery = async (requestedAnchorId?: string) => {
    const anchorId = requestedAnchorId ?? selectedIds[0]
    const anchorVector = anchorId ? session.getRawVector(anchorId) : undefined
    if (!sample || !anchorId || !anchorVector || !connectedInstance.id) {
      setQuery({ ...emptyQuery, status: 'unsupported' })
      setQueryAnchorId(undefined)
      return
    }
    const work = session.beginWork()
    setQueryAnchorId(anchorId)
    setQuery({ ...emptyQuery, status: 'fetching' })
    try {
      const execute = createNativeReadOnlyExecutor({
        instanceId: connectedInstance.id,
        cliClientUuid: cliSettings.cliClientUuid,
        post: apiService.post,
      })
      const result = await orchestrateNativeQuery({
        source,
        anchorId,
        anchorVector,
        sampleIds: sample.result.ids,
        metric: sample.result.metric,
        algorithm: sample.result.algorithm,
        limit: NATIVE_QUERY_LIMIT,
        execute,
        signal: work.signal,
        generation: work.generation,
        accept: (generation) => session.accept(generation, null),
      })
      if (result.kind !== 'ready') {
        setQuery({ ...emptyQuery, status: result.kind })
        return
      }
      setQuery({
        ...result,
        status: result.neighbors.length ? 'ready' : 'empty',
      })
    } catch (error) {
      setQuery({
        ...emptyQuery,
        status:
          errorStatus(error) === 'acl-unavailable'
            ? 'acl-unavailable'
            : 'recoverable-error',
      })
    }
  }

  const copyIds = (ids: string[]) => {
    if (!ids.length) return
    void navigator.clipboard?.writeText(ids.join('\n')).catch(() => undefined)
  }

  const exportRows = (rows: SelectionRow[]) => {
    if (!rows.length) return
    const payload = JSON.stringify(rows, null, 2)
    const url = URL.createObjectURL(
      new Blob([payload], { type: 'application/json' }),
    )
    const link = document.createElement('a')
    link.href = url
    link.download = `vector-visualizer-results-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const runNeighborsForSelected = (id?: string) => {
    if (id) setSelectedIds([id])
    setWorkspaceMode('neighbors')
    void runQuery(id)
  }

  const buildManifest = (): LocalManifestV1 | undefined => {
    if (!sample || sample.result.metric === 'unknown') return undefined
    if (sample.result.method === 'unavailable') return undefined
    const provenance = buildNativeManifestProvenance({
      databaseId: connectedInstance.id,
      source,
      sampleIds: sample.result.ids,
      samplingMethod: sample.result.method,
      seed: sample.result.seed,
      algorithm: sample.result.algorithm,
    })
    const manifestVectors = new Float32Array(
      sample.result.sampleCount * sample.result.dimensions,
    )
    const vectorsAvailable = sample.result.ids.every((id, index) => {
      const vector = session.getRawVector(id)
      if (!vector) return false
      manifestVectors.set(vector, index * sample.result.dimensions)
      return true
    })
    const healthRecords = sample.result.records
      .filter(({ id }) => healthEvidence?.sampleIds.includes(id))
      .map(({ id, metadata }) => ({ id, metadata }))
    const duplicateEvidence = healthEvidence
      ? calculateDuplicateCandidates(
          healthRecords,
          {
            metric: healthEvidence.metric,
            sampleIds: healthEvidence.sampleIds,
            freshness: healthEvidence.freshness,
            coverage: 'sample-pair-complete',
            pairMeasure: healthEvidence.pairMeasure,
            duplicateDirection: healthEvidence.duplicateDirection,
            edges: healthEvidence.edges,
          },
          { threshold: duplicateThreshold },
        )
      : unknownEvidence
    const outlierEvidence = healthEvidence
      ? calculateOutlierCandidates(
          {
            metric: healthEvidence.metric,
            distanceMeasure: healthEvidence.neighborDistanceMeasure,
            sampleIds: healthEvidence.sampleIds,
            freshness: healthEvidence.freshness,
            exactness: healthEvidence.exactness,
            k: healthEvidence.k,
            distances: healthEvidence.kthDistances,
          },
          outlierConfig,
        )
      : unknownEvidence
    const driftEvidence = vectorsAvailable
      ? buildNativeDriftEvidence({
          sample: sample.result,
          vectors: manifestVectors,
          clusterField: metadataField,
          metadataField,
          duplicateIds:
            duplicateEvidence.kind === 'known'
              ? duplicateEvidence.groups.flatMap(({ ids }) => ids)
              : undefined,
          outlierIds:
            outlierEvidence.kind === 'known' ? outlierEvidence.ids : undefined,
          queryNeighbors: query.neighbors,
        })
      : undefined
    manifestVectors.fill(0)
    return toLocalManifest({
      version: 1,
      sourceKind: source.kind,
      sourceId: provenance.sourceId,
      dimensions: sample.result.dimensions,
      metric: sample.result.metric,
      ...(source.kind === 'search-index'
        ? { vectorField: source.vectorField }
        : {}),
      sampleCount: sample.result.sampleCount,
      sourceCount: sample.result.sourceCount,
      sampleIdDigest: provenance.sampleIdDigest,
      databaseId: provenance.databaseId,
      sampling: provenance.sampling,
      filter: provenance.filter,
      graph: {
        exactness: provenance.graphExactness,
        evidence: 'measured',
      },
      algorithm: sample.result.algorithm,
      quantization: sample.result.quantization,
      createdAt: new Date().toISOString(),
      freshness:
        sample.result.freshness === 'unknown'
          ? undefined
          : sample.result.freshness,
      projection: {
        algorithm: 'umap',
        dimensions: 2,
        seed: UMAP_SEED,
        quality:
          sample.quality.kind === 'measured' ? sample.quality.value : undefined,
      },
      driftEvidence,
    })
  }

  const saveManifest = () => {
    const manifest = buildManifest()
    if (!manifest) return
    const id = `native-${Date.now()}-${manifests.length + 1}`
    createLocalManifestStorage(window.localStorage).save(id, manifest)
    setManifests((current) => [...current, manifest])
    setCompareStatus(undefined)
  }

  const runTruthBenchmark = async () => {
    const anchorId = selectedIds[0]
    const anchorVector = anchorId ? session.getRawVector(anchorId) : undefined
    const manifest = manifests[manifests.length - 1]
    if (
      source.kind !== 'vector-set' ||
      !sample ||
      !manifest ||
      !anchorVector ||
      !connectedInstance.id
    ) {
      setCompareStatus('unsupported')
      return
    }
    const work = session.beginWork()
    try {
      const execute = createNativeReadOnlyExecutor({
        instanceId: connectedInstance.id,
        cliClientUuid: cliSettings.cliClientUuid,
        post: apiService.post,
      })
      const run = await runNativeVectorSetBenchmark({
        key: source.key,
        anchorVector,
        limit: Math.min(50, sample.result.sourceCount),
        manifest,
        execute,
        signal: work.signal,
      })
      if (!session.accept(work.generation, run).accepted) {
        setCompareStatus('cancelled')
        return
      }
      setBenchmarkRuns((current) => [...current, run])
      setCompareStatus(undefined)
    } catch (error) {
      setCompareStatus(
        errorStatus(error) === 'cancelled' ? 'cancelled' : 'recoverable-error',
      )
    } finally {
      anchorVector.fill(0)
    }
  }

  const loadTopology = async () => {
    const selectedId = selectedIds[0]
    if (source.kind !== 'vector-set' || !selectedId || !connectedInstance.id) {
      setAdvanced({ status: 'unsupported', topology: { kind: 'unsupported' } })
      return
    }
    const work = session.beginWork()
    setAdvanced({ status: 'ready', topology: { kind: 'unsupported' } })
    try {
      const execute = createNativeReadOnlyExecutor({
        instanceId: connectedInstance.id,
        cliClientUuid: cliSettings.cliClientUuid,
        post: apiService.post,
      })
      const selectedArgument =
        sample?.result.memberArguments?.get(selectedId) ?? selectedId
      const reply = await execute(
        planVectorSetTopology(source.key, selectedArgument),
        work.signal,
      )
      if (!session.accept(work.generation, reply).accepted) {
        setAdvanced({ status: 'cancelled', topology: { kind: 'unsupported' } })
        return
      }
      setAdvanced({
        status: 'ready',
        topology: parseVlinksTopology(reply, {
          supported: true,
          limit: 50,
          source: selectedArgument,
        }),
      })
    } catch (error) {
      const status = errorStatus(error)
      setAdvanced({
        status:
          status === 'acl-unavailable' ||
          status === 'cancelled' ||
          status === 'unsupported'
            ? status
            : 'recoverable-error',
        topology: { kind: 'unsupported' },
      })
    }
  }

  const content =
    workflow === 'explore' ? (
      <Explore
        sample={sample}
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
        metadataField={metadataField}
        colorByValue={metadataField || ''}
        showClusterLabels={showClusterLabels}
        clusterLabelLimit={clusterLabelLimit}
        showDensity={showDensity}
        densityGrid={densityGrid}
        densityGridSize={densityGridSize}
        dbscanResult={dbscanResult}
        showMapLabels={showMapLabels}
      />
    ) : workflow === 'query-lab' ? (
      <Col gap="m">
        <Button
          disabled={!selectedIds[0] || !sample}
          onClick={() => void runQuery()}
        >
          {t('vectorVisualizer.queryLab.runSelectedAnchorQuery')}
        </Button>
        <Text color="subdued">
          {t('vectorVisualizer.queryLab.runDescription', {
            command: sourceKind === 'search-index' ? 'KNN' : 'VSIM',
          })}
        </Text>
        {!sample ? (
          <Text role="status">
            {t('vectorVisualizer.queryLab.readyNotSampled')}
          </Text>
        ) : !selectedIds[0] ? (
          <Text role="status">
            {t('vectorVisualizer.queryLab.selectDocument')}
          </Text>
        ) : query.status === 'ready-not-sampled' ? (
          <Text role="status">
            {t('vectorVisualizer.queryLab.waitingForQuery', {
              id: selectedIds[0],
            })}
          </Text>
        ) : undefined}
        <QueryLab
          {...query}
          sourceSample={
            sample
              ? buildNativeQuerySourceSample({
                  sourceKind,
                  sampleKind:
                    sample.result.kind === 'partial' ? 'partial' : 'success',
                  neighborMetric: query.neighbors[0]?.metric,
                  health: healthEvidence,
                })
              : undefined
          }
          topKBoundary={
            query.status === 'ready' || query.status === 'empty'
              ? NATIVE_QUERY_LIMIT
              : undefined
          }
          freshness={
            sample?.result.freshness === 'changed-while-sampled'
              ? 'changed while sampled'
              : 'current'
          }
          sourceKind={sourceKind}
          selectedIds={selectedIds}
          focusedId={selectedIds[0]}
          onSelectionChange={setSelectedIds}
        />
      </Col>
    ) : workflow === 'health' ? (
      <Health
        sample={sample}
        evidence={healthEvidence}
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
        metadataField={metadataField}
        queryValues={query.neighbors.map(({ value }) => value)}
        duplicateThreshold={duplicateThreshold}
        onDuplicateThresholdChange={setDuplicateThreshold}
        outlierConfig={outlierConfig}
        onOutlierConfigChange={setOutlierConfig}
      />
    ) : workflow === 'compare-tune' ? (
      !sample ? (
        <NativeExecutionUnavailable workflow={workflowLabels['compare-tune']} />
      ) : sample.result.metric === 'unknown' ? (
        <Text role="status">
          {t('vectorVisualizer.compareTune.metricUnavailable')}
        </Text>
      ) : manifests.length < 2 ? (
        <Col gap="m">
          <Text role="status">
            {t('vectorVisualizer.compareTune.needManifests')}
          </Text>
          <Button onClick={saveManifest}>
            {t('vectorVisualizer.compareTune.saveManifest')}
          </Button>
        </Col>
      ) : (
        <CompareTune
          left={manifests[manifests.length - 2]}
          right={manifests[manifests.length - 1]}
          runs={benchmarkRuns}
          status={compareStatus}
          benchmarkEnabled={source.kind === 'vector-set'}
          benchmarkSampleCount={Math.min(50, sample.result.sourceCount)}
          onConfirmBenchmark={() => void runTruthBenchmark()}
        />
      )
    ) : (
      <Col gap="m">
        {sourceKind === 'vector-set' && (
          <Button
            disabled={!selectedIds[0]}
            onClick={() => void loadTopology()}
          >
            {t('vectorVisualizer.advanced.loadSelectedTopology')}
          </Button>
        )}
        <Advanced
          sourceKind={sourceKind}
          status={advanced.status}
          topology={
            sourceKind === 'search-index'
              ? { kind: 'unsupported' }
              : advanced.topology
          }
        />
      </Col>
    )

  const sourceLabel =
    source.kind === 'search-index'
      ? t('vectorVisualizer.source.searchIndex', { index: source.index })
      : t('vectorVisualizer.source.vectorSet')
  const availableMetadataFields = Array.from(
    new Set([
      ...(sample?.result.availableMetadataFields ?? []),
      ...(sample?.result.records.flatMap(({ metadata }) =>
        metadata ? Object.keys(metadata) : [],
      ) ?? []),
    ]),
  )
  const metadataGroupCount = new Set(
    sample?.result.records.flatMap(({ metadata }) => {
      const value = metadata?.[metadataField]
      return value === undefined || value === '' ? [] : [String(value)]
    }) ?? [],
  ).size
  const canShowClusterLabels = metadataGroupCount >= MIN_CLUSTER_LABEL_COUNT
  const normalizedFilterExpression = filterExpression.trim()
  const isFilterDirty = Boolean(
    sample &&
      sourceKind === 'search-index' &&
      normalizedFilterExpression !== sampledFilterExpression,
  )
  const sampleFreshnessLabel =
    sample?.result.freshness === 'changed-while-sampled'
      ? t('vectorVisualizer.sampleFreshness.changed')
      : sample
        ? t('vectorVisualizer.sampleFreshness.fresh')
        : t('vectorVisualizer.sampleFreshness.notSampled')
  const sampledResultRows: SelectionRow[] =
    sample?.result.ids.map((id, index) => ({
      id,
      metadata: sample.result.records.find((record) => record.id === id)
        ?.metadata,
      metric: 'score',
      plotted: true,
      rank: index + 1,
      selected: selectedIds.includes(id),
      value: Number.NaN,
    })) ?? []
  const pageResultStatus: VisualizerStatus =
    status === 'ready-not-sampled'
      ? 'ready-not-sampled'
      : status === 'fetching'
        ? 'fetching'
        : status === 'layouting'
          ? 'layouting'
          : status
  const usesQueryResults = workspaceMode === 'neighbors'
  const resultRows: SelectionRow[] = usesQueryResults
    ? query.neighbors.map((neighbor) => ({
        ...neighbor,
        metadata: sample?.result.records.find(
          (record) => record.id === neighbor.id,
        )?.metadata,
        selected: selectedIds.includes(neighbor.id),
      }))
    : workspaceMode === 'selection'
      ? sampledResultRows.filter(({ selected }) => selected)
      : sampledResultRows
  const resultStatus: VisualizerStatus =
    usesQueryResults &&
    (status === 'ready' || status === 'partial' || status === 'stale')
      ? query.status
      : pageResultStatus
  const canvasState =
    status === 'fetching' || status === 'layouting'
      ? 'loading'
      : status === 'empty'
        ? 'empty'
        : status === 'unsupported'
          ? 'unsupported'
          : status === 'acl-unavailable'
            ? 'acl-unavailable'
            : status === 'cancelled'
              ? 'cancelled'
              : status === 'recoverable-error'
                ? 'error'
                : 'ready'
  const inspectorContext =
    workspaceMode === 'neighbors'
      ? 'nearest'
      : workspaceMode === 'selection'
        ? 'selected'
        : 'sampled'
  const inspectorProvenance = usesQueryResults
    ? query.neighbors[0]
      ? t('vectorVisualizer.results.provenance.query', {
          provenance: query.neighbors[0].provenance,
        })
      : t('vectorVisualizer.results.provenance.noNeighborEvidence')
    : sampledFilterExpression
      ? t('vectorVisualizer.results.provenance.filtered', {
          filter: sampledFilterExpression,
        })
      : t('vectorVisualizer.results.provenance.sampled')
  const visualizationActions = [
    {
      id: 'run-neighbors',
      label: t('vectorVisualizer.actions.runNeighborsForSelected'),
      disabled: selectedIds.length !== 1 || !sample,
      onClick: () => runNeighborsForSelected(selectedIds[0]),
    },
    {
      id: 'clear-selection',
      label: t('vectorVisualizer.actions.clearSelection'),
      disabled: !selectedIds.length,
      onClick: () => setSelectedIds([]),
    },
  ]
  const atlasView = (
    <Explore
      sample={sample}
      selectedIds={selectedIds}
      onSelectedIdsChange={setSelectedIds}
      metadataField={metadataField}
      colorByValue={metadataField || ''}
      showClusterLabels={showClusterLabels}
      clusterLabelLimit={clusterLabelLimit}
      showDensity={showDensity}
      densityGrid={densityGrid}
      densityGridSize={densityGridSize}
      dbscanResult={dbscanResult}
      showMapLabels={showMapLabels}
    />
  )
  const neighborsView = (
    <VectorVisualizerNeighbors
      anchorId={queryAnchorId ?? selectedIds[0]}
      canRun={Boolean(selectedIds[0] && sample)}
      exactness={query.exactness}
      freshness={
        sample?.result.freshness === 'changed-while-sampled'
          ? 'changed while sampled'
          : 'current'
      }
      metadataField={metadataField}
      neighbors={query.neighbors}
      records={sample?.result.records ?? []}
      selectedIds={selectedIds}
      status={query.status}
      topKBoundary={
        query.status === 'ready' || query.status === 'empty'
          ? NATIVE_QUERY_LIMIT
          : undefined
      }
      onRun={() => void runQuery()}
      onSelect={(id) => setSelectedIds([id])}
    />
  )
  const selectionView = (
    <Explore
      sample={sample}
      selectedIds={selectedIds}
      onSelectedIdsChange={setSelectedIds}
      metadataField={metadataField}
      colorByValue={metadataField || ''}
      showClusterLabels={showClusterLabels}
      clusterLabelLimit={clusterLabelLimit}
      showDensity={showDensity}
      densityGrid={densityGrid}
      densityGridSize={densityGridSize}
      dbscanResult={dbscanResult}
      showMapLabels={showMapLabels}
      mode="selection"
    />
  )

  return (
    <NativeHost data-testid="vector-visualizer-native-host">
      <NativeHeader align="center" gap="m" justify="between" wrap>
        <Col gap="xs">
          <Title component="h1" size="M">
            {t('vectorVisualizer.page.title')}
          </Title>
          <Row
            align="center"
            data-testid="vector-visualizer-page-context"
            gap="s"
            wrap
          >
            <Text component="span" size="S">
              {source.kind === 'search-index'
                ? t('vectorVisualizer.page.searchSourceReady', {
                    index: source.index,
                    vectorField: source.vectorField,
                  })
                : t('vectorVisualizer.page.vectorSetSourceReady')}
            </Text>
            <Text color="subdued" component="span" size="S">
              {sampleFreshnessLabel}
            </Text>
            <Text aria-live="polite" component="span" role="status" size="S">
              {statusCopy[status]}
            </Text>
            <Text component="span" size="S">
              {t('vectorVisualizer.page.selectedCount', {
                count: selectedIds.length,
              })}
            </Text>
          </Row>
        </Col>
        <Row align="center" gap="s" wrap>
          <Button
            disabled={
              !cliSettings.cliClientUuid ||
              cliSettings.loading ||
              status === 'fetching' ||
              status === 'layouting'
            }
            onClick={() => void sampleVectors()}
          >
            {t('vectorVisualizer.actions.sampleVectors')}
          </Button>
          <Button
            disabled={status !== 'fetching' && status !== 'layouting'}
            onClick={cancel}
          >
            {t('vectorVisualizer.actions.cancel')}
          </Button>
          <Text color="subdued" size="S">
            {t('vectorVisualizer.page.noCommandOnOpen')}
          </Text>
        </Row>
      </NativeHeader>
      <ModeHeader
        align="center"
        data-testid="vector-visualizer-mode-header"
        justify="between"
      >
        <VectorVisualizerModeTabs
          idPrefix="vector-visualizer"
          mode={workspaceMode}
          utilityActions={visualizationActions}
          onModeChange={setWorkspaceMode}
        />
      </ModeHeader>
      <TruthBanner role="status" size="S">
        {t('vectorVisualizer.page.truthBanner')}
      </TruthBanner>
      <VectorVisualizerWorkspace
        controls={
          <VectorVisualizerControls
            source={{
              label: t('vectorVisualizer.controls.source.label'),
              value: sourceLabel,
              options: [{ label: sourceLabel, value: sourceLabel }],
              disabled: true,
              disabledReason: t(
                'vectorVisualizer.controls.source.disabledReason',
              ),
            }}
            filter={{
              ...(sourceKind === 'search-index'
                ? {
                    value: filterExpression,
                    activeFilters: normalizedFilterExpression
                      ? [
                          {
                            id: 'search-filter',
                            label: isFilterDirty
                              ? t(
                                  'vectorVisualizer.controls.filter.dirtyChip',
                                  { filter: normalizedFilterExpression },
                                )
                              : normalizedFilterExpression,
                          },
                        ]
                      : [],
                    syntaxHelp: {
                      content: isFilterDirty
                        ? t('vectorVisualizer.controls.filter.dirtyHelp')
                        : t('vectorVisualizer.controls.filter.syntaxHelp'),
                    },
                    onChange: setFilterExpression,
                    onRemove: () => setFilterExpression(''),
                  }
                : {
                    value: '',
                    disabled: true,
                    disabledReason: t(
                      'vectorVisualizer.controls.filter.vectorSetDisabled',
                    ),
                  }),
            }}
            colorBy={
              availableMetadataFields.length || dbscanResult
                ? {
                    label: t('vectorVisualizer.controls.colorBy.label'),
                    value: metadataField,
                    options: [
                      ...availableMetadataFields.map((field) => ({
                        label: field,
                        value: field,
                      })),
                      ...(dbscanResult
                        ? [
                            {
                              label: `Clusters (DBSCAN) · ${dbscanResult.clusterCount}`,
                              value: DBSCAN_COLOR_BY_VALUE,
                            },
                          ]
                        : []),
                    ],
                    onChange: setMetadataField,
                  }
                : {
                    label: t('vectorVisualizer.controls.colorBy.label'),
                    value: '',
                    options: [],
                    disabled: true,
                    disabledReason: t(
                      'vectorVisualizer.controls.colorBy.disabledReason',
                    ),
                  }
            }
            sampleBudget={{
              value: sampleBudget,
              min: MIN_SAMPLE_BUDGET,
              max: MAX_SAMPLE_BUDGET,
              onChange: (value) => {
                if (typeof value === 'number') setSampleBudget(value)
              },
            }}
            summary={
              sample
                ? {
                    sampleCount: sample.result.sampleCount,
                    sourceCount: sample.result.sourceCount,
                    samplingMethod: sample.result.method,
                    projectionAlgorithm: 'UMAP',
                    seed: UMAP_SEED,
                    freshness: sample.result.freshness,
                    quality:
                      sample.quality.kind === 'measured'
                        ? String(sample.quality.value)
                        : t('vectorVisualizer.common.unknown'),
                  }
                : undefined
            }
            clusterLabels={
              sample
                ? canShowClusterLabels
                  ? {
                      checked: showClusterLabels,
                      onChange: setShowClusterLabels,
                    }
                  : {
                      checked: false,
                      disabled: true,
                      disabledReason: t(
                        'vectorVisualizer.controls.clusterLabels.disabledReason',
                      ),
                    }
                : undefined
            }
            clusterLabelLimit={
              sample && canShowClusterLabels
                ? {
                    label: t(
                      'vectorVisualizer.controls.clusterLabelLimit.label',
                    ),
                    value: clusterLabelLimit,
                    options: CLUSTER_LABEL_LIMIT_OPTIONS.map((option) => ({
                      label: t(option.labelKey),
                      value: option.value,
                    })),
                    onChange: (value) => {
                      if (isClusterLabelLimit(value))
                        setClusterLabelLimit(value)
                    },
                  }
                : undefined
            }
            densityHeatmap={
              sample
                ? {
                    checked: showDensity,
                    onChange: setShowDensity,
                  }
                : undefined
            }
            mapLabels={
              sample
                ? {
                    checked: showMapLabels,
                    onChange: setShowMapLabels,
                  }
                : undefined
            }
            loading={status === 'fetching' || status === 'layouting'}
          />
        }
        visualization={
          <VectorVisualizerCanvas
            mode={workspaceMode}
            onModeChange={setWorkspaceMode}
            status={statusCopy[status]}
            selectionCount={selectedIds.length}
            selectedId={selectedIds[0]}
            idPrefix="vector-visualizer"
            state={canvasState}
            stateSlot={<Text>{statusCopy[status]}</Text>}
            showModeChrome={false}
            utilityActions={visualizationActions}
            views={{
              atlas: atlasView,
              neighbors: neighborsView,
              selection: selectionView,
            }}
          />
        }
        results={
          <VectorVisualizerResults
            context={inspectorContext}
            exactness={
              workspaceMode === 'neighbors' ? query.exactness : 'sample-exact'
            }
            focusedId={selectedIds[0]}
            provenance={inspectorProvenance}
            rows={resultRows}
            sourceKind={sourceKind}
            status={resultStatus}
            onCopyVisibleIds={copyIds}
            onCopyFocusedId={(id) => copyIds([id])}
            onExportFocusedResult={(row) => exportRows([row])}
            onExportVisibleResults={exportRows}
            onResultFocus={(id) => setSelectedIds([id])}
            onRunNeighborsForFocused={runNeighborsForSelected}
          />
        }
      />
      <details open={additionalWorkflowsOpen}>
        <summary
          onClick={(event) => {
            event.preventDefault()
            setAdditionalWorkflowsOpen((open) => !open)
          }}
        >
          {t('vectorVisualizer.workflows.additional')}
        </summary>
        <Row
          aria-label={t('vectorVisualizer.workflows.additional')}
          gap="s"
          wrap
        >
          {workflows.slice(1).map((id) => (
            <Button
              aria-pressed={workflow === id}
              key={id}
              size="s"
              onClick={() => selectWorkflow(id)}
            >
              {workflowLabels[id]}
            </Button>
          ))}
        </Row>
        {workflow !== 'explore' && content}
      </details>
    </NativeHost>
  )
}
