'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatTimeFromDate } from '@/lib/utils/format'
import { CampusBadges } from '@/components/CampusBadge'
import { CALENDAR_EVENT_COLORS } from './types'
import type { Event } from '../types'

interface SelectedDayPanelProps {
  selectedDate: Date | null
  events: Event[]
  onEventSelect?: (event: Event) => void
}

export function SelectedDayPanel({
  selectedDate,
  events,
  onEventSelect,
}: SelectedDayPanelProps) {
  return (
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
            {events.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  No events on this day
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((event) => {
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
                              <CampusBadges
                                campuses={event.campuses}
                                size="sm"
                                maxVisible={1}
                              />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatTimeFromDate(startTime)}
                            {event.location && ` • ${event.location.name}`}
                          </p>
                          {event.totalPositions > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {event.filledPositions}/{event.totalPositions}{' '}
                              volunteers
                            </p>
                          )}
                        </div>
                        {event.status !== 'published' && (
                          <Badge
                            variant="secondary"
                            className="text-xs rounded-full"
                          >
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
  )
}
