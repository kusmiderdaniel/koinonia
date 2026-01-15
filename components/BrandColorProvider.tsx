'use client'

import { useEffect } from 'react'
import { hexToOklch } from '@/lib/utils'

interface BrandColorProviderProps {
  brandColor: string | null
  children: React.ReactNode
}

const DEFAULT_BRAND_COLOR = '#f49f1e'

export function BrandColorProvider({ brandColor, children }: BrandColorProviderProps) {
  useEffect(() => {
    const color = brandColor || DEFAULT_BRAND_COLOR
    const oklchColor = hexToOklch(color)

    // Set the CSS variable on the document root
    document.documentElement.style.setProperty('--brand', oklchColor)

    // Cleanup on unmount - reset to default
    return () => {
      document.documentElement.style.setProperty('--brand', hexToOklch(DEFAULT_BRAND_COLOR))
    }
  }, [brandColor])

  return <>{children}</>
}
