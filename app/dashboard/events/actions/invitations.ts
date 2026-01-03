'use server'

import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'
import { format } from 'date-fns'
import {
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireManagePermission,
} from './helpers'
import { sendEmail } from '@/lib/email/config'
import { InvitationEmail } from '@/emails/InvitationEmail'

export type InvitationScope = 'all' | 'ministry' | 'positions'

export interface SendInvitationsOptions {
  eventId: string
  scope: InvitationScope
  ministryId?: string
  positionIds?: string[]
}

/**
 * Send invitations to volunteers assigned to event positions.
 * Updates assignment status from null to 'invited' and creates notifications.
 */
export async function sendInvitations(options: SendInvitationsOptions) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'send invitations')
  if (permError) return { error: permError }

  // Build query based on scope
  let query = adminClient
    .from('event_assignments')
    .select(`
      id,
      profile_id,
      position:event_positions!inner (
        id,
        title,
        ministry_id,
        ministry:ministries (
          id,
          name,
          color
        ),
        event:events!inner (
          id,
          title,
          start_time,
          end_time,
          church_id,
          church:churches (
            id,
            name
          )
        )
      )
    `)
    .is('status', null) // Only get assignments without invitation sent

  if (options.scope === 'all') {
    // Filter by event - need to filter through the position's event_id
    query = query.eq('position.event.id', options.eventId)
  } else if (options.scope === 'ministry' && options.ministryId) {
    query = query
      .eq('position.event.id', options.eventId)
      .eq('position.ministry_id', options.ministryId)
  } else if (options.scope === 'positions' && options.positionIds?.length) {
    query = query.in('position_id', options.positionIds)
  } else {
    return { error: 'Invalid scope or missing parameters' }
  }

  const { data: assignments, error: fetchError } = await query

  if (fetchError) {
    console.error('Error fetching assignments:', fetchError)
    return { error: 'Failed to fetch assignments' }
  }

  if (!assignments || assignments.length === 0) {
    return { error: 'No pending assignments found to invite' }
  }

  // Extract assignment IDs
  const assignmentIds = assignments.map((a) => a.id)
  const now = new Date().toISOString()

  // Update all assignments to 'invited' status
  const { error: updateError } = await adminClient
    .from('event_assignments')
    .update({
      status: 'invited',
      invited_at: now,
    })
    .in('id', assignmentIds)

  if (updateError) {
    console.error('Error updating assignments:', updateError)
    return { error: 'Failed to update assignment status' }
  }

  // Create notifications for each assignment with email tokens
  // Type assertion for the nested query result
  type MinistryData = { id: string; name: string; color: string }
  type ChurchData = { id: string; name: string }
  type EventData = {
    id: string
    title: string
    start_time: string
    end_time: string | null
    church_id: string
    church: ChurchData | ChurchData[]
  }
  type PositionData = {
    id: string
    title: string
    ministry_id: string
    ministry: MinistryData | MinistryData[]
    event: EventData | EventData[]
  }

  const notifications = assignments.map((a) => {
    const position = a.position as unknown as PositionData
    const event = Array.isArray(position.event) ? position.event[0] : position.event

    return {
      church_id: event.church_id,
      recipient_id: a.profile_id,
      type: 'position_invitation' as const,
      title: "You've been invited to serve",
      message: `You've been assigned to "${position.title}" for "${event.title}"`,
      event_id: event.id,
      assignment_id: a.id,
      expires_at: event.start_time,
      email_token: nanoid(32), // Generate unique token for email links
    }
  })

  const { data: insertedNotifications, error: notifyError } = await adminClient
    .from('notifications')
    .insert(notifications)
    .select('id, email_token, recipient_id, assignment_id')

  if (notifyError) {
    console.error('Failed to create notifications:', notifyError)
    // Don't fail the whole operation - assignments are already updated
  }

  // Send email notifications
  if (insertedNotifications && insertedNotifications.length > 0) {
    // Fetch profiles to get emails and preferences
    const profileIds = assignments.map((a) => a.profile_id)
    const { data: profiles } = await adminClient
      .from('profiles')
      .select('id, first_name, email, receive_email_notifications')
      .in('id', profileIds)

    const profileMap = new Map(profiles?.map((p) => [p.id, p]) || [])

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    // Send emails asynchronously (don't block response)
    for (const notification of insertedNotifications) {
      const profile = profileMap.get(notification.recipient_id)

      // Skip if user opted out of emails or no email address
      if (!profile?.receive_email_notifications || !profile?.email) {
        continue
      }

      // Find the assignment data for this notification
      const assignment = assignments.find((a) => a.id === notification.assignment_id)
      if (!assignment) continue

      const position = assignment.position as unknown as PositionData
      const event = Array.isArray(position.event) ? position.event[0] : position.event
      const ministry = Array.isArray(position.ministry) ? position.ministry[0] : position.ministry
      const church = Array.isArray(event.church) ? event.church[0] : event.church

      // Format event date and time
      const startDate = new Date(event.start_time)
      const eventDate = format(startDate, 'EEEE, MMMM d, yyyy')
      const eventTime = event.end_time
        ? `${format(startDate, 'h:mm a')} - ${format(new Date(event.end_time), 'h:mm a')}`
        : format(startDate, 'h:mm a')

      // Send email (fire and forget - don't await)
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
    }
  }

  revalidatePath('/dashboard/events')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/inbox')

  return {
    data: {
      invitedCount: assignmentIds.length,
    },
  }
}

/**
 * Get pending invitation counts for an event (for the send dialog UI)
 */
export async function getPendingInvitationCounts(eventId: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { adminClient } = auth

  // Get all assignments without invitations for this event
  const { data: assignments, error } = await adminClient
    .from('event_assignments')
    .select(`
      id,
      position:event_positions!inner (
        id,
        title,
        ministry_id,
        ministry:ministries (id, name, color),
        event_id
      )
    `)
    .is('status', null)
    .eq('position.event_id', eventId)

  if (error) {
    console.error('Error fetching pending counts:', error)
    return { error: 'Failed to fetch pending counts' }
  }

  // Count by ministry
  const ministryCountsMap = new Map<string, { ministry: { id: string; name: string; color: string }; count: number }>()
  const positionCountsMap = new Map<string, { position: { id: string; title: string }; count: number }>()

  type AssignmentData = {
    id: string
    position: {
      id: string
      title: string
      ministry_id: string
      ministry: { id: string; name: string; color: string } | { id: string; name: string; color: string }[]
      event_id: string
    }
  }

  for (const a of (assignments as unknown as AssignmentData[])) {
    const position = a.position
    const ministry = Array.isArray(position.ministry) ? position.ministry[0] : position.ministry

    // Ministry count
    const existingMinistry = ministryCountsMap.get(ministry.id)
    if (existingMinistry) {
      existingMinistry.count++
    } else {
      ministryCountsMap.set(ministry.id, { ministry, count: 1 })
    }

    // Position count
    const existingPosition = positionCountsMap.get(position.id)
    if (existingPosition) {
      existingPosition.count++
    } else {
      positionCountsMap.set(position.id, {
        position: { id: position.id, title: position.title },
        count: 1,
      })
    }
  }

  return {
    data: {
      total: assignments?.length || 0,
      byMinistry: Array.from(ministryCountsMap.values()),
      byPosition: Array.from(positionCountsMap.values()),
    },
  }
}

/**
 * Respond to an invitation (accept or decline).
 * Only the assigned volunteer can respond to their own invitation.
 */
export async function respondToInvitation(
  assignmentId: string,
  response: 'accepted' | 'declined'
) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Get the assignment and verify it belongs to the current user
  const { data: assignment, error: fetchError } = await adminClient
    .from('event_assignments')
    .select('id, profile_id, status')
    .eq('id', assignmentId)
    .single()

  if (fetchError || !assignment) {
    return { error: 'Assignment not found' }
  }

  if (assignment.profile_id !== profile.id) {
    return { error: 'You can only respond to your own invitations' }
  }

  // Allow response if status is 'invited', 'accepted', or 'declined' (can change response)
  const allowedStatuses = ['invited', 'accepted', 'declined']
  if (!allowedStatuses.includes(assignment.status)) {
    return { error: 'This invitation can no longer be changed' }
  }

  const now = new Date().toISOString()

  // Update assignment status
  const { error: updateError } = await adminClient
    .from('event_assignments')
    .update({
      status: response,
      responded_at: now,
    })
    .eq('id', assignmentId)

  if (updateError) {
    console.error('Error updating assignment:', updateError)
    return { error: 'Failed to update response' }
  }

  // Update the notification - mark as actioned AND read
  const { error: notifyError } = await adminClient
    .from('notifications')
    .update({
      is_actioned: true,
      action_taken: response,
      actioned_at: now,
      is_read: true,
      read_at: now,
    })
    .eq('assignment_id', assignmentId)
    .eq('type', 'position_invitation')

  if (notifyError) {
    console.error('Failed to update notification:', notifyError)
    // Don't fail - assignment is already updated
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/events')

  return { success: true, response }
}
