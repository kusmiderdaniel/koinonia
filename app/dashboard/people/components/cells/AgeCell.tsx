'use client'

import { memo } from 'react'
import { TableCell } from '@/components/ui/table'
import { calculateAge } from '../member-table-types'
import { cn } from '@/lib/utils'
import type { AgeCellProps } from './types'

export const AgeCell = memo(function AgeCell({
  member,
  columnKey,
  getColumnStyle,
  getFrozenClasses,
}: AgeCellProps) {
  return (
    <TableCell
      className={cn('text-muted-foreground', getFrozenClasses(columnKey))}
      style={getColumnStyle(columnKey)}
    >
      {calculateAge(member.date_of_birth)}
    </TableCell>
  )
})
