'use client'

import { useState, useMemo, memo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EVENT_TYPE_LABELS } from '@/lib/constants/event'
import { formatTimeFromDate } from '@/lib/utils/format'
import { CampusBadges } from '@/components/CampusBadge'
import type { Event } from './types'

interface CalendarViewProps {
  events: Event[]
  firstDayOfWeek?: number // 0 = Sunday, 1 = Monday (default)
  onEventSelect?: (event: Event) => void
  leftPanelContent?: React.ReactNode // Custom content to replace the calendar (e.g., event details)
}

// Calendar-specific colors (simpler, for dots/indicators)
const CALENDAR_EVENT_COLORS: Record<string, string> = {
  service: 'bg-blue-500',
  rehearsal: 'bg-purple-500',
  meeting: 'bg-green-500',
  special_event: 'bg-amber-500',
  other: 'bg-gray-500',
}

const DAYS_SUNDAY_START = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAYS_MONDAY_START = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number, firstDayOfWeek: number) {
  const jsDay = new Date(year, month, 1).getDay() // 0 = Sunday, 6 = Saturday
  // Adjust based on first day of week
  // If firstDayOfWeek is 1 (Monday), shift so Monday = 0, Sunday = 6
  return (jsDay - firstDayOfWeek + 7) % 7
}

const STATUS_BADGES: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
  draft: { variant: 'secondary', label: 'Draft' },
  published: { variant: 'default', label: 'Published' },
  cancelled: { variant: 'destructive', label: 'Cancelled' },
}

export const CalendarView = memo(function CalendarView({ events, firstDayOfWeek = 1, onEventSelect, leftPanelContent }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDayOffset = getFirstDayOfMonth(currentYear, currentMonth, firstDayOfWeek)

  // Choose day labels based on first day of week setting
  const dayLabels = firstDayOfWeek === 0 ? DAYS_SUNDAY_START : DAYS_MONDAY_START

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, Event[]>()

    events.forEach(event => {
      const date = new Date(event.start_time)
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`

      if (!map.has(key)) {
        map.set(key, [])
      }
      map.get(key)!.push(event)
    })

    // Sort events within each day by start time
    map.forEach((dayEvents) => {
      dayEvents.sort((a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      )
    })

    return map
  }, [events])

  const getEventsForDate = (day: number) => {
    const key = `${currentYear}-${currentMonth}-${day}`
    return eventsByDate.get(key) || []
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1))
    setSelectedDate(null)
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1))
    setSelectedDate(null)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(new Date())
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      today.getDate() === day &&
      today.getMonth() === currentMonth &&
      today.getFullYear() === currentYear
    )
  }

  const isSelected = (day: number) => {
    return (
      selectedDate &&
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentMonth &&
      selectedDate.getFullYear() === currentYear
    )
  }

  const handleDateClick = (day: number) => {
    setSelectedDate(new Date(currentYear, currentMonth, day))
  }

  // Get events for selected date
  const selectedDateEvents = selectedDate
    ? getEventsForDate(selectedDate.getDate())
    : []

  // Build calendar grid
  const calendarDays = []

  // Empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOffset; i++) {
    calendarDays.push(null)
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)]">
      {/* Calendar or Event Details */}
      <div className="flex-1 min-w-0">
        {leftPanelContent ? (
          leftPanelContent
        ) : (
        <Card className="h-full overflow-auto">
          <CardContent className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {MONTHS[currentMonth]} {currentYear}
              </h2>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="rounded-full" onClick={goToToday}>
                  Today
                </Button>
                <Button variant="outline" size="icon" className="rounded-full" onClick={goToPreviousMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full" onClick={goToNextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {dayLabels.map(day => (
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
                const hasEvents = dayEvents.length > 0

                const today = isToday(day)
                const selected = isSelected(day)

                return (
                  <button
                    key={day}
                    onClick={() => handleDateClick(day)}
                    className={cn(
                      'h-24 p-1 text-left border rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 flex flex-col',
                      today && 'bg-brand/10 border-brand/50',
                      selected && !today && 'bg-gray-100 dark:bg-gray-800 ring-2 ring-gray-400 dark:ring-gray-500',
                      selected && today && 'bg-brand/20 ring-2 ring-brand'
                    )}
                  >
                    <span
                      className={cn(
                        'text-sm font-medium inline-flex items-center justify-center w-7 h-7 rounded-full',
                        today && 'bg-brand text-brand-foreground',
                        selected && !today && 'bg-gray-300 dark:bg-gray-600'
                      )}
                    >
                      {day}
                    </span>
                    {hasEvents && (
                      <div className="flex-1 overflow-hidden mt-1 space-y-0.5">
                        {dayEvents.slice(0, 3).map(event => (
                          <div
                            key={event.id}
                            className={cn(
                              'text-xs px-1 py-0.5 rounded truncate text-white',
                              CALENDAR_EVENT_COLORS[event.event_type]
                            )}
                            title={event.title}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-muted-foreground px-1">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
        )}
      </div>

      {/* Right panel - selected day's events */}
      <div className="lg:w-96 flex-shrink-0">
        <Card className="h-full">
          <CardContent className="p-4 h-full flex flex-col">
            {selectedDate ? (
              <>
                <h3 className="font-semibold mb-4">
                  {selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </h3>
                {selectedDateEvents.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">No events on this day</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDateEvents.map(event => {
                      const startTime = new Date(event.start_time)
                      return (
                        <button
                          key={event.id}
                          onClick={() => onEventSelect?.(event)}
                          className="block w-full text-left p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start gap-2">
                            <div
                              className={cn(
                                'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                                CALENDAR_EVENT_COLORS[event.event_type]
                              )}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium truncate">{event.title}</p>
                                {event.campuses && event.campuses.length > 0 && (
                                  <CampusBadges campuses={event.campuses} size="sm" maxVisible={1} />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {formatTimeFromDate(startTime)}
                                {event.location && ` • ${event.location.name}`}
                              </p>
                              {event.totalPositions > 0 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {event.filledPositions}/{event.totalPositions} volunteers
                                </p>
                              )}
                            </div>
                            {event.status !== 'published' && (
                              <Badge variant="secondary" className="text-xs rounded-full">
                                {event.status}
                              </Badge>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  Select a day to see its events
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
})
