'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useDebouncedValue, queryKeys, useCacheInvalidation } from '@/lib/hooks'
import { isLeaderOrAbove, isAdminOrOwner } from '@/lib/permissions'
import { getEvents, getChurchMembers } from '../actions'
import type { Event, Member } from '../types'

export type ViewMode = 'list' | 'calendar' | 'matrix' | 'templates'

export interface EventsInitialData {
  events: Event[]
  churchMembers: Member[]
  role: string
  firstDayOfWeek: number
}

interface UseEventListReturn {
  // Data
  events: Event[]
  churchMembers: Member[]
  userRole: string
  firstDayOfWeek: number

  // State
  isLoading: boolean
  error: string | null
  searchQuery: string
  viewMode: ViewMode

  // Filtered data
  filteredEvents: Event[]
  upcomingEvents: Event[]
  pastEvents: Event[]

  // Permissions
  canManage: boolean // Can create/edit/delete events (admin/owner only)
  canManageContent: boolean // Can manage agenda, songs, positions (leader+)
  canDelete: boolean

  // Actions
  setSearchQuery: (query: string) => void
  setViewMode: (mode: ViewMode) => void
  setError: (error: string | null) => void
  refreshEvents: () => Promise<void>
}

export function useEventList(initialData?: EventsInitialData): UseEventListReturn {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const { invalidateEvents, invalidateChurchMembers } = useCacheInvalidation()

  // Initialize viewMode from URL param (survives page revalidation)
  const initialViewMode = (): ViewMode => {
    const viewParam = searchParams.get('view')
    if (viewParam === 'list' || viewParam === 'calendar' || viewParam === 'matrix' || viewParam === 'templates') {
      return viewParam
    }
    return 'list'
  }

  // Local UI state
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300)
  const [viewMode, setViewModeState] = useState<ViewMode>(initialViewMode)
  const [error, setError] = useState<string | null>(null)

  // setViewMode that also updates the URL to persist across revalidation
  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode)
    // Update URL with new view mode (preserving other params)
    const params = new URLSearchParams(searchParams.toString())
    if (mode === 'list') {
      params.delete('view') // 'list' is default, no need for param
    } else {
      params.set('view', mode)
    }
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
    router.replace(newUrl, { scroll: false })
  }, [pathname, router, searchParams])

  // React Query with initialData for instant render
  const eventsQuery = useQuery({
    queryKey: queryKeys.events,
    queryFn: async () => {
      const result = await getEvents()
      if (result.error) {
        throw new Error(result.error)
      }
      return {
        data: result.data || [],
        role: result.role || '',
        firstDayOfWeek: result.firstDayOfWeek ?? 1,
      }
    },
    initialData: initialData ? {
      data: initialData.events,
      role: initialData.role,
      firstDayOfWeek: initialData.firstDayOfWeek,
    } : undefined,
    staleTime: 60 * 1000, // Data fresh for 1 minute
    refetchOnWindowFocus: false,
  })

  // React Query for church members with initialData
  const membersQuery = useQuery({
    queryKey: queryKeys.churchMembers,
    queryFn: async () => {
      const result = await getChurchMembers()
      return result.data || []
    },
    initialData: initialData?.churchMembers,
    staleTime: 5 * 60 * 1000, // Members data fresh for 5 minutes
    refetchOnWindowFocus: false,
  })

  // Extract data from queries with defaults
  const events = eventsQuery.data?.data ?? []
  const userRole = eventsQuery.data?.role ?? ''
  const firstDayOfWeek = eventsQuery.data?.firstDayOfWeek ?? 1
  const churchMembers = membersQuery.data ?? []
  const isLoading = eventsQuery.isLoading || membersQuery.isLoading

  // Sync viewMode with URL param changes (e.g., browser back/forward)
  useEffect(() => {
    const viewParam = searchParams.get('view')
    const targetMode: ViewMode = (viewParam === 'list' || viewParam === 'calendar' || viewParam === 'matrix' || viewParam === 'templates')
      ? viewParam
      : 'list'
    // Only update if different to avoid unnecessary state updates
    if (targetMode !== viewMode) {
      setViewModeState(targetMode)
    }
  }, [searchParams, viewMode])

  // Sync query errors to local error state
  useEffect(() => {
    if (eventsQuery.error) {
      setError(eventsQuery.error.message)
    }
  }, [eventsQuery.error])

  // Permissions
  // canManage: Can create/edit/delete events (admin/owner only)
  const canManage = useMemo(
    () => isAdminOrOwner(userRole),
    [userRole]
  )

  // canManageContent: Can manage agenda, songs, positions (leader+)
  const canManageContent = useMemo(
    () => isLeaderOrAbove(userRole),
    [userRole]
  )

  const canDelete = useMemo(
    () => isAdminOrOwner(userRole),
    [userRole]
  )

  // Filtered events (uses debounced search for performance)
  const filteredEvents = useMemo(() => {
    if (!debouncedSearchQuery) return events
    const query = debouncedSearchQuery.toLowerCase()
    return events.filter((event) =>
      event.title.toLowerCase().includes(query) ||
      event.description?.toLowerCase().includes(query)
    )
  }, [events, debouncedSearchQuery])

  // Separate into upcoming and past (using timestamp comparison for performance)
  const { upcomingEvents, pastEvents } = useMemo(() => {
    const nowTimestamp = Date.now()
    const upcoming: typeof filteredEvents = []
    const past: typeof filteredEvents = []

    for (const event of filteredEvents) {
      if (new Date(event.start_time).getTime() >= nowTimestamp) {
        upcoming.push(event)
      } else {
        past.push(event)
      }
    }

    return { upcomingEvents: upcoming, pastEvents: past }
  }, [filteredEvents])

  // Refresh function that uses React Query invalidation
  const refreshEvents = useCallback(async () => {
    await Promise.all([
      invalidateEvents(),
      invalidateChurchMembers(),
    ])
  }, [invalidateEvents, invalidateChurchMembers])

  return {
    // Data
    events,
    churchMembers,
    userRole,
    firstDayOfWeek,

    // State
    isLoading,
    error,
    searchQuery,
    viewMode,

    // Filtered data
    filteredEvents,
    upcomingEvents,
    pastEvents,

    // Permissions
    canManage,
    canManageContent,
    canDelete,

    // Actions
    setSearchQuery,
    setViewMode,
    setError,
    refreshEvents,
  }
}
