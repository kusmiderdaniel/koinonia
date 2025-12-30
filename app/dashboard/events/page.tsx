import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { EventsPageClient } from './EventsPageClient'
import { canUserSeeEvent } from './actions/helpers'
import type { Event, Member } from './types'

export default async function EventsPage() {
  // Get authenticated user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Get user's profile with church context
  const adminClient = createServiceRoleClient()
  const { data: profile } = await adminClient
    .from('profiles')
    .select('id, church_id, role')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    redirect('/onboarding')
  }

  // Parallel fetch: events, church settings, and church members
  const [eventsResult, churchResult, membersResult] = await Promise.all([
    adminClient
      .from('events')
      .select(`
        *,
        location:locations (id, name, address),
        created_by_profile:profiles!created_by (id, first_name, last_name),
        responsible_person:profiles!responsible_person_id (id, first_name, last_name, email),
        event_positions (id, quantity_needed, event_assignments (id)),
        event_invitations (profile_id)
      `)
      .eq('church_id', profile.church_id)
      .order('start_time', { ascending: true }),
    adminClient
      .from('churches')
      .select('first_day_of_week, timezone')
      .eq('id', profile.church_id)
      .single(),
    adminClient
      .from('profiles')
      .select('id, first_name, last_name, email')
      .eq('church_id', profile.church_id)
      .eq('active', true)
      .eq('member_type', 'authenticated')
      .order('first_name'),
  ])

  const events = eventsResult.data || []
  const church = churchResult.data
  const members = membersResult.data || []

  // Filter events based on visibility
  const filteredEvents = events.filter((event) => {
    const invitedUserIds = event.event_invitations?.map((inv: { profile_id: string }) => inv.profile_id) || []
    return canUserSeeEvent(profile.role, event.visibility, user.id, invitedUserIds)
  })

  // Transform events with position counts
  const transformedEvents = filteredEvents.map((event) => {
    const totalPositions = event.event_positions?.reduce(
      (sum: number, p: { quantity_needed: number }) => sum + p.quantity_needed, 0
    ) || 0
    const filledPositions = event.event_positions?.reduce(
      (sum: number, p: { event_assignments: { id: string }[] | null }) => sum + (p.event_assignments?.length || 0), 0
    ) || 0
    return { ...event, totalPositions, filledPositions }
  })

  return (
    <EventsPageClient
      initialData={{
        events: transformedEvents as Event[],
        churchMembers: members as Member[],
        role: profile.role,
        firstDayOfWeek: church?.first_day_of_week ?? 1,
      }}
    />
  )
}
