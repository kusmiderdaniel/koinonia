import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { InboxPageClient } from './InboxPageClient'
import { getNotifications, getUnreadCount, getActionableCount } from '@/app/dashboard/notifications/actions'

export default async function InboxPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Fetch notifications and counts in parallel
  const [notificationsResult, unreadResult, actionableResult] = await Promise.all([
    getNotifications(100),
    getUnreadCount(),
    getActionableCount(),
  ])

  const notifications = notificationsResult.data || []
  const unreadCount = unreadResult.count || 0
  const actionableCount = actionableResult.count || 0

  return (
    <InboxPageClient
      initialNotifications={notifications}
      initialUnreadCount={unreadCount}
      initialActionableCount={actionableCount}
    />
  )
}
