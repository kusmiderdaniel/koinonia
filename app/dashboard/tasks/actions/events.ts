'use server'

import { getAuthenticatedUserWithProfile, isAuthError } from './helpers'

export interface EventForPicker {
  id: string
  title: string
  event_type: string
  start_time: string
  end_time: string
  campuses: { id: string; name: string; color: string | null }[]
}

export interface Campus {
  id: string
  name: string
  color: string | null
}

// Raw event data structure from Supabase query
interface RawEventData {
  id: string
  title: string
  event_type: string
  start_time: string
  end_time: string
  event_campuses: Array<{
    campus: { id: string; name: string; color: string | null } | null
  }> | null
}

export async function getEventsForPicker() {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Fetch events and campuses in parallel
  const [eventsResult, campusesResult] = await Promise.all([
    adminClient
      .from('events')
      .select(`
        id,
        title,
        event_type,
        start_time,
        end_time,
        event_campuses (
          campus:campuses (
            id,
            name,
            color
          )
        )
      `)
      .eq('church_id', profile.church_id)
      .order('start_time', { ascending: true }),
    adminClient
      .from('campuses')
      .select('id, name, color')
      .eq('church_id', profile.church_id)
      .eq('is_active', true)
      .order('name'),
  ])

  if (eventsResult.error) {
    console.error('Error fetching events:', eventsResult.error)
    return { error: 'Failed to load events' }
  }

  if (campusesResult.error) {
    console.error('Error fetching campuses:', campusesResult.error)
    return { error: 'Failed to load campuses' }
  }

  // Transform events to flatten campus data
  const events: EventForPicker[] = ((eventsResult.data || []) as unknown as RawEventData[]).map((event) => ({
    id: event.id,
    title: event.title,
    event_type: event.event_type,
    start_time: event.start_time,
    end_time: event.end_time,
    campuses: (event.event_campuses || [])
      .map((ec) => ec.campus)
      .filter((c): c is { id: string; name: string; color: string | null } => c !== null),
  }))

  return {
    data: {
      events,
      campuses: campusesResult.data || [],
    },
  }
}
