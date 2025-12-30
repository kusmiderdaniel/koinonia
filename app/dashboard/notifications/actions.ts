'use server'

import { revalidatePath } from 'next/cache'
import {
  getAuthenticatedUserWithProfile,
  isAuthError,
} from '@/lib/utils/server-auth'
import type { Notification } from '@/types/notifications'

/**
 * Get notifications for the current user
 */
export async function getNotifications(limit: number = 50) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const { data, error } = await adminClient
    .from('notifications')
    .select(`
      id,
      church_id,
      recipient_id,
      type,
      title,
      message,
      event_id,
      assignment_id,
      is_read,
      is_actioned,
      action_taken,
      created_at,
      read_at,
      actioned_at,
      expires_at,
      event:events (
        id,
        title,
        start_time,
        end_time
      ),
      assignment:event_assignments (
        id,
        position:event_positions (
          id,
          title,
          ministry:ministries (
            id,
            name,
            color
          )
        )
      )
    `)
    .eq('recipient_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching notifications:', error)
    return { error: 'Failed to fetch notifications' }
  }

  // Transform the data to match our Notification type
  const notifications: Notification[] = (data || []).map((n) => {
    // Handle potential array results from Supabase joins
    const event = Array.isArray(n.event) ? n.event[0] : n.event
    const assignment = Array.isArray(n.assignment) ? n.assignment[0] : n.assignment

    let transformedAssignment = null
    if (assignment) {
      const position = Array.isArray(assignment.position) ? assignment.position[0] : assignment.position
      if (position) {
        const ministry = Array.isArray(position.ministry) ? position.ministry[0] : position.ministry
        transformedAssignment = {
          id: assignment.id,
          position: {
            id: position.id,
            title: position.title,
            ministry: ministry ? {
              id: ministry.id,
              name: ministry.name,
              color: ministry.color,
            } : { id: '', name: '', color: '' },
          },
        }
      }
    }

    return {
      id: n.id,
      church_id: n.church_id,
      recipient_id: n.recipient_id,
      type: n.type as Notification['type'],
      title: n.title,
      message: n.message,
      event_id: n.event_id,
      assignment_id: n.assignment_id,
      is_read: n.is_read,
      is_actioned: n.is_actioned,
      action_taken: n.action_taken as Notification['action_taken'],
      created_at: n.created_at,
      read_at: n.read_at,
      actioned_at: n.actioned_at,
      expires_at: n.expires_at,
      event: event ? {
        id: event.id,
        title: event.title,
        start_time: event.start_time,
        end_time: event.end_time,
      } : null,
      assignment: transformedAssignment,
    }
  })

  return { data: notifications }
}

/**
 * Get unread notification count for the current user
 */
export async function getUnreadCount() {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const { count, error } = await adminClient
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', profile.id)
    .eq('is_read', false)

  if (error) {
    console.error('Error fetching unread count:', error)
    return { error: 'Failed to fetch count' }
  }

  return { count: count || 0 }
}

/**
 * Get count of actionable (pending) notifications
 */
export async function getActionableCount() {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const { count, error } = await adminClient
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', profile.id)
    .eq('type', 'position_invitation')
    .eq('is_actioned', false)

  if (error) {
    console.error('Error fetching actionable count:', error)
    return { error: 'Failed to fetch count' }
  }

  return { count: count || 0 }
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const { error } = await adminClient
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', notificationId)
    .eq('recipient_id', profile.id)

  if (error) {
    console.error('Error marking notification as read:', error)
    return { error: 'Failed to mark as read' }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead() {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const { error } = await adminClient
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('recipient_id', profile.id)
    .eq('is_read', false)

  if (error) {
    console.error('Error marking all as read:', error)
    return { error: 'Failed to mark all as read' }
  }

  revalidatePath('/dashboard')
  return { success: true }
}
