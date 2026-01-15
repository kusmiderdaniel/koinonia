'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, CheckCheck, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { NotificationItem } from './NotificationItem'
import {
  getNotifications,
  getUnreadCount,
  getActionableCount,
  markAllAsRead,
} from '@/app/dashboard/notifications/actions'
import type { Notification } from '@/types/notifications'
import { toast } from 'sonner'
import { onNotificationRefresh } from '@/lib/events/notifications'

export function NotificationCenter() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadBadgeCount, setUnreadBadgeCount] = useState(0)
  const [actionableCount, setActionableCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false)

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch badge counts (unread + actionable)
  const fetchCounts = useCallback(async () => {
    try {
      const [unreadResult, actionableResult] = await Promise.all([
        getUnreadCount(),
        getActionableCount(),
      ])
      if (typeof unreadResult.count === 'number') {
        setUnreadBadgeCount(unreadResult.count)
      }
      if (typeof actionableResult.count === 'number') {
        setActionableCount(actionableResult.count)
      }
    } catch (error) {
      console.error('Error fetching notification counts:', error)
    }
  }, [])

  // Fetch full notifications list
  const fetchNotifications = useCallback(async () => {
    setIsLoading(true)
    try {
      const [notificationsResult, unreadResult, actionableResult] = await Promise.all([
        getNotifications(20),
        getUnreadCount(),
        getActionableCount(),
      ])

      if (notificationsResult.data) {
        setNotifications(notificationsResult.data)
      }

      if (typeof unreadResult.count === 'number') {
        setUnreadBadgeCount(unreadResult.count)
      }

      if (typeof actionableResult.count === 'number') {
        setActionableCount(actionableResult.count)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen, fetchNotifications])

  // Initial fetch for badge count + polling every 30 seconds
  useEffect(() => {
    fetchCounts()
    const interval = setInterval(fetchCounts, 30000)
    return () => clearInterval(interval)
  }, [fetchCounts])

  // Listen for notification refresh events (e.g., when invitation is responded to)
  useEffect(() => {
    return onNotificationRefresh(() => {
      fetchCounts()
      // Also refresh full notifications if dropdown is open
      if (isOpen) {
        fetchNotifications()
      }
    })
  }, [isOpen, fetchCounts, fetchNotifications])

  const handleMarkAllRead = async () => {
    setIsMarkingAllRead(true)
    try {
      const result = await markAllAsRead()
      if (result.error) {
        toast.error(result.error)
      } else {
        // Update local state
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
        )
        toast.success('All notifications marked as read')
      }
    } catch (error) {
      toast.error('Failed to mark all as read')
    } finally {
      setIsMarkingAllRead(false)
    }
  }

  const handleActionComplete = () => {
    // Refresh notifications after an action
    fetchNotifications()
  }

  const handleNavigateToEvent = (eventId: string) => {
    setIsOpen(false)
    router.push(`/dashboard/events?event=${eventId}`)
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  // Show placeholder during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="relative rounded-full hover:bg-gray-50 dark:hover:bg-zinc-900"
      >
        <Bell className="h-5 w-5" />
      </Button>
    )
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full hover:bg-gray-50 dark:hover:bg-zinc-900"
        >
          <Bell className={`h-5 w-5 ${unreadBadgeCount > 0 ? 'text-brand fill-brand' : ''}`} />
          {unreadBadgeCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center text-xs rounded-full"
            >
              {unreadBadgeCount > 9 ? '9+' : unreadBadgeCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="w-80 p-0 bg-white dark:bg-zinc-950"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleMarkAllRead}
              disabled={isMarkingAllRead}
            >
              {isMarkingAllRead ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : (
                <CheckCheck className="w-3 h-3 mr-1" />
              )}
              Mark all read
            </Button>
          )}
        </div>

        {/* Notifications list */}
        <ScrollArea className="max-h-[400px]">
          {isLoading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div>
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onActionComplete={handleActionComplete}
                  onNavigateToEvent={notification.event_id ? () => handleNavigateToEvent(notification.event_id!) : undefined}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer - pending invitations count */}
        {actionableCount > 0 && (
          <div className="px-4 py-2 border-t bg-amber-50 dark:bg-amber-950/30">
            <p className="text-xs text-amber-700 dark:text-amber-400">
              {actionableCount} pending invitation{actionableCount !== 1 ? 's' : ''} requiring response
            </p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
