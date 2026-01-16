'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { EVENT_TYPE_COLORS } from './constants'
import { formatTime } from './utils'
import type { CalendarEvent } from '@/app/dashboard/actions'

interface CalendarDayCellProps {
  day: number
  events: CalendarEvent[]
  isToday: boolean
  isSelected: boolean
  timeFormat: '12h' | '24h'
  onClick: () => void
}

export function CalendarDayCell({
  day,
  events,
  isToday,
  isSelected,
  timeFormat,
  onClick,
}: CalendarDayCellProps) {
  const t = useTranslations('dashboard')
  const hasEvents = events.length > 0
  const maxVisible = 4
  const visibleEvents = events.slice(0, maxVisible)
  const moreCount = events.length - maxVisible

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative h-12 md:min-h-24 p-1 text-left border rounded-md transition-colors',
        'hover:bg-gray-100 dark:hover:bg-gray-800',
        'focus:outline-none focus:ring-2 focus:ring-ring',
        isToday && 'bg-brand/10 border-brand/50',
        isSelected && !isToday && 'bg-gray-100 dark:bg-gray-800 ring-2 ring-gray-400 dark:ring-gray-500',
        isSelected && isToday && 'bg-brand/20 ring-2 ring-brand',
        !isToday && !isSelected && 'border-border'
      )}
    >
      {/* Mobile layout - day number with dots below */}
      <div className="flex flex-col items-center md:hidden h-full">
        <span
          className={cn(
            'inline-flex items-center justify-center text-xs w-5 h-5 rounded-full font-medium',
            isToday && 'bg-brand text-brand-foreground',
            isSelected && !isToday && 'bg-gray-300 dark:bg-gray-600'
          )}
        >
          {day}
        </span>
        {hasEvents && (
          <div className="flex items-center gap-0.5 mt-1">
            {events.slice(0, 2).map((event) => (
              <div
                key={event.id}
                className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  EVENT_TYPE_COLORS[event.event_type] || 'bg-gray-500'
                )}
              />
            ))}
            {events.length > 2 && (
              <span className="text-[7px] leading-none text-muted-foreground">+{events.length - 2}</span>
            )}
          </div>
        )}
      </div>

      {/* Desktop layout - day number with event bars */}
      <div className="hidden md:flex gap-1">
        <span
          className={cn(
            'inline-flex items-center justify-center text-sm w-6 h-6 rounded-full font-medium flex-shrink-0',
            isToday && 'bg-brand text-brand-foreground',
            isSelected && !isToday && 'bg-gray-300 dark:bg-gray-600'
          )}
        >
          {day}
        </span>
        {hasEvents && (
          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            {visibleEvents.map((event) => {
              // Don't show time for all-day events like birthdays and holidays
              const isAllDayEvent = event.event_type === 'birthday' || event.event_type === 'holiday'
              const titleText = isAllDayEvent
                ? event.title
                : `${formatTime(event.start_time, timeFormat)} ${event.title}`

              return (
                <div
                  key={event.id}
                  className={cn(
                    'rounded px-1 py-0.5 text-white text-[10px] leading-tight truncate',
                    EVENT_TYPE_COLORS[event.event_type] || 'bg-gray-500'
                  )}
                  title={titleText}
                >
                  {event.title}
                </div>
              )
            })}
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
}
