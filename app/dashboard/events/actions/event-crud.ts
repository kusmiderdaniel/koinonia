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

export async function getEvents(filters?: { status?: string; eventType?: string }) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { user, profile, adminClient } = auth

  // Build events query
  let eventsQuery = adminClient
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
    const invitedUserIds = event.event_invitations?.map((inv: { profile_id: string }) => inv.profile_id) || []
    return canUserSeeEvent(profile.role, event.visibility, user.id, invitedUserIds)
  })

  const transformedEvents = filteredEvents?.map((event) => {
    const totalPositions = event.event_positions?.reduce(
      (sum: number, p: { quantity_needed: number }) => sum + p.quantity_needed, 0
    ) || 0
    const filledPositions = event.event_positions?.reduce(
      (sum: number, p: { event_assignments: { id: string }[] | null }) => sum + (p.event_assignments?.length || 0), 0
    ) || 0
    return { ...event, totalPositions, filledPositions }
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
        song:songs (id, title, artist, default_key, duration_seconds)
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
      event_invitations (profile_id, profile:profiles (id, first_name, last_name))
    `)
    .eq('id', eventId)
    .eq('church_id', profile.church_id)
    .single()

  if (error) {
    console.error('Error fetching event:', error)
    return { error: 'Failed to load event' }
  }

  if (!event) return { error: 'Event not found' }

  const invitedUserIds = event.event_invitations?.map((inv: { profile_id: string }) => inv.profile_id) || []
  if (!canUserSeeEvent(profile.role, event.visibility, user.id, invitedUserIds)) {
    return { error: 'Event not found' }
  }

  return { data: event, role: profile.role }
}

export async function createEvent(data: EventInput) {
  const validated = eventSchema.safeParse(data)
  if (!validated.success) return { error: 'Invalid data provided' }

  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { user, profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'create events')
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

  revalidatePath('/dashboard/events')
  return { data: event }
}

export async function updateEvent(eventId: string, data: Partial<EventInput>) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { user, profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'update events')
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
