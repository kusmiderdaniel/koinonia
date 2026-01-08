'use client'

import { memo, useState } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Lock, Users, Shield, Crown } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import type { LinkVisibility } from '@/app/dashboard/links/types'

type CardSize = 'small' | 'medium' | 'large'

interface LinkCardProps {
  title: string
  description: string | null
  icon: string | null
  imageUrl: string | null
  cardColor: string
  textColor: string | null
  cardStyle: 'filled' | 'outline' | 'shadow'
  cardSize: CardSize
  borderRadius: string
  hoverEffect: 'none' | 'scale' | 'glow' | 'lift'
  isClicking: boolean
  onClick: () => void
  showVisibilityBadge?: boolean
  visibility?: LinkVisibility
  hideLabel?: boolean
  labelBold?: boolean
  labelItalic?: boolean
  labelUnderline?: boolean
}

// Card size styles
const CARD_SIZE_STYLES: Record<CardSize, { padding: string; text: string; icon: string; height: string }> = {
  small: { padding: 'p-3', text: 'text-sm', icon: 'w-4 h-4', height: 'h-16' },
  medium: { padding: 'p-4', text: 'text-base', icon: 'w-5 h-5', height: 'h-20' },
  large: { padding: 'p-5', text: 'text-lg', icon: 'w-6 h-6', height: 'h-28' },
}

// Calculate contrasting text color based on background
function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#1f2937' : '#ffffff'
}

// Get icon component from string name
function getIconComponent(iconName: string | null): React.ComponentType<{ className?: string }> | null {
  if (!iconName) return null

  // Convert kebab-case or snake_case to PascalCase
  const pascalCase = iconName
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')

  // @ts-expect-error - Dynamic icon lookup
  const IconComponent = LucideIcons[pascalCase]
  return IconComponent || null
}

// Visibility icons
const VISIBILITY_ICONS: Record<LinkVisibility, React.ComponentType<{ className?: string }>> = {
  public: Users,
  member: Users,
  volunteer: Users,
  leader: Shield,
  admin: Crown,
}

export const LinkCard = memo(function LinkCard({
  title,
  description,
  icon,
  imageUrl,
  cardColor,
  textColor,
  cardStyle,
  cardSize,
  borderRadius,
  hoverEffect,
  isClicking,
  onClick,
  showVisibilityBadge,
  visibility,
  hideLabel,
  labelBold,
  labelItalic,
  labelUnderline,
}: LinkCardProps) {
  // Calculate text color if not provided
  const computedTextColor = textColor || getContrastColor(cardColor)

  // Get icon component
  const IconComponent = getIconComponent(icon)

  // Get size styles
  const sizeStyles = CARD_SIZE_STYLES[cardSize]

  // Get visibility icon
  const VisibilityIcon = visibility ? VISIBILITY_ICONS[visibility] : null

  const [isHovered, setIsHovered] = useState(false)

  // Hover effect classes
  const hoverClasses = cn(
    hoverEffect === 'scale' && 'hover:scale-[1.02] active:scale-[0.98]',
    hoverEffect === 'lift' && 'hover:-translate-y-1 hover:shadow-xl',
  )

  // Glow effect needs dynamic box-shadow
  const getGlowShadow = () => {
    if (hoverEffect === 'glow' && isHovered) {
      return `0 0 25px ${cardColor}99`
    }
    return undefined
  }

  // Label style classes
  const labelClasses = cn(
    'truncate',
    sizeStyles.text,
    labelBold ? 'font-bold' : 'font-medium',
    labelItalic && 'italic',
    labelUnderline && 'underline',
  )

  // Image card rendering
  if (imageUrl) {
    return (
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          'w-full relative overflow-hidden transition-all duration-200 cursor-pointer',
          borderRadius,
          sizeStyles.height,
          hoverClasses,
          isClicking && 'scale-[0.98] opacity-80',
        )}
        style={{ boxShadow: getGlowShadow() }}
      >
        {/* Background image */}
        <img
          src={imageUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/40" />
        {/* Content */}
        <div className={cn(
          'absolute inset-0 flex items-center gap-3 text-white',
          sizeStyles.padding
        )}>
          {/* Icon */}
          {IconComponent && (
            <div className="flex-shrink-0">
              <IconComponent className={sizeStyles.icon} />
            </div>
          )}

          {/* Content */}
          {!hideLabel && (
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-2">
                <span className={labelClasses}>{title}</span>
                {showVisibilityBadge && visibility && visibility !== 'public' && VisibilityIcon && (
                  <Badge
                    variant="secondary"
                    className="text-xs px-1.5 py-0.5 opacity-70 bg-white/20"
                  >
                    <VisibilityIcon className="w-3 h-3 mr-1" />
                    {visibility}
                  </Badge>
                )}
              </div>
              {description && (
                <p className="text-sm opacity-70 truncate mt-0.5">{description}</p>
              )}
            </div>
          )}

          {/* Arrow */}
          {!hideLabel && (
            <div className="flex-shrink-0 opacity-50">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          )}
        </div>
      </button>
    )
  }

  // Regular card rendering
  const cardStyles: React.CSSProperties = {}

  // Apply card style
  if (cardStyle === 'filled') {
    cardStyles.backgroundColor = cardColor
    cardStyles.color = computedTextColor
  } else if (cardStyle === 'outline') {
    cardStyles.backgroundColor = 'transparent'
    cardStyles.border = `2px solid ${cardColor}`
    cardStyles.color = cardColor // Text matches the outline color
  } else if (cardStyle === 'shadow') {
    cardStyles.backgroundColor = cardColor
    cardStyles.color = computedTextColor
    cardStyles.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.15)'
  }

  // Apply glow effect
  const glowShadow = getGlowShadow()
  if (glowShadow) {
    cardStyles.boxShadow = cardStyles.boxShadow
      ? `${cardStyles.boxShadow}, ${glowShadow}`
      : glowShadow
  }

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'w-full transition-all duration-200 cursor-pointer',
        borderRadius,
        sizeStyles.padding,
        hoverClasses,
        isClicking && 'scale-[0.98] opacity-80',
      )}
      style={cardStyles}
    >
      <div className={cn('flex items-center gap-3', hideLabel && 'justify-center')}>
        {/* Icon */}
        {IconComponent && (
          <div className="flex-shrink-0">
            <IconComponent className={sizeStyles.icon} />
          </div>
        )}

        {/* Content */}
        {!hideLabel && (
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-2">
              <span className={labelClasses}>{title}</span>
              {showVisibilityBadge && visibility && visibility !== 'public' && VisibilityIcon && (
                <Badge
                  variant="secondary"
                  className="text-xs px-1.5 py-0.5 opacity-70"
                  style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}
                >
                  <VisibilityIcon className="w-3 h-3 mr-1" />
                  {visibility}
                </Badge>
              )}
            </div>
            {description && (
              <p className="text-sm opacity-70 truncate mt-0.5">{description}</p>
            )}
          </div>
        )}

        {/* Arrow */}
        {!hideLabel && (
          <div className="flex-shrink-0 opacity-50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        )}
      </div>
    </button>
  )
})
