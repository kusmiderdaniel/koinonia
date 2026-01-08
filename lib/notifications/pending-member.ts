import { createServiceRoleClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/config'
import { PendingMemberEmail } from '@/emails/PendingMemberEmail'
import {
  parseNotificationPreferences,
  shouldNotify,
} from '@/lib/notifications/preferences'

interface PendingMemberInfo {
  firstName: string
  lastName: string
  email: string
}

interface ChurchInfo {
  id: string
  name: string
}

/**
 * Notify leaders (owner, admin, leader roles) about a new pending member registration.
 * Respects each leader's notification preferences.
 */
export async function notifyLeadersOfPendingMember(
  church: ChurchInfo,
  pendingMember: PendingMemberInfo
) {
  const adminClient = createServiceRoleClient()

  // Get all leaders+ in the church with their notification preferences
  const { data: leaders, error: fetchError } = await adminClient
    .from('profiles')
    .select('id, first_name, email, receive_email_notifications, notification_preferences')
    .eq('church_id', church.id)
    .in('role', ['owner', 'admin', 'leader'])

  if (fetchError || !leaders || leaders.length === 0) {
    console.error('[Notification] Failed to fetch leaders for pending member notification:', fetchError)
    return
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const reviewUrl = `${siteUrl}/dashboard/people?tab=pending`
  const memberFullName = `${pendingMember.firstName} ${pendingMember.lastName}`

  for (const leader of leaders) {
    const prefs = parseNotificationPreferences(leader.notification_preferences)

    // Check in-app notification preference
    if (shouldNotify(prefs, 'pending_member_registrations', 'in_app')) {
      const { error: notifyError } = await adminClient
        .from('notifications')
        .insert({
          church_id: church.id,
          recipient_id: leader.id,
          type: 'pending_member',
          title: 'New Member Request',
          message: `${memberFullName} has requested to join ${church.name}`,
        })

      if (notifyError) {
        console.error('[Notification] Failed to create pending member notification:', notifyError)
      }
    }

    // Check email notification preference
    if (
      leader.email &&
      leader.receive_email_notifications &&
      shouldNotify(prefs, 'pending_member_registrations', 'email')
    ) {
      sendEmail({
        to: leader.email,
        subject: `New member request: ${memberFullName} wants to join ${church.name}`,
        react: PendingMemberEmail({
          recipientName: leader.first_name,
          memberName: memberFullName,
          memberEmail: pendingMember.email,
          churchName: church.name,
          reviewUrl,
        }),
      }).catch((err) => console.error('[Email] Failed to send pending member email:', err))
    }
  }
}
