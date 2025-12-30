'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useRef } from 'react'
import { queryKeys } from './queries'

// Import server actions for each route
import { getMinistries } from '@/app/dashboard/ministries/actions'
import { getSongs } from '@/app/dashboard/songs/actions'
import { getEvents } from '@/app/dashboard/events/actions'

/**
 * Hook to prefetch route data on hover
 * This significantly improves perceived navigation speed by
 * loading data before the user clicks
 */
export function usePrefetchRoutes() {
  const queryClient = useQueryClient()

  // Track which routes have been prefetched to avoid duplicate calls
  const prefetchedRef = useRef<Set<string>>(new Set())

  const prefetchMinistries = useCallback(() => {
    if (prefetchedRef.current.has('ministries')) return
    prefetchedRef.current.add('ministries')

    queryClient.prefetchQuery({
      queryKey: queryKeys.ministries,
      queryFn: async () => {
        const result = await getMinistries()
        if (result.error) throw new Error(result.error)
        return { data: result.data || [], role: result.role || '' }
      },
      staleTime: 60 * 1000, // Match the staleTime used in the hook
    })
  }, [queryClient])

  const prefetchSongs = useCallback(() => {
    if (prefetchedRef.current.has('songs')) return
    prefetchedRef.current.add('songs')

    queryClient.prefetchQuery({
      queryKey: queryKeys.songs,
      queryFn: async () => {
        const result = await getSongs()
        if (result.error) throw new Error(result.error)
        return { songs: result.data || [], canManage: result.canManage || false }
      },
      staleTime: 60 * 1000,
    })
  }, [queryClient])

  const prefetchEvents = useCallback(() => {
    if (prefetchedRef.current.has('events')) return
    prefetchedRef.current.add('events')

    queryClient.prefetchQuery({
      queryKey: queryKeys.events,
      queryFn: async () => {
        const result = await getEvents()
        if (result.error) throw new Error(result.error)
        return {
          events: result.data || [],
          role: result.role || '',
          firstDayOfWeek: result.firstDayOfWeek ?? 1,
        }
      },
      staleTime: 60 * 1000,
    })
  }, [queryClient])

  // Map route paths to their prefetch functions
  const prefetchRoute = useCallback((path: string) => {
    switch (path) {
      case '/dashboard/ministries':
        prefetchMinistries()
        break
      case '/dashboard/songs':
        prefetchSongs()
        break
      case '/dashboard/events':
        prefetchEvents()
        break
      // People, Settings, Profile are server components or have their own loading states
      // Dashboard homepage is typically lightweight
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
