import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useHistory, useLocation, useParams } from 'react-router-dom'
import styled from 'styled-components'

import { Button } from 'uiSrc/components/base/forms/buttons'
import { RiIcon } from 'uiSrc/components/base/icons'
import { Col, Row } from 'uiSrc/components/base/layout/flex'
import { Breadcrumbs } from 'uiSrc/components/base/navigation/breadcrumbs'
import { Text, Title } from 'uiSrc/components/base/text'
import { PluginsThemeContext } from 'uiSrc/components/base/utils/pluginsThemeContext'
import { Pages } from 'uiSrc/constants'
import { useTranslation } from 'uiSrc/i18n'
import { IndexInfoSidePanel } from 'uiSrc/pages/vector-search/components/index-info-side-panel'
import { ViewIndexButton } from 'uiSrc/pages/vector-search/pages/VectorSearchQueryPage/components/view-index-button'
import apiService from 'uiSrc/services/apiService'
import {
  cliSettingsSelector,
  createCliClientAction,
} from 'uiSrc/slices/cli/cli-settings'
import { useAppDispatch, useAppSelector } from 'uiSrc/slices/hooks'
import { connectedInstanceSelector } from 'uiSrc/slices/instances/instances'
import {
  parseSearchExecutionEvidence,
  parseVlinksTopology,
} from 'uiSrc/packages/vector-visualizer/src/advanced/advanced'
import {
  Advanced,
  Atlas,
  CompareAtlas,
  CompareTune,
  DuplicateExplorer,
  OutlierExplorer,
  QueryLab,
  SelectionTable,
  Tune,
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
import type {
  LayoutJobV1,
  VectorMetric,
  VisualizerStatus,
} from 'uiSrc/packages/vector-visualizer/src/contracts'
import { redisSimilarityFromDistance } from 'uiSrc/packages/vector-visualizer/src/metrics'
import type { SelectionRow } from 'uiSrc/packages/vector-visualizer/src/selection/selection'
import type { SensitivityResult } from 'uiSrc/packages/vector-visualizer/src/tune/Tune'
import {
  recommendSearchIndexTuning,
  recommendVectorSetTuning,
  resolveSearchIndexTuningProfile,
  type TuneRecommendation,
} from 'uiSrc/packages/vector-visualizer/src/tune/recommendations'
import { planSensitivityRuns } from 'uiSrc/packages/vector-visualizer/src/tune/sensitivity'
import {
  LayoutWorkerClient,
  type BoundedMetricEvidenceResult,
  type LayoutQuality,
} from 'uiSrc/packages/vector-visualizer/src/worker/layout'
import { planVectorSetTopology } from 'uiSrc/packages/vector-visualizer/src/vectorSetAdapter'
import { normalizeCoordinates } from 'uiSrc/packages/vector-visualizer/src/renderer/AtlasRenderer'
import type { AtlasClusterLabel } from 'uiSrc/packages/vector-visualizer/src/atlas/Atlas/Atlas.types'

import {
  buildVectorVisualizerSourceSearch,
  consumeVectorVisualizerSource,
  createNativeVisualizerSession,
  parseVectorVisualizerSourceSearch,
  type NativeVisualizerWorkflow,
  type VectorDataSourceRef,
  vectorVisualizerSourceKey,
} from './nativeHandoff'
import {
  createNativeReadOnlyExecutor,
  serializeNativeArgument,
} from './nativeExecution'
import { runNativeVectorSetBenchmark } from './nativeBenchmark'
import { buildNativeManifestProvenance } from './nativeManifest'
import { buildNativeQuerySourceSample } from './nativeQueryEvidence'
import {
  orchestrateNativeSample,
  orchestrateNativeQuery,
  type NativeSampleResult,
} from './nativeOrchestration'
import {
  parseNativeDocumentExport,
  planSearchDocumentExport,
  planVectorSetDocumentExport,
  type NativeDocumentExport,
} from './nativeDocumentExport'
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
import { HybridScoreChart } from './components/HybridScoreChart'

const DBSCAN_COLOR_BY_VALUE = '__dbscan_clusters__'
const DBSCAN_MIN_POINTS = 5
const DBSCAN_K = 5
const AGGREGATE_COUNT_ALIAS = 'count'
const AGGREGATE_BEST_DISTANCE_ALIAS = 'best_distance'
const AGGREGATE_AVERAGE_DISTANCE_ALIAS = 'avg_distance'
const AGGREGATE_WORST_DISTANCE_ALIAS = 'worst_distance'

const quoteCliToken = (value: string): string => JSON.stringify(value)

const formatAggregateMetricValue = (
  value: string | number | undefined,
  metric: VectorMetric | 'unknown',
): string | undefined => {
  const numericValue =
    typeof value === 'number' ? value : Number.parseFloat(value ?? '')
  if (!Number.isFinite(numericValue)) return undefined

  const displayValue =
    metric === 'cosine'
      ? redisSimilarityFromDistance(numericValue)
      : numericValue

  return displayValue.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')
}

const aggregateMetricLabels = (metric: VectorMetric | 'unknown') => {
  if (metric === 'cosine') {
    return {
      best: 'Best similarity',
      average: 'Average similarity',
      worst: 'Worst similarity',
    }
  }

  if (metric === 'l2') {
    return {
      best: 'Lowest distance',
      average: 'Average distance',
      worst: 'Highest distance',
    }
  }

  return {
    best: 'Minimum metric',
    average: 'Average metric',
    worst: 'Maximum metric',
  }
}

const buildCopyableQuery = (
  source: VectorDataSourceRef,
  anchorVector: Float32Array,
  limit: number,
  filter?: string,
): string => {
  if (source.kind === 'search-index') {
    const query = `${filter ? `(${filter})` : '*'}=>[KNN ${limit} @${source.vectorField} $vv_anchor AS __vv_metric]`
    const anchorBlob = new Uint8Array(
      anchorVector.buffer,
      anchorVector.byteOffset,
      anchorVector.byteLength,
    )
    return [
      'FT.PROFILE',
      quoteCliToken(source.index),
      'SEARCH',
      'LIMITED',
      'QUERY',
      quoteCliToken(query),
      'PARAMS',
      '2',
      'vv_anchor',
      serializeNativeArgument(anchorBlob),
      'SORTBY',
      '__vv_metric',
      'ASC',
      'RETURN',
      '1',
      '__vv_metric',
      'DIALECT',
      '2',
    ].join(' ')
  }

  return [
    'VSIM',
    quoteCliToken(new TextDecoder().decode(source.key)),
    'VALUES',
    String(anchorVector.length),
    ...Array.from(anchorVector, String),
    'COUNT',
    String(limit),
    'WITHSCORES',
  ].join(' ')
}

const DEFAULT_SAMPLE_BUDGET = 2_000
const MIN_SAMPLE_BUDGET = 500
const MAX_SAMPLE_BUDGET = 20_000
const MAX_HEALTH_SAMPLE_SIZE = 200
const MAX_SENSITIVITY_SAMPLE_SIZE = 500
const UMAP_SEED = 42
const DEFAULT_NEIGHBOR_LIMIT = 10
const MIN_NEIGHBOR_LIMIT = 5
const MAX_NEIGHBOR_LIMIT = 30
const NEIGHBOR_LIMIT_STEP = 5
const NEIGHBOR_LIMIT_RERUN_DEBOUNCE_MS = 300
const SELF_MATCH_BUFFER = 1
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

const redisQueryLimitForVisibleNeighbors = (visibleNeighborLimit: number) =>
  visibleNeighborLimit + SELF_MATCH_BUFFER

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

const NativeHeader = styled(Row)`
  flex: 0 0 auto;
  min-inline-size: 0;
`

const HeaderRightAction = styled(Row)`
  flex: 0 0 auto;
  margin-left: auto;
`

const BreadcrumbLink = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.core.space.space050};
  background: none;
  border: 0;
  padding: 0;
  cursor: pointer;
  color: ${({ theme }) => theme.semantic.color.text.primary500};

  &:hover {
    text-decoration: underline;
  }
`

const SlashSeparator = styled.span`
  color: ${({ theme }) => theme.semantic.color.text.neutral500};
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

const AdditionalWorkflowPanelBase = styled.details`
  display: flex;
  flex-direction: column;
  min-block-size: 0;
  min-inline-size: 0;
  inline-size: 100%;
  max-block-size: 100%;
  overflow: hidden;
  border: ${({ theme }) => theme.core.space.space010} solid
    ${({ theme }) => theme.semantic.color.border.neutral500};
  background-color: ${({ theme }) =>
    theme.semantic.color.background.neutral100};

  &:not([open]) {
    max-block-size: none;
    overflow: hidden;
  }

  &[open] {
    block-size: 100%;
    max-block-size: min(
      42vh,
      ${({ theme }) => `calc(${theme.core.space.space800} * 7)`}
    );
  }

  > summary {
    flex: 0 0 auto;
    padding: ${({ theme }) => theme.core.space.space050}
      ${({ theme }) => theme.core.space.space100};
    cursor: pointer;
  }
`

const AdditionalWorkflowPanel =
  AdditionalWorkflowPanelBase as React.ComponentType<
    React.PropsWithChildren<React.DetailsHTMLAttributes<HTMLDetailsElement>>
  >

const AdditionalWorkflowBody = styled(Col).attrs({ gap: 's' })`
  flex: 1 1 0;
  min-block-size: 0;
  min-inline-size: 0;
  max-block-size: min(
    36vh,
    ${({ theme }) => `calc(${theme.core.space.space800} * 6)`}
  );
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0 ${({ theme }) => theme.core.space.space100}
    ${({ theme }) => theme.core.space.space100};
  scrollbar-gutter: stable;
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

type SensitivityStatus = 'idle' | 'running' | 'unavailable' | 'error'

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
  const rows: SelectionRow[] = sampleIds.map((id, index) => ({
    id,
    metric: 'score',
    plotted: true,
    rank: index + 1,
    selected: selectedIds.includes(id),
    value: Number.NaN,
  }))

  return (
    <Col gap="m">
      <Text
        aria-live="polite"
        aria-label={t('vectorVisualizer.selection.selectedIds')}
        role="status"
      >
        {t('vectorVisualizer.page.selectedCount', {
          count: selectedIds.length,
        })}
      </Text>
      <Text color="subdued">
        {description ?? t('vectorVisualizer.selection.idsOnly')}
      </Text>
      <SelectionTable
        focusedId={selectedIds[0]}
        rows={rows}
        variant="compact-id"
        onFocus={(id) => onSelectedIdsChange([id])}
      />
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
  projectionAlgorithm,
  comparePanel,
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
  projectionAlgorithm: 'umap' | 'pca'
  comparePanel?: { coordinates: Float32Array; quality: LayoutQuality }
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
  const clusterDominantMetadataField = isDbscanColorBy
    ? Array.from(
        new Set([
          ...(result.availableMetadataFields ?? []),
          ...result.records.flatMap(({ metadata }) =>
            metadata ? Object.keys(metadata) : [],
          ),
        ]),
      ).find((field) =>
        result.records.some(({ metadata }) => {
          const value = metadata?.[field]
          return value !== undefined && value !== ''
        }),
      )
    : metadataField

  const clusterDominant = new Map<number, string>()
  if (isDbscanColorBy && dbscan && clusterDominantMetadataField) {
    const clusterValueCounts = new Map<number, Map<string, number>>()
    for (let i = 0; i < result.ids.length; i += 1) {
      const cid = dbscan.assignments[i]
      if (cid < 0) continue
      const val = recordsById.get(result.ids[i])?.metadata?.[
        clusterDominantMetadataField
      ]
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
        if (c > topCount) {
          topCount = c
          topVal = v
        }
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
    legendEntries = [...clusterColorMap.entries()].map(([clusterId, color]) => {
      const dominant = clusterDominant.get(clusterId)
      return {
        label: dominant
          ? `Cluster ${clusterId} · ${dominant}`
          : `Cluster ${clusterId}`,
        color,
        count: clusterCounts.get(clusterId) ?? 0,
      }
    })
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

  const provenance = {
    sourceCount: result.sourceCount,
    sampleCount: result.sampleCount,
    method: projectionAlgorithm === 'umap' ? 'UMAP' : 'PCA',
    seed: UMAP_SEED,
    freshness:
      result.freshness === 'changed-while-sampled'
        ? ('changed-while-sampled' as const)
        : ('fresh' as const),
    exactness: 'unknown' as const,
    quality: sample.quality,
  }

  if (comparePanel && mode !== 'selection') {
    const currentMethod = projectionAlgorithm === 'umap' ? 'UMAP' : 'PCA'
    const alternateMethod = projectionAlgorithm === 'umap' ? 'PCA' : 'UMAP'
    return (
      <Col gap="l">
        <CompareAtlas
          left={{
            coordinates: sample.coordinates,
            provenance: { ...provenance, method: currentMethod },
            title: t('vectorVisualizer.atlas.compareLeft', {
              method: currentMethod,
              quality:
                qualitySummary(sample.quality) ??
                t('vectorVisualizer.common.unknown'),
            }),
          }}
          right={{
            coordinates: comparePanel.coordinates,
            provenance: {
              ...provenance,
              method: alternateMethod,
              quality: comparePanel.quality,
            },
            title: t('vectorVisualizer.atlas.compareRight', {
              method: alternateMethod,
              quality:
                qualitySummary(comparePanel.quality) ??
                t('vectorVisualizer.common.unknown'),
            }),
          }}
          sampleIds={result.ids}
          pointColors={pointColors}
          clusterLabels={clusterLabels}
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
          ...provenance,
          method: projectionAlgorithm === 'umap' ? 'UMAP' : 'PCA',
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

/** Short display value for compare-projections panel titles; never fabricates unmeasured quality. */
const qualitySummary = (quality: LayoutQuality) =>
  quality.kind === 'measured' ? quality.value.toFixed(2) : undefined

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
      <Row align="start" gap="l" wrap>
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
      </Row>
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
  const history = useHistory()
  const location = useLocation()
  const { instanceId } = useParams<{ instanceId: string }>()
  const routeSearch = location.search || history.location?.search || ''
  const routeSource = useMemo(
    () => parseVectorVisualizerSourceSearch(routeSearch),
    [routeSearch],
  )
  const [source, setSource] = useState<VectorDataSourceRef | undefined>(
    routeSource,
  )
  const dispatch = useAppDispatch()
  const connectedInstance = useAppSelector(connectedInstanceSelector)
  const cliSettings = useAppSelector(cliSettingsSelector)
  const [session] = useState(() => {
    const nextSession = createNativeVisualizerSession({ workflow: 'explore' })
    if (routeSource) nextSession.setSource(routeSource)
    return nextSession
  })
  const layoutWorker = useRef<LayoutWorkerClient>()
  const layoutWorkerPromise = useRef<Promise<LayoutWorkerClient>>()
  const disposed = useRef(false)
  const cliInitializationAttempted = useRef(false)
  const sampleRef = useRef<NativePageSample>()
  const projectionAlgorithmRef = useRef<'umap' | 'pca'>('umap')
  const queryAnchorIdRef = useRef<string>()
  const runQueryRef = useRef<(anchorId?: string) => Promise<void>>()
  const hydratedSourceKeyRef = useRef<string>()
  const [workflow, setWorkflow] = useState(
    () => session.getPreferences().workflow,
  )
  const [workspaceMode, setWorkspaceMode] = useState<
    'atlas' | 'neighbors' | 'selection'
  >('atlas')
  const [additionalWorkflowsOpen, setAdditionalWorkflowsOpen] = useState(false)
  const [isIndexPanelOpen, setIsIndexPanelOpen] = useState(false)
  const [sampleBudget, setSampleBudget] = useState(DEFAULT_SAMPLE_BUDGET)
  const [projectionAlgorithm, setProjectionAlgorithm] = useState<
    'umap' | 'pca'
  >('umap')
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
  const [neighborLimit, setNeighborLimit] = useState(DEFAULT_NEIGHBOR_LIMIT)
  const neighborLimitRef = useRef(neighborLimit)
  const [queryMode, setQueryMode] = useState<
    'knn' | 'range' | 'hybrid' | 'aggregate'
  >('knn')
  const [hybridVsimMode, setHybridVsimMode] = useState<'knn' | 'range'>('knn')
  const [rangeRadius, setRangeRadius] = useState(0.5)
  const [efRuntime, setEfRuntime] = useState<number | undefined>()
  const [queryEpsilon, setQueryEpsilon] = useState<number | undefined>()
  const [textQuery, setTextQuery] = useState('')
  const [fusionMethod, setFusionMethod] = useState<'rrf' | 'linear'>('rrf')
  const [rrfConstant, setRrfConstant] = useState<number | undefined>()
  const [rrfWindow, setRrfWindow] = useState<number | undefined>()
  const [linearAlpha, setLinearAlpha] = useState<number | undefined>()
  const [linearBeta, setLinearBeta] = useState<number | undefined>()
  const [hybridResult, setHybridResult] = useState<{
    documents: Array<{
      id: string
      textScore?: number
      vectorScore?: number
      hybridScore?: number
      fields?: Record<string, string>
    }>
    totalResults: number
  }>()
  const [aggregateResult, setAggregateResult] = useState<{
    groups: Array<Record<string, unknown>>
    totalGroups: number
  }>()
  const [hybridPolicy, setHybridPolicy] = useState<
    'AUTO' | 'BATCHES' | 'ADHOC_BF' | undefined
  >()
  const [batchSize, setBatchSize] = useState<number | undefined>()
  const [searchWindowSize, setSearchWindowSize] = useState<number | undefined>()
  const [shardKRatio, setShardKRatio] = useState<number | undefined>()
  const [useSearchHistory, setUseSearchHistory] = useState<
    'OFF' | 'ON' | 'AUTO' | undefined
  >()
  const [searchBufferCapacity, setSearchBufferCapacity] = useState<
    number | undefined
  >()
  const [manifests, setManifests] = useState<LocalManifestV1[]>([])
  const [benchmarkRuns, setBenchmarkRuns] = useState<BenchmarkRunV1[]>([])
  const [compareStatus, setCompareStatus] = useState<
    CompareTuneStatus | undefined
  >('empty')
  const [sensitivityRuns, setSensitivityRuns] = useState<SensitivityResult[]>(
    [],
  )
  const [sensitivityStatus, setSensitivityStatus] =
    useState<SensitivityStatus>('idle')
  const [selectedK, setSelectedK] = useState<number>()
  const sensitivityLayoutsRef = useRef(
    new Map<
      number,
      {
        coordinates: Float32Array
        quality: LayoutQuality
      }
    >(),
  )
  const [showDensity, setShowDensity] = useState(false)
  const [densityGrid, setDensityGrid] = useState<Float32Array | null>(null)
  const [densityGridSize, setDensityGridSize] = useState(64)
  const [dbscanResult, setDbscanResult] = useState<DBSCANResult | null>(null)
  const [showMapLabels, setShowMapLabels] = useState(false)
  const [compareProjections, setCompareProjections] = useState(false)
  const [altCoordinates, setAltCoordinates] = useState<Float32Array | null>(
    null,
  )
  const [altQuality, setAltQuality] = useState<LayoutQuality>()
  const [aggregateGroupByField, setAggregateGroupByField] = useState('')

  const [advanced, setAdvanced] = useState<{
    status:
      | 'ready'
      | 'acl-unavailable'
      | 'cancelled'
      | 'recoverable-error'
      | 'unsupported'
    topology: ReturnType<typeof parseVlinksTopology>
  }>({ status: 'ready', topology: { kind: 'unsupported' } })

  sampleRef.current = sample

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

  const getLayoutWorker = useCallback(async () => {
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
    return layoutWorkerPromise.current
  }, [])

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
    setDbscanResult(
      computeDBSCAN(normalized, count, epsilon, DBSCAN_MIN_POINTS),
    )
  }, [sample])

  useEffect(() => {
    const handoffSource = consumeVectorVisualizerSource()
    const nextSource = handoffSource ?? routeSource
    if (!nextSource) return
    const nextSourceKey = vectorVisualizerSourceKey(nextSource)
    if (hydratedSourceKeyRef.current === nextSourceKey) return

    hydratedSourceKeyRef.current = nextSourceKey
    session.setSource(nextSource)
    setSource(nextSource)

    if (handoffSource?.kind === 'search-index' && !routeSource) {
      const restorableLocation = {
        pathname: location.pathname,
        search: buildVectorVisualizerSourceSearch(handoffSource),
      }
      if (typeof history.replace === 'function') {
        history.replace(restorableLocation)
      } else {
        history.push(restorableLocation)
      }
    }
  }, [history, location.pathname, routeSource, session])

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
    if (source?.kind !== 'search-index') setIsIndexPanelOpen(false)
  }, [source?.kind])

  useEffect(() => {
    disposed.current = false
    return () => {
      disposed.current = true
      layoutWorker.current?.dispose()
      session.dispose()
    }
  }, [session])

  useEffect(() => {
    if (projectionAlgorithmRef.current === projectionAlgorithm) return undefined
    projectionAlgorithmRef.current = projectionAlgorithm
    const currentSample = sampleRef.current
    if (!currentSample) return undefined

    let cancelled = false
    setAltCoordinates(null)
    setAltQuality(undefined)
    setStatus('layouting')

    void (async () => {
      const { ids, dimensions, sampleCount, kind } = currentSample.result
      const vectors = new Float32Array(sampleCount * dimensions)
      ids.forEach((id, index) => {
        const vector = session.getRawVector(id)
        if (vector) vectors.set(vector, index * dimensions)
      })
      const hasVectors = ids.every((id) => session.getRawVector(id))
      if (!hasVectors) throw new Error('Sample vectors are unavailable')

      const worker = await getLayoutWorker()
      const layout = await worker.start({
        version: 1,
        jobId: `native-reproject-${Date.now()}`,
        algorithm: projectionAlgorithm,
        metric: currentSample.layoutMetric,
        count: sampleCount,
        dimensions,
        vectors,
        seed: UMAP_SEED,
        parameters: { nNeighbors: 15 },
      })
      if (cancelled) return
      if (layout.type !== 'complete') {
        setStatus('unsupported')
        return
      }
      setSample((latest) =>
        latest
          ? {
              ...latest,
              coordinates: layout.coordinates,
              quality: layout.quality,
            }
          : latest,
      )
      setStatus(kind === 'partial' ? 'partial' : 'ready')
    })().catch(() => {
      if (!cancelled) setStatus('recoverable-error')
    })

    return () => {
      cancelled = true
    }
  }, [getLayoutWorker, projectionAlgorithm, session])

  useEffect(() => {
    if (!compareProjections || !sample) {
      setAltCoordinates(null)
      setAltQuality(undefined)
      return undefined
    }

    let cancelled = false
    const altAlgorithm = projectionAlgorithm === 'umap' ? 'pca' : 'umap'
    const { ids, dimensions, sampleCount } = sample.result

    void (async () => {
      const vectors = new Float32Array(sampleCount * dimensions)
      ids.forEach((id, index) => {
        const vector = session.getRawVector(id)
        if (vector) vectors.set(vector, index * dimensions)
      })
      const hasVectors = ids.every((id) => session.getRawVector(id))
      if (!hasVectors) throw new Error('Sample vectors are unavailable')

      const worker = await getLayoutWorker()
      const layout = await worker.start({
        version: 1,
        jobId: `native-compare-${Date.now()}`,
        algorithm: altAlgorithm,
        metric: sample.layoutMetric,
        count: sampleCount,
        dimensions,
        vectors,
        seed: UMAP_SEED,
        parameters: { nNeighbors: 15 },
      })
      if (cancelled) return
      if (layout.type !== 'complete') {
        setAltCoordinates(null)
        setAltQuality(undefined)
        return
      }
      setAltCoordinates(layout.coordinates)
      setAltQuality(layout.quality)
    })().catch(() => {
      if (!cancelled) {
        setAltCoordinates(null)
        setAltQuality(undefined)
      }
    })

    return () => {
      cancelled = true
    }
  }, [
    compareProjections,
    getLayoutWorker,
    projectionAlgorithm,
    sample,
    session,
  ])

  queryAnchorIdRef.current = queryAnchorId
  useEffect(() => {
    if (neighborLimitRef.current === neighborLimit) return undefined
    neighborLimitRef.current = neighborLimit
    const anchorId = queryAnchorIdRef.current
    if (!anchorId || !runQueryRef.current) return undefined
    const timer = window.setTimeout(() => {
      const currentAnchorId = queryAnchorIdRef.current
      if (currentAnchorId) void runQueryRef.current?.(currentAnchorId)
    }, NEIGHBOR_LIMIT_RERUN_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [neighborLimit])

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

  const navigateToIndexes = () => {
    history.push(Pages.vectorSearch(instanceId ?? connectedInstance.id))
  }

  const sourceKind = source.kind
  const tuneConfig = sample
    ? source.kind === 'search-index'
      ? resolveSearchIndexTuningProfile({
          count: sample.result.sourceCount,
          dimensions: sample.result.dimensions,
          ...(sample.result.metric === 'unknown'
            ? {}
            : { metric: sample.result.metric as VectorMetric }),
          algorithm: sample.result.algorithm,
          m: sample.result.m,
          efConstruction: sample.result.efConstruction,
          efRuntime: efRuntime ?? sample.result.efRuntime,
          epsilon: queryEpsilon,
          compression: sample.result.compression,
          graphMaxDegree: sample.result.graphMaxDegree,
          constructionWindowSize: sample.result.constructionWindowSize,
          searchWindowSize: searchWindowSize ?? sample.result.searchWindowSize,
          useSearchHistory,
          searchBufferCapacity,
        })
      : {
          count: sample.result.sourceCount,
          dimensions: sample.result.dimensions,
          ...(sample.result.metric === 'unknown'
            ? {}
            : { metric: sample.result.metric as VectorMetric }),
          algorithm: sample.result.algorithm,
          m: sample.result.m,
          efConstruction: sample.result.efConstruction,
          efRuntime: efRuntime ?? sample.result.efRuntime,
        }
    : undefined
  const tuneRecommendations: TuneRecommendation[] =
    sample && tuneConfig
      ? source.kind === 'vector-set'
        ? recommendVectorSetTuning(tuneConfig)
        : recommendSearchIndexTuning(tuneConfig)
      : []
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
    setHybridResult(undefined)
    setAggregateResult(undefined)
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
    setHybridResult(undefined)
    setAggregateResult(undefined)
    setSensitivityRuns([])
    setSensitivityStatus('idle')
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
      const worker = await getLayoutWorker()
      if (!session.accept(work.generation, null).accepted) {
        setStatus('stale')
        return
      }
      const layout = await worker.start({
        version: 1,
        jobId: `native-${work.generation}`,
        algorithm: projectionAlgorithm,
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
      setAggregateResult(undefined)
      setStatus(errorStatus(error))
    }
  }

  const runQuery = async (requestedAnchorId?: string) => {
    const anchorId = requestedAnchorId ?? selectedIds[0]
    const anchorVector = anchorId ? session.getRawVector(anchorId) : undefined
    if (!sample || !anchorId || !anchorVector || !connectedInstance.id) {
      setQuery({ ...emptyQuery, status: 'unsupported' })
      setQueryAnchorId(undefined)
      setHybridResult(undefined)
      setAggregateResult(undefined)
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
        limit: redisQueryLimitForVisibleNeighbors(neighborLimit),
        execute,
        signal: work.signal,
        generation: work.generation,
        accept: (generation) => session.accept(generation, null),
        queryMode,
        radius: queryMode === 'range' ? rangeRadius : undefined,
        epsilon: queryMode === 'range' ? queryEpsilon : undefined,
        efRuntime: queryMode === 'knn' ? efRuntime : undefined,
        hybridPolicy: queryMode === 'knn' ? hybridPolicy : undefined,
        batchSize:
          queryMode === 'knn' && hybridPolicy === 'BATCHES'
            ? batchSize
            : undefined,
        searchWindowSize,
        shardKRatio,
        useSearchHistory,
        searchBufferCapacity,
        textQuery: queryMode === 'hybrid' ? textQuery : undefined,
        fusionMethod: queryMode === 'hybrid' ? fusionMethod : undefined,
        rrfConstant:
          queryMode === 'hybrid' && fusionMethod === 'rrf'
            ? rrfConstant
            : undefined,
        rrfWindow:
          queryMode === 'hybrid' && fusionMethod === 'rrf'
            ? rrfWindow
            : undefined,
        linearAlpha:
          queryMode === 'hybrid' && fusionMethod === 'linear'
            ? linearAlpha
            : undefined,
        linearBeta:
          queryMode === 'hybrid' && fusionMethod === 'linear'
            ? linearBeta
            : undefined,
        hybridVsimMode: queryMode === 'hybrid' ? hybridVsimMode : undefined,
        filter:
          queryMode === 'hybrid'
            ? filterExpression.trim() || undefined
            : undefined,
        aggregateGroupByFields:
          queryMode === 'aggregate' && aggregateGroupByField
            ? [aggregateGroupByField]
            : undefined,
        aggregateLoadFields:
          queryMode === 'aggregate' && aggregateGroupByField
            ? [aggregateGroupByField]
            : undefined,
        aggregateReduceOps:
          queryMode === 'aggregate'
            ? [
                {
                  function: 'COUNT',
                  alias: AGGREGATE_COUNT_ALIAS,
                },
                {
                  function: 'MIN',
                  field: '__vv_metric',
                  alias: AGGREGATE_BEST_DISTANCE_ALIAS,
                },
                {
                  function: 'AVG',
                  field: '__vv_metric',
                  alias: AGGREGATE_AVERAGE_DISTANCE_ALIAS,
                },
                {
                  function: 'MAX',
                  field: '__vv_metric',
                  alias: AGGREGATE_WORST_DISTANCE_ALIAS,
                },
              ]
            : undefined,
      })
      if (result.kind === 'hybrid-ready') {
        setHybridResult({
          documents: result.documents,
          totalResults: result.totalResults,
        })
        setQuery({
          ...emptyQuery,
          profile: result.profile,
          status: result.documents.length ? 'ready' : 'empty',
        })
        setAggregateResult(undefined)
        return
      }
      if (result.kind === 'aggregate-ready') {
        setAggregateResult({
          groups: result.groups,
          totalGroups: result.totalGroups,
        })
        setQuery({
          ...emptyQuery,
          profile: result.profile,
          status: result.groups.length ? 'ready' : 'empty',
        })
        setHybridResult(undefined)
        return
      }
      setHybridResult(undefined)
      setAggregateResult(undefined)
      if (result.kind !== 'ready') {
        setQuery({ ...emptyQuery, status: result.kind })
        return
      }
      setQuery({
        ...result,
        status: result.neighbors.length ? 'ready' : 'empty',
      })
    } catch (error) {
      if (
        queryMode === 'hybrid' &&
        error instanceof Error &&
        (error.message.includes('unknown command') ||
          error.message.includes('ERR unknown'))
      ) {
        setQuery({
          ...emptyQuery,
          status: 'unsupported',
        })
        setHybridResult(undefined)
        setAggregateResult(undefined)
        return
      }
      setQuery({
        ...emptyQuery,
        status:
          errorStatus(error) === 'acl-unavailable'
            ? 'acl-unavailable'
            : 'recoverable-error',
      })
      setHybridResult(undefined)
      setAggregateResult(undefined)
    }
  }

  runQueryRef.current = runQuery

  const copyIds = (ids: string[]) => {
    if (!ids.length) return
    void navigator.clipboard?.writeText(ids.join('\n')).catch(() => undefined)
  }

  const exportJson = (items: unknown[], filename: string) => {
    if (!items.length) return
    const payload = JSON.stringify(items, null, 2)
    const url = URL.createObjectURL(
      new Blob([payload], { type: 'application/json' }),
    )
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportDocuments = async (rows: SelectionRow[]) => {
    if (!rows.length || !sample || !connectedInstance.id) return
    const execute = createNativeReadOnlyExecutor({
      instanceId: connectedInstance.id,
      cliClientUuid: cliSettings.cliClientUuid,
      post: apiService.post,
    })
    const documents = await Promise.all(
      rows.map(async ({ id }): Promise<NativeDocumentExport> => {
        if (source.kind === 'search-index') {
          const storage = sample.result.storage ?? 'hash'
          const reply = await execute(planSearchDocumentExport({ id, storage }))
          return parseNativeDocumentExport({
            id,
            reply,
            source,
            storage,
          })
        }

        const member = sample.result.memberArguments?.get(id) ?? id
        const reply = await execute(
          planVectorSetDocumentExport({
            key: source.key,
            member,
          }),
        )
        return parseNativeDocumentExport({ id, reply, source })
      }),
    )
    exportJson(documents, `vector-visualizer-documents-${Date.now()}.json`)
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
        algorithm: projectionAlgorithm,
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

  const runSensitivity = async () => {
    if (!sample) return
    const ids = sample.result.ids.slice(0, MAX_SENSITIVITY_SAMPLE_SIZE)
    const count = ids.length
    const { dimensions } = sample.result
    if (count < 4 || !dimensions) {
      setSensitivityRuns([])
      setSensitivityStatus('unavailable')
      return
    }

    const work = session.beginWork()
    setSensitivityRuns([])
    setSensitivityStatus('running')
    setSelectedK(undefined)
    sensitivityLayoutsRef.current.clear()

    try {
      const vectors = new Float32Array(count * dimensions)
      let hasMissingRawVector = false
      ids.forEach((id, index) => {
        const vector = session.getRawVector(id)
        if (!vector) {
          hasMissingRawVector = true
          return
        }

        vectors.set(vector, index * dimensions)
      })
      if (hasMissingRawVector) {
        setSensitivityStatus('unavailable')
        return
      }
      const worker = await getLayoutWorker()
      if (!session.accept(work.generation, null).accepted) return
      const baseJob: LayoutJobV1 = {
        version: 1,
        jobId: `tune-sensitivity-${work.generation}`,
        algorithm: 'umap',
        metric: sample.layoutMetric,
        count,
        dimensions,
        vectors,
        seed: UMAP_SEED,
        parameters: { nNeighbors: 15 },
      }
      const plan = planSensitivityRuns(baseJob)
      const results: SensitivityResult[] = []
      for (let index = 0; index < plan.jobs.length; index += 1) {
        // eslint-disable-next-line no-await-in-loop
        const layout = await worker.start(plan.jobs[index])
        if (!session.accept(work.generation, layout).accepted) return
        if (layout.type !== 'complete') continue
        const nNeighbors = plan.values[index]
        sensitivityLayoutsRef.current.set(nNeighbors, {
          coordinates: layout.coordinates,
          quality: layout.quality,
        })
        results.push({
          nNeighbors,
          quality:
            layout.quality.kind === 'measured' ? layout.quality.value : 0,
          coordinates: layout.coordinates,
          count,
        })
      }
      setSensitivityRuns(results)
      setSensitivityStatus(results.length > 0 ? 'idle' : 'unavailable')
    } catch {
      setSensitivityRuns([])
      setSensitivityStatus('error')
    }
  }

  const selectSensitivityK = (k: number) => {
    setSelectedK(k)
    const stored = sensitivityLayoutsRef.current.get(k)
    if (!stored) return
    setSample((current) =>
      current
        ? {
            ...current,
            coordinates: stored.coordinates,
            quality: stored.quality,
          }
        : current,
    )
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
        projectionAlgorithm={projectionAlgorithm}
        comparePanel={
          compareProjections && altCoordinates
            ? {
                coordinates: altCoordinates,
                quality: altQuality ?? {
                  kind: 'unknown',
                  reason: 'not-measured',
                },
              }
            : undefined
        }
      />
    ) : workflow === 'query-lab' ? (
      <Col gap="m">
        {sourceKind === 'search-index' && (
          <Row align="center" gap="s">
            <Text size="S">Query mode</Text>
            <Button
              size="s"
              variant={queryMode === 'knn' ? 'primary' : 'secondary-fill'}
              onClick={() => setQueryMode('knn')}
            >
              KNN
            </Button>
            <Button
              size="s"
              variant={queryMode === 'range' ? 'primary' : 'secondary-fill'}
              onClick={() => setQueryMode('range')}
            >
              Range
            </Button>
            <Button
              size="s"
              variant={queryMode === 'hybrid' ? 'primary' : 'secondary-fill'}
              onClick={() => setQueryMode('hybrid')}
            >
              Hybrid
            </Button>
            <Button
              size="s"
              variant={queryMode === 'aggregate' ? 'primary' : 'secondary-fill'}
              onClick={() => setQueryMode('aggregate')}
            >
              Aggregate
            </Button>
          </Row>
        )}
        {sourceKind === 'search-index' && queryMode === 'hybrid' && (
          <Col gap="s">
            <Row align="center" gap="s">
              <Text size="S">Text query</Text>
              <input
                type="text"
                value={textQuery}
                placeholder="*"
                onChange={(event) => setTextQuery(event.target.value)}
                style={{ width: 200 }}
              />
            </Row>
            <Row align="center" gap="s">
              <Text size="S">VSIM mode</Text>
              <Button
                size="s"
                variant={
                  hybridVsimMode === 'knn' ? 'primary' : 'secondary-fill'
                }
                onClick={() => setHybridVsimMode('knn')}
              >
                KNN
              </Button>
              <Button
                size="s"
                variant={
                  hybridVsimMode === 'range' ? 'primary' : 'secondary-fill'
                }
                onClick={() => setHybridVsimMode('range')}
              >
                Range
              </Button>
            </Row>
            <Row align="center" gap="s">
              <Text size="S">Fusion</Text>
              <Button
                size="s"
                variant={fusionMethod === 'rrf' ? 'primary' : 'secondary-fill'}
                onClick={() => setFusionMethod('rrf')}
              >
                RRF
              </Button>
              <Button
                size="s"
                variant={
                  fusionMethod === 'linear' ? 'primary' : 'secondary-fill'
                }
                onClick={() => setFusionMethod('linear')}
              >
                Linear
              </Button>
            </Row>
            {fusionMethod === 'rrf' && (
              <Row align="center" gap="s">
                <Text size="S">WINDOW</Text>
                <input
                  type="number"
                  min={1}
                  value={rrfWindow ?? ''}
                  placeholder="20"
                  onChange={(event) => {
                    const nextWindow = Number(event.target.value)
                    setRrfWindow(
                      Number.isFinite(nextWindow) && nextWindow > 0
                        ? nextWindow
                        : undefined,
                    )
                  }}
                  style={{ width: 80 }}
                />
                <Text size="S">CONSTANT</Text>
                <input
                  type="number"
                  min={1}
                  value={rrfConstant ?? ''}
                  placeholder="60"
                  onChange={(event) => {
                    const nextConstant = Number(event.target.value)
                    setRrfConstant(
                      Number.isFinite(nextConstant) && nextConstant > 0
                        ? nextConstant
                        : undefined,
                    )
                  }}
                  style={{ width: 80 }}
                />
              </Row>
            )}
            {fusionMethod === 'linear' && (
              <Row align="center" gap="s">
                <Text size="S">ALPHA</Text>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.1}
                  value={linearAlpha ?? ''}
                  placeholder="0.5"
                  onChange={(event) => {
                    const nextAlpha = Number(event.target.value)
                    setLinearAlpha(
                      Number.isFinite(nextAlpha) ? nextAlpha : undefined,
                    )
                  }}
                  style={{ width: 80 }}
                />
                <Text size="S">BETA</Text>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.1}
                  value={linearBeta ?? ''}
                  placeholder="0.5"
                  onChange={(event) => {
                    const nextBeta = Number(event.target.value)
                    setLinearBeta(
                      Number.isFinite(nextBeta) ? nextBeta : undefined,
                    )
                  }}
                  style={{ width: 80 }}
                />
              </Row>
            )}
          </Col>
        )}
        {sourceKind === 'search-index' && queryMode === 'range' && (
          <Row align="center" gap="s">
            <Text size="S">RADIUS</Text>
            <input
              type="number"
              min={0}
              step={0.01}
              value={rangeRadius}
              onChange={(event) => {
                const nextRadius = Number(event.target.value)
                setRangeRadius(
                  Number.isFinite(nextRadius) && nextRadius > 0
                    ? nextRadius
                    : rangeRadius,
                )
              }}
              style={{ width: 80 }}
            />
            <Text size="S">EPSILON</Text>
            <input
              type="number"
              min={0.001}
              max={1}
              step={0.001}
              value={queryEpsilon ?? ''}
              placeholder="default"
              onChange={(event) => {
                const nextEpsilon = Number(event.target.value)
                setQueryEpsilon(
                  Number.isFinite(nextEpsilon) && nextEpsilon > 0
                    ? nextEpsilon
                    : undefined,
                )
              }}
              style={{ width: 80 }}
            />
          </Row>
        )}
        {sourceKind === 'search-index' && queryMode === 'aggregate' && (
          <Col gap="s">
            <Row align="center" gap="s">
              <Text size="S">GROUPBY field</Text>
              <input
                type="text"
                value={aggregateGroupByField}
                placeholder="category"
                onChange={(event) =>
                  setAggregateGroupByField(event.target.value)
                }
                style={{ width: 160 }}
              />
            </Row>
            <Text color="subdued" size="XS">
              Returns count plus best, average, and worst similarity within the
              bounded query result set.
            </Text>
          </Col>
        )}
        {sourceKind === 'search-index' &&
          queryMode === 'knn' &&
          sample?.result.algorithm === 'hnsw' && (
            <Row align="center" gap="s">
              <Text size="S">EF_RUNTIME</Text>
              <input
                type="number"
                min={1}
                max={4096}
                value={efRuntime ?? ''}
                placeholder="default"
                onChange={(event) => {
                  const nextEfRuntime = Number(event.target.value)
                  setEfRuntime(
                    Number.isFinite(nextEfRuntime) && nextEfRuntime > 0
                      ? nextEfRuntime
                      : undefined,
                  )
                }}
                style={{ width: 80 }}
              />
            </Row>
          )}
        {sourceKind === 'search-index' &&
          (sample?.result.algorithm?.includes('svs') ||
            sample?.result.algorithm?.includes('vamana')) && (
            <Row align="center" gap="s">
              <Text size="S">SEARCH_WINDOW_SIZE</Text>
              <input
                type="number"
                min={1}
                max={4096}
                value={searchWindowSize ?? ''}
                placeholder="default"
                onChange={(event) => {
                  const nextSearchWindowSize = Number(event.target.value)
                  setSearchWindowSize(
                    Number.isFinite(nextSearchWindowSize) &&
                      nextSearchWindowSize > 0
                      ? nextSearchWindowSize
                      : undefined,
                  )
                }}
                style={{ width: 80 }}
              />
            </Row>
          )}
        {sourceKind === 'search-index' && queryMode === 'knn' && (
          <Row align="center" gap="s">
            <Text size="S">HYBRID_POLICY</Text>
            <select
              value={hybridPolicy ?? ''}
              onChange={(event) => {
                const nextHybridPolicy = event.target.value
                setHybridPolicy(
                  nextHybridPolicy === 'AUTO' ||
                    nextHybridPolicy === 'BATCHES' ||
                    nextHybridPolicy === 'ADHOC_BF'
                    ? nextHybridPolicy
                    : undefined,
                )
              }}
            >
              <option value="">default</option>
              <option value="AUTO">AUTO</option>
              <option value="BATCHES">BATCHES</option>
              <option value="ADHOC_BF">ADHOC_BF</option>
            </select>
            {hybridPolicy === 'BATCHES' && (
              <Row align="center" gap="s">
                <Text size="S">BATCH_SIZE</Text>
                <input
                  type="number"
                  min={1}
                  value={batchSize ?? ''}
                  placeholder="default"
                  onChange={(event) => {
                    const nextBatchSize = Number(event.target.value)
                    setBatchSize(
                      Number.isFinite(nextBatchSize) && nextBatchSize > 0
                        ? nextBatchSize
                        : undefined,
                    )
                  }}
                  style={{ width: 80 }}
                />
              </Row>
            )}
          </Row>
        )}
        {sourceKind === 'search-index' && (
          <Row align="center" gap="s">
            <Text size="S">SHARD_K_RATIO</Text>
            <input
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={shardKRatio ?? ''}
              placeholder="default"
              onChange={(event) => {
                const nextShardKRatio = Number(event.target.value)
                setShardKRatio(
                  Number.isFinite(nextShardKRatio) && nextShardKRatio > 0
                    ? nextShardKRatio
                    : undefined,
                )
              }}
              style={{ width: 80 }}
            />
            <Text size="S">USE_SEARCH_HISTORY</Text>
            <select
              value={useSearchHistory ?? ''}
              onChange={(event) => {
                const nextUseSearchHistory = event.target.value
                setUseSearchHistory(
                  nextUseSearchHistory === 'OFF' ||
                    nextUseSearchHistory === 'ON' ||
                    nextUseSearchHistory === 'AUTO'
                    ? nextUseSearchHistory
                    : undefined,
                )
              }}
            >
              <option value="">default</option>
              <option value="OFF">OFF</option>
              <option value="ON">ON</option>
              <option value="AUTO">AUTO</option>
            </select>
            <Text size="S">SEARCH_BUFFER_CAPACITY</Text>
            <input
              type="number"
              min={1}
              value={searchBufferCapacity ?? ''}
              placeholder="default"
              onChange={(event) => {
                const nextSearchBufferCapacity = Number(event.target.value)
                setSearchBufferCapacity(
                  Number.isFinite(nextSearchBufferCapacity) &&
                    nextSearchBufferCapacity > 0
                    ? nextSearchBufferCapacity
                    : undefined,
                )
              }}
              style={{ width: 80 }}
            />
          </Row>
        )}
        <Button
          disabled={!selectedIds[0] || !sample}
          onClick={() => void runQuery()}
        >
          {t('vectorVisualizer.queryLab.runSelectedAnchorQuery')}
        </Button>
        <Text color="subdued">
          {t('vectorVisualizer.queryLab.runDescription', {
            command:
              sourceKind === 'search-index'
                ? queryMode === 'range'
                  ? 'VECTOR_RANGE'
                  : queryMode === 'hybrid'
                    ? 'FT.HYBRID'
                    : queryMode === 'aggregate'
                      ? 'FT.AGGREGATE'
                      : 'KNN'
                : 'VSIM',
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
        {queryMode === 'knn' || queryMode === 'range' ? (
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
                ? neighborLimit
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
        ) : (
          <Text aria-live="polite" role="status">
            {query.status === 'ready'
              ? queryMode === 'aggregate'
                ? 'Aggregate result groups are ready.'
                : 'Hybrid result scores are ready.'
              : query.status === 'empty'
                ? queryMode === 'aggregate'
                  ? 'No aggregate groups returned for this query.'
                  : 'No hybrid documents returned for this query.'
                : query.status === 'fetching'
                  ? 'Fetching bounded query evidence.'
                  : query.status === 'unsupported'
                    ? 'This source cannot provide this query evidence.'
                    : query.status === 'acl-unavailable'
                      ? 'Redis ACLs do not allow this evidence.'
                      : query.status === 'cancelled'
                        ? 'Query retrieval was cancelled.'
                        : query.status === 'recoverable-error'
                          ? 'Query evidence could not be loaded. Retry.'
                          : 'Select a sampled document and run the query.'}
          </Text>
        )}
        {queryMode === 'aggregate' &&
          aggregateResult &&
          aggregateResult.groups.length > 0 && (
            <Col gap="s" aria-label="Aggregate result groups">
              <Row align="center" justify="between" gap="s">
                <Title component="h3" size="S">
                  Aggregate groups
                </Title>
                <Col align="end" gap="xxs">
                  <Text color="subdued" size="XS">
                    {aggregateResult.groups.length} of{' '}
                    {aggregateResult.totalGroups} groups
                  </Text>
                  <Text color="subdued" size="XS">
                    grouped within returned top-k query results
                  </Text>
                </Col>
              </Row>
              <Row gap="s" wrap>
                {aggregateResult.groups.map((group, index) => {
                  const aggregateLabels = aggregateMetricLabels(
                    sample.result.metric,
                  )
                  const groupField =
                    aggregateGroupByField ||
                    Object.keys(group).find(
                      (field) =>
                        ![
                          AGGREGATE_COUNT_ALIAS,
                          AGGREGATE_BEST_DISTANCE_ALIAS,
                          AGGREGATE_AVERAGE_DISTANCE_ALIAS,
                          AGGREGATE_WORST_DISTANCE_ALIAS,
                        ].includes(field),
                    ) ||
                    'group'
                  const groupValue =
                    group[groupField] ?? group[`@${groupField}`] ?? 'Unknown'
                  const countValue = group[AGGREGATE_COUNT_ALIAS]
                  const bestValue = formatAggregateMetricValue(
                    group[AGGREGATE_BEST_DISTANCE_ALIAS],
                    sample.result.metric,
                  )
                  const averageValue = formatAggregateMetricValue(
                    group[AGGREGATE_AVERAGE_DISTANCE_ALIAS],
                    sample.result.metric,
                  )
                  const worstValue = formatAggregateMetricValue(
                    group[AGGREGATE_WORST_DISTANCE_ALIAS],
                    sample.result.metric,
                  )

                  return (
                    <Col
                      aria-label={`Aggregate group ${index + 1}`}
                      gap="xs"
                      key={`${index}-${JSON.stringify(group)}`}
                    >
                      <Text size="S">
                        {groupField}: {String(groupValue)}
                      </Text>
                      {countValue !== undefined && (
                        <Text size="S">{String(countValue)} returned docs</Text>
                      )}
                      {bestValue !== undefined && (
                        <Text size="S">
                          {aggregateLabels.best}: {bestValue}
                        </Text>
                      )}
                      {averageValue !== undefined && (
                        <Text size="S">
                          {aggregateLabels.average}: {averageValue}
                        </Text>
                      )}
                      {worstValue !== undefined && (
                        <Text size="S">
                          {aggregateLabels.worst}: {worstValue}
                        </Text>
                      )}
                    </Col>
                  )
                })}
              </Row>
            </Col>
          )}
        {queryMode === 'hybrid' &&
          hybridResult &&
          hybridResult.documents.length > 0 && (
            <HybridScoreChart documents={hybridResult.documents} />
          )}
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
      ) : (
        <Col gap="m">
          <Button onClick={() => void runSensitivity()}>
            {t('vectorVisualizer.tune.runSensitivity')}
          </Button>
          <Tune
            currentConfig={tuneConfig}
            recommendations={tuneRecommendations}
            selectedK={selectedK}
            sensitivityRuns={sensitivityRuns}
            sensitivityStatus={sensitivityStatus}
            sourceKind={sourceKind}
            onSelectK={selectSensitivityK}
          />
          {sample.result.metric === 'unknown' ? (
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
          )}
        </Col>
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
          searchProfile={
            sourceKind === 'search-index'
              ? parseSearchExecutionEvidence(query.profile)
              : undefined
          }
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
  const canShowClusterLabels =
    metadataField === DBSCAN_COLOR_BY_VALUE
      ? Boolean(dbscanResult && dbscanResult.clusterCount > 0)
      : metadataGroupCount >= MIN_CLUSTER_LABEL_COUNT
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
  const copyQuery = () => {
    const selectedId = selectedIds[0]
    if (!selectedId) return
    const vector = session.getRawVector(selectedId)
    if (!vector) return
    const command = buildCopyableQuery(
      source,
      vector,
      redisQueryLimitForVisibleNeighbors(neighborLimit),
      sampledFilterExpression || undefined,
    )
    void navigator.clipboard?.writeText(command).catch(() => undefined)
  }
  const visualizationActions = [
    {
      id: 'run-neighbors',
      label: t('vectorVisualizer.actions.runNeighborsForSelected'),
      disabled: selectedIds.length !== 1 || !sample,
      onClick: () => runNeighborsForSelected(selectedIds[0]),
    },
    {
      id: 'copy-query',
      label: t('vectorVisualizer.actions.copyQuery'),
      disabled: selectedIds.length !== 1 || !sample,
      onClick: copyQuery,
    },
    {
      id: 'clear-selection',
      label: t('vectorVisualizer.actions.clearSelection'),
      disabled: !selectedIds.length,
      onClick: () => setSelectedIds([]),
    },
  ]
  const additionalWorkflowPanel = (
    <AdditionalWorkflowPanel open={additionalWorkflowsOpen}>
      <summary
        onClick={(event) => {
          event.preventDefault()
          setAdditionalWorkflowsOpen((open) => !open)
        }}
      >
        {t('vectorVisualizer.workflows.additional')}
      </summary>
      <AdditionalWorkflowBody>
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
              variant={workflow === id ? 'primary' : 'secondary-ghost'}
              onClick={() => selectWorkflow(id)}
            >
              {workflowLabels[id]}
            </Button>
          ))}
        </Row>
        {workflow !== 'explore' && content}
      </AdditionalWorkflowBody>
    </AdditionalWorkflowPanel>
  )
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
      projectionAlgorithm={projectionAlgorithm}
      comparePanel={
        compareProjections && altCoordinates
          ? {
              coordinates: altCoordinates,
              quality: altQuality ?? {
                kind: 'unknown',
                reason: 'not-measured',
              },
            }
          : undefined
      }
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
          ? neighborLimit
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
      projectionAlgorithm={projectionAlgorithm}
    />
  )

  return (
    <NativeHost data-testid="vector-visualizer-native-host">
      {source.kind === 'search-index' && (
        <Breadcrumbs.Compose
          aria-label={t('vectorSearch.query.breadcrumb.ariaLabel')}
          data-testid="vector-visualizer-breadcrumb-search-indexes"
        >
          <Breadcrumbs.List>
            <Breadcrumbs.Item>
              <BreadcrumbLink
                type="button"
                onClick={navigateToIndexes}
                data-testid="vector-visualizer-breadcrumb-search-indexes-link"
              >
                <RiIcon type="ChevronLeftIcon" size="S" />
                <Title size="M" color="primary">
                  {t('vectorSearch.query.breadcrumb.indexes')}
                </Title>
              </BreadcrumbLink>
            </Breadcrumbs.Item>
            <Breadcrumbs.Item>
              <Breadcrumbs.Separator>
                <SlashSeparator>/</SlashSeparator>
              </Breadcrumbs.Separator>
            </Breadcrumbs.Item>
            <Breadcrumbs.Item>
              <Title size="M" color="primary">
                {source.index}
              </Title>
            </Breadcrumbs.Item>
          </Breadcrumbs.List>
        </Breadcrumbs.Compose>
      )}
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
        {source.kind === 'search-index' && (
          <HeaderRightAction align="center">
            <ViewIndexButton
              isActive={isIndexPanelOpen}
              onClick={() => setIsIndexPanelOpen((open) => !open)}
            />
          </HeaderRightAction>
        )}
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
      <VectorVisualizerWorkspace
        resultsMode={isIndexPanelOpen ? 'expanded' : 'default'}
        additional={additionalWorkflowPanel}
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
            algorithm={{
              value: projectionAlgorithm,
              onChange: setProjectionAlgorithm,
              label: t('vectorVisualizer.controls.algorithm.label'),
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
                    suggestions: availableMetadataFields,
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
            neighborLimit={{
              value: neighborLimit,
              min: MIN_NEIGHBOR_LIMIT,
              max: MAX_NEIGHBOR_LIMIT,
              step: NEIGHBOR_LIMIT_STEP,
              onChange: setNeighborLimit,
            }}
            summary={
              sample
                ? {
                    sampleCount: sample.result.sampleCount,
                    sourceCount: sample.result.sourceCount,
                    samplingMethod: sample.result.method,
                    projectionAlgorithm: t(
                      `vectorVisualizer.controls.algorithm.${projectionAlgorithm}` as never,
                    ),
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
            compareProjections={{
              label: t('vectorVisualizer.controls.compareProjections.label'),
              checked: compareProjections,
              ...(sample
                ? { onChange: setCompareProjections }
                : {
                    disabled: true,
                    disabledReason: t(
                      'vectorVisualizer.controls.compareProjections.disabledReason',
                    ),
                  }),
            }}
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
          isIndexPanelOpen && source.kind === 'search-index' ? (
            <IndexInfoSidePanel
              indexName={source.index}
              onClose={() => setIsIndexPanelOpen(false)}
            />
          ) : (
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
              onExportFocusedResult={(row) => void exportDocuments([row])}
              onExportVisibleResults={(rows) => void exportDocuments(rows)}
              onResultFocus={(id) => setSelectedIds([id])}
              onRunNeighborsForFocused={runNeighborsForSelected}
            />
          )
        }
      />
    </NativeHost>
  )
}
