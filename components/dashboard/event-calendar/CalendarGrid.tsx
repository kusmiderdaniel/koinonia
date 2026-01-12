'use client'

import { useTranslations } from 'next-intl'
import { CalendarDayCell } from './CalendarDayCell'
import { DAYS_SUNDAY_START_KEYS, DAYS_MONDAY_START_KEYS } from './constants'
import type { CalendarEvent } from '@/app/dashboard/actions'

interface CalendarGridProps {
  calendarDays: (number | null)[]
  firstDayOfWeek: number
  currentMonth: number
  currentYear: number
  selectedDay: number | null
  timeFormat: '12h' | '24h'
  getEventsForDay: (day: number) => CalendarEvent[]
  onDayClick: (day: number) => void
}

export function CalendarGrid({
  calendarDays,
  firstDayOfWeek,
  currentMonth,
  currentYear,
  selectedDay,
  timeFormat,
  getEventsForDay,
  onDayClick,
}: CalendarGridProps) {
  const t = useTranslations('dashboard')
  const dayLabelKeys = firstDayOfWeek === 0 ? DAYS_SUNDAY_START_KEYS : DAYS_MONDAY_START_KEYS

  const isToday = (day: number) => {
    const today = new Date()
    return (
      today.getDate() === day &&
      today.getMonth() === currentMonth &&
      today.getFullYear() === currentYear
    )
  }

  return (
    <>
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {dayLabelKeys.map((dayKey) => {
          const dayLabel = t(`calendar.daysShort.${dayKey}`)
          return (
            <div
              key={dayKey}
              className="text-center text-xs md:text-sm font-medium text-muted-foreground py-2"
            >
              <span className="md:hidden">{dayLabel.charAt(0)}</span>
              <span className="hidden md:inline">{dayLabel}</span>
            </div>
          )
        })}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="h-12 md:min-h-24" />
          }

          return (
            <CalendarDayCell
              key={day}
              day={day}
              events={getEventsForDay(day)}
              isToday={isToday(day)}
              isSelected={selectedDay === day}
              timeFormat={timeFormat}
              onClick={() => onDayClick(day)}
            />
          )
        })}
      </div>
    </>
  )
}
