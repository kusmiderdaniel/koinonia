'use client'

import { cn } from '@/lib/utils'
import { CALENDAR_EVENT_COLORS } from './types'
import type { Event } from '../types'

interface DayCellProps {
  day: number
  events: Event[]
  isToday: boolean
  isSelected: boolean
  onClick: () => void
}

export function DayCell({
  day,
  events,
  isToday,
  isSelected,
  onClick,
}: DayCellProps) {
  const hasEvents = events.length > 0

  return (
    <button
      onClick={onClick}
      className={cn(
        'h-24 p-1 text-left border rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 flex flex-col',
        isToday && 'bg-brand/10 border-brand/50',
        isSelected &&
          !isToday &&
          'bg-gray-100 dark:bg-gray-800 ring-2 ring-gray-400 dark:ring-gray-500',
        isSelected && isToday && 'bg-brand/20 ring-2 ring-brand'
      )}
    >
      <span
        className={cn(
          'text-sm font-medium inline-flex items-center justify-center w-7 h-7 rounded-full',
          isToday && 'bg-brand text-brand-foreground',
          isSelected && !isToday && 'bg-gray-300 dark:bg-gray-600'
        )}
      >
        {day}
      </span>
      {hasEvents && (
        <div className="flex-1 overflow-hidden mt-1 space-y-0.5">
          {events.slice(0, 3).map((event) => (
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
          {events.length > 3 && (
            <div className="text-xs text-muted-foreground px-1">
              +{events.length - 3} more
            </div>
          )}
        </div>
      )}
    </button>
  )
}
