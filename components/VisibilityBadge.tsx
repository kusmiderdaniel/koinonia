import { memo } from 'react'
import { Eye, Lock } from 'lucide-react'
import { VISIBILITY_LABELS, VISIBILITY_STYLES } from '@/lib/constants/event'

interface VisibilityBadgeProps {
  visibility: string
  showIcon?: boolean
  className?: string
}

export const VisibilityBadge = memo(function VisibilityBadge({
  visibility,
  showIcon = true,
  className = ''
}: VisibilityBadgeProps) {
  const label = VISIBILITY_LABELS[visibility] || visibility
  const colorClass = VISIBILITY_STYLES[visibility] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
  const Icon = visibility === 'hidden' ? Lock : Eye

  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded flex items-center gap-1 ${colorClass} ${className}`}
    >
      {showIcon && <Icon className="w-3 h-3" />}
      {label}
    </span>
  )
})
