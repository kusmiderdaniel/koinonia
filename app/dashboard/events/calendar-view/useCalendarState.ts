'use client'

import { useState, useMemo, useCallback } from 'react'
import type { Event } from '../types'

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(
  year: number,
  month: number,
  firstDayOfWeek: number
) {
  const jsDay = new Date(year, month, 1).getDay()
  return (jsDay - firstDayOfWeek + 7) % 7
}

export function useCalendarState(events: Event[], firstDayOfWeek: number) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDayOffset = getFirstDayOfMonth(
    currentYear,
    currentMonth,
    firstDayOfWeek
  )

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, Event[]>()

    events.forEach((event) => {
      const date = new Date(event.start_time)
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`

      if (!map.has(key)) {
        map.set(key, [])
      }
      map.get(key)!.push(event)
    })

    // Sort events within each day by start time
    map.forEach((dayEvents) => {
      dayEvents.sort(
        (a, b) =>
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      )
    })

    return map
  }, [events])

  const getEventsForDate = useCallback(
    (day: number) => {
      const key = `${currentYear}-${currentMonth}-${day}`
      return eventsByDate.get(key) || []
    },
    [eventsByDate, currentYear, currentMonth]
  )

  const goToPreviousMonth = useCallback(() => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1))
    setSelectedDate(null)
  }, [currentYear, currentMonth])

  const goToNextMonth = useCallback(() => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1))
    setSelectedDate(null)
  }, [currentYear, currentMonth])

  const goToToday = useCallback(() => {
    setCurrentDate(new Date())
    setSelectedDate(new Date())
  }, [])

  const isToday = useCallback(
    (day: number) => {
      const today = new Date()
      return (
        today.getDate() === day &&
        today.getMonth() === currentMonth &&
        today.getFullYear() === currentYear
      )
    },
    [currentMonth, currentYear]
  )

  const isSelected = useCallback(
    (day: number) => {
      return (
        selectedDate &&
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === currentMonth &&
        selectedDate.getFullYear() === currentYear
      )
    },
    [selectedDate, currentMonth, currentYear]
  )

  const handleDateClick = useCallback(
    (day: number) => {
      setSelectedDate(new Date(currentYear, currentMonth, day))
    },
    [currentYear, currentMonth]
  )

  // Get events for selected date
  const selectedDateEvents = selectedDate
    ? getEventsForDate(selectedDate.getDate())
    : []

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const days: (number | null)[] = []

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOffset; i++) {
      days.push(null)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }

    return days
  }, [firstDayOffset, daysInMonth])

  return {
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
  }
}
