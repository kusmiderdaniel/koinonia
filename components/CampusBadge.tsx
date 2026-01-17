'use client'

import { memo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CampusBadgeProps {
  name: string
  color?: string
  showIcon?: boolean
  size?: 'sm' | 'default'
  className?: string
}

export const CampusBadge = memo(function CampusBadge({
  name,
  color = '#3B82F6',
  showIcon = false,
  size = 'default',
  className,
}: CampusBadgeProps) {
  // Calculate contrasting text color based on background
  const getContrastColor = (hexColor: string): string => {
    // Remove # if present
    const hex = hexColor.replace('#', '')

    // Convert to RGB
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)

    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

    // Return white for dark colors, dark for light colors
    return luminance > 0.5 ? '#1f2937' : '#ffffff'
  }

  const textColor = getContrastColor(color)

  return (
    <Badge
      variant="secondary"
      className={cn(
        'font-medium whitespace-nowrap rounded-md',
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-0.5',
        className
      )}
      style={{
        backgroundColor: color,
        color: textColor,
        borderColor: color,
      }}
    >
      {showIcon && <Building2 className={cn('mr-1', size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5')} />}
      {name}
    </Badge>
  )
})

// Multiple campuses display component
interface CampusBadgesProps {
  campuses: Array<{ id: string; name: string; color: string }>
  showIcon?: boolean
  size?: 'sm' | 'default'
  maxVisible?: number
  className?: string
}

export const CampusBadges = memo(function CampusBadges({
  campuses,
  showIcon = false,
  size = 'default',
  maxVisible = 3,
  className,
}: CampusBadgesProps) {
  if (!campuses || campuses.length === 0) {
    return null
  }

  const visibleCampuses = campuses.slice(0, maxVisible)
  const hiddenCount = campuses.length - maxVisible

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {visibleCampuses.map((campus) => (
        <CampusBadge
          key={campus.id}
          name={campus.name}
          color={campus.color}
          showIcon={showIcon}
          size={size}
        />
      ))}
      {hiddenCount > 0 && (
        <Badge variant="outline" className={cn('font-medium rounded-md', size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-0.5')}>
          +{hiddenCount} more
        </Badge>
      )}
    </div>
  )
})
