'use client'

import { memo } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { TableCell } from '@/components/ui/table'
import type { ActiveCellProps } from './types'

export const ActiveCell = memo(function ActiveCell({
  member,
  columnKey,
  getColumnStyle,
  getFrozenClasses,
  canEditActiveStatus,
  isUpdatingActive,
  onActiveChange,
}: ActiveCellProps) {
  return (
    <TableCell className={getFrozenClasses(columnKey)} style={getColumnStyle(columnKey)}>
      <div className="flex justify-center">
        <Checkbox
          checked={member.active}
          onCheckedChange={(checked) => onActiveChange(member.id, checked as boolean)}
          disabled={!canEditActiveStatus || isUpdatingActive}
          className={isUpdatingActive ? 'opacity-50' : ''}
        />
      </div>
    </TableCell>
  )
})
