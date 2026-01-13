'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
import { TableCell } from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { GenderCellProps } from './types'

export const GenderCell = memo(function GenderCell({
  member,
  columnKey,
  getColumnStyle,
  getFrozenClasses,
  canEditOfflineProfile,
  isUpdatingProfile,
  onProfileChange,
}: GenderCellProps) {
  const t = useTranslations('people')

  return (
    <TableCell
      className={cn('text-muted-foreground', getFrozenClasses(columnKey))}
      style={getColumnStyle(columnKey)}
    >
      {canEditOfflineProfile ? (
        <Select
          value={member.sex || ''}
          onValueChange={(value) => onProfileChange(member.id, { sex: value || null })}
          disabled={isUpdatingProfile}
        >
          <SelectTrigger
            className={cn(
              'w-24 h-8 text-xs !border !border-black dark:!border-white',
              isUpdatingProfile && 'opacity-50'
            )}
          >
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent className="border border-black dark:border-white">
            <SelectItem value="male">{t('sex.male')}</SelectItem>
            <SelectItem value="female">{t('sex.female')}</SelectItem>
          </SelectContent>
        </Select>
      ) : member.sex ? (
        t(`sex.${member.sex}`)
      ) : (
        '—'
      )}
    </TableCell>
  )
})
