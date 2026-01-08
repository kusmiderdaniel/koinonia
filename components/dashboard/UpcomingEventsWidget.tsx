'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarDays, ChevronRight, MapPin } from 'lucide-react'
import { getDateTimeFormatPattern } from '@/lib/utils/format'
import type { DashboardEvent } from '@/app/dashboard/actions'

interface UpcomingEventsWidgetProps {
  events: DashboardEvent[]
  timeFormat?: '12h' | '24h'
}

export function UpcomingEventsWidget({ events, timeFormat = '24h' }: UpcomingEventsWidgetProps) {
  const router = useRouter()

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, getDateTimeFormatPattern(timeFormat))
  }

  const getEventTypeIcon = (eventType: string) => {
    // Simple calendar icon for all types, could be expanded
    return <CalendarDays className="w-4 h-4 text-muted-foreground" />
  }

  const handleNavigate = (eventId: string) => {
    router.push(`/dashboard/events?event=${eventId}`)
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <CalendarDays className="w-5 h-5" />
          Upcoming Events
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No upcoming events</p>
            <p className="text-xs mt-1">Events will appear here once scheduled</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                onClick={() => handleNavigate(event.id)}
                className="flex gap-3 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-zinc-900 cursor-pointer transition-colors"
              >
                {/* Event type icon */}
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                  {getEventTypeIcon(event.event_type)}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Title */}
                  <p className="font-medium text-sm truncate">
                    {event.title}
                  </p>

                  {/* Date */}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(event.start_time)}
                  </p>

                  {/* Location if available */}
                  {event.location && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}
                </div>

                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 self-center" />
              </div>
            ))}

            {/* View all link */}
            <Link
              href="/dashboard/events"
              className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground pt-2"
            >
              View all events
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
