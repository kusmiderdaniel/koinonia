'use client'

import { useState } from 'react'
import { LinkCard } from '@/app/links/LinkCard'
import { SocialIcons } from '@/app/links/SocialIcons'

interface MemberLinksPanelProps {
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
    hideLabel: boolean
    labelBold: boolean
    labelItalic: boolean
    labelUnderline: boolean
  }>
  church: {
    id: string
    name: string
    logoUrl: string | null
  }
}

export function MemberLinksPanel({ settings, links, church }: MemberLinksPanelProps) {
  const [clickingLinkId, setClickingLinkId] = useState<string | null>(null)

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

  return (
    <div className="space-y-3">
      {/* Links */}
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
          hideLabel={link.hideLabel}
          labelBold={link.labelBold}
          labelItalic={link.labelItalic}
          labelUnderline={link.labelUnderline}
        />
      ))}

      {/* Empty state */}
      {links.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No links available</p>
        </div>
      )}

      {/* Social Links */}
      {settings.socialLinks && settings.socialLinks.length > 0 && (
        <div className="pt-4 border-t">
          <SocialIcons links={settings.socialLinks} />
        </div>
      )}
    </div>
  )
}
