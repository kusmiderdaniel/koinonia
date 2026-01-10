'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { format, parseISO, isToday, isPast, isValid } from 'date-fns'
import { Calendar as CalendarIcon, X } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface InlineDueDateEditorProps {
  dueDate: string | null
  onUpdate: (dueDate: Date | null) => Promise<void>
  disabled?: boolean
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
}

export function InlineDueDateEditor({
  dueDate,
  onUpdate,
  disabled = false,
  weekStartsOn = 0,
}: InlineDueDateEditorProps) {
  const t = useTranslations('tasks')
  const [open, setOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const dateInfo = useMemo(() => {
    if (!dueDate) return null
    const date = parseISO(dueDate)
    if (!isValid(date)) return null

    // Always show DD/MM/YYYY format, but color overdue dates red
    const label = format(date, 'dd/MM/yyyy')
    const className = isPast(date) && !isToday(date) ? 'text-red-600' : 'text-muted-foreground'
    return { label, className, date }
  }, [dueDate])

  const handleSelect = async (date: Date | undefined) => {
    if (isUpdating) return
    setIsUpdating(true)
    setOpen(false)
    try {
      await onUpdate(date || null)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleClear = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isUpdating) return
    setIsUpdating(true)
    try {
      await onUpdate(null)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled || isUpdating}>
        <button
          className={cn(
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded text-left',
            isUpdating && 'opacity-50'
          )}
        >
          <span className="flex items-center gap-1 text-sm hover:bg-muted px-2 py-1 rounded group">
            <CalendarIcon className="h-3 w-3 text-muted-foreground shrink-0" />
            {dateInfo ? (
              <>
                <span className={cn('truncate', dateInfo.className)}>
                  {dateInfo.label}
                </span>
                <span
                  role="button"
                  onClick={handleClear}
                  className="opacity-0 group-hover:opacity-100 hover:text-red-600 ml-1 shrink-0 cursor-pointer"
                  title={t('inlineEditor.clearDueDate')}
                >
                  <X className="h-3 w-3" />
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">{t('inlineEditor.noDate')}</span>
            )}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 bg-white dark:bg-zinc-950 border shadow-lg"
        align="start"
      >
        <Calendar
          mode="single"
          selected={dateInfo?.date}
          onSelect={handleSelect}
          defaultMonth={dateInfo?.date || new Date()}
          weekStartsOn={weekStartsOn}
          className="p-2"
          classNames={{
            caption_label: "text-sm font-medium",
            month_caption: "flex justify-center relative items-center h-7",
            nav: "absolute inset-x-0 flex items-center justify-between",
            button_previous: "h-6 w-6 bg-transparent p-0 opacity-50 hover:opacity-100",
            button_next: "h-6 w-6 bg-transparent p-0 opacity-50 hover:opacity-100",
            day: "text-center text-sm h-8 w-8 p-0",
            day_button: "h-8 w-8 p-0 font-normal text-sm",
            weekday: "text-muted-foreground w-8 font-normal text-xs text-center",
            week: "flex justify-between mt-1",
            month: "space-y-2",
          }}
        />
        {dateInfo && (
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={() => handleSelect(undefined)}
            >
              <X className="h-4 w-4 mr-2" />
              {t('inlineEditor.clearDate')}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
