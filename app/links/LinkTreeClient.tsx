'use client'

import { useState } from 'react'
import Image from 'next/image'
import { LinkCard } from './LinkCard'
import { SocialIcons } from './SocialIcons'
import type { LinkVisibility } from '@/app/dashboard/links/types'

interface LinkTreeClientProps {
  church: {
    id: string
    name: string
    logoUrl: string | null
  }
  settings: {
    title: string | null
    bio: string | null
    backgroundColor: string | null
    backgroundGradientStart: string | null
    backgroundGradientEnd: string | null
    cardStyle: 'filled' | 'outline' | 'shadow'
    cardBorderRadius: string | null
    avatarUrl: string | null
    showChurchName: boolean
    socialLinks: { platform: string; url: string }[]
  }
  links: Array<{
    id: string
    title: string
    url: string
    description: string | null
    icon: string | null
    imageUrl: string | null
    cardColor: string | null
    textColor: string | null
    cardSize: 'small' | 'medium' | 'large'
    hoverEffect: 'none' | 'scale' | 'glow' | 'lift'
    visibility: LinkVisibility
    hideLabel: boolean
    labelBold: boolean
    labelItalic: boolean
    labelUnderline: boolean
  }>
  userRole: string | null
}

export function LinkTreeClient({ church, settings, links, userRole }: LinkTreeClientProps) {
  const [clickingLinkId, setClickingLinkId] = useState<string | null>(null)

  // Build background style
  const backgroundStyle: React.CSSProperties = {}
  if (settings.backgroundGradientStart && settings.backgroundGradientEnd) {
    backgroundStyle.background = `linear-gradient(180deg, ${settings.backgroundGradientStart} 0%, ${settings.backgroundGradientEnd} 100%)`
  } else if (settings.backgroundColor) {
    backgroundStyle.backgroundColor = settings.backgroundColor
  } else {
    backgroundStyle.backgroundColor = '#FFFFFF'
  }

  // Track link click
  const handleLinkClick = async (linkId: string, url: string) => {
    setClickingLinkId(linkId)

    try {
      // Track the click (fire and forget)
      fetch('/api/links/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkId, churchId: church.id }),
      }).catch(() => {
        // Ignore tracking errors
      })

      // Open link in new tab
      window.open(url, '_blank', 'noopener,noreferrer')
    } finally {
      setTimeout(() => setClickingLinkId(null), 200)
    }
  }

  // Get display avatar (settings avatar or church logo)
  const avatarUrl = settings.avatarUrl || church.logoUrl

  // Get display title
  const displayTitle = settings.title || (settings.showChurchName ? church.name : null)

  return (
    <div
      className="min-h-screen flex flex-col items-center py-8 px-4"
      style={backgroundStyle}
    >
      <div className="w-full max-w-md">
        {/* Avatar */}
        {avatarUrl && (
          <div className="flex justify-center mb-4">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white shadow-lg relative">
              <Image
                src={avatarUrl}
                alt={church.name}
                fill
                className="object-cover"
                sizes="96px"
              />
            </div>
          </div>
        )}

        {/* Title */}
        {displayTitle && (
          <h1 className="text-2xl font-bold text-center mb-2">
            {displayTitle}
          </h1>
        )}

        {/* Bio */}
        {settings.bio && (
          <p className="text-center text-muted-foreground mb-6 text-sm">
            {settings.bio}
          </p>
        )}

        {/* Links */}
        <div className="space-y-3">
          {links.map(link => (
            <LinkCard
              key={link.id}
              title={link.title}
              description={link.description}
              icon={link.icon}
              imageUrl={link.imageUrl}
              cardColor={link.cardColor || '#FFFFFF'}
              textColor={link.textColor}
              cardStyle={settings.cardStyle}
              cardSize={link.cardSize}
              borderRadius={settings.cardBorderRadius || 'rounded-lg'}
              hoverEffect={link.hoverEffect}
              isClicking={clickingLinkId === link.id}
              onClick={() => handleLinkClick(link.id, link.url)}
              showVisibilityBadge={userRole !== null && link.visibility !== 'public'}
              visibility={link.visibility}
              hideLabel={link.hideLabel}
              labelBold={link.labelBold}
              labelItalic={link.labelItalic}
              labelUnderline={link.labelUnderline}
            />
          ))}
        </div>

        {/* Empty state */}
        {links.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No links available</p>
          </div>
        )}

        {/* Social Links */}
        {settings.socialLinks && settings.socialLinks.length > 0 && (
          <div className="mt-8">
            <SocialIcons links={settings.socialLinks} />
          </div>
        )}

        {/* Powered by */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          <a
            href="https://koinonia.app"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            Powered by Koinonia
          </a>
        </div>
      </div>
    </div>
  )
}
