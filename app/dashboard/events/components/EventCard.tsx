'use client'

import { memo } from 'react'
import { EventTypeBadge } from '@/components/EventTypeBadge'
import { CampusBadges } from '@/components/CampusBadge'
import { SelectableCard } from '@/components/cards'
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
    <SelectableCard isSelected={isSelected} onClick={onClick}>
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
    </SelectableCard>
  )
})
