'use client'

import { useState, memo } from 'react'
import { useTranslations } from 'next-intl'
import { TableCell } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { DepartureReasonCellProps } from './types'

export const DepartureReasonCell = memo(function DepartureReasonCell({
  member,
  columnKey,
  getColumnStyle,
  getFrozenClasses,
  canEditDeparture,
  isUpdatingDeparture,
  onDepartureChange,
}: DepartureReasonCellProps) {
  const t = useTranslations('people')
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [reasonValue, setReasonValue] = useState(member.reason_for_departure || '')

  return (
    <TableCell
      className={cn('text-muted-foreground', getFrozenClasses(columnKey))}
      style={getColumnStyle(columnKey)}
    >
      {canEditDeparture ? (
        <Popover
          open={popoverOpen}
          onOpenChange={(open) => {
            setPopoverOpen(open)
            if (open) setReasonValue(member.reason_for_departure || '')
          }}
        >
          <PopoverTrigger asChild>
            <button className="text-left text-sm hover:bg-muted px-2 py-1 rounded min-w-[100px] max-w-[200px] truncate">
              {member.reason_for_departure || '—'}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 bg-white dark:bg-zinc-950 border shadow-lg">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('table.reasonForDeparture')}</label>
              <Textarea
                value={reasonValue}
                onChange={(e) => setReasonValue(e.target.value)}
                placeholder={t('table.enterReason')}
                className="min-h-[80px]"
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
                  disabled={isUpdatingDeparture}
                  onClick={() => {
                    onDepartureChange(member.id, member.date_of_departure, reasonValue || null)
                    setPopoverOpen(false)
                  }}
                >
                  {isUpdatingDeparture ? t('actions.saving') : t('actions.save')}
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      ) : (
        <span className="px-2 py-1 inline-block">{member.reason_for_departure || '—'}</span>
      )}
    </TableCell>
  )
})
