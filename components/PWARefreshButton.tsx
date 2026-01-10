'use client'

import { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Shows a refresh button only when running as installed PWA (standalone mode).
 * This helps users refresh content since there's no browser refresh button.
 */
export function PWARefreshButton() {
  const [isStandalone, setIsStandalone] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    // Check if running as installed PWA
    const isInStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      // @ts-expect-error - iOS Safari specific
      window.navigator.standalone === true

    setIsStandalone(isInStandaloneMode)
  }, [])

  if (!isStandalone) {
    return null
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    window.location.reload()
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="fixed bottom-20 right-4 z-50 rounded-full shadow-lg bg-white dark:bg-zinc-900 h-10 w-10"
      title="Refresh"
    >
      <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
    </Button>
  )
}
