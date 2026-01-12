'use server'

import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'
import {
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireManagePermission,
  unwrapRelation,
} from './helpers'
import { sendInvitationEmails } from './invitations-emails'
import type {
  AssignmentWithPosition,
  SendInvitationsOptions,
  SendBulkInvitationsOptions,
} from './invitations-types'

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

  if (options.scope === 'dates' && options.selectedDates?.length) {
    // For dates scope, we need to filter by events that match the selected dates
    // This will be handled after fetching by filtering the results
  } else if (options.scope === 'events' && options.selectedEventIds?.length) {
    query = query.in('position.event.id', options.selectedEventIds)
  } else if (options.scope === 'ministries' && options.selectedMinistryIds?.length) {
    query = query.in('position.ministry_id', options.selectedMinistryIds)
  } else if (options.scope === 'positions' && options.selectedPositionIds?.length) {
    query = query.in('position_id', options.selectedPositionIds)
  } else if (options.scope !== 'all' && options.scope !== 'dates') {
    return { error: 'Invalid scope or missing parameters' }
  }

  const { data: rawAssignments, error: fetchError } = await query

  if (fetchError) {
    console.error('Error fetching assignments:', fetchError)
    return { error: 'Failed to fetch assignments' }
  }

  if (!rawAssignments || rawAssignments.length === 0) {
    return { error: 'No pending assignments found to invite' }
  }

  // Filter by date if scope is 'dates'
  let assignments = rawAssignments
  if (options.scope === 'dates' && options.selectedDates?.length) {
    assignments = rawAssignments.filter((a) => {
      const position = a.position as unknown as { event: { start_time: string } | { start_time: string }[] }
      const event = Array.isArray(position.event) ? position.event[0] : position.event
      if (!event) return false
      const eventDate = event.start_time.split('T')[0]
      return options.selectedDates!.includes(eventDate)
    })

    if (assignments.length === 0) {
      return { error: 'No pending assignments found for selected dates' }
    }
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
