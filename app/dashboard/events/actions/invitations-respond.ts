'use server'

import { revalidatePath } from 'next/cache'
import {
  getAuthenticatedUserWithProfile,
  isAuthError,
} from './helpers'
import { notifyMinistryLeaderOfResponse } from './invitation-notifications'
import { syncEventToGoogle } from '@/lib/google-calendar/sync-service'

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

  // Sync to Google Calendar (personal calendar changes based on accepted/declined status)
  // Get event_id from assignment's position
  adminClient
    .from('event_assignments')
    .select('position:event_positions (event_id)')
    .eq('id', assignmentId)
    .single()
    .then(({ data }) => {
      const position = Array.isArray(data?.position)
        ? data.position[0]
        : data?.position
      if (position?.event_id) {
        syncEventToGoogle(position.event_id).catch((err) => {
          console.error('Failed to sync invitation response to Google Calendar:', err)
        })
      }
    })

  return { success: true, response }
}
