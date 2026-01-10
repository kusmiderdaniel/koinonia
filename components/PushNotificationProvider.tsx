'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import {
  requestFCMToken,
  onForegroundMessage,
  isPushSupported,
  getNotificationPermission,
} from '@/lib/firebase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface PushContextValue {
  isSupported: boolean
  isEnabled: boolean
  isLoading: boolean
  permission: NotificationPermission | 'unsupported'
  requestPermission: () => Promise<boolean>
  currentToken: string | null
  deviceId: string | null
}

const PushContext = createContext<PushContextValue | null>(null)

// Generate a unique device ID for this browser
function generateUUID(): string {
  // Fallback for browsers that don't support crypto.randomUUID
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback using crypto.getRandomValues
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (crypto.getRandomValues(new Uint8Array(1))[0] & 15) >> (c === 'x' ? 0 : 3)
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

function getDeviceId(): string {
  if (typeof window === 'undefined') return ''

  const storageKey = 'koinonia_device_id'
  let deviceId = localStorage.getItem(storageKey)

  if (!deviceId) {
    deviceId = `web-${generateUUID()}`
    localStorage.setItem(storageKey, deviceId)
  }

  return deviceId
}

export function PushNotificationProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [isSupported, setIsSupported] = useState(false)
  const [isEnabled, setIsEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default')
  const [currentToken, setCurrentToken] = useState<string | null>(null)
  const [deviceId, setDeviceId] = useState<string | null>(null)

  const registerToken = useCallback(async (token: string, devId: string) => {
    try {
      const response = await fetch('/api/push/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          deviceId: devId,
          platform: 'web',
          deviceName: navigator.userAgent.slice(0, 100),
        }),
      })

      if (!response.ok) {
        console.error('[Push] Failed to register token')
        return false
      }
      return true
    } catch (error) {
      console.error('[Push] Registration error:', error)
      return false
    }
  }, [])

  useEffect(() => {
    const initialize = async () => {
      // Get device ID
      const devId = getDeviceId()
      setDeviceId(devId)

      // Check if push is supported
      const supported = await isPushSupported()
      setIsSupported(supported)

      if (!supported) {
        setIsLoading(false)
        setPermission('unsupported')
        return
      }

      // Check current permission
      const perm = getNotificationPermission()
      setPermission(perm)

      if (perm === 'granted') {
        // Already have permission, get token
        const token = await requestFCMToken()
        if (token) {
          setCurrentToken(token)
          setIsEnabled(true)
          await registerToken(token, devId)
        }
      }

      setIsLoading(false)
    }

    initialize()
  }, [registerToken])

  // Listen for foreground messages
  useEffect(() => {
    if (!isEnabled) return

    const unsubscribe = onForegroundMessage((payload) => {
      // Show toast for foreground notifications
      toast(payload.notification?.title || 'Notification', {
        description: payload.notification?.body,
        action: payload.data?.event_id
          ? {
              label: 'View',
              onClick: () => {
                router.push(`/dashboard/events?event=${payload.data!.event_id}`)
              },
            }
          : payload.data?.type === 'position_invitation'
            ? {
                label: 'View',
                onClick: () => {
                  router.push('/dashboard/inbox')
                },
              }
            : undefined,
      })
    })

    return unsubscribe
  }, [isEnabled, router])

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !deviceId) return false

    setIsLoading(true)
    try {
      const token = await requestFCMToken()
      if (token) {
        setCurrentToken(token)
        setIsEnabled(true)
        setPermission('granted')
        const registered = await registerToken(token, deviceId)
        if (registered) {
          toast.success('Push notifications enabled')
        }
        return registered
      }

      // Check if permission was denied
      const perm = getNotificationPermission()
      setPermission(perm)

      if (perm === 'denied') {
        toast.error('Notifications blocked. Please enable them in browser settings.')
      }

      return false
    } catch (error) {
      console.error('[Push] Permission request failed:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isSupported, deviceId, registerToken])

  return (
    <PushContext.Provider
      value={{
        isSupported,
        isEnabled,
        isLoading,
        permission,
        requestPermission,
        currentToken,
        deviceId,
      }}
    >
      {children}
    </PushContext.Provider>
  )
}

export function usePushNotifications() {
  const context = useContext(PushContext)
  if (!context) {
    throw new Error('usePushNotifications must be used within PushNotificationProvider')
  }
  return context
}
