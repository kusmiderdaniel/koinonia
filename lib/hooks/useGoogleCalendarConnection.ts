'use client'

/**
 * React hook for Google Calendar connection management.
 */

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  GoogleCalendarConnectionResponse,
  GoogleCalendarConnection,
  CalendarInfo,
} from '@/lib/google-calendar/types'

// ============================================
// Types
// ============================================

interface Campus {
  id: string
  name: string
  color: string | null
}

interface UseGoogleCalendarConnectionReturn {
  // Connection state
  connection: GoogleCalendarConnection | null
  calendars: CalendarInfo[]
  availableCampuses: Campus[]
  canSyncChurchCalendar: boolean
  isLoading: boolean
  isError: boolean
  error: Error | null

  // Actions
  connect: () => Promise<void>
  disconnect: (deleteCalendars?: boolean) => Promise<void>
  updatePreferences: (preferences: UpdatePreferencesParams) => Promise<void>
  triggerSync: (eventId?: string) => Promise<void>

  // Loading states
  isConnecting: boolean
  isDisconnecting: boolean
  isUpdatingPreferences: boolean
  isSyncing: boolean
}

interface UpdatePreferencesParams {
  syncChurchCalendar?: boolean
  syncPersonalCalendar?: boolean
  campusPreferences?: {
    campusId: string
    enabled: boolean
  }[]
}

// ============================================
// API Functions
// ============================================

async function fetchConnectionStatus(): Promise<GoogleCalendarConnectionResponse> {
  const response = await fetch('/api/integrations/google-calendar/status')
  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.error || 'Failed to fetch connection status')
  }
  return response.json()
}

async function initiateConnection(): Promise<{ authUrl: string }> {
  const response = await fetch('/api/integrations/google-calendar/authorize')
  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.error || 'Failed to initiate connection')
  }
  return response.json()
}

async function disconnectCalendar(deleteCalendars: boolean): Promise<void> {
  const response = await fetch('/api/integrations/google-calendar/disconnect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deleteCalendars }),
  })
  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.error || 'Failed to disconnect')
  }
}

async function updateCalendarPreferences(preferences: UpdatePreferencesParams): Promise<void> {
  const response = await fetch('/api/integrations/google-calendar/preferences', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(preferences),
  })
  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.error || 'Failed to update preferences')
  }
}

async function syncCalendars(eventId?: string): Promise<{ success: boolean; synced: number }> {
  const response = await fetch('/api/integrations/google-calendar/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventId }),
  })
  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.error || 'Failed to sync')
  }
  return response.json()
}

// ============================================
// Hook
// ============================================

export function useGoogleCalendarConnection(): UseGoogleCalendarConnectionReturn {
  const queryClient = useQueryClient()
  const [isConnecting, setIsConnecting] = useState(false)

  // Query for connection status
  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['google-calendar-connection'],
    queryFn: fetchConnectionStatus,
    staleTime: 30000, // Consider data fresh for 30 seconds
    retry: 1,
  })

  // Mutation for disconnect
  const disconnectMutation = useMutation({
    mutationFn: (deleteCalendars: boolean) => disconnectCalendar(deleteCalendars),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-calendar-connection'] })
    },
  })

  // Mutation for preferences update
  const preferencesMutation = useMutation({
    mutationFn: updateCalendarPreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-calendar-connection'] })
    },
  })

  // Mutation for sync
  const syncMutation = useMutation({
    mutationFn: syncCalendars,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-calendar-connection'] })
    },
  })

  // Connect action - opens Google OAuth
  const connect = useCallback(async () => {
    setIsConnecting(true)
    try {
      const { authUrl } = await initiateConnection()
      // Redirect to Google OAuth
      window.location.href = authUrl
    } catch (error) {
      setIsConnecting(false)
      throw error
    }
    // Don't set isConnecting to false - we're redirecting
  }, [])

  // Disconnect action
  const disconnect = useCallback(async (deleteCalendars = false) => {
    await disconnectMutation.mutateAsync(deleteCalendars)
  }, [disconnectMutation])

  // Update preferences action
  const updatePreferences = useCallback(async (preferences: UpdatePreferencesParams) => {
    await preferencesMutation.mutateAsync(preferences)
  }, [preferencesMutation])

  // Trigger sync action
  const triggerSync = useCallback(async (eventId?: string) => {
    await syncMutation.mutateAsync(eventId)
  }, [syncMutation])

  return {
    connection: data?.connection || null,
    calendars: data?.calendars || [],
    availableCampuses: data?.availableCampuses || [],
    canSyncChurchCalendar: data?.canSyncChurchCalendar || false,
    isLoading,
    isError,
    error: error as Error | null,

    connect,
    disconnect,
    updatePreferences,
    triggerSync,

    isConnecting,
    isDisconnecting: disconnectMutation.isPending,
    isUpdatingPreferences: preferencesMutation.isPending,
    isSyncing: syncMutation.isPending,
  }
}
