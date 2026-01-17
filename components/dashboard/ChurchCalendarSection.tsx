'use client'

import { useState, useCallback, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { EnhancedCalendar } from './EnhancedCalendar'
import { EventDialog } from '@/app/dashboard/events/dialogs/EventDialog'
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Plus,
  Cake,
  Star,
} from 'lucide-react'
import {
  getCalendarEventsForMember,
  getChurchHolidays,
  getCalendarBirthdays,
  type CalendarEvent,
  type ChurchHoliday,
  type CalendarBirthday,
} from '@/app/dashboard/actions'
import type { UserRole } from '@/lib/permissions'

interface ChurchCalendarSectionProps {
  initialEvents: CalendarEvent[]
  initialHolidays?: ChurchHoliday[]
  initialBirthdays?: CalendarBirthday[]
  initialMonth: number
  initialYear: number
  firstDayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6
  timeFormat: '12h' | '24h'
  role: UserRole
  canCreateEvents?: boolean
}

export function ChurchCalendarSection({
  initialEvents,
  initialHolidays = [],
  initialBirthdays = [],
  initialMonth,
  initialYear,
  firstDayOfWeek,
  timeFormat,
  role,
  canCreateEvents = false,
}: ChurchCalendarSectionProps) {
  const t = useTranslations('dashboard')
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)
  const [holidays, setHolidays] = useState<ChurchHoliday[]>(initialHolidays)
  const [birthdays, setBirthdays] = useState<CalendarBirthday[]>(initialBirthdays)
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(initialMonth)
  const [currentYear, setCurrentYear] = useState(initialYear)
  const [eventDialogOpen, setEventDialogOpen] = useState(false)

  // Check if user can see birthdays (leaders and above)
  const canSeeBirthdays = ['leader', 'admin', 'owner'].includes(role)

  // Check if calendar is empty
  const isEmpty = events.length === 0 && holidays.length === 0 && birthdays.length === 0

  // Calculate upcoming items for collapsed view
  const upcomingItems = useMemo(() => {
    const items: Array<{
      type: 'event' | 'holiday' | 'birthday'
      date: Date
      title: string
      color?: string
      avatar?: string | null
    }> = []

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const nextMonth = new Date(today)
    nextMonth.setMonth(nextMonth.getMonth() + 1)

    // Add events
    events.forEach((event) => {
      const eventDate = new Date(event.start_time)
      if (eventDate >= today && eventDate <= nextMonth) {
        items.push({
          type: 'event',
          date: eventDate,
          title: event.title,
        })
      }
    })

    // Add holidays
    holidays.forEach((holiday) => {
      const holidayDate = new Date(holiday.date)
      if (holidayDate >= today && holidayDate <= nextMonth) {
        items.push({
          type: 'holiday',
          date: holidayDate,
          title: holiday.name,
          color: holiday.color,
        })
      }
    })

    // Add birthdays (only if user can see them)
    if (canSeeBirthdays) {
      birthdays.forEach((birthday) => {
        const birthdayDate = new Date(birthday.date)
        if (birthdayDate >= today && birthdayDate <= nextMonth) {
          items.push({
            type: 'birthday',
            date: birthdayDate,
            title: `${birthday.firstName} ${birthday.lastName}`,
            avatar: birthday.avatarUrl,
          })
        }
      })
    }

    // Sort by date
    items.sort((a, b) => a.date.getTime() - b.date.getTime())

    return items.slice(0, 5)
  }, [events, holidays, birthdays, canSeeBirthdays])

  const handleMonthChange = useCallback(async (month: number, year: number) => {
    setIsLoading(true)
    setCurrentMonth(month)
    setCurrentYear(year)

    try {
      const [eventsResult, holidaysResult, birthdaysResult] = await Promise.all([
        getCalendarEventsForMember(month, year),
        getChurchHolidays(month, year),
        canSeeBirthdays ? getCalendarBirthdays(month, year) : Promise.resolve({ data: [] }),
      ])

      if (eventsResult.data) setEvents(eventsResult.data)
      if (holidaysResult.data) setHolidays(holidaysResult.data)
      if (birthdaysResult.data) setBirthdays(birthdaysResult.data)
    } catch (error) {
      console.error('Failed to fetch calendar data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [canSeeBirthdays])

  const handleCreateEvent = useCallback(() => {
    setEventDialogOpen(true)
  }, [])

  const handleEventDialogSuccess = useCallback(() => {
    setEventDialogOpen(false)
    // Refresh events for current month
    handleMonthChange(currentMonth, currentYear)
  }, [handleMonthChange, currentMonth, currentYear])

  const formatUpcomingDate = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.getTime() === today.getTime()) {
      return t('yourWeek.today')
    } else if (date.getTime() === tomorrow.getTime()) {
      return t('yourWeek.tomorrow')
    }

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  // Collapsed empty state
  if (isEmpty && !isExpanded) {
    return (
      <div className="mt-6">
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <Card className="border border-black dark:border-white !ring-0 outline-none">
            <div className="p-4 flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-3 hover:bg-muted/50 transition-colors rounded-md p-1 -m-1 flex-1 text-left">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <h3 className="font-semibold">{t('calendar.title')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('calendar.emptyMonth')}
                    </p>
                  </div>
                </button>
              </CollapsibleTrigger>
              <div className="flex items-center gap-2">
                {canCreateEvents && (
                  <Button
                    size="sm"
                    className="rounded-full !bg-brand hover:!bg-brand/90 !text-brand-foreground border border-black"
                    onClick={handleCreateEvent}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {t('calendar.createEvent')}
                  </Button>
                )}
                <CollapsibleTrigger asChild>
                  <button className="p-1 hover:bg-muted/50 rounded-md transition-colors">
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </button>
                </CollapsibleTrigger>
              </div>
            </div>
          </Card>
        </Collapsible>
      </div>
    )
  }

  // Collapsed view with upcoming items
  if (!isExpanded) {
    return (
      <div className="mt-6">
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <Card className="border border-black dark:border-white !ring-0 outline-none">
            <div className="p-4 flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-3 hover:bg-muted/50 transition-colors rounded-md p-1 -m-1 flex-1 text-left">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <h3 className="font-semibold">{t('calendar.title')}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {upcomingItems.slice(0, 3).map((item, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs"
                        >
                          {item.type === 'birthday' && <Cake className="h-3 w-3 mr-1" />}
                          {item.type === 'holiday' && <Star className="h-3 w-3 mr-1" />}
                          {formatUpcomingDate(item.date)}: {item.title}
                        </Badge>
                      ))}
                      {upcomingItems.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{upcomingItems.length - 3} {t('calendar.more', { count: upcomingItems.length - 3 })}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </CollapsibleTrigger>
              <div className="flex items-center gap-2 flex-shrink-0">
                {canCreateEvents && (
                  <Button
                    size="sm"
                    className="rounded-full !bg-brand hover:!bg-brand/90 !text-brand-foreground border border-black"
                    onClick={handleCreateEvent}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {t('calendar.createEvent')}
                  </Button>
                )}
                <CollapsibleTrigger asChild>
                  <button className="p-1 hover:bg-muted/50 rounded-md transition-colors">
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </button>
                </CollapsibleTrigger>
              </div>
            </div>
          </Card>
        </Collapsible>
      </div>
    )
  }

  // Expanded full calendar view
  return (
    <div className={`mt-6 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <button
          className="flex items-center gap-2 hover:opacity-70 transition-opacity"
          onClick={() => setIsExpanded(false)}
        >
          <Calendar className="h-5 w-5" />
          <h2 className="text-lg font-semibold">{t('calendar.title')}</h2>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
        {canCreateEvents && (
          <Button
            size="sm"
            className="rounded-full !bg-brand hover:!bg-brand/90 !text-brand-foreground border border-black"
            onClick={handleCreateEvent}
          >
            <Plus className="h-4 w-4 mr-1" />
            {t('calendar.createEvent')}
          </Button>
        )}
      </div>

      <Card className="border border-black dark:border-white !ring-0 outline-none">
        <CardContent className="p-4">
          {/* Holidays Legend (birthdays are shown only on the calendar itself) */}
          {holidays.length > 0 && (
            <div className="mb-4 pb-4 border-b">
              <div className="flex flex-wrap gap-2">
                {holidays.map((holiday) => {
                  const holidayDate = new Date(holiday.date)
                  return (
                    <Badge
                      key={holiday.id}
                      variant="outline"
                      className="text-xs"
                      style={{ borderColor: holiday.color, color: holiday.color }}
                    >
                      <Star className="h-3 w-3 mr-1" />
                      {holiday.name} ({holidayDate.getDate()})
                    </Badge>
                  )
                })}
              </div>
            </div>
          )}

          {/* Calendar with enhanced data */}
          <EnhancedCalendar
            events={events}
            holidays={holidays}
            birthdays={canSeeBirthdays ? birthdays : []}
            firstDayOfWeek={firstDayOfWeek}
            timeFormat={timeFormat}
            onMonthChange={handleMonthChange}
          />
        </CardContent>
      </Card>

      <EventDialog
        open={eventDialogOpen}
        onOpenChange={setEventDialogOpen}
        onSuccess={handleEventDialogSuccess}
        timeFormat={timeFormat}
      />
    </div>
  )
}
