'use client'

import { useState, memo } from 'react'
import { useTranslations } from 'next-intl'
import { TableCell } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { EmailCellProps } from './types'

export const EmailCell = memo(function EmailCell({
  member,
  columnKey,
  getColumnStyle,
  getFrozenClasses,
  canEditOfflineProfile,
  isUpdatingProfile,
  onProfileChange,
}: EmailCellProps) {
  const t = useTranslations('people')
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [value, setValue] = useState(member.email || '')

  return (
    <TableCell
      className={cn('text-muted-foreground', getFrozenClasses(columnKey))}
      style={getColumnStyle(columnKey)}
    >
      {canEditOfflineProfile ? (
        <Popover
          open={popoverOpen}
          onOpenChange={(open) => {
            setPopoverOpen(open)
            if (open) setValue(member.email || '')
          }}
        >
          <PopoverTrigger asChild>
            <button
              disabled={isUpdatingProfile}
              className={cn(
                'h-8 text-sm text-left rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
                !member.email && 'text-muted-foreground/50',
                isUpdatingProfile && 'opacity-50 cursor-not-allowed'
              )}
            >
              {member.email || '—'}
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-64 bg-white dark:bg-zinc-950 border border-black dark:border-white shadow-lg"
            align="start"
          >
            <div className="space-y-2">
              <Input
                type="email"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={t('offlineMember.emailPlaceholder')}
                className="!border !border-black dark:!border-white"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="!border !border-black dark:!border-white"
                  onClick={() => setPopoverOpen(false)}
                >
                  {t('actions.cancel')}
                </Button>
                <Button
                  size="sm"
                  disabled={isUpdatingProfile}
                  onClick={() => {
                    onProfileChange(member.id, { email: value || null })
                    setPopoverOpen(false)
                  }}
                >
                  {isUpdatingProfile ? t('actions.saving') : t('actions.save')}
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      ) : (
        member.email || '—'
      )}
    </TableCell>
  )
})
