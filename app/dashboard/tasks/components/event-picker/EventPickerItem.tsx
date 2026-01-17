'use client'

import { memo } from 'react'
import { Calendar } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { EventTypeBadge } from '@/components/EventTypeBadge'
import { getTimeFormatPattern } from '@/lib/utils/format'
import type { EventForPicker } from './types'

interface EventPickerItemProps {
  event: EventForPicker
  isSelected: boolean
  onSelect: (eventId: string) => void
  timeFormat?: '12h' | '24h'
}

export const EventPickerItem = memo(function EventPickerItem({
  event,
  isSelected,
  onSelect,
  timeFormat = '24h',
}: EventPickerItemProps) {
  const formatEventDate = (startTime: string) => {
    const timePattern = getTimeFormatPattern(timeFormat)
    return format(parseISO(startTime), `MMM d, yyyy · ${timePattern}`)
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(event.id)}
      className={`w-full text-left p-3 rounded-lg border transition-all ${
        isSelected
          ? 'bg-brand/10 border-brand'
          : 'border-black/20 dark:border-white/20 hover:bg-gray-50 dark:hover:bg-zinc-900'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium truncate">{event.title}</span>
            <EventTypeBadge type={event.event_type} />
          </div>
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {formatEventDate(event.start_time)}
          </div>
        </div>
        {event.campuses.length > 0 && (
          <div className="flex flex-wrap gap-1 justify-end shrink-0">
            {event.campuses.map((campus) => (
              <span
                key={campus.id}
                className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800"
                style={campus.color ? {
                  backgroundColor: `${campus.color}20`,
                  color: campus.color
                } : undefined}
              >
                {campus.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  )
})
