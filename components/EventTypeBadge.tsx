import { memo } from 'react'
import { EVENT_TYPE_LABELS, EVENT_TYPE_COLORS } from '@/lib/constants/event'

interface EventTypeBadgeProps {
  type: string
  className?: string
  size?: 'sm' | 'default'
}

export const EventTypeBadge = memo(function EventTypeBadge({
  type,
  className = '',
  size = 'default'
}: EventTypeBadgeProps) {
  const label = EVENT_TYPE_LABELS[type] || type
  const colorClass = EVENT_TYPE_COLORS[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
  const sizeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0' : 'text-xs px-2 py-0.5'

  return (
    <span
      className={`font-medium rounded ${sizeClass} ${colorClass} ${className}`}
    >
      {label}
    </span>
  )
})
