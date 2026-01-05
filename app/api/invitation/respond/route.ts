import { redirect } from 'next/navigation'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { notifyMinistryLeaderOfResponse } from '@/app/dashboard/events/actions/invitations'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const action = searchParams.get('action') as 'accept' | 'decline' | null

  // Validate parameters
  if (!token || token.length < 20) {
    return redirect('/invitation/error?reason=invalid_token')
  }

  if (!action || !['accept', 'decline'].includes(action)) {
    return redirect('/invitation/error?reason=invalid_action')
  }

  const supabase = createServiceRoleClient()

  // Lookup notification by token
  const { data: notification, error: lookupError } = await supabase
    .from('notifications')
    .select(`
      id,
      assignment_id,
      expires_at,
      is_actioned,
      action_taken
    `)
    .eq('email_token', token)
    .eq('type', 'position_invitation')
    .single()

  if (lookupError || !notification) {
    console.error('[Invitation] Token not found:', lookupError?.message)
    return redirect('/invitation/error?reason=token_not_found')
  }

  // Check if already expired
  if (notification.expires_at && new Date(notification.expires_at) < new Date()) {
    return redirect('/invitation/expired')
  }

  // Check if already responded
  if (notification.is_actioned) {
    const previous = notification.action_taken || 'unknown'
    return redirect(`/invitation/already-responded?previous=${previous}`)
  }

  // Validate assignment exists
  if (!notification.assignment_id) {
    return redirect('/invitation/error?reason=no_assignment')
  }

  const response = action === 'accept' ? 'accepted' : 'declined'
  const now = new Date().toISOString()

  // Update assignment status
  const { error: updateError } = await supabase
    .from('event_assignments')
    .update({
      status: response,
      responded_at: now,
    })
    .eq('id', notification.assignment_id)

  if (updateError) {
    console.error('[Invitation] Failed to update assignment:', updateError)
    return redirect('/invitation/error?reason=update_failed')
  }

  // Mark notification as actioned and read
  const { error: notifyError } = await supabase
    .from('notifications')
    .update({
      is_actioned: true,
      action_taken: response,
      actioned_at: now,
      is_read: true,
      read_at: now,
    })
    .eq('id', notification.id)

  if (notifyError) {
    console.error('[Invitation] Failed to update notification:', notifyError)
    // Don't fail - assignment is already updated
  }

  // Notify ministry leader about the response (don't let this break the flow)
  try {
    await notifyMinistryLeaderOfResponse(supabase, notification.assignment_id, response)
  } catch (err) {
    console.error('[Invitation] Failed to notify ministry leader:', err)
    // Don't fail - assignment is already updated
  }

  // Get event and position details for the success page
  const { data: assignment } = await supabase
    .from('event_assignments')
    .select(`
      position:event_positions (
        title,
        event:events (title)
      )
    `)
    .eq('id', notification.assignment_id)
    .single()

  // Type assertion for nested data
  type AssignmentData = {
    position: {
      title: string
      event: { title: string } | { title: string }[]
    } | null
  }

  const typedAssignment = assignment as unknown as AssignmentData | null
  const eventData = typedAssignment?.position?.event
  const eventTitle = Array.isArray(eventData) ? eventData[0]?.title : eventData?.title
  const positionTitle = typedAssignment?.position?.title

  const params = new URLSearchParams({
    action: response,
    event: eventTitle || '',
    position: positionTitle || '',
  })

  return redirect(`/invitation/success?${params.toString()}`)
}
