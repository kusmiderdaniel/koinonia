'use client'

import { useState, useCallback, useMemo } from 'react'
import type { Unavailability } from '../types'
import { toDateString, getFirstDayOfCurrentMonth } from '../types'

interface UseCalendarSelectionReturn {
  // State
  selectedStart: Date | null
  selectedEnd: Date | null
  calendarMonth: Date

  // Computed
  selectedRange: Date[]
  canGoPrevious: boolean
  disabledDays: { before: Date }

  // Actions
  handleDayClick: (
    day: Date,
    unavailability: Unavailability[],
    onExistingClick: (item: Unavailability) => void,
    onRangeComplete: () => void
  ) => void
  handleAddSingleDay: (onComplete: () => void) => void
  handleClearSelection: () => void
  handleMonthChange: (newMonth: Date) => void
  setSelectedStart: (date: Date | null) => void
  setSelectedEnd: (date: Date | null) => void
}

export function useCalendarSelection(): UseCalendarSelectionReturn {
  const [selectedStart, setSelectedStart] = useState<Date | null>(null)
  const [selectedEnd, setSelectedEnd] = useState<Date | null>(null)
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date())

  const handleDayClick = useCallback(
    (
      day: Date,
      unavailability: Unavailability[],
      onExistingClick: (item: Unavailability) => void,
      onRangeComplete: () => void
    ) => {
      // Check if this date is already unavailable
      const dateStr = toDateString(day)
      const existingItem = unavailability.find(
        (item) => dateStr >= item.start_date && dateStr <= item.end_date
      )

      if (existingItem) {
        // Open edit dialog for this unavailability
        onExistingClick(existingItem)
        return
      }

      if (!selectedStart) {
        // First click - set start date
        setSelectedStart(day)
        setSelectedEnd(null)
      } else if (!selectedEnd) {
        // Second click - set end date if it's after start
        if (day >= selectedStart) {
          setSelectedEnd(day)
          // Open dialog to add reason
          onRangeComplete()
        } else {
          // If clicked before start, reset and use this as new start
          setSelectedStart(day)
          setSelectedEnd(null)
        }
      } else {
        // Both already selected, start fresh
        setSelectedStart(day)
        setSelectedEnd(null)
      }
    },
    [selectedStart, selectedEnd]
  )

  const handleAddSingleDay = useCallback(
    (onComplete: () => void) => {
      if (selectedStart) {
        setSelectedEnd(selectedStart)
        onComplete()
      }
    },
    [selectedStart]
  )

  const handleClearSelection = useCallback(() => {
    setSelectedStart(null)
    setSelectedEnd(null)
  }, [])

  const handleMonthChange = useCallback((newMonth: Date) => {
    const firstOfCurrentMonth = getFirstDayOfCurrentMonth()
    if (newMonth >= firstOfCurrentMonth) {
      setCalendarMonth(newMonth)
    }
  }, [])

  // Check if we can go to previous month
  const canGoPrevious = useMemo(() => {
    const firstOfCurrentMonth = getFirstDayOfCurrentMonth()
    const firstOfDisplayedMonth = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth(),
      1
    )
    return firstOfDisplayedMonth > firstOfCurrentMonth
  }, [calendarMonth])

  // Determine which dates to show as selected range on calendar (excluding start date)
  const selectedRange = useMemo(() => {
    if (!selectedStart || !selectedEnd) return []

    const dates: Date[] = []
    const current = new Date(selectedStart)
    current.setDate(current.getDate() + 1) // Start from day after selectedStart
    while (current <= selectedEnd) {
      dates.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    return dates
  }, [selectedStart, selectedEnd])

  // Disable days before current month
  const disabledDays = useMemo(() => {
    const firstOfCurrentMonth = getFirstDayOfCurrentMonth()
    return { before: firstOfCurrentMonth }
  }, [])

  return {
    // State
    selectedStart,
    selectedEnd,
    calendarMonth,

    // Computed
    selectedRange,
    canGoPrevious,
    disabledDays,

    // Actions
    handleDayClick,
    handleAddSingleDay,
    handleClearSelection,
    handleMonthChange,
    setSelectedStart,
    setSelectedEnd,
  }
}
