'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Check, CheckCheck, Inbox, Loader2 } from 'lucide-react'
import { NotificationItem } from '@/components/NotificationItem'
import { getNotifications, markAllAsRead, getUnreadCount, getActionableCount } from '@/app/dashboard/notifications/actions'
import type { Notification } from '@/types/notifications'
import { toast } from 'sonner'
import { onNotificationRefresh } from '@/lib/events/notifications'

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
  const t = useTranslations('inbox')
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [notifications, setNotifications] = useState(initialNotifications)
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const [actionableCount, setActionableCount] = useState(initialActionableCount)
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'actionable'>('all')

  useEffect(() => {
    setMounted(true)
  }, [])

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

  // Listen for notification refresh events (e.g., when invitation is responded to from home page)
  useEffect(() => {
    return onNotificationRefresh(refreshNotifications)
  }, [refreshNotifications])

  const handleMarkAllAsRead = async () => {
    setIsMarkingAllRead(true)
    try {
      const result = await markAllAsRead()
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(t('toast.markedAllRead'))
        await refreshNotifications()
      }
    } catch {
      toast.error(t('toast.markAllReadError'))
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

  if (!mounted) {
    return null
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] md:h-screen overflow-hidden">
      <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 shrink-0 gap-2">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <Inbox className="h-6 w-6 md:h-7 md:w-7 flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-bold">{t('title')}</h1>
              <p className="text-xs md:text-sm text-muted-foreground truncate">
                {unreadCount > 0 ? t('unreadCount', { count: unreadCount }) : t('allCaughtUp')}
                {actionableCount > 0 && ` · ${t('pendingCount', { count: actionableCount })}`}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAllRead}
              className="gap-1.5 md:gap-2 !rounded-full !border-black dark:!border-white text-xs md:text-sm flex-shrink-0"
            >
              {isMarkingAllRead ? (
                <Loader2 className="h-3.5 w-3.5 md:h-4 md:w-4 animate-spin" />
              ) : (
                <CheckCheck className="h-3.5 w-3.5 md:h-4 md:w-4" />
              )}
              <span className="hidden sm:inline">{t('markAllRead')}</span>
              <span className="sm:hidden">{t('markAllReadShort')}</span>
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-auto">
          <div className="md:border md:border-black md:dark:border-zinc-700 rounded-lg md:p-4 max-w-2xl">
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
              <TabsList className="mb-4 w-full border border-black dark:border-zinc-700">
                <TabsTrigger value="all" className="flex-1 text-xs md:text-sm py-2 md:py-1.5 data-[state=active]:bg-brand data-[state=active]:text-white">
                  {t('tabs.all')}
                </TabsTrigger>
                <TabsTrigger value="unread" className="flex-1 text-xs md:text-sm py-2 md:py-1.5 data-[state=active]:bg-brand data-[state=active]:text-white">
                  {t('tabs.unread')}
                </TabsTrigger>
                <TabsTrigger value="actionable" className="flex-1 text-xs md:text-sm py-2 md:py-1.5 data-[state=active]:bg-brand data-[state=active]:text-white">
                  <span className="hidden sm:inline">{t('tabs.actionable')}</span>
                  <span className="sm:hidden">{t('tabs.actionableShort')}</span>
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
                        {t(`empty.${activeTab}.title`)}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {t(`empty.${activeTab}.description`)}
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
        </div>
      </div>
    </div>
  )
}
