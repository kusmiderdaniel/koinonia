'use server'

import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'
import { format } from 'date-fns'
import {
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireManagePermission,
  unwrapRelation,
} from './helpers'
import { sendEmail } from '@/lib/email/config'
import { InvitationEmail } from '@/emails/InvitationEmail'
import {
  parseNotificationPreferences,
  shouldNotify,
} from '@/lib/notifications/preferences'
import { formatTimeFromDate, type TimeFormat } from '@/lib/utils/format'

// Shared types for Supabase nested query results
type MinistryData = { id: string; name: string; color: string }
type ChurchData = { id: string; name: string; time_format: string | null }
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
type AssignmentWithPosition = {
  id: string
  profile_id: string
  position: PositionData
}


// Helper to send invitation emails
async function sendInvitationEmails(
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
  }
}

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
            name,
            time_format
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
  const typedAssignments = assignments as unknown as AssignmentWithPosition[]

  const notifications = typedAssignments
    .map((a) => {
      const event = unwrapRelation(a.position.event)
      if (!event) return null

      return {
        church_id: event.church_id,
        recipient_id: a.profile_id,
        type: 'position_invitation' as const,
        title: "You've been invited to serve",
        message: `You've been assigned to "${a.position.title}" for "${event.title}"`,
        event_id: event.id,
        assignment_id: a.id,
        expires_at: event.start_time,
        email_token: nanoid(32),
      }
    })
    .filter((n): n is NonNullable<typeof n> => n !== null)

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
    await sendInvitationEmails(adminClient, typedAssignments, insertedNotifications)
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
  type SimplePositionData = {
    id: string
    title: string
    ministry_id: string
    ministry: MinistryData | MinistryData[]
    event_id: string
  }
  type SimpleAssignment = { id: string; position: SimplePositionData }

  const ministryCountsMap = new Map<string, { ministry: MinistryData; count: number }>()
  const positionCountsMap = new Map<string, { position: { id: string; title: string }; count: number }>()

  for (const a of (assignments as unknown as SimpleAssignment[])) {
    const position = a.position
    const ministry = unwrapRelation(position.ministry)
    if (!ministry) continue

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
 * Get pending invitation counts for the scheduling matrix (across multiple events)
 */
export async function getMatrixPendingInvitationCounts(eventIds: string[]) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { adminClient } = auth

  if (!eventIds.length) {
    return { data: { total: 0, byEvent: [], byMinistry: [], byPosition: [] } }
  }

  // Get all assignments without invitations for these events
  const { data: assignments, error } = await adminClient
    .from('event_assignments')
    .select(`
      id,
      position:event_positions!inner (
        id,
        title,
        ministry_id,
        ministry:ministries (id, name, color),
        event_id,
        event:events!inner (id, title, start_time)
      )
    `)
    .is('status', null)
    .in('position.event_id', eventIds)

  if (error) {
    console.error('Error fetching matrix pending counts:', error)
    return { error: 'Failed to fetch pending counts' }
  }

  type MatrixEventData = { id: string; title: string; start_time: string }
  type MatrixPositionData = {
    id: string
    title: string
    ministry_id: string
    ministry: MinistryData | MinistryData[]
    event_id: string
    event: MatrixEventData | MatrixEventData[]
  }
  type MatrixAssignment = { id: string; position: MatrixPositionData }

  const eventCountsMap = new Map<string, { event: MatrixEventData; count: number }>()
  const ministryCountsMap = new Map<string, { ministry: MinistryData; count: number }>()
  const positionCountsMap = new Map<string, { position: { id: string; title: string; eventId: string; ministry: MinistryData | null }; count: number }>()

  for (const a of (assignments as unknown as MatrixAssignment[])) {
    const position = a.position
    const ministry = unwrapRelation(position.ministry)
    const event = unwrapRelation(position.event)
    if (!event) continue

    // Event count
    const existingEvent = eventCountsMap.get(event.id)
    if (existingEvent) {
      existingEvent.count++
    } else {
      eventCountsMap.set(event.id, { event, count: 1 })
    }

    // Ministry count
    if (ministry) {
      const existingMinistry = ministryCountsMap.get(ministry.id)
      if (existingMinistry) {
        existingMinistry.count++
      } else {
        ministryCountsMap.set(ministry.id, { ministry, count: 1 })
      }
    }

    // Position count
    const existingPosition = positionCountsMap.get(position.id)
    if (existingPosition) {
      existingPosition.count++
    } else {
      positionCountsMap.set(position.id, {
        position: { id: position.id, title: position.title, eventId: event.id, ministry: ministry || null },
        count: 1,
      })
    }
  }

  return {
    data: {
      total: assignments?.length || 0,
      byEvent: Array.from(eventCountsMap.values()).sort(
        (a, b) => new Date(a.event.start_time).getTime() - new Date(b.event.start_time).getTime()
      ),
      byMinistry: Array.from(ministryCountsMap.values()),
      byPosition: Array.from(positionCountsMap.values()),
    },
  }
}

export type BulkInvitationScope = 'all' | 'events' | 'ministries' | 'positions'

export interface SendBulkInvitationsOptions {
  eventIds: string[]
  scope: BulkInvitationScope
  selectedEventIds?: string[]
  selectedMinistryIds?: string[]
  selectedPositionIds?: string[]
}

/**
 * Send bulk invitations across multiple events (for scheduling matrix)
 */
export async function sendBulkInvitations(options: SendBulkInvitationsOptions) {
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
            name,
            time_format
          )
        )
      )
    `)
    .is('status', null)
    .in('position.event.id', options.eventIds)

  if (options.scope === 'events' && options.selectedEventIds?.length) {
    query = query.in('position.event.id', options.selectedEventIds)
  } else if (options.scope === 'ministries' && options.selectedMinistryIds?.length) {
    query = query.in('position.ministry_id', options.selectedMinistryIds)
  } else if (options.scope === 'positions' && options.selectedPositionIds?.length) {
    query = query.in('position_id', options.selectedPositionIds)
  } else if (options.scope !== 'all') {
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
  const typedAssignments = assignments as unknown as AssignmentWithPosition[]

  const notifications = typedAssignments
    .map((a) => {
      const event = unwrapRelation(a.position.event)
      if (!event) return null

      return {
        church_id: event.church_id,
        recipient_id: a.profile_id,
        type: 'position_invitation' as const,
        title: "You've been invited to serve",
        message: `You've been assigned to "${a.position.title}" for "${event.title}"`,
        event_id: event.id,
        assignment_id: a.id,
        expires_at: event.start_time,
        email_token: nanoid(32),
      }
    })
    .filter((n): n is NonNullable<typeof n> => n !== null)

  const { data: insertedNotifications, error: notifyError } = await adminClient
    .from('notifications')
    .insert(notifications)
    .select('id, email_token, recipient_id, assignment_id')

  if (notifyError) {
    console.error('Failed to create notifications:', notifyError)
  }

  // Send email notifications
  if (insertedNotifications && insertedNotifications.length > 0) {
    await sendInvitationEmails(adminClient, typedAssignments, insertedNotifications)
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
  revalidatePath('/dashboard/inbox')

  // Notify ministry leader about the response
  await notifyMinistryLeaderOfResponse(adminClient, assignmentId, response)

  return { success: true, response }
}

/**
 * Notify the ministry leader and event responsible person when a volunteer accepts or declines an invitation.
 * This is called from both the in-app response and email-based response.
 * Respects user notification preferences.
 */
export async function notifyMinistryLeaderOfResponse(
  adminClient: Awaited<ReturnType<typeof import('@/lib/supabase/server').createServiceRoleClient>>,
  assignmentId: string,
  response: 'accepted' | 'declined',
  responder?: { id: string; first_name: string; last_name: string }
) {
  // Get assignment with position, ministry leader, event details, and responsible person
  const { data: assignment, error: fetchError } = await adminClient
    .from('event_assignments')
    .select(`
      id,
      profile_id,
      profile:profiles!event_assignments_profile_id_fkey (
        id,
        first_name,
        last_name
      ),
      position:event_positions!inner (
        id,
        title,
        ministry:ministries (
          id,
          name,
          leader_id,
          leader:profiles!ministries_leader_id_fkey (
            id,
            first_name,
            email,
            receive_email_notifications,
            notification_preferences
          )
        ),
        event:events!inner (
          id,
          title,
          start_time,
          church_id,
          responsible_person_id,
          responsible_person:profiles!events_responsible_person_id_fkey (
            id,
            first_name,
            email,
            receive_email_notifications,
            notification_preferences
          )
        )
      )
    `)
    .eq('id', assignmentId)
    .single()

  if (fetchError || !assignment) {
    console.error('[Notification] Failed to fetch assignment for leader notification:', fetchError)
    return
  }

  // Type the nested data
  type ProfileData = { id: string; first_name: string; last_name: string }
  type RecipientData = {
    id: string
    first_name: string
    email: string | null
    receive_email_notifications: boolean
    notification_preferences: unknown
  }
  type MinistryData = { id: string; name: string; leader_id: string | null; leader: RecipientData | RecipientData[] | null }
  type EventData = {
    id: string
    title: string
    start_time: string
    church_id: string
    responsible_person_id: string | null
    responsible_person: RecipientData | RecipientData[] | null
  }
  type PositionData = { id: string; title: string; ministry: MinistryData | MinistryData[] | null; event: EventData | EventData[] }

  const position = assignment.position as unknown as PositionData
  const ministry = Array.isArray(position.ministry) ? position.ministry[0] : position.ministry
  const event = Array.isArray(position.event) ? position.event[0] : position.event
  const ministryLeader = ministry?.leader
    ? (Array.isArray(ministry.leader) ? ministry.leader[0] : ministry.leader)
    : null
  const eventResponsible = event?.responsible_person
    ? (Array.isArray(event.responsible_person) ? event.responsible_person[0] : event.responsible_person)
    : null

  // Get the responder's name
  let responderName: string
  if (responder) {
    responderName = `${responder.first_name} ${responder.last_name}`
  } else {
    const profile = assignment.profile as unknown as ProfileData | ProfileData[] | null
    const profileData = Array.isArray(profile) ? profile[0] : profile
    responderName = profileData ? `${profileData.first_name} ${profileData.last_name}` : 'A volunteer'
  }

  const responseVerb = response === 'accepted' ? 'accepted' : 'declined'
  const responseEmoji = response === 'accepted' ? '✅' : '❌'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const startDate = new Date(event.start_time)
  const eventDate = format(startDate, 'EEEE, MMMM d, yyyy')

  // Track who we've already notified to avoid duplicates
  const notifiedIds = new Set<string>()

  // Determine the preference key based on response type
  const ministryPreferenceKey = response === 'accepted'
    ? 'ministry_invitation_accepted' as const
    : 'ministry_invitation_declined' as const
  const eventPreferenceKey = response === 'accepted'
    ? 'event_invitation_accepted' as const
    : 'event_invitation_declined' as const

  // Helper function to send notification to a recipient
  const sendNotification = async (
    recipient: RecipientData,
    preferenceKey: 'ministry_invitation_accepted' | 'ministry_invitation_declined' | 'event_invitation_accepted' | 'event_invitation_declined'
  ) => {
    if (notifiedIds.has(recipient.id)) return
    notifiedIds.add(recipient.id)

    const prefs = parseNotificationPreferences(recipient.notification_preferences)

    // Check in-app notification preference
    if (shouldNotify(prefs, preferenceKey, 'in_app')) {
      const { error: notifyError } = await adminClient
        .from('notifications')
        .insert({
          church_id: event.church_id,
          recipient_id: recipient.id,
          type: 'invitation_response',
          title: `${responseEmoji} Invitation ${responseVerb}`,
          message: `${responderName} has ${responseVerb} the invitation to serve as "${position.title}" for "${event.title}"`,
          event_id: event.id,
          assignment_id: assignmentId,
        })

      if (notifyError) {
        console.error('[Notification] Failed to create notification:', notifyError)
      }
    }

    // Check email notification preference
    if (
      recipient.email &&
      recipient.receive_email_notifications &&
      shouldNotify(prefs, preferenceKey, 'email')
    ) {
      const { sendEmail } = await import('@/lib/email/config')
      const { InvitationResponseEmail } = await import('@/emails/InvitationResponseEmail')

      sendEmail({
        to: recipient.email,
        subject: `${responseEmoji} ${responderName} ${responseVerb} invitation for ${position.title}`,
        react: InvitationResponseEmail({
          leaderName: recipient.first_name,
          volunteerName: responderName,
          response: responseVerb,
          positionTitle: position.title,
          eventTitle: event.title,
          eventDate,
          ministryName: ministry?.name || 'Ministry',
          viewEventUrl: `${siteUrl}/dashboard/events/${event.id}`,
        }),
      }).catch((err) => console.error('[Email] Failed to send notification email:', err))
    }
  }

  // Notify ministry leader (based on accepted/declined preference)
  if (ministryLeader?.id) {
    await sendNotification(ministryLeader, ministryPreferenceKey)
  }

  // Notify event responsible person (based on accepted/declined preference)
  if (eventResponsible?.id) {
    await sendNotification(eventResponsible, eventPreferenceKey)
  }
}
