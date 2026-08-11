import React from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from 'uiSrc/components/base/forms/buttons'
import { Text } from 'uiSrc/components/base/text'
import { FieldTypes } from 'uiSrc/pages/browser/components/create-redisearch-index/constants'
import { useIndexInfo } from 'uiSrc/pages/vector-search/hooks/useIndexInfo/useIndexInfo'

import * as S from './ListContent.styles'

interface Props {
  indexName: string
  onCancel: () => void
  onSelect: (field: string) => void
}

export const VectorFieldPicker = ({ indexName, onCancel, onSelect }: Props) => {
  const { t } = useTranslation()
  const { indexInfo, loading, error } = useIndexInfo({ indexName })
  const vectorFields =
    indexInfo?.attributes.filter(({ type }) => type === FieldTypes.VECTOR) ?? []

  return (
    <S.VectorFieldPicker data-testid="vector-search-vector-field-picker">
      <Text>{t('vectorVisualizer.fieldPicker.select')}</Text>
      {loading && (
        <Text data-testid="vector-search-vector-field-loading">
          {t('vectorVisualizer.fieldPicker.loading')}
        </Text>
      )}
      {error && (
        <Text data-testid="vector-search-vector-field-error">
          {t('vectorVisualizer.fieldPicker.error')}
        </Text>
      )}
      {!loading && !error && vectorFields.length === 0 && (
        <Text data-testid="vector-search-vector-field-empty">
          {t('vectorVisualizer.fieldPicker.empty')}
        </Text>
      )}
      {!loading &&
        !error &&
        vectorFields.map(({ attribute }) => (
          <Button
            key={attribute}
            onClick={() => onSelect(attribute)}
            data-testid={`vector-search-visualize-field-${attribute}`}
          >
            {attribute}
          </Button>
        ))}
      <Button onClick={onCancel}>
        {t('vectorVisualizer.fieldPicker.cancel')}
      </Button>
    </S.VectorFieldPicker>
  )
}
