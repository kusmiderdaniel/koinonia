'use client'

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
  const dateValue = value ? new Date(value as string) : undefined

  return (
    <FieldWrapper field={field} error={error}>
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
    </FieldWrapper>
  )
}
