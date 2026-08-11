import React from 'react'
import { Button } from 'uiSrc/components/base/forms/buttons'

export const AddItemsAction = ({
  openAddItemPanel,
}: {
  openAddItemPanel: () => void
}) => <Button onClick={openAddItemPanel}>Add elements</Button>
