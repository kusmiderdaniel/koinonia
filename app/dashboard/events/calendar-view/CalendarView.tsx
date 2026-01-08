'use client'

import { memo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCalendarState } from './useCalendarState'
import { DayCell } from './DayCell'
import { SelectedDayPanel } from './SelectedDayPanel'
import { MONTHS, DAYS_SUNDAY_START, DAYS_MONDAY_START } from './types'
import type { CalendarViewProps } from './types'

export const CalendarView = memo(function CalendarView({
  events,
  firstDayOfWeek = 1,
  timeFormat = '24h',
  onEventSelect,
  leftPanelContent,
}: CalendarViewProps) {
  const {
    currentYear,
    currentMonth,
    selectedDate,
    calendarDays,
    selectedDateEvents,
    getEventsForDate,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    isToday,
    isSelected,
    handleDateClick,
  } = useCalendarState(events, firstDayOfWeek)

  // Choose day labels based on first day of week setting
  const dayLabels = firstDayOfWeek === 0 ? DAYS_SUNDAY_START : DAYS_MONDAY_START

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Calendar or Event Details */}
      <div className="flex-1 min-w-0">
        {leftPanelContent ? (
          leftPanelContent
        ) : (
          <Card className="h-full overflow-auto border border-black dark:border-zinc-700">
            <CardContent className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">
                  {MONTHS[currentMonth]} {currentYear}
                </h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={goToToday}
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    onClick={goToPreviousMonth}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    onClick={goToNextMonth}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2">
                {dayLabels.map((day) => (
                  <div
                    key={day}
                    className="text-center text-sm font-medium text-muted-foreground py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                  if (day === null) {
                    return <div key={`empty-${index}`} className="h-24" />
                  }

                  const dayEvents = getEventsForDate(day)

                  return (
                    <DayCell
                      key={day}
                      day={day}
                      events={dayEvents}
                      isToday={isToday(day)}
                      isSelected={!!isSelected(day)}
                      onClick={() => handleDateClick(day)}
                    />
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right panel - selected day's events */}
      <div className="lg:w-96 flex-shrink-0">
        <SelectedDayPanel
          selectedDate={selectedDate}
          events={selectedDateEvents}
          timeFormat={timeFormat}
          onEventSelect={onEventSelect}
        />
      </div>
    </div>
  )
})
