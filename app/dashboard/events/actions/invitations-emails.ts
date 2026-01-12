'use server'

import { format } from 'date-fns'
import { unwrapRelation } from './helpers'
import { sendEmail } from '@/lib/email/config'
import { InvitationEmail } from '@/emails/InvitationEmail'
import { formatTimeFromDate, type TimeFormat } from '@/lib/utils/format'
import { sendPushToUser } from '@/lib/push/send'
import type { AssignmentWithPosition } from './invitations-types'

/**
 * Send invitation emails and push notifications to volunteers
 */
export async function sendInvitationEmails(
  adminClient: Awaited<ReturnType<typeof import('@/lib/supabase/server').createServiceRoleClient>>,
  assignments: AssignmentWithPosition[],
  insertedNotifications: Array<{ id: string; email_token: string; recipient_id: string; assignment_id: string }>
) {
  const profileIds = assignments.map((a) => a.profile_id)
  const { data: profiles } = await adminClient
    .from('profiles')
    .select('id, first_name, email, receive_email_notifications')
    .in('id', profileIds)

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) || [])
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  for (const notification of insertedNotifications) {
    const profile = profileMap.get(notification.recipient_id)

    if (!profile?.receive_email_notifications || !profile?.email) {
      continue
    }

    const assignment = assignments.find((a) => a.id === notification.assignment_id)
    if (!assignment) continue

    const position = assignment.position
    const event = unwrapRelation(position.event)
    if (!event) continue
    const ministry = unwrapRelation(position.ministry)
    const church = unwrapRelation(event.church)

    const startDate = new Date(event.start_time)
    const eventDate = format(startDate, 'EEEE, MMMM d, yyyy')
    const timeFormat = (church?.time_format || '24h') as TimeFormat
    const eventTime = event.end_time
      ? `${formatTimeFromDate(startDate, timeFormat)} - ${formatTimeFromDate(new Date(event.end_time), timeFormat)}`
      : formatTimeFromDate(startDate, timeFormat)

    sendEmail({
      to: profile.email,
      subject: `You're invited to serve: ${position.title} for ${event.title}`,
      react: InvitationEmail({
        recipientName: profile.first_name,
        eventTitle: event.title,
        eventDate,
        eventTime,
        positionTitle: position.title,
        ministryName: ministry?.name || 'Ministry',
        ministryColor: ministry?.color || '#3B82F6',
        acceptUrl: `${siteUrl}/api/invitation/respond?token=${notification.email_token}&action=accept`,
        declineUrl: `${siteUrl}/api/invitation/respond?token=${notification.email_token}&action=decline`,
        viewInAppUrl: `${siteUrl}/dashboard/inbox`,
        churchName: church?.name || 'Your Church',
      }),
    }).catch((err) => console.error('[Email] Failed to send invitation email:', err))

    // Send push notification
    sendPushToUser(notification.recipient_id, {
      title: "You've been invited to serve",
      body: `${position.title} for ${event.title} on ${eventDate}`,
      data: {
        type: 'position_invitation',
        event_id: event.id,
        notification_id: notification.id,
      },
    }).catch((err) => console.error('[Push] Failed to send invitation push:', err))
  }
}
