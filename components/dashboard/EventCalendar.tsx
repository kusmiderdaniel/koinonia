'use client'

import { useState, useMemo, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, MapPin, Clock, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CalendarEvent } from '@/app/dashboard/actions'

interface EventCalendarProps {
  events: CalendarEvent[]
  firstDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6
  timeFormat?: '12h' | '24h'
  onMonthChange?: (month: number, year: number) => void
}

const MONTH_KEYS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
] as const

const DAYS_SUNDAY_START_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
const DAYS_MONDAY_START_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

const EVENT_TYPE_COLORS: Record<string, string> = {
  service: 'bg-blue-500',
  rehearsal: 'bg-purple-500',
  meeting: 'bg-green-500',
  special_event: 'bg-amber-500',
  other: 'bg-gray-500',
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOffset(year: number, month: number, firstDayOfWeek: number) {
  const jsDay = new Date(year, month, 1).getDay()
  return (jsDay - firstDayOfWeek + 7) % 7
}

function formatTime(dateString: string, timeFormat: '12h' | '24h' = '24h'): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-US', {
    hour: timeFormat === '12h' ? 'numeric' : '2-digit',
    minute: '2-digit',
    hour12: timeFormat === '12h',
  })
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

export function EventCalendar({
  events,
  firstDayOfWeek = 1,
  timeFormat = '24h',
  onMonthChange,
}: EventCalendarProps) {
  const t = useTranslations('dashboard')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDayOffset = getFirstDayOffset(currentYear, currentMonth, firstDayOfWeek)

  const dayLabelKeys = firstDayOfWeek === 0 ? DAYS_SUNDAY_START_KEYS : DAYS_MONDAY_START_KEYS

  // Group events by day
  const eventsByDay = useMemo(() => {
    const map = new Map<number, CalendarEvent[]>()

    events.forEach((event) => {
      const date = new Date(event.start_time)
      // Only include events for current month
      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        const day = date.getDate()
        if (!map.has(day)) {
          map.set(day, [])
        }
        map.get(day)!.push(event)
      }
    })

    // Sort events within each day by start time
    map.forEach((dayEvents) => {
      dayEvents.sort(
        (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      )
    })

    return map
  }, [events, currentMonth, currentYear])

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

  const handleDayClick = useCallback((day: number) => {
    const dayEvents = getEventsForDay(day)
    setSelectedDay(day)
    if (dayEvents.length > 0) {
      setSheetOpen(true)
    }
  }, [getEventsForDay])

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

  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : []

  return (
    <>
      <div className="h-full">
        <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
          <Calendar className="h-5 w-5" />
          {t('calendar.title')}
        </h2>
        <Card className="border border-black dark:border-zinc-700">
          <CardHeader className="pt-5 pb-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {t(`calendar.months.${MONTH_KEYS[currentMonth]}`)} {currentYear}
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full h-8 px-3"
                  onClick={goToToday}
                >
                  {t('calendar.today')}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full h-8 w-8"
                  onClick={goToPreviousMonth}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full h-8 w-8"
                  onClick={goToNextMonth}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-2 md:p-4">
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

              const dayEvents = getEventsForDay(day)
              const hasEvents = dayEvents.length > 0
              const today = isToday(day)
              const selected = selectedDay === day
              // Show up to 4 events on desktop
              const maxVisible = 4
              const visibleEvents = dayEvents.slice(0, maxVisible)
              const moreCount = dayEvents.length - maxVisible

              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    'relative h-12 md:min-h-24 p-1 text-left border rounded-md transition-colors',
                    'hover:bg-gray-100 dark:hover:bg-gray-800',
                    'focus:outline-none focus:ring-2 focus:ring-ring',
                    today && 'bg-brand/10 border-brand/50',
                    selected && !today && 'bg-gray-100 dark:bg-gray-800 ring-2 ring-gray-400 dark:ring-gray-500',
                    selected && today && 'bg-brand/20 ring-2 ring-brand',
                    !today && !selected && 'border-border'
                  )}
                >
                  {/* Mobile layout - day number with dots below */}
                  <div className="flex flex-col items-center md:hidden h-full">
                    <span
                      className={cn(
                        'inline-flex items-center justify-center text-xs w-5 h-5 rounded-full font-medium',
                        today && 'bg-brand text-brand-foreground',
                        selected && !today && 'bg-gray-300 dark:bg-gray-600'
                      )}
                    >
                      {day}
                    </span>
                    {hasEvents && (
                      <div className="flex items-center gap-0.5 mt-1">
                        {dayEvents.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            className={cn(
                              'w-1.5 h-1.5 rounded-full',
                              EVENT_TYPE_COLORS[event.event_type] || 'bg-gray-500'
                            )}
                          />
                        ))}
                        {dayEvents.length > 2 && (
                          <span className="text-[7px] leading-none text-muted-foreground">+{dayEvents.length - 2}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Desktop layout - day number with event bars */}
                  <div className="hidden md:flex gap-1">
                    <span
                      className={cn(
                        'inline-flex items-center justify-center text-sm w-6 h-6 rounded-full font-medium flex-shrink-0',
                        today && 'bg-brand text-brand-foreground',
                        selected && !today && 'bg-gray-300 dark:bg-gray-600'
                      )}
                    >
                      {day}
                    </span>
                    {hasEvents && (
                      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                        {visibleEvents.map((event) => (
                          <div
                            key={event.id}
                            className={cn(
                              'rounded px-1 py-0.5 text-white text-[10px] leading-tight truncate',
                              EVENT_TYPE_COLORS[event.event_type] || 'bg-gray-500'
                            )}
                            title={`${formatTime(event.start_time, timeFormat)} ${event.title}`}
                          >
                            {event.title}
                          </div>
                        ))}
                        {moreCount > 0 && (
                          <span className="text-[10px] text-muted-foreground truncate">
                            {t('calendar.more', { count: moreCount })}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 pt-4 border-t flex flex-wrap gap-3 text-xs text-muted-foreground">
            {Object.entries(EVENT_TYPE_COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1">
                <div className={cn('w-2 h-2 rounded-full', color)} />
                <span>{t(`calendar.eventTypes.${type}`)}</span>
              </div>
            ))}
          </div>
        </CardContent>
        </Card>
      </div>

      {/* Events Dialog */}
      <Dialog open={sheetOpen} onOpenChange={setSheetOpen}>
        <DialogContent className="max-w-md max-h-[70vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0 pb-2">
            <DialogTitle>
              {selectedDay && formatDate(
                new Date(currentYear, currentMonth, selectedDay).toISOString()
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto space-y-3">
            {selectedDayEvents.length === 0 ? (
              <div className="rounded-lg border bg-muted/50 p-8">
                <p className="text-muted-foreground text-center">
                  {t('calendar.noEventsOnDay')}
                </p>
              </div>
            ) : (
              selectedDayEvents.map((event) => (
                <div key={event.id} className="rounded-lg border bg-card p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'w-1 min-h-[3rem] rounded-full flex-shrink-0 self-stretch',
                        EVENT_TYPE_COLORS[event.event_type] || 'bg-gray-500'
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold">{event.title}</h4>

                      <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 flex-shrink-0" />
                          <span>
                            {formatTime(event.start_time, timeFormat)}
                            {event.end_time && ` - ${formatTime(event.end_time, timeFormat)}`}
                          </span>
                        </div>

                        {event.location && (
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <span className="block">{event.location.name}</span>
                              {event.location.address && (
                                <span className="block text-xs text-muted-foreground/70 truncate">
                                  {event.location.address}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {event.campuses.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {event.campuses.map((campus) => (
                            <Badge
                              key={campus.id}
                              variant="outline"
                              className="text-xs rounded-full"
                              style={{
                                borderColor: campus.color || undefined,
                                color: campus.color || undefined,
                              }}
                            >
                              {campus.name}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {event.description && (
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
