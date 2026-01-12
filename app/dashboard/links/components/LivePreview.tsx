'use client'

import { memo } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Instagram, Facebook, Youtube, Twitter, Globe, Mail, Music } from 'lucide-react'
import {
  getContrastColor,
  getIconComponent,
  CARD_SIZE_STYLES_PREVIEW,
  type CardSize,
} from '@/lib/utils/link-utils'
import type { LinkTreeSettingsRow, LinkTreeLinkRow, SocialLink } from '../types'

// Map platform names to icons for social links
const PLATFORM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
  twitter: Twitter,
  tiktok: Music,
  spotify: Music,
  website: Globe,
  email: Mail,
}

interface LivePreviewProps {
  settings: LinkTreeSettingsRow | null
  links: LinkTreeLinkRow[]
  churchName?: string
  churchLogo?: string | null
}

export const LivePreview = memo(function LivePreview({
  settings,
  links,
  churchName,
  churchLogo,
}: LivePreviewProps) {
  const t = useTranslations('links')
  // Build background style
  const backgroundStyle: React.CSSProperties = {}
  if (settings?.background_gradient_start && settings?.background_gradient_end) {
    backgroundStyle.background = `linear-gradient(180deg, ${settings.background_gradient_start} 0%, ${settings.background_gradient_end} 100%)`
  } else if (settings?.background_color) {
    backgroundStyle.backgroundColor = settings.background_color
  } else {
    backgroundStyle.backgroundColor = '#FFFFFF'
  }

  // Get display title
  const displayTitle = settings?.title || (settings?.show_church_name !== false ? churchName : null)

  // Get card style
  const cardStyle = settings?.card_style || 'filled'
  const borderRadius = settings?.card_border_radius || 'rounded-lg'

  // Filter active links only
  const activeLinks = links.filter(link => link.is_active !== false)

  return (
    <div className="border border-black dark:border-zinc-700 rounded-lg overflow-hidden bg-muted/30">
      <div className="p-2 border-b border-black dark:border-zinc-700 bg-muted/50">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <span className="ml-2 text-xs text-muted-foreground">{t('preview.label')}</span>
        </div>
      </div>

      <div
        className="p-4 min-h-[400px] max-h-[500px] overflow-y-auto"
        style={backgroundStyle}
      >
        <div className="flex flex-col items-center">
          {/* Avatar */}
          {(settings?.avatar_url || churchLogo) && (
            <div className="w-12 h-12 rounded-full bg-muted border-2 border-white shadow mb-3 overflow-hidden relative">
              <Image
                src={settings?.avatar_url || churchLogo!}
                alt=""
                fill
                className="object-cover"
                sizes="48px"
                unoptimized
              />
            </div>
          )}

          {/* Title */}
          {displayTitle && (
            <h2
              className="text-base font-bold text-center mb-3"
              style={{ color: getContrastColor(settings?.background_color || '#FFFFFF') }}
            >
              {displayTitle}
            </h2>
          )}

          {/* Bio */}
          {settings?.bio && (
            <p
              className="text-xs text-center mb-4 opacity-70 max-w-[200px]"
              style={{ color: getContrastColor(settings?.background_color || '#FFFFFF') }}
            >
              {settings.bio}
            </p>
          )}

          {/* Links */}
          <div className="w-full space-y-2">
            {activeLinks.map(link => {
              const cardColor = link.card_color || '#3B82F6'
              const textColor = getContrastColor(cardColor)
              const size = (link.card_size as CardSize) || 'medium'
              const IconComponent = getIconComponent(link.icon)
              const hasImage = !!link.image_url

              const cardStyles: React.CSSProperties = {}

              if (!hasImage) {
                if (cardStyle === 'filled') {
                  cardStyles.backgroundColor = cardColor
                  cardStyles.color = textColor
                } else if (cardStyle === 'outline') {
                  cardStyles.backgroundColor = 'transparent'
                  cardStyles.border = `2px solid ${cardColor}`
                  cardStyles.color = cardColor // Text matches the outline color
                } else if (cardStyle === 'shadow') {
                  cardStyles.backgroundColor = cardColor
                  cardStyles.color = textColor
                  cardStyles.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)'
                }
              }

              const sizeStyles = CARD_SIZE_STYLES_PREVIEW[size]

              // Height values for image cards - matched to regular card heights
              const imageCardHeights: Record<CardSize, string> = {
                small: '2rem',     // ~32px - matches py-2 + content
                medium: '2.25rem', // ~36px - matches py-2.5 + content
                large: '2.75rem',  // ~44px - matches py-3 + content
              }

              // Image card
              if (hasImage) {
                return (
                  <div
                    key={link.id}
                    className={cn(
                      'w-full relative overflow-hidden',
                      borderRadius
                    )}
                    style={{ height: imageCardHeights[size], minHeight: imageCardHeights[size] }}
                  >
                    <Image
                      src={link.image_url!}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="300px"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-black/40" />
                    <div className={cn(
                      'absolute inset-0 flex items-center gap-2 text-white',
                      sizeStyles.padding,
                      link.hide_label && 'justify-center'
                    )}>
                      {IconComponent && <IconComponent className={cn(
                        'flex-shrink-0',
                        sizeStyles.icon
                      )} />}
                      {!link.hide_label && (
                        <span className={cn(
                          'truncate',
                          sizeStyles.text,
                          link.label_bold ? 'font-bold' : 'font-medium',
                          link.label_italic && 'italic',
                          link.label_underline && 'underline'
                        )}>
                          {link.title}
                        </span>
                      )}
                    </div>
                  </div>
                )
              }

              // Regular card
              return (
                <div
                  key={link.id}
                  className={cn(
                    'w-full flex items-center gap-2',
                    borderRadius,
                    sizeStyles.padding,
                    link.hide_label && 'justify-center'
                  )}
                  style={cardStyles}
                >
                  {IconComponent && <IconComponent className={cn(
                    'flex-shrink-0',
                    sizeStyles.icon
                  )} />}
                  {!link.hide_label && (
                    <span className={cn(
                      'truncate',
                      sizeStyles.text,
                      link.label_bold ? 'font-bold' : 'font-medium',
                      link.label_italic && 'italic',
                      link.label_underline && 'underline'
                    )}>
                      {link.title}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Empty state */}
          {activeLinks.length === 0 && (
            <div
              className="text-center py-6 text-xs opacity-50"
              style={{ color: getContrastColor(settings?.background_color || '#FFFFFF') }}
            >
              {t('preview.noActiveLinks')}
            </div>
          )}

          {/* Social Links */}
          {settings?.social_links && (settings.social_links as unknown as SocialLink[]).length > 0 && (
            <div className="flex justify-center gap-2 mt-4">
              {(settings.social_links as unknown as SocialLink[]).map((link, index) => {
                const Icon = PLATFORM_ICONS[link.platform] || Globe
                return (
                  <div
                    key={`${link.platform}-${index}`}
                    className="p-1.5 rounded-full opacity-70"
                    style={{ color: getContrastColor(settings?.background_color || '#FFFFFF') }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                )
              })}
            </div>
          )}

          {/* Powered by */}
          <div className="mt-4 text-center text-[10px] opacity-40">
            {t('preview.poweredBy')}
          </div>
        </div>
      </div>
    </div>
  )
})
