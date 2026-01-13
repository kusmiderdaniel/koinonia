'use client'

import { memo } from 'react'
import { TableCell } from '@/components/ui/table'
import { InlineDateEditor } from '../InlineDateEditor'
import { cn } from '@/lib/utils'
import type { DepartureDateCellProps } from './types'

export const DepartureDateCell = memo(function DepartureDateCell({
  member,
  columnKey,
  getColumnStyle,
  getFrozenClasses,
  canEditDeparture,
  isUpdatingDeparture,
  onDepartureChange,
}: DepartureDateCellProps) {
  return (
    <TableCell
      className={cn('text-muted-foreground', getFrozenClasses(columnKey))}
      style={getColumnStyle(columnKey)}
    >
      <InlineDateEditor
        value={member.date_of_departure}
        onChange={(date) => onDepartureChange(member.id, date, member.reason_for_departure)}
        disabled={isUpdatingDeparture}
        canEdit={canEditDeparture}
      />
    </TableCell>
  )
})
