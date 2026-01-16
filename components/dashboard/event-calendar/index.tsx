'use client'

import { useState, useMemo, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Calendar } from 'lucide-react'
import { CalendarHeader } from './CalendarHeader'
import { CalendarGrid } from './CalendarGrid'
import { CalendarLegend } from './CalendarLegend'
import { EventsDialog } from './EventsDialog'
import { getDaysInMonth, getFirstDayOffset, buildCalendarDays } from './utils'
import type { CalendarEvent } from '@/app/dashboard/actions'

interface EventCalendarProps {
  events: CalendarEvent[]
  firstDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6
  timeFormat?: '12h' | '24h'
  onMonthChange?: (month: number, year: number) => void
  hideTitle?: boolean
  hideCard?: boolean
}

export function EventCalendar({
  events,
  firstDayOfWeek = 1,
  timeFormat = '24h',
  onMonthChange,
  hideTitle = false,
  hideCard = false,
}: EventCalendarProps) {
  const t = useTranslations('dashboard')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDayOffset = getFirstDayOffset(currentYear, currentMonth, firstDayOfWeek)
  const calendarDays = useMemo(
    () => buildCalendarDays(firstDayOffset, daysInMonth),
    [firstDayOffset, daysInMonth]
  )

  // Group events by day (multi-day events appear on all days they span)
  const eventsByDay = useMemo(() => {
    const map = new Map<number, CalendarEvent[]>()

    events.forEach((event) => {
      const startDate = new Date(event.start_time)
      const endDate = event.end_time ? new Date(event.end_time) : startDate

      // Get the range of days this event spans within the current month
      const monthStart = new Date(currentYear, currentMonth, 1)
      const monthEnd = new Date(currentYear, currentMonth + 1, 0) // Last day of month

      // Clamp the event's date range to the current month
      const effectiveStart = startDate < monthStart ? monthStart : startDate
      const effectiveEnd = endDate > monthEnd ? monthEnd : endDate

      // Only process if the event overlaps with the current month
      if (effectiveStart <= monthEnd && effectiveEnd >= monthStart) {
        const startDay = effectiveStart.getMonth() === currentMonth && effectiveStart.getFullYear() === currentYear
          ? effectiveStart.getDate()
          : 1
        const endDay = effectiveEnd.getMonth() === currentMonth && effectiveEnd.getFullYear() === currentYear
          ? effectiveEnd.getDate()
          : daysInMonth

        // Add the event to each day it spans
        for (let day = startDay; day <= endDay; day++) {
          if (!map.has(day)) {
            map.set(day, [])
          }
          map.get(day)!.push(event)
        }
      }
    })

    // Sort events within each day by start time
    map.forEach((dayEvents) => {
      dayEvents.sort(
        (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      )
    })

    return map
  }, [events, currentMonth, currentYear, daysInMonth])

  const getEventsForDay = useCallback(
    (day: number) => eventsByDay.get(day) || [],
    [eventsByDay]
  )

  const goToPreviousMonth = useCallback(() => {
    const newDate = new Date(currentYear, currentMonth - 1, 1)
    setCurrentDate(newDate)
    setSelectedDay(null)
    onMonthChange?.(newDate.getMonth(), newDate.getFullYear())
  }, [currentYear, currentMonth, onMonthChange])

  const goToNextMonth = useCallback(() => {
    const newDate = new Date(currentYear, currentMonth + 1, 1)
    setCurrentDate(newDate)
    setSelectedDay(null)
    onMonthChange?.(newDate.getMonth(), newDate.getFullYear())
  }, [currentYear, currentMonth, onMonthChange])

  const goToToday = useCallback(() => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDay(today.getDate())
    onMonthChange?.(today.getMonth(), today.getFullYear())
  }, [onMonthChange])

  const handleDayClick = useCallback((day: number) => {
    const dayEvents = getEventsForDay(day)
    setSelectedDay(day)
    if (dayEvents.length > 0) {
      setSheetOpen(true)
    }
  }, [getEventsForDay])

  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : []

  const calendarContent = (
    <>
      <CalendarGrid
        calendarDays={calendarDays}
        firstDayOfWeek={firstDayOfWeek}
        currentMonth={currentMonth}
        currentYear={currentYear}
        selectedDay={selectedDay}
        timeFormat={timeFormat}
        getEventsForDay={getEventsForDay}
        onDayClick={handleDayClick}
      />
      <CalendarLegend />
    </>
  )

  return (
    <>
      <div className="h-full">
        {!hideTitle && (
          <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
            <Calendar className="h-5 w-5" />
            {t('calendar.title')}
          </h2>
        )}
        {hideCard ? (
          <>
            <CalendarHeader
              currentMonth={currentMonth}
              currentYear={currentYear}
              hideCard={hideCard}
              onPreviousMonth={goToPreviousMonth}
              onNextMonth={goToNextMonth}
              onToday={goToToday}
            />
            {calendarContent}
          </>
        ) : (
          <Card className="border border-black dark:border-zinc-700">
            <CardHeader className="pt-5 pb-2">
              <CalendarHeader
                currentMonth={currentMonth}
                currentYear={currentYear}
                onPreviousMonth={goToPreviousMonth}
                onNextMonth={goToNextMonth}
                onToday={goToToday}
              />
            </CardHeader>
            <CardContent className="p-2 md:p-4">
              {calendarContent}
            </CardContent>
          </Card>
        )}
      </div>

      <EventsDialog
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        selectedDay={selectedDay}
        currentMonth={currentMonth}
        currentYear={currentYear}
        events={selectedDayEvents}
        timeFormat={timeFormat}
      />
    </>
  )
}
