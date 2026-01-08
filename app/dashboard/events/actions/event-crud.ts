'use server'

import { revalidatePath } from 'next/cache'
import {
  eventSchema,
  canUserSeeEvent,
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireManagePermission,
  requireAdminPermission,
} from './helpers'
import type { EventInput } from './helpers'
import { getUserCampusIds } from '@/lib/utils/campus'
import { isVolunteer, isLeader } from '@/lib/permissions'

export async function getEvents(filters?: { status?: string; eventType?: string }) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { user, profile, adminClient } = auth

  const userIsVolunteer = isVolunteer(profile.role)
  const userIsLeader = isLeader(profile.role)
  const needsCampusFilter = userIsVolunteer || userIsLeader

  // For volunteers and leaders, get their campus IDs for filtering
  let userCampusIds: string[] = []
  if (needsCampusFilter) {
    userCampusIds = await getUserCampusIds(profile.id, adminClient)
  }

  // Build events query
  let eventsQuery = adminClient
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
    .order('start_time', { ascending: true })

  if (filters?.status) eventsQuery = eventsQuery.eq('status', filters.status)
  if (filters?.eventType) eventsQuery = eventsQuery.eq('event_type', filters.eventType)

  // Parallel fetch: church settings and events (independent queries)
  const [churchResult, eventsResult] = await Promise.all([
    adminClient
      .from('churches')
      .select('first_day_of_week, timezone')
      .eq('id', profile.church_id)
      .single(),
    eventsQuery,
  ])

  const church = churchResult.data
  const { data: events, error } = eventsResult

  if (error) {
    console.error('Error fetching events:', error)
    return { error: 'Failed to load events' }
  }

  const filteredEvents = events?.filter((event) => {
    const invitedProfileIds = event.event_invitations?.map((inv: { profile_id: string }) => inv.profile_id) || []

    // First check visibility permissions (use profile.id since invitations use profile_id)
    if (!canUserSeeEvent(profile.role, event.visibility, profile.id, invitedProfileIds)) {
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

      // If event has no campus, they can see it (church-wide event)
      if (eventCampusIds.length === 0) return true

      // If user has no campus, they can only see church-wide events
      if (userCampusIds.length === 0) return false

      // Check if any event campus matches user's campus
      return eventCampusIds.some((campusId: string) => userCampusIds.includes(campusId))
    }

    return true
  })

  const transformedEvents = filteredEvents?.map((event) => {
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

  return {
    data: transformedEvents,
    role: profile.role,
    firstDayOfWeek: church?.first_day_of_week ?? 1,
    timezone: church?.timezone ?? 'America/New_York',
  }
}

export async function getEvent(eventId: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { user, profile, adminClient } = auth

  const { data: event, error } = await adminClient
    .from('events')
    .select(`
      *,
      location:locations (id, name, address),
      created_by_profile:profiles!created_by (id, first_name, last_name),
      responsible_person:profiles!responsible_person_id (id, first_name, last_name, email),
      event_agenda_items (
        *,
        leader:profiles (id, first_name, last_name),
        ministry:ministries (id, name, color),
        song:songs (id, title, artist, default_key, duration_seconds),
        arrangement:song_arrangements (id, name, is_default)
      ),
      event_positions (
        *,
        ministry:ministries (id, name, color),
        role:ministry_roles (id, name),
        event_assignments (
          *,
          profile:profiles!event_assignments_profile_id_fkey (id, first_name, last_name, email),
          assigned_by_profile:profiles!event_assignments_assigned_by_fkey (id, first_name, last_name)
        )
      ),
      event_invitations (profile_id, profile:profiles (id, first_name, last_name)),
      event_campuses (campus:campuses (id, name, color)),
      tasks (
        *,
        assignee:profiles!assigned_to (id, first_name, last_name, email),
        ministry:ministries!ministry_id (id, name, color),
        campus:campuses!campus_id (id, name, color),
        created_by_profile:profiles!created_by (id, first_name, last_name),
        completed_by_profile:profiles!completed_by (id, first_name, last_name)
      )
    `)
    .eq('id', eventId)
    .eq('church_id', profile.church_id)
    .single()

  if (error) {
    console.error('Error fetching event:', error)
    return { error: 'Failed to load event' }
  }

  if (!event) return { error: 'Event not found' }

  const invitedProfileIds = event.event_invitations?.map((inv: { profile_id: string }) => inv.profile_id) || []
  if (!canUserSeeEvent(profile.role, event.visibility, profile.id, invitedProfileIds)) {
    return { error: 'Event not found' }
  }

  // Transform event_campuses to campuses array (handle both array and object from Supabase)
  const campuses: { id: string; name: string; color: string }[] = []
  for (const ec of event.event_campuses || []) {
    const campus = Array.isArray(ec.campus) ? ec.campus[0] : ec.campus
    if (campus?.id) {
      campuses.push(campus)
    }
  }

  // For volunteers and leaders, check campus access
  if (isVolunteer(profile.role) || isLeader(profile.role)) {
    const eventCampusIds = campuses.map(c => c.id)

    // If event has campus restrictions, check if user is in one of them
    if (eventCampusIds.length > 0) {
      const userCampusIds = await getUserCampusIds(profile.id, adminClient)
      const hasAccess = eventCampusIds.some((campusId: string) => userCampusIds.includes(campusId))
      if (!hasAccess) {
        return { error: 'Event not found' }
      }
    }
  }

  return { data: { ...event, campuses }, role: profile.role }
}

export async function createEvent(data: EventInput) {
  const validated = eventSchema.safeParse(data)
  if (!validated.success) return { error: 'Invalid data provided' }

  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { user, profile, adminClient } = auth

  // Only admin/owner can create events (not leaders)
  const permError = requireAdminPermission(profile.role, 'create events')
  if (permError) return { error: permError }

  const { data: event, error } = await adminClient
    .from('events')
    .insert({
      church_id: profile.church_id,
      title: validated.data.title,
      description: validated.data.description || null,
      event_type: validated.data.eventType,
      location_id: validated.data.locationId || null,
      responsible_person_id: validated.data.responsiblePersonId || null,
      start_time: validated.data.startTime,
      end_time: validated.data.endTime,
      is_all_day: validated.data.isAllDay,
      status: validated.data.status,
      visibility: validated.data.visibility,
      created_by: profile.id,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating event:', error)
    return { error: 'Failed to create event' }
  }

  if (validated.data.visibility === 'hidden') {
    const invitedUserIds = new Set(validated.data.invitedUsers || [])
    invitedUserIds.add(profile.id)
    const invitations = Array.from(invitedUserIds).map((profileId) => ({
      event_id: event.id,
      profile_id: profileId,
    }))
    await adminClient.from('event_invitations').insert(invitations)
  }

  // Save event campuses if provided
  if (validated.data.campusIds && validated.data.campusIds.length > 0) {
    const eventCampuses = validated.data.campusIds.map((campusId) => ({
      event_id: event.id,
      campus_id: campusId,
    }))
    await adminClient.from('event_campuses').insert(eventCampuses)
  }

  revalidatePath('/dashboard/events')
  return { data: event }
}

export async function updateEvent(eventId: string, data: Partial<EventInput>) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { user, profile, adminClient } = auth

  // Only admin/owner can update event details (not leaders)
  const permError = requireAdminPermission(profile.role, 'update events')
  if (permError) return { error: permError }

  const updateData: Record<string, unknown> = {}
  if (data.title !== undefined) updateData.title = data.title
  if (data.description !== undefined) updateData.description = data.description || null
  if (data.eventType !== undefined) updateData.event_type = data.eventType
  if (data.locationId !== undefined) updateData.location_id = data.locationId || null
  if (data.responsiblePersonId !== undefined) updateData.responsible_person_id = data.responsiblePersonId || null
  if (data.startTime !== undefined) updateData.start_time = data.startTime
  if (data.endTime !== undefined) updateData.end_time = data.endTime
  if (data.isAllDay !== undefined) updateData.is_all_day = data.isAllDay
  if (data.status !== undefined) updateData.status = data.status
  if (data.visibility !== undefined) updateData.visibility = data.visibility

  const { error } = await adminClient
    .from('events')
    .update(updateData)
    .eq('id', eventId)
    .eq('church_id', profile.church_id)

  if (error) {
    console.error('Error updating event:', error)
    return { error: 'Failed to update event' }
  }

  if (data.visibility !== undefined && data.invitedUsers !== undefined) {
    await adminClient.from('event_invitations').delete().eq('event_id', eventId)
    if (data.visibility === 'hidden') {
      const invitedUserIds = new Set(data.invitedUsers || [])
      invitedUserIds.add(profile.id)
      const invitations = Array.from(invitedUserIds).map((profileId) => ({
        event_id: eventId,
        profile_id: profileId,
      }))
      await adminClient.from('event_invitations').insert(invitations)
    }
  }

  // Update event campuses if provided
  if (data.campusIds !== undefined) {
    await adminClient.from('event_campuses').delete().eq('event_id', eventId)
    if (data.campusIds.length > 0) {
      const eventCampuses = data.campusIds.map((campusId) => ({
        event_id: eventId,
        campus_id: campusId,
      }))
      await adminClient.from('event_campuses').insert(eventCampuses)
    }
  }

  revalidatePath('/dashboard/events')
  return { success: true }
}

export async function deleteEvent(eventId: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireAdminPermission(profile.role, 'delete events')
  if (permError) return { error: permError }

  const { error } = await adminClient
    .from('events')
    .delete()
    .eq('id', eventId)
    .eq('church_id', profile.church_id)

  if (error) {
    console.error('Error deleting event:', error)
    return { error: 'Failed to delete event' }
  }

  revalidatePath('/dashboard/events')
  return { success: true }
}

export async function duplicateEvent(eventId: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireAdminPermission(profile.role, 'create events')
  if (permError) return { error: permError }

  // Fetch the original event with all related data
  const { data: original, error: fetchError } = await adminClient
    .from('events')
    .select(`
      *,
      event_campuses (campus_id),
      event_agenda_items (*),
      event_positions (*)
    `)
    .eq('id', eventId)
    .eq('church_id', profile.church_id)
    .single()

  if (fetchError || !original) {
    console.error('Error fetching event to duplicate:', fetchError)
    return { error: 'Event not found' }
  }

  // Create the new event with "(copy)" suffix
  const { data: newEvent, error: createError } = await adminClient
    .from('events')
    .insert({
      church_id: profile.church_id,
      title: `${original.title} (copy)`,
      description: original.description,
      start_time: original.start_time,
      end_time: original.end_time,
      is_all_day: original.is_all_day,
      location_id: original.location_id,
      event_type: original.event_type,
      visibility: original.visibility,
      status: 'published',
      created_by: profile.id,
    })
    .select('id')
    .single()

  if (createError || !newEvent) {
    console.error('Error creating duplicate event:', createError)
    return { error: 'Failed to duplicate event' }
  }

  // Duplicate campuses
  if (original.event_campuses && original.event_campuses.length > 0) {
    const campuses = original.event_campuses.map((c: { campus_id: string }) => ({
      event_id: newEvent.id,
      campus_id: c.campus_id,
    }))
    await adminClient.from('event_campuses').insert(campuses)
  }

  // Duplicate agenda items (without song assignments or leaders)
  if (original.event_agenda_items && original.event_agenda_items.length > 0) {
    const agendaItems = original.event_agenda_items.map((item: {
      title: string
      description: string | null
      duration_seconds: number
      sort_order: number
      is_song_placeholder: boolean
      ministry_id: string | null
    }) => ({
      event_id: newEvent.id,
      title: item.title,
      description: item.description,
      duration_seconds: item.duration_seconds,
      sort_order: item.sort_order,
      is_song_placeholder: item.is_song_placeholder,
      ministry_id: item.ministry_id,
    }))
    await adminClient.from('event_agenda_items').insert(agendaItems)
  }

  // Duplicate positions (without assignments)
  if (original.event_positions && original.event_positions.length > 0) {
    const positions = original.event_positions.map((pos: {
      ministry_id: string
      role_id: string | null
      title: string
      quantity_needed: number
      notes: string | null
      sort_order: number | null
    }) => ({
      event_id: newEvent.id,
      ministry_id: pos.ministry_id,
      role_id: pos.role_id,
      title: pos.title,
      quantity_needed: pos.quantity_needed,
      notes: pos.notes,
      sort_order: pos.sort_order,
    }))
    await adminClient.from('event_positions').insert(positions)
  }

  revalidatePath('/dashboard/events')
  return { data: { eventId: newEvent.id } }
}
