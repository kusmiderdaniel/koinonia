'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
import { Eye, Lock } from 'lucide-react'
import { VISIBILITY_STYLES } from '@/lib/constants/event'

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
  const t = useTranslations('events.visibility')
  const label = t(visibility as 'members' | 'volunteers' | 'leaders' | 'hidden')
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
