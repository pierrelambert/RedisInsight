import React, { ReactNode } from 'react'

export default function AutoSizer({
  children,
}: {
  children: (size: { width: number; height: number }) => ReactNode
}) {
  return <>{children({ width: 900, height: 120 })}</>
}
