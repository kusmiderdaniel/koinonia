'use client'

import { useState, useEffect } from 'react'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Sync with browser API on mount
    setMatches(media.matches)

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [query])

  return matches
}

// Convenience hook for detecting mobile viewport
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)')
}
