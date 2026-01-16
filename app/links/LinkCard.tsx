'use client'

import { memo, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Users, Shield, Crown } from 'lucide-react'
import {
  getContrastColor,
  getIconComponent,
  CARD_SIZE_STYLES,
  type CardSize,
} from '@/lib/utils/link-utils'
import type { LinkVisibility } from '@/app/dashboard/links/types'

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

  // Get icon component (static lookup from lucide-react icons object)
  // eslint-disable-next-line react-hooks/static-components -- Icon is looked up from static object
  const IconComponent = getIconComponent(icon)

  // Get size styles
  const sizeStyles = CARD_SIZE_STYLES[cardSize]

  // Get visibility icon
  const VisibilityIcon = visibility ? VISIBILITY_ICONS[visibility] : null

  const [isHovered, setIsHovered] = useState(false)
  const [imageError, setImageError] = useState(false)

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

  // Height values for image cards - matched to regular card heights (padding + content)
  const imageCardHeights: Record<CardSize, string> = {
    small: '2.75rem',   // ~44px - matches p-3 + content
    medium: '3.25rem',  // ~52px - matches p-4 + content
    large: '4rem',      // ~64px - matches p-5 + content
  }

  // Image card rendering (only if image loads successfully)
  if (imageUrl && !imageError) {
    return (
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          'w-full relative overflow-hidden transition-all duration-200 cursor-pointer',
          borderRadius,
          hoverClasses,
          isClicking && 'scale-[0.98] opacity-80',
        )}
        style={{
          boxShadow: getGlowShadow(),
          height: imageCardHeights[cardSize],
          minHeight: imageCardHeights[cardSize],
        }}
      >
        {/* Background image */}
        <Image
          src={imageUrl}
          alt={`Background for ${title}`}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 400px"
          onError={() => setImageError(true)}
          unoptimized
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
