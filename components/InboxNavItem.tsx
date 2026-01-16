'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Inbox } from 'lucide-react'
import { ProgressLink } from '@/components/ProgressLink'
import { getUnreadCount } from '@/app/dashboard/notifications/actions'
import { onNotificationRefresh } from '@/lib/events/notifications'
import { useNotificationSubscription } from '@/lib/hooks/useNotificationSubscription'

interface InboxNavItemProps {
  profileId: string
  collapsed: boolean
  isMobile?: boolean
  onNavigate?: () => void
  onPrefetch?: () => void
}

export function InboxNavItem({ profileId, collapsed, isMobile = false, onNavigate, onPrefetch }: InboxNavItemProps) {
  const t = useTranslations('dashboard.navigation')
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(0)
  const isActive = pathname === '/dashboard/inbox'

  const fetchUnreadCount = useCallback(async () => {
    const result = await getUnreadCount()
    if (typeof result.count === 'number') {
      setUnreadCount(result.count)
    }
  }, [])

  // Fetch on mount
  useEffect(() => {
    fetchUnreadCount()
  }, [fetchUnreadCount])

  // Subscribe to real-time notification changes via Supabase Realtime
  useNotificationSubscription({
    profileId,
    onNotificationChange: fetchUnreadCount,
  })

  // Refetch when navigating away from inbox (user may have read notifications)
  useEffect(() => {
    if (!isActive) {
      fetchUnreadCount()
    }
  }, [isActive, fetchUnreadCount])

  // Listen for notification refresh events (e.g., when invitation is responded to)
  useEffect(() => {
    return onNotificationRefresh(fetchUnreadCount)
  }, [fetchUnreadCount])

  const linkContent = (
    <ProgressLink
      href="/dashboard/inbox"
      onClick={onNavigate}
      onMouseEnter={onPrefetch}
      className={cn(
        'flex items-center rounded-lg text-sm font-medium transition-colors relative',
        isMobile ? 'py-3 min-h-12' : 'py-2',
        isActive
          ? 'bg-brand text-brand-foreground'
          : 'text-muted-foreground hover:bg-gray-50 dark:hover:bg-zinc-900 hover:text-foreground'
      )}
    >
      <div className="w-12 flex items-center justify-center flex-shrink-0 relative">
        <Inbox className={isMobile ? 'w-6 h-6' : 'w-5 h-5'} />
        {/* Badge for collapsed mode - positioned on icon */}
        {collapsed && unreadCount > 0 && (
          <span className="absolute -top-1 -right-0.5 h-4 min-w-4 px-1 text-[10px] rounded-full flex items-center justify-center bg-red-600 text-white font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </div>
      {!collapsed && (
        <>
          <span className={cn('pr-3', isMobile && 'text-base')}>{t('inbox')}</span>
          {/* Badge for expanded mode - after label */}
          {unreadCount > 0 && (
            <span className="ml-auto mr-3 h-5 min-w-5 px-1.5 text-xs rounded-full flex items-center justify-center bg-red-600 text-white font-medium">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </>
      )}
    </ProgressLink>
  )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {linkContent}
        </TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-2">
          {t('inbox')}
          {unreadCount > 0 && (
            <span className="h-5 min-w-5 px-1.5 text-xs rounded-full flex items-center justify-center bg-red-600 text-white font-medium">
              {unreadCount}
            </span>
          )}
        </TooltipContent>
      </Tooltip>
    )
  }

  return linkContent
}
