'use server'

import {
  getAuthenticatedUserWithProfile,
  isAuthError,
} from '@/lib/utils/server-auth'

export interface DashboardAssignment {
  id: string
  status: 'invited' | 'accepted' | 'declined' | 'expired' | null
  invited_at: string | null
  event: {
    id: string
    title: string
    start_time: string
    event_type: string
  }
  position: {
    id: string
    title: string
  }
  ministry: {
    id: string
    name: string
    color: string
  }
}

/**
 * Get user's upcoming assignments for the next month
 */
export async function getMyAssignments(): Promise<{ data?: DashboardAssignment[]; error?: string }> {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Calculate date range: now to 1 month from now
  const now = new Date()
  const oneMonthFromNow = new Date()
  oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1)

  // First, get all assignments for this user
  const { data, error } = await adminClient
    .from('event_assignments')
    .select(`
      id,
      status,
      invited_at,
      position:event_positions (
        id,
        title,
        event:events (
          id,
          title,
          start_time,
          event_type
        ),
        ministry:ministries (
          id,
          name,
          color
        )
      )
    `)
    .eq('profile_id', profile.id)

  if (error) {
    console.error('Error fetching assignments:', error)
    return { error: 'Failed to fetch assignments' }
  }

  // Transform and filter the data in JavaScript
  const assignments: DashboardAssignment[] = (data || [])
    .map((a) => {
      const position = Array.isArray(a.position) ? a.position[0] : a.position
      const event = position ? (Array.isArray(position.event) ? position.event[0] : position.event) : null
      const ministry = position ? (Array.isArray(position.ministry) ? position.ministry[0] : position.ministry) : null

      return {
        id: a.id,
        status: a.status as DashboardAssignment['status'],
        invited_at: a.invited_at,
        event: event ? {
          id: event.id,
          title: event.title,
          start_time: event.start_time,
          event_type: event.event_type,
        } : null,
        position: position ? {
          id: position.id,
          title: position.title,
        } : null,
        ministry: ministry ? {
          id: ministry.id,
          name: ministry.name,
          color: ministry.color,
        } : { id: '', name: '', color: '#6b7280' },
      }
    })
    // Filter to only events in the date range
    .filter((a): a is DashboardAssignment => {
      if (!a.event || !a.position) return false
      const eventDate = new Date(a.event.start_time)
      return eventDate >= now && eventDate <= oneMonthFromNow
    })
    // Sort by event start time
    .sort((a, b) => new Date(a.event.start_time).getTime() - new Date(b.event.start_time).getTime())

  return { data: assignments }
}
