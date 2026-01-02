'use client'

import { memo } from 'react'
import { EventTypeBadge } from '@/components/EventTypeBadge'
import { CampusBadges } from '@/components/CampusBadge'
import type { Event } from '../types'

interface EventCardProps {
  event: Event
  isSelected: boolean
  onClick: () => void
}

export const EventCard = memo(function EventCard({ event, isSelected, onClick }: EventCardProps) {
  const startDate = new Date(event.start_time)
  const dateStr = startDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
  const timeStr = event.is_all_day
    ? 'All day'
    : startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg transition-colors ${
        isSelected
          ? 'bg-gray-100 dark:bg-zinc-800 font-medium'
          : 'hover:bg-gray-50 dark:hover:bg-zinc-800/50'
      }`}
    >
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <EventTypeBadge type={event.event_type} />
        {event.campuses && event.campuses.length > 0 && (
          <CampusBadges campuses={event.campuses} size="sm" maxVisible={2} />
        )}
      </div>
      <p className="font-medium truncate">{event.title}</p>
      <p className="text-xs text-muted-foreground">
        {dateStr} • {timeStr}
      </p>
      {event.totalPositions > 0 && (
        <p className="text-xs text-muted-foreground">
          {event.filledPositions}/{event.totalPositions} volunteers
        </p>
      )}
    </button>
  )
})
