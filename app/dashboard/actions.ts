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

export interface DashboardEvent {
  id: string
  title: string
  start_time: string
  event_type: string
  location: string | null
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

export interface DashboardTask {
  id: string
  title: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  due_date: string | null
  ministry: {
    id: string
    name: string
    color: string
  } | null
  event: {
    id: string
    title: string
  } | null
}

/**
 * Get user's tasks (assigned to them, not completed/cancelled)
 */
export async function getMyTasks(): Promise<{ data?: DashboardTask[]; error?: string }> {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const { data, error } = await adminClient
    .from('tasks')
    .select(`
      id,
      title,
      status,
      priority,
      due_date,
      ministry:ministries (
        id,
        name,
        color
      ),
      event:events (
        id,
        title
      )
    `)
    .eq('assigned_to', profile.id)
    .in('status', ['pending', 'in_progress'])
    .order('due_date', { ascending: true, nullsFirst: false })
    .limit(10)

  if (error) {
    console.error('Error fetching tasks:', error)
    return { error: 'Failed to fetch tasks' }
  }

  const tasks: DashboardTask[] = (data || []).map((t) => {
    const ministry = Array.isArray(t.ministry) ? t.ministry[0] : t.ministry
    const event = Array.isArray(t.event) ? t.event[0] : t.event

    return {
      id: t.id,
      title: t.title,
      status: t.status as DashboardTask['status'],
      priority: t.priority as DashboardTask['priority'],
      due_date: t.due_date,
      ministry: ministry ? {
        id: ministry.id,
        name: ministry.name,
        color: ministry.color,
      } : null,
      event: event ? {
        id: event.id,
        title: event.title,
      } : null,
    }
  })

  return { data: tasks }
}

/**
 * Get count of upcoming unavailability entries
 */
export async function getUnavailabilityCount(): Promise<{ count: number; error?: string }> {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { count: 0, error: auth.error }

  const { profile, adminClient } = auth

  const today = new Date().toISOString().split('T')[0]

  const { count, error } = await adminClient
    .from('unavailability')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', profile.id)
    .gte('end_date', today)

  if (error) {
    console.error('Error fetching unavailability count:', error)
    return { count: 0, error: 'Failed to fetch unavailability' }
  }

  return { count: count || 0 }
}

// ============================================
// Calendar Events for Members
// ============================================

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

// ============================================
// Birthdays for Leaders/Admins/Owners
// ============================================

export interface Birthday {
  id: string
  firstName: string
  lastName: string
  avatarUrl: string | null
  dateOfBirth: string
  ministryName: string | null
  ministryColor: string | null
}

/**
 * Get upcoming birthdays for the dashboard
 * - Leaders: See birthdays of members in ministries they lead
 * - Admins/Owners: Also see birthdays of all leaders
 */
export async function getUpcomingBirthdays(): Promise<{ data?: Birthday[]; error?: string }> {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth
  const role = profile.role

  // Import birthday helpers dynamically to keep server action clean
  const { isBirthdayInRange, sortBirthdaysByProximity } = await import('@/lib/utils/birthday-helpers')

  const allBirthdays: Birthday[] = []

  // For leaders, admins, owners: Get ministry members' birthdays
  if (['leader', 'admin', 'owner'].includes(role)) {
    // Get ministries this user leads (for leaders) or all ministries (for admins/owners)
    let ministriesQuery = adminClient
      .from('ministries')
      .select('id, name, color')
      .eq('church_id', profile.church_id)
      .eq('is_active', true)

    // Leaders only see ministries they lead
    if (role === 'leader') {
      ministriesQuery = ministriesQuery.eq('leader_id', profile.id)
    }

    const { data: ministries } = await ministriesQuery

    if (ministries && ministries.length > 0) {
      const ministryIds = ministries.map((m) => m.id)
      const ministryMap = new Map(ministries.map((m) => [m.id, m]))

      // Get members of these ministries with birthdays
      const { data: members } = await adminClient
        .from('ministry_members')
        .select(`
          ministry_id,
          profile:profiles (
            id,
            first_name,
            last_name,
            avatar_url,
            date_of_birth
          )
        `)
        .in('ministry_id', ministryIds)
        .eq('is_active', true)

      if (members) {
        for (const member of members) {
          const p = Array.isArray(member.profile) ? member.profile[0] : member.profile
          if (!p || !p.date_of_birth) continue

          // Check if birthday is in range (-7 to +14 days)
          if (isBirthdayInRange(p.date_of_birth, -7, 14)) {
            const ministry = ministryMap.get(member.ministry_id)
            allBirthdays.push({
              id: p.id,
              firstName: p.first_name,
              lastName: p.last_name,
              avatarUrl: p.avatar_url,
              dateOfBirth: p.date_of_birth,
              ministryName: ministry?.name || null,
              ministryColor: ministry?.color || null,
            })
          }
        }
      }
    }
  }

  // For admins/owners: Also include all leaders
  if (['admin', 'owner'].includes(role)) {
    const { data: leaders } = await adminClient
      .from('profiles')
      .select('id, first_name, last_name, avatar_url, date_of_birth')
      .eq('church_id', profile.church_id)
      .eq('role', 'leader')
      .eq('is_active', true)
      .not('date_of_birth', 'is', null)

    if (leaders) {
      for (const leader of leaders) {
        if (!leader.date_of_birth) continue

        // Check if birthday is in range (-7 to +14 days)
        if (isBirthdayInRange(leader.date_of_birth, -7, 14)) {
          // Check if already added (avoid duplicates)
          if (!allBirthdays.some((b) => b.id === leader.id)) {
            allBirthdays.push({
              id: leader.id,
              firstName: leader.first_name,
              lastName: leader.last_name,
              avatarUrl: leader.avatar_url,
              dateOfBirth: leader.date_of_birth,
              ministryName: 'Church Leader',
              ministryColor: null,
            })
          }
        }
      }
    }
  }

  // Sort by proximity (upcoming first)
  const sorted = sortBirthdaysByProximity(allBirthdays)

  return { data: sorted }
}
