'use client'

import { useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from './queries'

/**
 * Hook to prefetch route data on hover for faster navigation.
 * Uses React Query's prefetchQuery to cache data before user navigates.
 */
export function usePrefetchRoutes() {
  const queryClient = useQueryClient()
  // Track which routes have been prefetched to avoid duplicate calls
  const prefetchedRef = useRef<Set<string>>(new Set())

  const prefetchMinistries = useCallback(async () => {
    if (prefetchedRef.current.has('ministries')) return
    prefetchedRef.current.add('ministries')

    try {
      const { getMinistries } = await import('@/app/dashboard/ministries/actions')
      await queryClient.prefetchQuery({
        queryKey: queryKeys.ministries,
        queryFn: async () => {
          const result = await getMinistries()
          if (result.error) throw new Error(result.error)
          return result.data
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
      })
    } catch {
      prefetchedRef.current.delete('ministries')
    }
  }, [queryClient])

  const prefetchSongs = useCallback(async () => {
    if (prefetchedRef.current.has('songs')) return
    prefetchedRef.current.add('songs')

    try {
      const { getSongs } = await import('@/app/dashboard/songs/actions')
      await queryClient.prefetchQuery({
        queryKey: queryKeys.songs,
        queryFn: async () => {
          const result = await getSongs()
          if (result.error) throw new Error(result.error)
          return result.data
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
      })
    } catch {
      prefetchedRef.current.delete('songs')
    }
  }, [queryClient])

  const prefetchEvents = useCallback(async () => {
    if (prefetchedRef.current.has('events')) return
    prefetchedRef.current.add('events')

    try {
      const { getEvents } = await import('@/app/dashboard/events/actions')
      await queryClient.prefetchQuery({
        queryKey: queryKeys.events,
        queryFn: async () => {
          const result = await getEvents()
          if (result.error) throw new Error(result.error)
          return result.data
        },
        staleTime: 60 * 1000, // 1 minute
      })
    } catch {
      prefetchedRef.current.delete('events')
    }
  }, [queryClient])

  // Map route paths to their prefetch functions
  const prefetchRoute = useCallback((path: string) => {
    if (path.includes('/ministries')) {
      prefetchMinistries()
    } else if (path.includes('/songs')) {
      prefetchSongs()
    } else if (path.includes('/events')) {
      prefetchEvents()
    }
  }, [prefetchMinistries, prefetchSongs, prefetchEvents])

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
