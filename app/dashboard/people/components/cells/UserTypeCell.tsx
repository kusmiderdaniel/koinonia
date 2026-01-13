'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
import { TableCell } from '@/components/ui/table'
import type { UserTypeCellProps } from './types'

export const UserTypeCell = memo(function UserTypeCell({
  member,
  columnKey,
  getColumnStyle,
  getFrozenClasses,
}: UserTypeCellProps) {
  const t = useTranslations('people')

  return (
    <TableCell className={getFrozenClasses(columnKey)} style={getColumnStyle(columnKey)}>
      {member.member_type === 'offline' ? (
        <span className="inline-flex items-center bg-amber-50 text-amber-700 border-amber-200 border rounded-full px-2 py-0.5 text-xs font-medium">
          {t('offline')}
        </span>
      ) : (
        <span className="inline-flex items-center bg-emerald-50 text-emerald-700 border-emerald-200 border rounded-full px-2 py-0.5 text-xs font-medium">
          {t('live')}
        </span>
      )}
    </TableCell>
  )
})
