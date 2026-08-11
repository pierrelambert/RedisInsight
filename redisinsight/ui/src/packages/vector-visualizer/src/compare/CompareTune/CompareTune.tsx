import React, { useState } from 'react'

import { BaseButton as Button } from 'uiSrc/components/base/forms/buttons/Button'
import { Col, Row } from 'uiSrc/components/base/layout/flex'
import { Text, Title } from 'uiSrc/components/base/text'

import {
  buildBenchmarkPreview,
  compareManifests,
  getComparableMeasuredRuns,
  toParetoPoints,
  type BenchmarkRunV1,
} from '../compare'
import * as S from './CompareTune.styles'
import type { CompareTuneProps, CompareTuneStatus } from './CompareTune.types'

const describeParetoRun = (run: BenchmarkRunV1) =>
  `${run.id}: recall ${run.recall.value}, latency ${run.latencyMs.value} ms, ${
    run.memoryMb.evidence === 'measured' && Number.isFinite(run.memoryMb.value)
      ? `memory ${run.memoryMb.value} MB, measured`
      : 'memory unavailable'
  }`

const formatMetricNumber = (value: number) =>
  Number(value.toPrecision(6)).toString()

const stateCopy: Record<Exclude<CompareTuneStatus, 'ready'>, string> = {
  empty: 'No comparable benchmark runs are available.',
  unsupported: 'Compare & Tune is unavailable for this source.',
  'recoverable-error': 'Compare & Tune could not load. Retry.',
  cancelled: 'Benchmark preview was cancelled.',
}

export const CompareTune = ({
  left,
  right,
  runs,
  status = 'ready',
  benchmarkEnabled = true,
  benchmarkSampleCount = 50,
  onConfirmBenchmark,
}: CompareTuneProps) => {
  const [previewOpen, setPreviewOpen] = useState(false)
  const compatibility = compareManifests(left, right)
  const preview = buildBenchmarkPreview({
    sourceKind: right.sourceKind,
    truth: true,
    sampleCount: benchmarkSampleCount,
  })
  const measured = getComparableMeasuredRuns(runs).filter(
    (run) => compareManifests(left, run.manifest).compatible,
  )
  const paretoPoints = new Map(
    toParetoPoints(measured).map((point) => [point.id, point]),
  )
  const allMemoryComparable =
    measured.length > 0 &&
    measured.every(
      (run) =>
        run.memoryMb.evidence === 'measured' &&
        Number.isFinite(run.memoryMb.value),
    )

  if (status !== 'ready')
    return (
      <S.Panel aria-label="Compare and Tune state">
        <Text
          role="status"
          color={status === 'recoverable-error' ? 'danger' : 'subdued'}
        >
          {stateCopy[status]}
        </Text>
      </S.Panel>
    )

  return (
    <Col gap="m" aria-label="Compare and Tune">
      <S.Panel>
        <Title component="h2" size="S">
          Manifest drift
        </Title>
        {!compatibility.compatible ? (
          <Col gap="xs">
            <Text color="attention">Comparison unavailable</Text>
            {compatibility.reasons.map((reason) => (
              <Text key={reason} color="subdued">
                {reason}
              </Text>
            ))}
          </Col>
        ) : (
          <Col gap="xs">
            <Text color="success">Compatible manifests</Text>
            <Text>
              Sample count: {compatibility.sampleDelta >= 0 ? '+' : ''}
              {compatibility.sampleDelta}
            </Text>
            <Text>
              Source count: {compatibility.sourceDelta >= 0 ? '+' : ''}
              {compatibility.sourceDelta}
            </Text>
            <Text color="subdued">
              Drift is bounded sample evidence; values are never coerced across
              incompatible schema.
            </Text>
            {compatibility.drift.map((fact) => (
              <Text
                key={fact.metric}
                color={
                  fact.provenance === 'unavailable' ? 'attention' : 'subdued'
                }
              >
                {fact.metric}:{' '}
                {fact.provenance === 'unavailable'
                  ? `unavailable (${fact.reason})`
                  : `${formatMetricNumber(fact.before)} → ${formatMetricNumber(fact.after)}; Δ ${fact.delta >= 0 ? '+' : ''}${formatMetricNumber(fact.delta)}${fact.unit ? ` ${fact.unit}` : ''} (${fact.provenance})`}
              </Text>
            ))}
          </Col>
        )}
      </S.Panel>
      <S.Panel>
        <Title component="h2" size="S">
          Pareto evidence
        </Title>
        <Text color="subdued">
          Comparable measured latency and recall only. Memory is shown only when
          a run-comparable observed measure exists.
        </Text>
        <Row gap="m" wrap>
          <Text title="Higher is better; only measured values are plotted.">
            Recall (ratio)
          </Text>
          <Text title="Lower is better; milliseconds from the measured run.">
            Latency (ms)
          </Text>
          {allMemoryComparable && (
            <Text title="Lower is better; memory observed by comparable measured runs.">
              Memory (MB)
            </Text>
          )}
        </Row>
        <S.Plot
          aria-label={
            allMemoryComparable
              ? 'Pareto plot: latency against recall; marker size represents comparable measured memory in MB'
              : 'Pareto plot: latency against recall; fixed marker size because comparable memory is unavailable'
          }
          role="img"
          viewBox="0 0 320 180"
        >
          <title>
            {allMemoryComparable
              ? 'Pareto plot: measured recall, latency, and comparable memory evidence'
              : 'Pareto plot: measured recall and latency; comparable memory unavailable'}
          </title>
          <line x1="44" x2="44" y1="12" y2="142" stroke="currentColor" />
          <line x1="44" x2="304" y1="142" y2="142" stroke="currentColor" />
          <text x="130" y="170">
            Latency (ms)
          </text>
          <text x="8" y="80" transform="rotate(-90 8 80)">
            Recall (ratio)
          </text>
          {measured.map((run) => (
            <circle
              cx={paretoPoints.get(run.id)?.x}
              cy={paretoPoints.get(run.id)?.y}
              fill="currentColor"
              key={run.id}
              r={paretoPoints.get(run.id)?.radius}
            >
              <title>{describeParetoRun(run)}</title>
            </circle>
          ))}
        </S.Plot>
        {measured.length ? (
          measured.map((run) => (
            <Col gap="xs" key={run.id}>
              <Text>Measured run: {run.id}</Text>
              <Text>
                <S.Code>{run.recall.value}</S.Code> measured ·{' '}
                <S.Code>{run.latencyMs.value} ms</S.Code> measured
              </Text>
              <Text color="subdued">
                {run.memoryMb.evidence === 'measured' &&
                Number.isFinite(run.memoryMb.value) ? (
                  <>
                    Memory: <S.Code>{run.memoryMb.value} MB</S.Code> measured
                  </>
                ) : (
                  'Memory: unavailable for this run'
                )}
              </Text>
            </Col>
          ))
        ) : (
          <Text role="status" color="subdued">
            No comparable measured Pareto evidence is available.
          </Text>
        )}
        {runs.some((run) => !measured.includes(run)) && (
          <Text color="notice">
            Sampled or estimated runs are excluded from the Pareto plot.
          </Text>
        )}
      </S.Panel>
      <S.Panel>
        <Title component="h2" size="S">
          Controlled truth benchmark
        </Title>
        <Text color="subdued">
          No tuning starts automatically and no work runs in the background.
        </Text>
        {!benchmarkEnabled ? (
          <Text role="status" color="subdued">
            Measured truth benchmark unavailable for this source.
          </Text>
        ) : !previewOpen ? (
          <Button
            aria-label="Preview truth benchmark"
            size="s"
            onClick={() => setPreviewOpen(true)}
          >
            Preview truth benchmark
          </Button>
        ) : (
          <Col gap="s">
            <Text>{preview.estimatedWork}</Text>
            <Text>
              Read-only command: <S.Code>{preview.commands.join(', ')}</S.Code>
            </Text>
            <Text color="attention">
              Confirmation is required before this read-only bounded operation.
            </Text>
            <Row gap="s">
              <Button
                aria-label="Confirm read-only benchmark"
                size="s"
                onClick={() => {
                  setPreviewOpen(false)
                  onConfirmBenchmark()
                }}
              >
                Confirm read-only benchmark
              </Button>
              <Button
                aria-label="Cancel benchmark"
                size="s"
                onClick={() => setPreviewOpen(false)}
              >
                Cancel benchmark
              </Button>
            </Row>
          </Col>
        )}
      </S.Panel>
    </Col>
  )
}
