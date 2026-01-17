'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { EVENT_TYPE_COLORS, EVENT_TYPE_HEX_COLORS } from './constants'
import { formatTime } from './utils'
import type { CalendarEvent } from '@/app/dashboard/actions'

interface CalendarDayCellProps {
  day: number
  events: CalendarEvent[] // Single-day events only (for desktop display)
  allEvents: CalendarEvent[] // All events including multi-day (for dialog)
  isToday: boolean
  isSelected: boolean
  timeFormat: '12h' | '24h'
  spanningEventsHeight: number
  spanningEventsCount: number // Number of spanning event rows
  cornerRadius?: {
    topLeft?: boolean
    topRight?: boolean
    bottomLeft?: boolean
    bottomRight?: boolean
  }
  onClick: () => void
}

export function CalendarDayCell({
  day,
  events,
  allEvents,
  isToday,
  isSelected,
  timeFormat,
  spanningEventsHeight,
  spanningEventsCount,
  cornerRadius,
  onClick,
}: CalendarDayCellProps) {
  const t = useTranslations('dashboard')
  const hasEvents = events.length > 0
  const hasAnyEvents = allEvents.length > 0
  // Adjust max visible based on spanning events: 2 slots total, minus spanning events
  const maxVisible = Math.max(0, 2 - spanningEventsCount)
  const visibleEvents = events.slice(0, maxVisible)
  const moreCount = events.length - maxVisible

  // Build corner radius classes
  const cornerClasses = cn(
    cornerRadius?.topLeft && 'rounded-tl-lg',
    cornerRadius?.topRight && 'rounded-tr-lg',
    cornerRadius?.bottomLeft && 'rounded-bl-lg',
    cornerRadius?.bottomRight && 'rounded-br-lg'
  )

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative h-12 md:min-h-24 p-1 text-left transition-colors border -mt-px -ml-px',
        'border-border dark:border-white/20',
        'hover:bg-gray-100 dark:hover:bg-gray-800 hover:z-10',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:z-10',
        isToday && 'bg-brand/10',
        isSelected && !isToday && 'bg-gray-100 dark:bg-gray-800 ring-2 ring-gray-400 dark:ring-gray-500 z-10',
        isSelected && isToday && 'bg-brand/20 ring-2 ring-brand z-10',
        cornerClasses
      )}
    >
      {/* Mobile layout - dots at top, day number at bottom left */}
      <div className="flex flex-col justify-between md:hidden h-full">
        {hasAnyEvents && (
          <div className="flex items-center gap-0.5">
            {allEvents.slice(0, 2).map((event) => (
              <div
                key={event.id}
                className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  EVENT_TYPE_COLORS[event.event_type] || 'bg-gray-500'
                )}
              />
            ))}
            {allEvents.length > 2 && (
              <span className="text-[7px] leading-none text-muted-foreground">+{allEvents.length - 2}</span>
            )}
          </div>
        )}
        <span
          className={cn(
            'inline-flex items-center justify-center text-xs w-5 h-5 rounded-full font-medium',
            isToday && 'bg-brand text-brand-foreground',
            isSelected && !isToday && 'bg-gray-300 dark:bg-gray-600'
          )}
        >
          {day}
        </span>
      </div>

      {/* Desktop layout - spanning events space at top, single-day events, day number at bottom left */}
      <div className="hidden md:flex md:flex-col md:justify-end h-full">
        {/* Reserved space for spanning events - only if this day has spanning events */}
        {spanningEventsCount > 0 && spanningEventsHeight > 0 && (
          <div style={{ height: spanningEventsHeight }} className="shrink-0" />
        )}
        {hasEvents && (
          <div className="flex flex-col gap-0.5 min-w-0 mb-auto overflow-hidden">
            {visibleEvents.map((event) => {
              const isAllDayEvent = event.event_type === 'birthday' || event.event_type === 'holiday'
              const titleText = isAllDayEvent
                ? event.title
                : `${formatTime(event.start_time, timeFormat)} ${event.title}`
              const hexColor = EVENT_TYPE_HEX_COLORS[event.event_type] || '#6b7280'

              return (
                <div
                  key={event.id}
                  className="rounded-r px-1 py-0.5 text-[10px] leading-tight truncate border-l-[3px] shrink-0"
                  style={{
                    borderLeftColor: hexColor,
                    backgroundColor: `${hexColor}25`,
                    color: hexColor,
                  }}
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
        <span
          className={cn(
            'inline-flex items-center justify-center text-sm w-6 h-6 rounded-full font-medium',
            isToday && 'bg-brand text-brand-foreground',
            isSelected && !isToday && 'bg-gray-300 dark:bg-gray-600'
          )}
        >
          {day}
        </span>
      </div>
    </button>
  )
}
