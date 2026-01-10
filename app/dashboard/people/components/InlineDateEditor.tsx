'use client'

import * as React from 'react'
import { format, parse, isValid } from 'date-fns'
import { cn } from '@/lib/utils'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { formatDate } from './member-table-types'

interface InlineDateEditorProps {
  value: string | null
  onChange: (date: string | null) => void
  disabled?: boolean
  canEdit: boolean
  placeholder?: string
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
}

export function InlineDateEditor({
  value,
  onChange,
  disabled = false,
  canEdit,
  placeholder = '—',
  weekStartsOn = 0,
}: InlineDateEditorProps) {
  const [open, setOpen] = React.useState(false)

  // Parse string value to Date for the calendar
  const selectedDate = React.useMemo(() => {
    if (!value) return undefined
    const date = parse(value, 'yyyy-MM-dd', new Date())
    return isValid(date) ? date : undefined
  }, [value])

  // Handle date selection
  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, 'yyyy-MM-dd'))
    } else {
      onChange(null)
    }
    setOpen(false)
  }

  if (!canEdit) {
    return (
      <span className="px-2 py-1 inline-block">
        {value ? formatDate(value) : placeholder}
      </span>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          disabled={disabled}
          className={cn(
            'h-8 px-2 text-sm text-left rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 min-w-[100px]',
            !selectedDate && 'text-muted-foreground/50',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {selectedDate ? formatDate(value!) : placeholder}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 bg-white dark:bg-zinc-950 border border-black dark:border-white shadow-lg"
        align="start"
      >
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          defaultMonth={selectedDate || new Date()}
          fromYear={1920}
          toYear={new Date().getFullYear() + 5}
          captionLayout="dropdown"
          weekStartsOn={weekStartsOn}
          classNames={{
            caption_label: 'hidden',
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
