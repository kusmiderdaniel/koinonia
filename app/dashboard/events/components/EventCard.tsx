'use client'

import { memo } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Pencil, Trash2 } from 'lucide-react'
import { EventTypeBadge } from '@/components/EventTypeBadge'
import { CampusBadges } from '@/components/CampusBadge'
import type { Event } from '../types'

interface EventCardProps {
  event: Event
  isSelected: boolean
  onClick: () => void
  canManage?: boolean
  onDuplicate?: (event: Event) => void
  onEdit?: (event: Event) => void
  onDelete?: (event: Event) => void
}

export const EventCard = memo(function EventCard({
  event,
  isSelected,
  onClick,
  canManage,
  onDuplicate,
  onEdit,
  onDelete,
}: EventCardProps) {
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
    <div
      className={`flex rounded-lg border border-black dark:border-white transition-colors ${
        isSelected
          ? 'bg-gray-100 dark:bg-zinc-800'
          : 'hover:bg-gray-50 dark:hover:bg-zinc-800/50'
      }`}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex-1 text-left p-3 min-w-0"
      >
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <EventTypeBadge type={event.event_type} />
          {event.campuses && event.campuses.length > 0 && (
            <CampusBadges campuses={event.campuses} size="sm" maxVisible={2} />
          )}
        </div>
        <p className={`truncate ${isSelected ? 'font-medium' : ''}`}>{event.title}</p>
        <p className="text-xs text-muted-foreground">
          {dateStr} • {timeStr}
        </p>
        {event.totalPositions > 0 && (
          <p className="text-xs text-muted-foreground">
            {event.filledPositions}/{event.totalPositions} volunteers
          </p>
        )}
      </button>
      {canManage && (
        <div className="flex flex-col justify-center gap-0.5 pr-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation()
              onDuplicate?.(event)
            }}
            title="Duplicate"
          >
            <Copy className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation()
              onEdit?.(event)
            }}
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={(e) => {
              e.stopPropagation()
              onDelete?.(event)
            }}
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  )
})
