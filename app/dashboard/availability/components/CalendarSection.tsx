'use client'

import { memo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatDateShort } from '../types'

export interface CalendarSectionProps {
  calendarMonth: Date
  firstDayOfWeek: 0 | 1
  unavailableDates: Date[]
  selectedStart: Date | null
  selectedEnd: Date | null
  selectedRange: Date[]
  canGoPrevious: boolean
  disabledDays: { before: Date }
  onDayClick: (day: Date) => void
  onPrevMonth: () => void
  onNextMonth: () => void
  onClearSelection: () => void
  onAddSingleDay: () => void
}

export const CalendarSection = memo(function CalendarSection({
  calendarMonth,
  firstDayOfWeek,
  unavailableDates,
  selectedStart,
  selectedEnd,
  selectedRange,
  canGoPrevious,
  disabledDays,
  onDayClick,
  onPrevMonth,
  onNextMonth,
  onClearSelection,
  onAddSingleDay,
}: CalendarSectionProps) {
  return (
    <div>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <Calendar
              mode="single"
              month={calendarMonth}
              onMonthChange={() => {}}
              selected={undefined}
              onSelect={(day) => day && onDayClick(day)}
              disabled={disabledDays}
              hideNavigation
              weekStartsOn={firstDayOfWeek}
              modifiers={{
                unavailable: unavailableDates,
                selectedStart: selectedStart ? [selectedStart] : [],
                selectedRange: selectedRange,
              }}
              modifiersClassNames={{
                unavailable:
                  'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800/40',
                selectedStart:
                  'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
                selectedRange:
                  'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
              }}
              className="rounded-md"
            />
            {/* Custom month navigation */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={onPrevMonth}
                disabled={!canGoPrevious}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={onNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Selection indicator */}
          {selectedStart && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium">Selected: </span>
                  {selectedEnd ? (
                    <span>
                      {formatDateShort(selectedStart)} - {formatDateShort(selectedEnd)}
                    </span>
                  ) : (
                    <span>{formatDateShort(selectedStart)}</span>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClearSelection}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {!selectedEnd && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Click another date for a range, or
                  </span>
                  <Button size="sm" onClick={onAddSingleDay}>
                    Add Single Day
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
})
