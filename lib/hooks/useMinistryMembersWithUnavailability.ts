'use client'

import { useState, useMemo, useEffect } from 'react'
import { useDebouncedValue } from './useDebounce'

export interface BaseMember {
  id: string
  first_name: string
  last_name: string
  email: string | null
}

export interface UnavailabilityInfo {
  profile_id: string
  reason: string | null
}

export interface UseMinistryMembersWithUnavailabilityOptions<T extends BaseMember> {
  /**
   * Function to fetch members (can include null values which will be filtered out)
   */
  fetchMembers: () => Promise<{ data?: (T | null)[] | null; error?: string }>
  /**
   * Function to fetch unavailability for given date and profile IDs
   */
  fetchUnavailability?: (date: string, profileIds: string[]) => Promise<{ data?: UnavailabilityInfo[] | null; error?: string }>
  /**
   * Event date to check unavailability against
   */
  eventDate?: string
  /**
   * Whether to enable the hook (e.g., only when dialog is open)
   */
  enabled?: boolean
}

export interface UseMinistryMembersWithUnavailabilityResult<T extends BaseMember> {
  members: T[]
  filteredMembers: T[]
  sortedMembers: T[]
  unavailableIds: Set<string>
  unavailabilityReasons: Map<string, string | null>
  search: string
  setSearch: (search: string) => void
  isLoading: boolean
  error: string | null
}

/**
 * Hook to fetch ministry members and check their unavailability for a specific date.
 * Provides search filtering and sorting (available members first).
 */
export function useMinistryMembersWithUnavailability<T extends BaseMember>({
  fetchMembers,
  fetchUnavailability,
  eventDate,
  enabled = true,
}: UseMinistryMembersWithUnavailabilityOptions<T>): UseMinistryMembersWithUnavailabilityResult<T> {
  const [members, setMembers] = useState<T[]>([])
  const [unavailableIds, setUnavailableIds] = useState<Set<string>>(new Set())
  const [unavailabilityReasons, setUnavailabilityReasons] = useState<Map<string, string | null>>(new Map())
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch members and unavailability when enabled
  useEffect(() => {
    if (!enabled) {
      return
    }

    setIsLoading(true)
    setSearch('')
    setError(null)

    fetchMembers().then(async (result) => {
      if (result.error) {
        setError(result.error)
        setIsLoading(false)
        return
      }

      const validMembers = (result.data || []).filter((m): m is T => m !== null)
      setMembers(validMembers)

      // Fetch unavailability if configured
      if (fetchUnavailability && validMembers.length > 0 && eventDate) {
        const profileIds = validMembers.map((m) => m.id)
        const unavailResult = await fetchUnavailability(eventDate, profileIds)

        if (!unavailResult.error && unavailResult.data) {
          const unavailSet = new Set(unavailResult.data.map((u) => u.profile_id))
          setUnavailableIds(unavailSet)

          const reasonsMap = new Map<string, string | null>()
          unavailResult.data.forEach((u) => {
            reasonsMap.set(u.profile_id, u.reason)
          })
          setUnavailabilityReasons(reasonsMap)
        }
      }

      setIsLoading(false)
    })
  }, [enabled, fetchMembers, fetchUnavailability, eventDate])

  // Filter members by search term
  const filteredMembers = useMemo(() => {
    if (!debouncedSearch.trim()) return members

    const searchLower = debouncedSearch.toLowerCase()
    return members.filter(
      (m) =>
        m.first_name.toLowerCase().includes(searchLower) ||
        m.last_name.toLowerCase().includes(searchLower) ||
        (m.email?.toLowerCase().includes(searchLower) ?? false)
    )
  }, [members, debouncedSearch])

  // Sort members: available first, then unavailable
  const sortedMembers = useMemo(() => {
    return [...filteredMembers].sort((a, b) => {
      const aUnavailable = unavailableIds.has(a.id)
      const bUnavailable = unavailableIds.has(b.id)
      if (aUnavailable && !bUnavailable) return 1
      if (!aUnavailable && bUnavailable) return -1
      return 0
    })
  }, [filteredMembers, unavailableIds])

  return {
    members,
    filteredMembers,
    sortedMembers,
    unavailableIds,
    unavailabilityReasons,
    search,
    setSearch,
    isLoading,
    error,
  }
}
