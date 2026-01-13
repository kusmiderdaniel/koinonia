import { useCallback, useEffect, useRef, useState } from 'react'

type EventType = 'view' | 'start' | 'submit'
type DeviceType = 'desktop' | 'mobile' | 'tablet'

interface UseFormAnalyticsOptions {
  formId: string
  token?: string // For public forms, use token-based endpoint
}

// Generate a unique session ID for this browser session
function getSessionId(): string {
  const key = 'form_analytics_session'
  let sessionId = sessionStorage.getItem(key)
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    sessionStorage.setItem(key, sessionId)
  }
  return sessionId
}

// Detect device type based on screen width
function getDeviceType(): DeviceType {
  if (typeof window === 'undefined') return 'desktop'
  const width = window.innerWidth
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

export function useFormAnalytics({ formId, token }: UseFormAnalyticsOptions) {
  const hasTrackedView = useRef(false)
  const hasTrackedStart = useRef(false)
  const [sessionId] = useState(() => {
    if (typeof window === 'undefined') return ''
    return getSessionId()
  })

  // Track an analytics event
  const trackEvent = useCallback(
    async (eventType: EventType) => {
      if (!sessionId) return

      try {
        // Determine the endpoint based on whether we have a token (public form) or formId (internal)
        const endpoint = token
          ? `/api/public-forms/${token}/analytics`
          : `/api/forms/${formId}/analytics`

        await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            eventType,
            sessionId,
            deviceType: getDeviceType(),
          }),
        })
      } catch (error) {
        // Silently fail - analytics should not break form functionality
        console.debug('Analytics event failed:', error)
      }
    },
    [formId, token, sessionId]
  )

  // Track 'view' event on mount
  useEffect(() => {
    if (!hasTrackedView.current && sessionId) {
      hasTrackedView.current = true
      trackEvent('view')
    }
  }, [trackEvent, sessionId])

  // Track 'start' event on first field interaction
  const trackStart = useCallback(() => {
    if (!hasTrackedStart.current) {
      hasTrackedStart.current = true
      trackEvent('start')
    }
  }, [trackEvent])

  // Track 'submit' event
  const trackSubmit = useCallback(() => {
    trackEvent('submit')
  }, [trackEvent])

  return {
    trackStart,
    trackSubmit,
  }
}
