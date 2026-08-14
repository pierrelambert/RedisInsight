import React from 'react'

import { FormField } from 'uiSrc/components/base/forms/FormField'
import {
  defaultValueRender,
  RiSelect,
} from 'uiSrc/components/base/forms/select/RiSelect'
import NumericInput from 'uiSrc/components/base/inputs/NumericInput'
import { Slider } from 'uiSrc/components/base/inputs'
import SwitchInput from 'uiSrc/components/base/inputs/SwitchInput'
import TextInput from 'uiSrc/components/base/inputs/TextInput'
import { Col } from 'uiSrc/components/base/layout/flex'
import { Text, Title } from 'uiSrc/components/base/text'

import type {
  VectorVisualizerControlOption,
  VectorVisualizerControlsProps,
  VectorVisualizerVisibilityControl,
} from './VectorVisualizerControls.types'
import * as S from './VectorVisualizerControls.styles'

const ALGORITHM_OPTIONS: VectorVisualizerControlOption[] = [
  { value: 'umap', label: 'UMAP' },
  { value: 'pca', label: 'PCA' },
]

const isAlgorithmValue = (value: string): value is 'umap' | 'pca' =>
  value === 'umap' || value === 'pca'

const getDisabledMessage = (disabled?: boolean, disabledReason?: string) =>
  disabled
    ? (disabledReason ?? 'This control is unavailable for the current source.')
    : undefined

const getCallbackControlState = (
  disabled: boolean | undefined,
  disabledReason: string | undefined,
  callback: unknown,
  label: string,
) => {
  const isDisabled = disabled || typeof callback !== 'function'

  return {
    disabled: isDisabled,
    message: getDisabledMessage(
      isDisabled,
      disabledReason ??
        `${label} is unavailable until its response-backed action is connected.`,
    ),
  }
}

const VisibilityControl = ({
  label,
  control,
}: {
  label: string
  control: VectorVisualizerVisibilityControl
}) => {
  const state = getCallbackControlState(
    control.disabled,
    control.disabledReason,
    control.onChange,
    label,
  )

  return (
    <Col gap="xs">
      <SwitchInput
        aria-label={label}
        checked={control.checked}
        disabled={state.disabled}
        title={label}
        onCheckedChange={control.onChange}
      />
      {state.message && (
        <Text color="subdued" size="S">
          {state.message}
        </Text>
      )}
    </Col>
  )
}

const ControlsBody = ({
  source,
  algorithm,
  colorBy,
  metadataField,
  filter,
  sampleBudget,
  neighborLimit,
  clusterLabels,
  clusterLabelLimit,
  outliers,
  densityHeatmap,
  mapLabels,
  compareProjections,
  summary,
  loading,
}: VectorVisualizerControlsProps) => {
  const sourceState = getCallbackControlState(
    source.disabled,
    source.disabledReason,
    source.onChange,
    source.label,
  )
  const algorithmState = algorithm
    ? getCallbackControlState(
        algorithm.disabled,
        algorithm.disabledReason,
        algorithm.onChange,
        algorithm.label,
      )
    : undefined
  const colorByState = colorBy
    ? getCallbackControlState(
        colorBy.disabled,
        colorBy.disabledReason,
        colorBy.onChange,
        colorBy.label,
      )
    : undefined
  const metadataFieldState = metadataField
    ? getCallbackControlState(
        metadataField.disabled,
        metadataField.disabledReason,
        metadataField.onChange,
        'Color by metadata field',
      )
    : undefined
  const filterState = filter
    ? getCallbackControlState(
        filter.disabled,
        filter.disabledReason,
        filter.onChange,
        'Filter',
      )
    : undefined
  const removeFiltersState = filter
    ? getCallbackControlState(
        filter.disabled,
        filter.disabledReason,
        filter.onRemove,
        'Filter removal',
      )
    : undefined
  const sampleBudgetState = getCallbackControlState(
    sampleBudget.disabled,
    sampleBudget.disabledReason,
    sampleBudget.onChange,
    'Sample budget',
  )
  const neighborLimitState = getCallbackControlState(
    neighborLimit.disabled,
    neighborLimit.disabledReason,
    neighborLimit.onChange,
    'Neighbor limit',
  )
  const clusterLabelLimitState = clusterLabelLimit
    ? getCallbackControlState(
        clusterLabelLimit.disabled,
        clusterLabelLimit.disabledReason,
        clusterLabelLimit.onChange,
        'Cluster label limit',
      )
    : undefined

  return (
    <S.Fields gap="l">
      <Col gap="s">
        <Title component="h2" size="S">
          Controls
        </Title>
        <Text color="subdued" size="S" role="status">
          {loading
            ? 'Updating visualizer controls.'
            : 'Context is applied to the connected workspace.'}
        </Text>
      </Col>

      <FormField label={source.label} additionalText={sourceState.message}>
        <RiSelect
          disabled={sourceState.disabled}
          loading={loading || source.loading}
          options={source.options}
          value={source.value}
          valueRender={defaultValueRender}
          onChange={source.onChange}
        />
      </FormField>

      {algorithm && (
        <FormField
          label={algorithm.label}
          additionalText={algorithmState?.message}
        >
          <RiSelect
            aria-label={algorithm.label}
            disabled={algorithmState?.disabled}
            options={ALGORITHM_OPTIONS}
            value={algorithm.value}
            valueRender={defaultValueRender}
            onChange={(value) => {
              if (isAlgorithmValue(value)) algorithm.onChange(value)
            }}
          />
        </FormField>
      )}

      {filter && (
        <Col gap="s">
          <FormField label="Filter" additionalText={filterState?.message}>
            <TextInput
              aria-label="Filter sampled documents"
              disabled={filterState?.disabled}
              loading={loading || filter.loading}
              placeholder={filter.placeholder ?? 'Filter expression'}
              value={filter.value}
              onChange={filter.onChange}
            />
          </FormField>
          {filter.syntaxHelp && (
            <Text aria-label="Filter syntax help" color="subdued" size="S">
              {filter.syntaxHelp.content}
            </Text>
          )}
          {!!filter.suggestions?.length && !filterState?.disabled && (
            <S.Filters gap="xs" wrap>
              {filter.suggestions.map((field) => (
                <S.FilterChip
                  aria-label={`Insert field @${field}`}
                  key={field}
                  size="s"
                  variant="secondary-ghost"
                  onClick={() => {
                    const prefix =
                      filter.value && !filter.value.endsWith(' ')
                        ? `${filter.value} @${field}`
                        : `${filter.value}@${field}`
                    filter.onChange?.(prefix)
                  }}
                >
                  @{field}
                </S.FilterChip>
              ))}
            </S.Filters>
          )}
          {!!filter.activeFilters?.length && (
            <Col gap="xs">
              <S.Filters gap="xs" wrap>
                {filter.activeFilters.map((activeFilter) => (
                  <S.FilterChip
                    aria-label={`Remove filter ${activeFilter.label}`}
                    disabled={removeFiltersState?.disabled}
                    key={activeFilter.id}
                    size="s"
                    variant="secondary-ghost"
                    onClick={() => filter.onRemove?.(activeFilter.id)}
                  >
                    {activeFilter.label}
                  </S.FilterChip>
                ))}
              </S.Filters>
              {removeFiltersState?.message && (
                <Text color="subdued" size="S">
                  {removeFiltersState.message}
                </Text>
              )}
            </Col>
          )}
        </Col>
      )}

      {colorBy && (
        <Col gap="xs">
          <FormField
            label={colorBy.label}
            additionalText={colorByState?.message}
          >
            <RiSelect
              aria-label={colorBy.label}
              disabled={colorByState?.disabled}
              loading={loading || colorBy.loading}
              options={colorBy.options}
              value={colorBy.value}
              valueRender={defaultValueRender}
              onChange={colorBy.onChange}
            />
          </FormField>
          <Text color="subdued" size="S">
            Changes apply immediately to the current sampled Atlas using
            response-backed values.
          </Text>
        </Col>
      )}

      {metadataField && (
        <FormField
          label="Color by metadata field"
          additionalText={metadataFieldState?.message}
        >
          <TextInput
            aria-label="Color by metadata field"
            disabled={metadataFieldState?.disabled}
            loading={loading}
            placeholder={metadataField.placeholder ?? 'Exact scalar field'}
            value={metadataField.value}
            onChange={metadataField.onChange}
          />
          <Text color="subdued" size="S">
            Enter an allow-listed scalar field to color response-backed values
            in the current sample.
          </Text>
        </FormField>
      )}

      <Col gap="xs">
        <FormField
          label={`Sample budget (${sampleBudget.min.toLocaleString()}–${sampleBudget.max.toLocaleString()})`}
          additionalText={sampleBudgetState.message}
        >
          <NumericInput
            disabled={sampleBudgetState.disabled}
            loading={loading || sampleBudget.loading}
            max={sampleBudget.max}
            min={sampleBudget.min}
            value={sampleBudget.value}
            onChange={sampleBudget.onChange}
          />
        </FormField>
      </Col>

      <Col gap="xs">
        <FormField
          label={`Neighbor limit: ${neighborLimit.value}`}
          additionalText={neighborLimitState.message}
        >
          <Slider
            aria-label="Neighbor limit"
            disabled={neighborLimitState.disabled}
            max={neighborLimit.max}
            min={neighborLimit.min}
            step={neighborLimit.step ?? 1}
            value={[neighborLimit.value]}
            onChange={(values: number[]) => neighborLimit.onChange?.(values[0])}
          />
        </FormField>
      </Col>

      {(clusterLabels ||
        clusterLabelLimit ||
        outliers ||
        densityHeatmap ||
        mapLabels ||
        compareProjections) && (
        <Col gap="m">
          {clusterLabels && (
            <VisibilityControl
              control={clusterLabels}
              label="Show cluster labels"
            />
          )}
          {clusterLabelLimit && (
            <FormField
              label="Cluster label limit"
              additionalText={clusterLabelLimitState?.message}
            >
              <RiSelect
                aria-label="Cluster label limit"
                disabled={clusterLabelLimitState?.disabled}
                loading={loading || clusterLabelLimit.loading}
                options={clusterLabelLimit.options}
                value={clusterLabelLimit.value}
                valueRender={defaultValueRender}
                onChange={clusterLabelLimit.onChange}
              />
            </FormField>
          )}
          {outliers && (
            <VisibilityControl control={outliers} label="Show outliers" />
          )}
          {densityHeatmap && (
            <VisibilityControl
              control={densityHeatmap}
              label="Show density heatmap"
            />
          )}
          {mapLabels && (
            <VisibilityControl
              control={mapLabels}
              label="Show cluster labels on map"
            />
          )}
          {compareProjections && (
            <VisibilityControl
              control={compareProjections}
              label={compareProjections.label}
            />
          )}
        </Col>
      )}

      {summary && (
        <S.Summary aria-label="Sampling and freshness summary">
          {summary.sampleCount !== undefined && (
            <>
              <dt>Sample</dt>
              <dd>{summary.sampleCount.toLocaleString()}</dd>
            </>
          )}
          {summary.sourceCount !== undefined && (
            <>
              <dt>Source</dt>
              <dd>{summary.sourceCount.toLocaleString()}</dd>
            </>
          )}
          {summary.samplingMethod && (
            <>
              <dt>Method</dt>
              <dd>{summary.samplingMethod}</dd>
            </>
          )}
          {summary.projectionAlgorithm && (
            <>
              <dt>Projection</dt>
              <dd>{summary.projectionAlgorithm}</dd>
            </>
          )}
          {summary.seed !== undefined && (
            <>
              <dt>Seed</dt>
              <dd>{summary.seed}</dd>
            </>
          )}
          {summary.freshness && (
            <>
              <dt>Freshness</dt>
              <dd>{summary.freshness}</dd>
            </>
          )}
          {summary.quality && (
            <>
              <dt>Quality</dt>
              <dd>{summary.quality}</dd>
            </>
          )}
        </S.Summary>
      )}
    </S.Fields>
  )
}

export const VectorVisualizerControls = (
  props: VectorVisualizerControlsProps,
) => (
  <S.Controls
    aria-label="Vector visualizer controls"
    data-testid="vector-visualizer-controls"
  >
    <ControlsBody {...props} />
  </S.Controls>
)
