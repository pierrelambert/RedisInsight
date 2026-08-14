import React from 'react'
import { IconButton as RedisUiIconButton } from '@redis-ui/components'
import * as Icons from 'uiSrc/components/base/icons/iconRegistry'
import { AllIconsType } from 'uiSrc/components/base/icons'

export type ButtonProps = React.ComponentProps<typeof RedisUiIconButton>

export type IconType = ButtonProps['icon']
export type IconButtonProps = Omit<ButtonProps, 'icon'> & {
  icon: IconType | string
}

export const IconButton = React.forwardRef<
  React.ElementRef<typeof RedisUiIconButton>,
  IconButtonProps
>(({ icon, size: _size, ...props }, ref) => {
  const buttonIcon =
    typeof icon === 'string' ? Icons[icon as AllIconsType] : icon

  return <RedisUiIconButton ref={ref} icon={buttonIcon} {...props} />
})

IconButton.displayName = 'IconButton'
