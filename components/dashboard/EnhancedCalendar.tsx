'use client'

import { useState, useCallback, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { EventCalendar } from './EventCalendar'
import type { CalendarEvent, ChurchHoliday, CalendarBirthday } from '@/app/dashboard/actions'

interface EnhancedCalendarProps {
  events: CalendarEvent[]
  holidays: ChurchHoliday[]
  birthdays: CalendarBirthday[]
  firstDayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6
  timeFormat: '12h' | '24h'
  onMonthChange: (month: number, year: number) => void
}

/**
 * Enhanced calendar that shows events, holidays, and birthdays.
 * Merges all items into pseudo-events for display.
 */
export function EnhancedCalendar({
  events,
  holidays,
  birthdays,
  firstDayOfWeek,
  timeFormat,
  onMonthChange,
}: EnhancedCalendarProps) {
  const t = useTranslations('dashboard')
  const [currentDate, setCurrentDate] = useState(new Date())

  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()

  // Create a map of special dates (holidays and birthdays)
  const specialDates = useMemo(() => {
    const map = new Map<number, { holidays: ChurchHoliday[]; birthdays: CalendarBirthday[] }>()

    holidays.forEach((holiday) => {
      const date = new Date(holiday.date)
      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        const day = date.getDate()
        if (!map.has(day)) {
          map.set(day, { holidays: [], birthdays: [] })
        }
        map.get(day)!.holidays.push(holiday)
      }
    })

    birthdays.forEach((birthday) => {
      const date = new Date(birthday.date)
      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        const day = date.getDate()
        if (!map.has(day)) {
          map.set(day, { holidays: [], birthdays: [] })
        }
        map.get(day)!.birthdays.push(birthday)
      }
    })

    return map
  }, [holidays, birthdays, currentMonth, currentYear])

  const handleMonthChange = useCallback((month: number, year: number) => {
    setCurrentDate(new Date(year, month, 1))
    onMonthChange(month, year)
  }, [onMonthChange])

  // Merge events with holiday/birthday markers
  const enhancedEvents: CalendarEvent[] = useMemo(() => {
    const allEvents = [...events]

    // Add holidays as pseudo-events
    holidays.forEach((holiday) => {
      const date = new Date(holiday.date)
      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        allEvents.push({
          id: `holiday-${holiday.id}`,
          title: `⭐ ${holiday.name}`,
          description: holiday.description,
          start_time: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0).toISOString(),
          end_time: null,
          location: null,
          event_type: 'holiday' as string,
          campuses: [],
        })
      }
    })

    // Add birthdays as pseudo-events
    birthdays.forEach((birthday) => {
      const date = new Date(birthday.date)
      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        allEvents.push({
          id: `birthday-${birthday.id}`,
          title: `🎂 ${birthday.firstName} ${birthday.lastName}`,
          description: null,
          start_time: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0).toISOString(),
          end_time: null,
          location: null,
          event_type: 'birthday' as string,
          campuses: [],
        })
      }
    })

    return allEvents
  }, [events, holidays, birthdays, currentMonth, currentYear])

  return (
    <EventCalendar
      events={enhancedEvents}
      firstDayOfWeek={firstDayOfWeek}
      timeFormat={timeFormat}
      onMonthChange={handleMonthChange}
      hideTitle
      hideCard
    />
  )
}
