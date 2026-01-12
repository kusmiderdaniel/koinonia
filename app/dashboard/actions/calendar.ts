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
 * Get public events for calendar (filtered by user's campuses)
 * Used for member dashboard calendar view
 */
export async function getCalendarEventsForMember(
  month: number,
  year: number
): Promise<{ data?: CalendarEvent[]; error?: string }> {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Calculate month boundaries
  const monthStart = new Date(year, month, 1)
  const monthEnd = new Date(year, month + 1, 1)

  // Get user's campus IDs
  const { data: userCampuses } = await adminClient
    .from('profile_campuses')
    .select('campus_id')
    .eq('profile_id', profile.id)

  const userCampusIds = (userCampuses || []).map((c) => c.campus_id)

  // Fetch events with visibility='members' and status='published'
  const { data: events, error } = await adminClient
    .from('events')
    .select(`
      id,
      title,
      description,
      start_time,
      end_time,
      event_type,
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
      )
    `)
    .eq('church_id', profile.church_id)
    .eq('visibility', 'members')
    .eq('status', 'published')
    .gte('start_time', monthStart.toISOString())
    .lt('start_time', monthEnd.toISOString())
    .order('start_time', { ascending: true })

  if (error) {
    console.error('Error fetching calendar events:', error)
    return { error: 'Failed to fetch calendar events' }
  }

  // Filter events by user's campuses (or include church-wide events with no campus)
  const filteredEvents: CalendarEvent[] = (events || [])
    .map((e) => {
      // Supabase may return campus as array or single object depending on the join
      const campuses = (e.event_campuses || [])
        .map((ec: { campus: unknown }) => {
          const campus = Array.isArray(ec.campus) ? ec.campus[0] : ec.campus
          return campus as { id: string; name: string; color: string | null } | null
        })
        .filter(Boolean) as Array<{ id: string; name: string; color: string | null }>

      // Handle location from the locations table join
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
      }
    })
    .filter((event) => {
      // If event has no campuses, it's church-wide - show to everyone
      if (event.campuses.length === 0) return true
      // If user has no campus assignment, only show church-wide events
      if (userCampusIds.length === 0) return event.campuses.length === 0
      // Show if any of the event's campuses match user's campuses
      return event.campuses.some((c) => userCampusIds.includes(c.id))
    })

  return { data: filteredEvents }
}
