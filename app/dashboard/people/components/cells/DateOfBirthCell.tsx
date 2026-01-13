'use client'

import { memo } from 'react'
import { TableCell } from '@/components/ui/table'
import { InlineDateEditor } from '../InlineDateEditor'
import { formatDateOfBirth } from '../member-table-types'
import { cn } from '@/lib/utils'
import type { DateOfBirthCellProps } from './types'

export const DateOfBirthCell = memo(function DateOfBirthCell({
  member,
  columnKey,
  getColumnStyle,
  getFrozenClasses,
  canEditOfflineProfile,
  isUpdatingProfile,
  onProfileChange,
}: DateOfBirthCellProps) {
  return (
    <TableCell
      className={cn('text-muted-foreground', getFrozenClasses(columnKey))}
      style={getColumnStyle(columnKey)}
    >
      {canEditOfflineProfile ? (
        <InlineDateEditor
          value={member.date_of_birth}
          onChange={(date) => onProfileChange(member.id, { dateOfBirth: date })}
          disabled={isUpdatingProfile}
          canEdit={true}
        />
      ) : (
        formatDateOfBirth(member.date_of_birth)
      )}
    </TableCell>
  )
})
