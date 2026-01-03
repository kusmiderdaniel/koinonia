'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Check, CheckCheck, Inbox, Loader2 } from 'lucide-react'
import { NotificationItem } from '@/components/NotificationItem'
import { getNotifications, markAllAsRead, getUnreadCount, getActionableCount } from '@/app/dashboard/notifications/actions'
import type { Notification } from '@/types/notifications'
import { toast } from 'sonner'

interface InboxPageClientProps {
  initialNotifications: Notification[]
  initialUnreadCount: number
  initialActionableCount: number
}

export function InboxPageClient({
  initialNotifications,
  initialUnreadCount,
  initialActionableCount,
}: InboxPageClientProps) {
  const router = useRouter()
  const [notifications, setNotifications] = useState(initialNotifications)
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const [actionableCount, setActionableCount] = useState(initialActionableCount)
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'actionable'>('all')

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    const [notificationsResult, unreadResult, actionableResult] = await Promise.all([
      getNotifications(100),
      getUnreadCount(),
      getActionableCount(),
    ])

    if (notificationsResult.data) {
      setNotifications(notificationsResult.data)
    }
    if (typeof unreadResult.count === 'number') {
      setUnreadCount(unreadResult.count)
    }
    if (typeof actionableResult.count === 'number') {
      setActionableCount(actionableResult.count)
    }
  }, [])

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(refreshNotifications, 30000)
    return () => clearInterval(interval)
  }, [refreshNotifications])

  const handleMarkAllAsRead = async () => {
    setIsMarkingAllRead(true)
    try {
      const result = await markAllAsRead()
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('All notifications marked as read')
        await refreshNotifications()
      }
    } catch {
      toast.error('Failed to mark all as read')
    } finally {
      setIsMarkingAllRead(false)
    }
  }

  const handleActionComplete = () => {
    refreshNotifications()
  }

  const handleNavigateToEvent = (eventId: string | null) => {
    if (eventId) {
      router.push(`/dashboard/events?event=${eventId}`)
    }
  }

  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.is_read
    if (activeTab === 'actionable') {
      return n.type === 'position_invitation' && !n.is_actioned && n.assignment_id
    }
    return true
  })

  return (
    <div className="container max-w-4xl py-6 px-4 sm:px-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Inbox className="h-7 w-7" />
          <div>
            <h1 className="text-2xl font-bold">Inbox</h1>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              {actionableCount > 0 && ` · ${actionableCount} pending response`}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={isMarkingAllRead}
            className="gap-2"
          >
            {isMarkingAllRead ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck className="h-4 w-4" />
            )}
            Mark all read
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="mb-4 w-full">
          <TabsTrigger value="all" className="flex-1 data-[state=active]:bg-brand data-[state=active]:text-white">
            All
          </TabsTrigger>
          <TabsTrigger value="unread" className="flex-1 data-[state=active]:bg-brand data-[state=active]:text-white">
            Unread
          </TabsTrigger>
          <TabsTrigger value="actionable" className="flex-1 data-[state=active]:bg-brand data-[state=active]:text-white">
            Needs Response
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  {activeTab === 'actionable' ? (
                    <Check className="h-6 w-6 text-muted-foreground" />
                  ) : (
                    <Inbox className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <h3 className="font-medium mb-1">
                  {activeTab === 'all' && 'No notifications yet'}
                  {activeTab === 'unread' && 'All caught up!'}
                  {activeTab === 'actionable' && 'No pending invitations'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {activeTab === 'all' && "You'll receive notifications for event invitations, task assignments, and more."}
                  {activeTab === 'unread' && "You've read all your notifications."}
                  {activeTab === 'actionable' && "You've responded to all invitations."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onActionComplete={handleActionComplete}
                  onNavigateToEvent={notification.event_id ? () => handleNavigateToEvent(notification.event_id) : undefined}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
