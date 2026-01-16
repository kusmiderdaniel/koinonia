'use client'

import { useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface UseNotificationSubscriptionOptions {
  /**
   * The profile ID to filter notifications for
   */
  profileId: string
  /**
   * Callback when any notification change occurs (INSERT, UPDATE, DELETE)
   */
  onNotificationChange: () => void
  /**
   * Whether the subscription is enabled (default: true)
   */
  enabled?: boolean
}

/**
 * Hook to subscribe to real-time notification changes via Supabase Realtime
 *
 * Replaces polling with instant updates when notifications are created,
 * updated, or deleted for the specified user.
 *
 * @example
 * ```tsx
 * useNotificationSubscription({
 *   profileId: 'user-profile-id',
 *   onNotificationChange: () => {
 *     // Refresh notifications from server
 *     refreshNotifications()
 *   },
 * })
 * ```
 */
export function useNotificationSubscription({
  profileId,
  onNotificationChange,
  enabled = true,
}: UseNotificationSubscriptionOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabaseRef = useRef(createClient())

  // Stable callback ref to avoid subscription recreation on callback change
  const onChangeRef = useRef(onNotificationChange)
  useEffect(() => {
    onChangeRef.current = onNotificationChange
  }, [onNotificationChange])

  const handleChange = useCallback(() => {
    onChangeRef.current()
  }, [])

  useEffect(() => {
    if (!enabled || !profileId) {
      return
    }

    const supabase = supabaseRef.current

    // Create a channel for this user's notifications
    const channel = supabase
      .channel(`notifications:${profileId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${profileId}`,
        },
        (payload) => {
          // Log for debugging in development
          if (process.env.NODE_ENV === 'development') {
            console.log('[Realtime] Notification change:', payload.eventType)
          }
          handleChange()
        }
      )
      .subscribe((status) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[Realtime] Subscription status:', status)
        }
      })

    channelRef.current = channel

    // Cleanup on unmount or when dependencies change
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [profileId, enabled, handleChange])

  // Return a function to manually unsubscribe if needed
  return {
    unsubscribe: useCallback(() => {
      if (channelRef.current) {
        supabaseRef.current.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }, []),
  }
}
