'use client'

import { useState, useEffect } from 'react'
import { Bell, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePushNotifications } from './PushNotificationProvider'

const STORAGE_KEY = 'koinonia_push_banner_dismissed'

export function PushPermissionBanner() {
  const { isSupported, isEnabled, isLoading, permission, requestPermission } =
    usePushNotifications()
  const [isDismissed, setIsDismissed] = useState(true) // Start dismissed to avoid flash
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if banner was previously dismissed
    const dismissed = localStorage.getItem(STORAGE_KEY)
    if (dismissed) {
      setIsDismissed(true)
      return
    }
    setIsDismissed(false)
  }, [])

  useEffect(() => {
    // Show banner if: supported, not enabled, not loading, not dismissed, permission not denied
    const shouldShow =
      isSupported && !isEnabled && !isLoading && !isDismissed && permission !== 'denied'
    setIsVisible(shouldShow)
  }, [isSupported, isEnabled, isLoading, isDismissed, permission])

  if (!isVisible) {
    return null
  }

  const handleEnable = async () => {
    await requestPermission()
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    setIsVisible(false)
    localStorage.setItem(STORAGE_KEY, 'true')
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white dark:bg-zinc-900 border rounded-lg shadow-lg p-4 z-50">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className="p-2 bg-brand/10 rounded-full flex-shrink-0">
          <Bell className="h-5 w-5 text-brand" />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm">Enable Push Notifications</h4>
          <p className="text-xs text-muted-foreground mt-1">
            Get instant alerts for invitations, reminders, and updates.
          </p>

          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              onClick={handleEnable}
              disabled={isLoading}
              className="bg-brand hover:bg-brand/90 text-brand-foreground"
            >
              {isLoading ? 'Enabling...' : 'Enable'}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss}>
              Not now
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
