import React, { useCallback } from 'react'
import { IconButton } from '@redis-ui/components'

import { useTranslation } from 'uiSrc/i18n'
import { Button } from 'uiSrc/components/base/forms/buttons'

import { ActionsCellProps } from '../../IndexList.types'
import {
  Menu,
  MenuContent,
  MenuDropdownArrow,
  MenuItem,
  MenuTrigger,
} from 'uiSrc/components/base/layout/menu'
import { MoreactionsIcon } from 'uiSrc/components/base/icons'
import { Row } from 'uiSrc/components/base/layout/flex'

export const ActionsCell = ({
  row,
  onQueryClick,
  actions = [],
}: ActionsCellProps) => {
  const { t } = useTranslation()
  const { id, name } = row

  const handleQueryClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      onQueryClick?.(name)
    },
    [onQueryClick, name],
  )

  return (
    <Row
      wrap
      data-testid={`index-actions-${id}`}
      gap="m"
      align="center"
      justify="center"
    >
      {onQueryClick && (
        <Button
          size="small"
          onClick={handleQueryClick}
          data-testid={`index-query-btn-${id}`}
        >
          {t('vectorSearch.list.action.query')}
        </Button>
      )}
      {actions.length > 0 && (
        <Menu data-testid={`index-actions-menu-${id}`}>
          <MenuTrigger>
            <IconButton
              icon={MoreactionsIcon}
              size="L"
              data-testid={`index-actions-menu-trigger-${id}`}
            />
          </MenuTrigger>
          <MenuContent placement="bottom" align="end">
            {actions.map((action) => {
              const ActionIcon = action.icon
              const handleActionClick = (e: React.MouseEvent) => {
                e.stopPropagation()
                action.callback(name)
              }
              return (
                <MenuItem.Compose
                  key={action.name}
                  variant={action.variant}
                  onClick={handleActionClick}
                  data-testid={`index-actions-${action.name.toLowerCase()}-btn-${id}`}
                >
                  {ActionIcon ? (
                    <ActionIcon
                      aria-hidden
                      color="currentColor"
                      customSize="16px"
                      data-testid={`index-actions-${action.name.toLowerCase()}-icon-${id}`}
                      style={{
                        flex: '0 0 16px',
                      }}
                    />
                  ) : null}
                  <MenuItem.Text>{action.label ?? action.name}</MenuItem.Text>
                </MenuItem.Compose>
              )
            })}
            <MenuDropdownArrow />
          </MenuContent>
        </Menu>
      )}
    </Row>
  )
}
