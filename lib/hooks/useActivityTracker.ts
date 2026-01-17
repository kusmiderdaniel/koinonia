'use client'

import { useEffect, useRef, useCallback } from 'react'

// Update activity every 2 minutes to keep "online" status fresh
const UPDATE_INTERVAL_MS = 2 * 60 * 1000

export function useActivityTracker() {
  const lastUpdateRef = useRef<number>(0)

  const updateActivity = useCallback(async () => {
    const now = Date.now()
    // Don't update more frequently than every minute
    if (now - lastUpdateRef.current < 60 * 1000) {
      return
    }

    lastUpdateRef.current = now

    try {
      await fetch('/api/activity', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      // Silently fail - activity tracking is not critical
      console.debug('Activity update failed:', error)
    }
  }, [])

  useEffect(() => {
    // Update immediately on mount
    updateActivity()

    // Set up periodic updates
    const intervalId = setInterval(updateActivity, UPDATE_INTERVAL_MS)

    // Also update on user interaction events (debounced via lastUpdateRef)
    const handleActivity = () => updateActivity()

    // Track meaningful user interactions
    window.addEventListener('click', handleActivity)
    window.addEventListener('keydown', handleActivity)
    window.addEventListener('scroll', handleActivity, { passive: true })

    // Update when user returns to tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateActivity()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(intervalId)
      window.removeEventListener('click', handleActivity)
      window.removeEventListener('keydown', handleActivity)
      window.removeEventListener('scroll', handleActivity)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [updateActivity])
}
