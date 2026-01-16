'use server'

import {
  getAuthenticatedUserWithProfile,
  isAuthError,
} from '@/lib/utils/server-auth'

export interface CalendarEvent {
  id: string
  title: string
  description: string | null
  start_time: string
  end_time: string | null
  location: {
    name: string
    address: string | null
  } | null
  event_type: string
  campuses: Array<{
    id: string
    name: string
    color: string | null
  }>
}

/**
 * Get events for dashboard calendar based on user's role.
 *
 * Visibility rules:
 * - Admin/Owner: All events except hidden ones they're not invited to
 * - Leader: All events in their campuses + hidden if invited
 * - Volunteer: volunteers+ events in their campuses, leaders+ only if assigned, hidden if invited
 * - Member: Only members visibility events + hidden if invited
 */
export async function getCalendarEventsForMember(
  month: number,
  year: number
): Promise<{ data?: CalendarEvent[]; error?: string }> {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth
  const role = profile.role

  // Calculate month boundaries
  const monthStart = new Date(year, month, 1)
  const monthEnd = new Date(year, month + 1, 1)

  const isAdminOrOwner = role === 'admin' || role === 'owner'
  const isLeader = role === 'leader'
  const isVolunteer = role === 'volunteer'
  const needsCampusFilter = isLeader || isVolunteer

  // Get user's campus IDs for filtering
  let userCampusIds: string[] = []
  if (needsCampusFilter) {
    const { data: userCampuses } = await adminClient
      .from('profile_campuses')
      .select('campus_id')
      .eq('profile_id', profile.id)
    userCampusIds = (userCampuses || []).map((c) => c.campus_id)
  }

  // For volunteers, get their event assignments to check if they can see leader+ events
  let volunteerAssignmentEventIds: Set<string> = new Set()
  if (isVolunteer) {
    const { data: assignments } = await adminClient
      .from('event_assignments')
      .select('position:event_positions!inner(event_id)')
      .eq('profile_id', profile.id)
      .in('status', ['invited', 'accepted'])

    if (assignments) {
      for (const assignment of assignments) {
        const position = Array.isArray(assignment.position) ? assignment.position[0] : assignment.position
        if (position?.event_id) {
          volunteerAssignmentEventIds.add(position.event_id)
        }
      }
    }
  }

  // Fetch all published events for the month (we'll filter by visibility in code)
  const { data: events, error } = await adminClient
    .from('events')
    .select(`
      id,
      title,
      description,
      start_time,
      end_time,
      event_type,
      visibility,
      location:locations (
        name,
        address
      ),
      event_campuses (
        campus:campuses (
          id,
          name,
          color
        )
      ),
      event_invitations (profile_id)
    `)
    .eq('church_id', profile.church_id)
    .eq('status', 'published')
    .gte('start_time', monthStart.toISOString())
    .lt('start_time', monthEnd.toISOString())
    .order('start_time', { ascending: true })

  if (error) {
    console.error('Error fetching calendar events:', error)
    return { error: 'Failed to fetch calendar events' }
  }

  // Filter and transform events based on role and visibility
  const filteredEvents: CalendarEvent[] = (events || [])
    .filter((e) => {
      const visibility = e.visibility
      const invitedProfileIds = (e.event_invitations || []).map((inv: { profile_id: string }) => inv.profile_id)
      const isInvited = invitedProfileIds.includes(profile.id)
      const hasAssignment = volunteerAssignmentEventIds.has(e.id)

      // Hidden events - only visible if invited
      if (visibility === 'hidden') {
        return isInvited
      }

      // Admin/Owner: see all non-hidden events
      if (isAdminOrOwner) {
        return true
      }

      // Leader: see all visibility levels (campus filter applied below)
      if (isLeader) {
        return true
      }

      // Volunteer visibility rules
      if (isVolunteer) {
        if (visibility === 'leaders') {
          return hasAssignment // Only if they have an assignment
        }
        if (visibility === 'volunteers' || visibility === 'members') {
          return true
        }
        return false
      }

      // Member: only members visibility
      return visibility === 'members'
    })
    .map((e) => {
      // Transform the event data
      const campuses = (e.event_campuses || [])
        .map((ec: { campus: unknown }) => {
          const campus = Array.isArray(ec.campus) ? ec.campus[0] : ec.campus
          return campus as { id: string; name: string; color: string | null } | null
        })
        .filter(Boolean) as Array<{ id: string; name: string; color: string | null }>

      const locationData = Array.isArray(e.location) ? e.location[0] : e.location
      const location = locationData
        ? { name: locationData.name, address: locationData.address }
        : null

      return {
        id: e.id,
        title: e.title,
        description: e.description,
        start_time: e.start_time,
        end_time: e.end_time,
        location,
        event_type: e.event_type,
        campuses,
        visibility: e.visibility,
        invitedProfileIds: (e.event_invitations || []).map((inv: { profile_id: string }) => inv.profile_id),
      }
    })
    .filter((event) => {
      // Campus filtering for leaders and volunteers
      if (!needsCampusFilter) return true

      // Hidden events the user is invited to bypass campus filter
      if ((event as { visibility?: string }).visibility === 'hidden' &&
          (event as { invitedProfileIds?: string[] }).invitedProfileIds?.includes(profile.id)) {
        return true
      }

      // If event has no campuses, it's church-wide - show to everyone
      if (event.campuses.length === 0) return true

      // If user has no campus assignment, only show church-wide events
      if (userCampusIds.length === 0) return event.campuses.length === 0

      // Show if any of the event's campuses match user's campuses
      return event.campuses.some((c) => userCampusIds.includes(c.id))
    })
    .map(({ visibility, invitedProfileIds, ...event }) => event) // Remove internal fields

  return { data: filteredEvents }
}
