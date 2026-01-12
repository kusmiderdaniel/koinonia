'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { FieldWrapper } from './FieldWrapper'
import type { DateFieldProps } from './types'

export function DateField({ field, value, error, onValueChange, weekStartsOn }: DateFieldProps) {
  const [mounted, setMounted] = useState(false)
  const dateValue = value ? new Date(value as string) : undefined

  // Prevent hydration mismatch from Radix UI ID generation
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <FieldWrapper field={field} error={error}>
      {mounted ? (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id={field.id}
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal !border !border-black dark:!border-white',
                !value && 'text-muted-foreground',
                error && '!border-red-500'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateValue ? format(dateValue, 'PPP') : 'Pick a date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto !p-0 !gap-0 !bg-white dark:!bg-zinc-900 border border-border shadow-md"
            align="start"
          >
            <Calendar
              mode="single"
              selected={dateValue}
              onSelect={(date) =>
                onValueChange(field.id, date ? format(date, 'yyyy-MM-dd') : '')
              }
              weekStartsOn={weekStartsOn}
              className="p-3"
              initialFocus
            />
          </PopoverContent>
        </Popover>
      ) : (
        <Button
          id={field.id}
          variant="outline"
          disabled
          className={cn(
            'w-full justify-start text-left font-normal !border !border-black dark:!border-white',
            !value && 'text-muted-foreground',
            error && '!border-red-500'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateValue ? format(dateValue, 'PPP') : 'Pick a date'}
        </Button>
      )}
    </FieldWrapper>
  )
}
