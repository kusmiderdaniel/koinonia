'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys, useCacheInvalidation } from '@/lib/hooks'
import { isLeaderOrAbove, isAdminOrOwner } from '@/lib/permissions'
import { getMinistries } from '../actions'
import type { Ministry } from '../types'

export interface MinistriesInitialData {
  ministries: Ministry[]
  role: string
}

interface UseMinistryListReturn {
  // Data
  ministries: Ministry[]
  selectedMinistryId: string | null
  selectedMinistry: Ministry | undefined
  userRole: string

  // State
  isLoading: boolean
  error: string | null

  // Permissions
  canManage: boolean
  canManageDetail: boolean

  // Actions
  setSelectedMinistryId: (id: string | null) => void
  setError: (error: string | null) => void
  refreshMinistries: () => Promise<void>
}

export function useMinistryList(initialData?: MinistriesInitialData): UseMinistryListReturn {
  const { invalidateMinistries } = useCacheInvalidation()
  const queryClient = useQueryClient()

  // Local UI state - start with null, let effect handle auto-selection based on viewport
  const [selectedMinistryId, setSelectedMinistryId] = useState<string | null>(null)

  // Track if initial auto-selection has been done
  const [hasAutoSelected, setHasAutoSelected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // React Query with initialData for instant render
  const ministriesQuery = useQuery({
    queryKey: queryKeys.ministries,
    queryFn: async () => {
      const result = await getMinistries()
      if (result.error) {
        throw new Error(result.error)
      }
      return {
        data: result.data || [],
        role: result.role || '',
      }
    },
    initialData: initialData ? {
      data: initialData.ministries,
      role: initialData.role,
    } : undefined,
    staleTime: 60 * 1000, // Data fresh for 1 minute
    refetchOnWindowFocus: false,
  })

  // Extract data from query with defaults
  const ministries = ministriesQuery.data?.data ?? []
  const userRole = ministriesQuery.data?.role ?? ''
  const isLoading = ministriesQuery.isLoading

  // Auto-select first ministry when data loads (desktop only)
  // Check viewport directly to avoid race condition with useIsMobile hook
  useEffect(() => {
    if (typeof window === 'undefined') return

    const isMobileViewport = window.matchMedia('(max-width: 767px)').matches

    // Only auto-select on desktop
    if (!isMobileViewport && !hasAutoSelected && !selectedMinistryId && ministries.length > 0) {
      setSelectedMinistryId(ministries[0].id)
      setHasAutoSelected(true)
    }
  }, [ministries, selectedMinistryId, hasAutoSelected])

  // Sync query errors to local error state
  useEffect(() => {
    if (ministriesQuery.error) {
      setError(ministriesQuery.error.message)
    }
  }, [ministriesQuery.error])

  const selectedMinistry = useMemo(
    () => ministries.find((m) => m.id === selectedMinistryId),
    [ministries, selectedMinistryId]
  )

  const canManage = useMemo(
    () => isAdminOrOwner(userRole),
    [userRole]
  )

  const canManageDetail = useMemo(
    () => isLeaderOrAbove(userRole),
    [userRole]
  )

  // Refresh function that uses React Query invalidation
  const refreshMinistries = useCallback(async () => {
    await invalidateMinistries()
  }, [invalidateMinistries])

  return {
    // Data
    ministries,
    selectedMinistryId,
    selectedMinistry,
    userRole,

    // State
    isLoading,
    error,

    // Permissions
    canManage,
    canManageDetail,

    // Actions
    setSelectedMinistryId,
    setError,
    refreshMinistries,
  }
}
