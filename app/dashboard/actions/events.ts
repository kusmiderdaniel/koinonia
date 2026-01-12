'use server'

import {
  getAuthenticatedUserWithProfile,
  isAuthError,
} from '@/lib/utils/server-auth'

export interface DashboardEvent {
  id: string
  title: string
  start_time: string
  event_type: string
  location: string | null
}

/**
 * Get upcoming church events (next 5)
 */
export async function getUpcomingEvents(): Promise<{ data?: DashboardEvent[]; error?: string }> {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const now = new Date()

  const { data, error } = await adminClient
    .from('events')
    .select(`
      id,
      title,
      start_time,
      event_type,
      location
    `)
    .eq('church_id', profile.church_id)
    .gte('start_time', now.toISOString())
    .order('start_time', { ascending: true })
    .limit(5)

  if (error) {
    console.error('Error fetching events:', error)
    return { error: 'Failed to fetch events' }
  }

  const events: DashboardEvent[] = (data || []).map((e) => ({
    id: e.id,
    title: e.title,
    start_time: e.start_time,
    event_type: e.event_type,
    location: e.location,
  }))

  return { data: events }
}
