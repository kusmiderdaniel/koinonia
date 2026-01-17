'use client'

import { memo } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { TableCell } from '@/components/ui/table'
import type { BaptizedCellProps } from './types'

export const BaptizedCell = memo(function BaptizedCell({
  member,
  columnKey,
  getColumnStyle,
  getFrozenClasses,
  canEditFields,
  isUpdatingBaptism,
  onBaptismChange,
}: BaptizedCellProps) {
  return (
    <TableCell className={getFrozenClasses(columnKey)} style={getColumnStyle(columnKey)}>
      <div className="flex justify-center">
        <Checkbox
          checked={member.baptism}
          onCheckedChange={(checked) => {
            const newBaptism = checked as boolean
            onBaptismChange(member.id, newBaptism, newBaptism ? member.baptism_date : null)
          }}
          disabled={!canEditFields || isUpdatingBaptism}
          className={isUpdatingBaptism ? 'opacity-50' : ''}
        />
      </div>
    </TableCell>
  )
})
