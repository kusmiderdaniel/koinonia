import { memo } from 'react'
import { EVENT_TYPE_LABELS, EVENT_TYPE_COLORS } from '@/lib/constants/event'

interface EventTypeBadgeProps {
  type: string
  className?: string
}

export const EventTypeBadge = memo(function EventTypeBadge({
  type,
  className = ''
}: EventTypeBadgeProps) {
  const label = EVENT_TYPE_LABELS[type] || type
  const colorClass = EVENT_TYPE_COLORS[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'

  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded ${colorClass} ${className}`}
    >
      {label}
    </span>
  )
})
