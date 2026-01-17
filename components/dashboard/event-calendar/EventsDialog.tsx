'use client'

import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { MapPin, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EVENT_TYPE_COLORS } from './constants'
import { formatTime, formatDate } from './utils'
import type { CalendarEvent } from '@/app/dashboard/actions'

interface EventsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDay: number | null
  currentMonth: number
  currentYear: number
  events: CalendarEvent[]
  timeFormat: '12h' | '24h'
}

export function EventsDialog({
  open,
  onOpenChange,
  selectedDay,
  currentMonth,
  currentYear,
  events,
  timeFormat,
}: EventsDialogProps) {
  const t = useTranslations('dashboard')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[70vh] flex flex-col overflow-hidden !border !border-black dark:!border-white">
        <DialogHeader className="flex-shrink-0 pb-2">
          <DialogTitle>
            {selectedDay && formatDate(
              new Date(currentYear, currentMonth, selectedDay).toISOString()
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto space-y-3">
          {events.length === 0 ? (
            <div className="rounded-lg border bg-muted/50 p-8">
              <p className="text-muted-foreground text-center">
                {t('calendar.noEventsOnDay')}
              </p>
            </div>
          ) : (
            events.map((event) => {
              const isAllDayEvent = event.event_type === 'birthday' || event.event_type === 'holiday'

              return (
                <div key={event.id} className="rounded-lg border border-border dark:border-white/20 bg-card p-4">
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
                        {!isAllDayEvent && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 flex-shrink-0" />
                            <span>
                              {formatTime(event.start_time, timeFormat)}
                              {event.end_time && ` - ${formatTime(event.end_time, timeFormat)}`}
                            </span>
                          </div>
                        )}

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
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
