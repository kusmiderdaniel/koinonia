'use client'

import { memo } from 'react'
import {
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  Globe,
  Mail,
  Music,
} from 'lucide-react'

interface SocialIconsProps {
  links: Array<{
    platform: string
    url: string
  }>
}

// Map platform names to icons
const PLATFORM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
  twitter: Twitter,
  tiktok: Music, // Using Music as TikTok isn't in lucide
  spotify: Music,
  website: Globe,
  email: Mail,
}

// Map platform names to labels
const PLATFORM_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  youtube: 'YouTube',
  twitter: 'Twitter / X',
  tiktok: 'TikTok',
  spotify: 'Spotify',
  website: 'Website',
  email: 'Email',
}

export const SocialIcons = memo(function SocialIcons({ links }: SocialIconsProps) {
  if (!links || links.length === 0) return null

  const handleClick = (url: string, platform: string) => {
    // Handle email links specially
    if (platform === 'email') {
      window.location.href = url.startsWith('mailto:') ? url : `mailto:${url}`
    } else {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div className="flex justify-center gap-4">
      {links.map((link, index) => {
        const Icon = PLATFORM_ICONS[link.platform] || Globe
        const label = PLATFORM_LABELS[link.platform] || link.platform

        return (
          <button
            key={`${link.platform}-${index}`}
            onClick={() => handleClick(link.url, link.platform)}
            className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            title={label}
            aria-label={`Visit our ${label}`}
          >
            <Icon className="w-5 h-5" />
          </button>
        )
      })}
    </div>
  )
})
