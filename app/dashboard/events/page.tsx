export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { EventsPageClient } from './EventsPageClient'
import { canUserSeeEvent } from './actions/helpers'
import { hasPageAccess, isVolunteer, isLeader, isMember } from '@/lib/permissions'
import { getUserCampusIds } from '@/lib/utils/campus'
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

  // Check page access - block members from events page
  if (!hasPageAccess(profile.role, 'events')) {
    redirect('/dashboard')
  }

  // Parallel fetch: events, church settings, church members, ministries, and campuses
  const [eventsResult, churchResult, membersResult, ministriesResult, campusesResult] = await Promise.all([
    adminClient
      .from('events')
      .select(`
        *,
        location:locations (id, name, address),
        created_by_profile:profiles!created_by (id, first_name, last_name),
        responsible_person:profiles!responsible_person_id (id, first_name, last_name, email),
        event_positions (id, quantity_needed, event_assignments (id)),
        event_invitations (profile_id),
        event_campuses (campus:campuses (id, name, color))
      `)
      .eq('church_id', profile.church_id)
      .order('start_time', { ascending: true }),
    adminClient
      .from('churches')
      .select('first_day_of_week, timezone, time_format')
      .eq('id', profile.church_id)
      .single(),
    adminClient
      .from('profiles')
      .select('id, first_name, last_name, email')
      .eq('church_id', profile.church_id)
      .eq('active', true)
      .eq('member_type', 'authenticated')
      .order('first_name'),
    adminClient
      .from('ministries')
      .select('id, name, color, campus_id')
      .eq('church_id', profile.church_id)
      .order('name'),
    adminClient
      .from('campuses')
      .select('id, name, color')
      .eq('church_id', profile.church_id)
      .order('name'),
  ])

  const events = eventsResult.data || []
  const church = churchResult.data
  const members = membersResult.data || []
  const ministries = ministriesResult.data || []
  const campuses = campusesResult.data || []

  const userIsVolunteer = isVolunteer(profile.role)
  const userIsLeader = isLeader(profile.role)
  const userIsMember = isMember(profile.role)
  const needsCampusFilter = userIsVolunteer || userIsLeader

  // For volunteers and leaders, get their campus IDs for filtering
  let userCampusIds: string[] = []
  if (needsCampusFilter) {
    userCampusIds = await getUserCampusIds(profile.id, adminClient)
  }

  // For volunteers, get their event assignments to check if they can see leader+ events
  let userAssignmentEventIds: Set<string> = new Set()
  if (userIsVolunteer) {
    const { data: assignments } = await adminClient
      .from('event_assignments')
      .select('position:event_positions!inner(event_id)')
      .eq('profile_id', profile.id)
      .in('status', ['invited', 'accepted'])

    if (assignments) {
      for (const assignment of assignments) {
        const position = Array.isArray(assignment.position) ? assignment.position[0] : assignment.position
        if (position?.event_id) {
          userAssignmentEventIds.add(position.event_id)
        }
      }
    }
  }

  // Filter events based on visibility and campus
  const filteredEvents = events.filter((event) => {
    const invitedProfileIds = event.event_invitations?.map((inv: { profile_id: string }) => inv.profile_id) || []
    const hasAssignment = userAssignmentEventIds.has(event.id)

    // Members can only see 'members' visibility events and hidden events they're invited to
    if (userIsMember) {
      if (event.visibility === 'hidden') {
        return invitedProfileIds.includes(profile.id)
      }
      return event.visibility === 'members'
    }

    // First check visibility permissions (use profile.id since invitations use profile_id)
    if (!canUserSeeEvent(profile.role, event.visibility, profile.id, invitedProfileIds, hasAssignment)) {
      return false
    }

    // For volunteers and leaders, filter by campus - they can only see events in their campus
    if (needsCampusFilter) {
      const eventCampusIds: string[] = []
      for (const ec of event.event_campuses || []) {
        // Handle both array and object return types from Supabase
        const campus = Array.isArray(ec.campus) ? ec.campus[0] : ec.campus
        if (campus?.id) {
          eventCampusIds.push(campus.id)
        }
      }

      // Hidden events the user is invited to bypass campus filter
      if (event.visibility === 'hidden' && invitedProfileIds.includes(profile.id)) {
        return true
      }

      // If event has no campus, they can see it (church-wide event)
      if (eventCampusIds.length === 0) return true

      // If user has no campus, they can only see church-wide events
      if (userCampusIds.length === 0) return false

      // Check if any event campus matches user's campus
      return eventCampusIds.some((campusId: string) => userCampusIds.includes(campusId))
    }

    return true
  })

  // Transform events with position counts and campuses
  const transformedEvents = filteredEvents.map((event) => {
    const totalPositions = event.event_positions?.reduce(
      (sum: number, p: { quantity_needed: number }) => sum + p.quantity_needed, 0
    ) || 0
    const filledPositions = event.event_positions?.reduce(
      (sum: number, p: { event_assignments: { id: string }[] | null }) => sum + (p.event_assignments?.length || 0), 0
    ) || 0
    // Transform event_campuses to campuses array (handle both array and object from Supabase)
    const campuses: { id: string; name: string; color: string }[] = []
    for (const ec of event.event_campuses || []) {
      const campus = Array.isArray(ec.campus) ? ec.campus[0] : ec.campus
      if (campus?.id) {
        campuses.push(campus)
      }
    }
    return { ...event, totalPositions, filledPositions, campuses }
  })

  return (
    <EventsPageClient
      initialData={{
        events: transformedEvents as Event[],
        churchMembers: members as Member[],
        ministries: ministries as { id: string; name: string; color: string; campus_id: string | null }[],
        campuses: campuses as { id: string; name: string; color: string }[],
        role: profile.role,
        firstDayOfWeek: church?.first_day_of_week ?? 1,
        timeFormat: (church?.time_format ?? '24h') as '12h' | '24h',
      }}
    />
  )
}
