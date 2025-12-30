'use client'

import { useCallback, useRef } from 'react'

/**
 * Hook to prefetch route data on hover
 * This is a no-op placeholder - prefetching is disabled to avoid
 * QueryClient context issues during SSR/hydration.
 *
 * The functionality can be re-enabled once proper hydration boundaries
 * are set up for React Query.
 */
export function usePrefetchRoutes() {
  // Track which routes have been prefetched to avoid duplicate calls
  const prefetchedRef = useRef<Set<string>>(new Set())

  // No-op functions - prefetching disabled for now
  const prefetchMinistries = useCallback(() => {
    // Disabled - data is fetched on navigation
  }, [])

  const prefetchSongs = useCallback(() => {
    // Disabled - data is fetched on navigation
  }, [])

  const prefetchEvents = useCallback(() => {
    // Disabled - data is fetched on navigation
  }, [])

  // Map route paths to their prefetch functions
  const prefetchRoute = useCallback((path: string) => {
    // Disabled - no prefetching
  }, [])

  // Reset prefetched cache (useful when data might be stale)
  const resetPrefetchCache = useCallback(() => {
    prefetchedRef.current.clear()
  }, [])

  return {
    prefetchRoute,
    prefetchMinistries,
    prefetchSongs,
    prefetchEvents,
    resetPrefetchCache,
  }
}
