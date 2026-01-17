'use client'

import { memo } from 'react'
import { TableCell } from '@/components/ui/table'
import { InlineDateEditor } from '../InlineDateEditor'
import { cn } from '@/lib/utils'
import type { BaptismDateCellProps } from './types'

export const BaptismDateCell = memo(function BaptismDateCell({
  member,
  columnKey,
  getColumnStyle,
  getFrozenClasses,
  canEditFields,
  isUpdatingBaptism,
  onBaptismChange,
}: BaptismDateCellProps) {
  return (
    <TableCell
      className={cn('text-muted-foreground', getFrozenClasses(columnKey))}
      style={getColumnStyle(columnKey)}
    >
      <div className="flex justify-center">
        <InlineDateEditor
          value={member.baptism_date}
          onChange={(date) => onBaptismChange(member.id, date ? true : member.baptism, date)}
          disabled={isUpdatingBaptism}
          canEdit={canEditFields}
        />
      </div>
    </TableCell>
  )
})
