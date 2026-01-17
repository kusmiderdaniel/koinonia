'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('availability')
  // Format month name
  const monthName = calendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' })

  return (
    <div className="w-full">
      <Card className="w-full">
        <CardContent className="p-3 md:p-4">
          {/* Month navigation - above calendar */}
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 !border !border-black/20 dark:!border-white/20"
              onClick={onPrevMonth}
              disabled={!canGoPrevious}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium text-sm">{monthName}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 !border !border-black/20 dark:!border-white/20"
              onClick={onNextMonth}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

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
                'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800/40 rounded-lg',
              selectedStart:
                'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg',
              selectedRange:
                'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg',
            }}
            classNames={{
              caption_label: "hidden",
              month_caption: "hidden",
            }}
            className="rounded-md w-full [&_table]:w-full !p-0"
          />

          {/* Selection indicator */}
          {selectedStart && (
            <div className="mt-3 md:mt-4 p-2 md:p-3 bg-blue-50 dark:bg-blue-950/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="text-xs md:text-sm">
                  <span className="font-medium">{t('calendar.selected')} </span>
                  {selectedEnd ? (
                    <span>
                      {formatDateShort(selectedStart)} - {formatDateShort(selectedEnd)}
                    </span>
                  ) : (
                    <span>{formatDateShort(selectedStart)}</span>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClearSelection} aria-label="Clear selection">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {!selectedEnd && (
                <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    <span className="hidden sm:inline">{t('calendar.clickForRange')}</span>
                    <span className="sm:hidden">{t('calendar.tapForRange')}</span>
                  </span>
                  <Button size="sm" variant="outline" className="w-full sm:w-auto text-xs h-7 !border-black/20 dark:!border-white/20" onClick={onAddSingleDay}>
                    {t('calendar.addSingleDay')}
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
