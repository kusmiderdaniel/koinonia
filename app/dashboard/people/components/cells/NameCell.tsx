'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
import { Trash2 } from 'lucide-react'
import { TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { NameCellProps } from './types'

export const NameCell = memo(function NameCell({
  member,
  columnKey,
  getColumnStyle,
  getFrozenClasses,
  currentUserId,
  canDeleteOffline,
  onDeleteOffline,
}: NameCellProps) {
  const t = useTranslations('people')

  return (
    <TableCell
      className={cn('font-medium', getFrozenClasses(columnKey))}
      style={getColumnStyle(columnKey)}
    >
      <div className="flex items-center gap-2">
        <span>
          {member.first_name} {member.last_name}
        </span>
        {member.id === currentUserId && (
          <span className="text-xs text-muted-foreground">{t('you')}</span>
        )}
        {member.member_type === 'offline' && canDeleteOffline && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
            onClick={() => onDeleteOffline(member)}
            title={t('deleteOffline.button')}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </TableCell>
  )
})
