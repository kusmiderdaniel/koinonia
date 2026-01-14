export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { InboxPageClient } from './InboxPageClient'
import { getNotifications, getUnreadCount, getActionableCount } from '@/app/dashboard/notifications/actions'
import { hasPageAccess } from '@/lib/permissions'

export default async function InboxPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Check page access
  const adminClient = createServiceRoleClient()
  const { data: profile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!profile || !hasPageAccess(profile.role, 'inbox')) {
    redirect('/dashboard')
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
