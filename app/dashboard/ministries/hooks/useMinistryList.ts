'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { queryKeys, useServerQuery, useCacheInvalidation } from '@/lib/hooks'
import { getMinistries } from '../actions'
import type { Ministry } from '../types'

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

export function useMinistryList(): UseMinistryListReturn {
  const { invalidateMinistries } = useCacheInvalidation()

  // Local UI state
  const [selectedMinistryId, setSelectedMinistryId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // React Query for ministries data
  const ministriesQuery = useServerQuery<{
    data: Ministry[]
    role: string
  }>(
    queryKeys.ministries,
    async () => {
      const result = await getMinistries()
      if (result.error) {
        return { error: result.error }
      }
      return {
        data: {
          data: result.data || [],
          role: result.role || '',
        },
      }
    },
    {
      staleTime: 60 * 1000, // Data fresh for 1 minute
      refetchOnWindowFocus: true,
    }
  )

  // Extract data from query with defaults
  const ministries = ministriesQuery.data?.data ?? []
  const userRole = ministriesQuery.data?.role ?? ''
  const isLoading = ministriesQuery.isLoading

  // Auto-select first ministry when data loads
  useEffect(() => {
    if (!selectedMinistryId && ministries.length > 0) {
      setSelectedMinistryId(ministries[0].id)
    }
  }, [ministries, selectedMinistryId])

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
    () => userRole === 'admin' || userRole === 'owner',
    [userRole]
  )

  const canManageDetail = useMemo(
    () => ['owner', 'admin', 'leader'].includes(userRole),
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
