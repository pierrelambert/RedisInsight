import React from 'react'
import { Button } from 'uiSrc/components/base/forms/buttons'
import { Col } from 'uiSrc/components/base/layout/flex'
import { Text } from 'uiSrc/components/base/text'
import { IndexListProps } from 'uiSrc/pages/vector-search/components/index-list/IndexList.types'

export const IndexList = ({ data, actions, dataTestId }: IndexListProps) => (
  <Col gap="m" data-testid={dataTestId}>
    {data.map((row) => (
      <Col gap="s" key={row.id}>
        <Text>{row.name}</Text>
        {actions?.map((action) => (
          <Button
            key={action.name}
            onClick={() => action.callback(row.name)}
            aria-label={`${action.name} for ${row.name}`}
          >
            {action.label ?? action.name}
          </Button>
        ))}
      </Col>
    ))}
  </Col>
)
