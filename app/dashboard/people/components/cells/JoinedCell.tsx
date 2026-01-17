'use client'

import { memo } from 'react'
import { TableCell } from '@/components/ui/table'
import { formatDate } from '../member-table-types'
import { cn } from '@/lib/utils'
import type { JoinedCellProps } from './types'

export const JoinedCell = memo(function JoinedCell({
  member,
  columnKey,
  getColumnStyle,
  getFrozenClasses,
}: JoinedCellProps) {
  return (
    <TableCell
      className={cn('text-muted-foreground', getFrozenClasses(columnKey))}
      style={getColumnStyle(columnKey)}
    >
      <div className="flex justify-center">
        {formatDate(member.created_at)}
      </div>
    </TableCell>
  )
})
