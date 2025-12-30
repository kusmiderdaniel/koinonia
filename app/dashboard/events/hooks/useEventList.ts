'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useDebouncedValue, queryKeys, useServerQuery, useCacheInvalidation } from '@/lib/hooks'
import { getEvents, getChurchMembers } from '../actions'
import type { Event, Member } from '../types'

export type ViewMode = 'list' | 'calendar' | 'templates'

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
  canManage: boolean
  canDelete: boolean

  // Actions
  setSearchQuery: (query: string) => void
  setViewMode: (mode: ViewMode) => void
  setError: (error: string | null) => void
  refreshEvents: () => Promise<void>
}

export function useEventList(): UseEventListReturn {
  const searchParams = useSearchParams()
  const { invalidateEvents, invalidateChurchMembers } = useCacheInvalidation()

  // Local UI state
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [error, setError] = useState<string | null>(null)

  // React Query for events data
  const eventsQuery = useServerQuery<{
    data: Event[]
    role: string
    firstDayOfWeek: number
  }>(
    queryKeys.events,
    async () => {
      const result = await getEvents()
      if (result.error) {
        return { error: result.error }
      }
      return {
        data: {
          data: result.data || [],
          role: result.role || '',
          firstDayOfWeek: result.firstDayOfWeek ?? 1,
        },
      }
    },
    {
      staleTime: 60 * 1000, // Data fresh for 1 minute
      refetchOnWindowFocus: true,
    }
  )

  // React Query for church members
  const membersQuery = useServerQuery<Member[]>(
    queryKeys.churchMembers,
    async () => {
      const result = await getChurchMembers()
      return { data: result.data || [] }
    },
    {
      staleTime: 5 * 60 * 1000, // Members data fresh for 5 minutes
    }
  )

  // Extract data from queries with defaults
  const events = eventsQuery.data?.data ?? []
  const userRole = eventsQuery.data?.role ?? ''
  const firstDayOfWeek = eventsQuery.data?.firstDayOfWeek ?? 1
  const churchMembers = membersQuery.data ?? []
  const isLoading = eventsQuery.isLoading || membersQuery.isLoading

  // Handle view query param from URL
  useEffect(() => {
    const viewParam = searchParams.get('view')
    if (viewParam === 'list' || viewParam === 'calendar' || viewParam === 'templates') {
      setViewMode(viewParam)
    }
  }, [searchParams])

  // Sync query errors to local error state
  useEffect(() => {
    if (eventsQuery.error) {
      setError(eventsQuery.error.message)
    }
  }, [eventsQuery.error])

  // Permissions
  const canManage = useMemo(
    () => ['owner', 'admin', 'leader'].includes(userRole),
    [userRole]
  )

  const canDelete = useMemo(
    () => ['owner', 'admin'].includes(userRole),
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
    canDelete,

    // Actions
    setSearchQuery,
    setViewMode,
    setError,
    refreshEvents,
  }
}
