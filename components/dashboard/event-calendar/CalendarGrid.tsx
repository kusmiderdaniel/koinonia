'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { CalendarDayCell } from './CalendarDayCell'
import { DAYS_SUNDAY_START_KEYS, DAYS_MONDAY_START_KEYS, EVENT_TYPE_HEX_COLORS } from './constants'
import { formatTime } from './utils'
import type { CalendarEvent } from '@/app/dashboard/actions'

interface CalendarGridProps {
  calendarDays: (number | null)[]
  firstDayOfWeek: number
  currentMonth: number
  currentYear: number
  selectedDay: number | null
  timeFormat: '12h' | '24h'
  events: CalendarEvent[]
  getEventsForDay: (day: number) => CalendarEvent[]
  onDayClick: (day: number) => void
}

interface SpanningEvent {
  event: CalendarEvent
  startCol: number
  endCol: number
  row: number
  isMultiDay: boolean
}

export function CalendarGrid({
  calendarDays,
  firstDayOfWeek,
  currentMonth,
  currentYear,
  selectedDay,
  timeFormat,
  events,
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

  // Identify multi-day events
  const multiDayEvents = useMemo(() => {
    return events.filter((event) => {
      const startDate = new Date(event.start_time)
      const endDate = event.end_time ? new Date(event.end_time) : startDate
      return startDate.toDateString() !== endDate.toDateString()
    })
  }, [events])

  const multiDayEventIds = useMemo(() => {
    return new Set(multiDayEvents.map(e => e.id))
  }, [multiDayEvents])

  // Split calendar into weeks
  const weeks = useMemo(() => {
    const result: (number | null)[][] = []
    for (let i = 0; i < calendarDays.length; i += 7) {
      result.push(calendarDays.slice(i, i + 7))
    }
    return result
  }, [calendarDays])

  // Calculate spanning events for each week
  const weekSpanningEvents = useMemo(() => {
    return weeks.map((week, weekIndex) => {
      const spanningEvents: SpanningEvent[] = []
      const weekStartIndex = weekIndex * 7

      multiDayEvents.forEach((event) => {
        const startDate = new Date(event.start_time)
        const endDate = event.end_time ? new Date(event.end_time) : startDate

        // Find which columns this event spans in this week
        let startCol = -1
        let endCol = -1

        week.forEach((day, colIndex) => {
          if (day === null) return

          const cellDate = new Date(currentYear, currentMonth, day)
          const cellDateOnly = new Date(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate())
          const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
          const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())

          if (cellDateOnly >= startDateOnly && cellDateOnly <= endDateOnly) {
            if (startCol === -1) startCol = colIndex
            endCol = colIndex
          }
        })

        if (startCol !== -1) {
          spanningEvents.push({
            event,
            startCol,
            endCol,
            row: 0, // Will be assigned later
            isMultiDay: true,
          })
        }
      })

      // Sort by start date, then by duration (longer events first for better stacking)
      spanningEvents.sort((a, b) => {
        const aStart = new Date(a.event.start_time).getTime()
        const bStart = new Date(b.event.start_time).getTime()
        if (aStart !== bStart) return aStart - bStart
        // Longer events first
        const aDuration = a.endCol - a.startCol
        const bDuration = b.endCol - b.startCol
        return bDuration - aDuration
      })

      // Assign rows to avoid overlaps
      const rows: boolean[][] = []
      spanningEvents.forEach((spanEvent) => {
        let assignedRow = 0
        while (true) {
          if (!rows[assignedRow]) rows[assignedRow] = []
          // Check if this row is free for the span
          let isFree = true
          for (let col = spanEvent.startCol; col <= spanEvent.endCol; col++) {
            if (rows[assignedRow][col]) {
              isFree = false
              break
            }
          }
          if (isFree) {
            // Mark columns as occupied
            for (let col = spanEvent.startCol; col <= spanEvent.endCol; col++) {
              rows[assignedRow][col] = true
            }
            spanEvent.row = assignedRow
            break
          }
          assignedRow++
        }
      })

      return {
        events: spanningEvents,
        maxRows: rows.length,
      }
    })
  }, [weeks, multiDayEvents, currentMonth, currentYear])

  // Get single-day events for a day (excluding multi-day events)
  const getSingleDayEventsForDay = (day: number) => {
    return getEventsForDay(day).filter(e => !multiDayEventIds.has(e.id))
  }

  // Calculate corner positions for rounded edges
  const cornerInfo = useMemo(() => {
    const info: Record<number, { topLeft?: boolean; topRight?: boolean; bottomLeft?: boolean; bottomRight?: boolean }> = {}

    // Find first and last days
    const daysInMonth = calendarDays.filter(d => d !== null) as number[]
    const firstDay = Math.min(...daysInMonth)
    const lastDay = Math.max(...daysInMonth)

    // Find positions
    weeks.forEach((week, weekIndex) => {
      const isFirstWeek = weekIndex === 0
      const isLastWeek = weekIndex === weeks.length - 1

      week.forEach((day, colIndex) => {
        if (day === null) return

        const isFirstCol = colIndex === 0
        const isLastCol = colIndex === 6

        // Check if this is the first day in this column (for top corners on left edge)
        const isFirstDayInLeftCol = isFirstCol && !weeks.slice(0, weekIndex).some(w => w[0] != null)

        // Check if this is the last day in this column (for bottom corners on left edge)
        const isLastDayInLeftCol = isFirstCol && !weeks.slice(weekIndex + 1).some(w => w[0] != null)

        // Check if this is the first day in the rightmost column
        const isFirstDayInRightCol = isLastCol && !weeks.slice(0, weekIndex).some(w => w[6] != null)

        // Check if this is the last day in the rightmost column (use != to catch both null and undefined)
        const isLastDayInRightCol = isLastCol && !weeks.slice(weekIndex + 1).some(w => w[6] != null)

        // Top-left corners: first day of month OR first day in leftmost column
        if (day === firstDay || isFirstDayInLeftCol) {
          info[day] = { ...info[day], topLeft: true }
        }

        // Top-right corners: last day in first week OR first day in rightmost column
        if ((isFirstWeek && isLastCol) || (isFirstWeek && day === Math.max(...week.filter(d => d !== null) as number[])) || isFirstDayInRightCol) {
          info[day] = { ...info[day], topRight: true }
        }

        // Bottom-left corners: first day in last week OR last day in leftmost column
        if ((isLastWeek && isFirstCol) || (isLastWeek && day === Math.min(...week.filter(d => d !== null) as number[])) || isLastDayInLeftCol) {
          info[day] = { ...info[day], bottomLeft: true }
        }

        // Bottom-right corners: last day of month OR last day in rightmost column
        if (day === lastDay || isLastDayInRightCol) {
          info[day] = { ...info[day], bottomRight: true }
        }
      })
    })

    return info
  }, [weeks, calendarDays])

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

      {/* Calendar weeks - pt-px pl-px compensates for negative margins on cells */}
      <div className="flex flex-col pt-px pl-px">
        {weeks.map((week, weekIndex) => {
          const { events: spanningEvents, maxRows } = weekSpanningEvents[weekIndex]
          const spanningHeight = maxRows > 0 ? maxRows * 18 + 4 : 0 // 18px per row + 4px padding

          return (
            <div key={weekIndex} className="relative">
              {/* Day cells grid with spanning events inside */}
              <div className="grid grid-cols-7 relative">
                {/* Spanning events layer - positioned inside the cells (desktop only) */}
                {spanningEvents.length > 0 && (
                  <div
                    className="hidden md:block absolute inset-x-0 top-0 z-10 pointer-events-none"
                    style={{ height: spanningHeight }}
                  >
                    {spanningEvents.map((spanEvent) => {
                      const startPercent = (spanEvent.startCol / 7) * 100
                      const widthPercent = ((spanEvent.endCol - spanEvent.startCol + 1) / 7) * 100
                      const isAllDayEvent = spanEvent.event.event_type === 'birthday' || spanEvent.event.event_type === 'holiday'
                      const hexColor = EVENT_TYPE_HEX_COLORS[spanEvent.event.event_type] || '#6b7280'

                      return (
                        <div
                          key={`${spanEvent.event.id}-${weekIndex}`}
                          className="absolute rounded-r px-1.5 py-0.5 text-[10px] leading-tight truncate cursor-pointer hover:opacity-80 pointer-events-auto border-l-[3px]"
                          style={{
                            left: `calc(${startPercent}% + 4px)`,
                            width: `calc(${widthPercent}% - 8px)`,
                            top: spanEvent.row * 18 + 4,
                            height: 16,
                            borderLeftColor: hexColor,
                            backgroundColor: `${hexColor}25`,
                            color: hexColor,
                          }}
                          title={spanEvent.event.title}
                        >
                          {!isAllDayEvent && (
                            <span className="opacity-60 mr-1">
                              {formatTime(spanEvent.event.start_time, timeFormat)}
                            </span>
                          )}
                          {spanEvent.event.title}
                        </div>
                      )
                    })}
                  </div>
                )}

                {week.map((day, colIndex) => {
                  const globalIndex = weekIndex * 7 + colIndex

                  if (day === null) {
                    return <div key={`empty-${globalIndex}`} className="h-12 md:min-h-24 -mt-px -ml-px" />
                  }

                  // Count spanning events that actually cover this day/column
                  const spanningEventsOnThisDay = spanningEvents.filter(
                    (se) => colIndex >= se.startCol && colIndex <= se.endCol
                  ).length

                  return (
                    <CalendarDayCell
                      key={day}
                      day={day}
                      events={getSingleDayEventsForDay(day)}
                      allEvents={getEventsForDay(day)}
                      isToday={isToday(day)}
                      isSelected={selectedDay === day}
                      timeFormat={timeFormat}
                      spanningEventsHeight={spanningHeight}
                      spanningEventsCount={spanningEventsOnThisDay}
                      cornerRadius={cornerInfo[day]}
                      onClick={() => onDayClick(day)}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
