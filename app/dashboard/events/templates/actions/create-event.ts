'use server'

import { revalidatePath } from 'next/cache'
import {
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireAdminPermission,
} from '@/lib/utils/server-auth'

export async function createEventFromTemplate(templateId: string, eventDate: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Only admin/owner can create events from templates
  const permError = requireAdminPermission(profile.role, 'create events')
  if (permError) return { error: permError }

  // Get template with all related data
  const { data: template, error: templateError } = await adminClient
    .from('event_templates')
    .select(`
      *,
      event_template_agenda_items (*),
      event_template_positions (*)
    `)
    .eq('id', templateId)
    .eq('church_id', profile.church_id)
    .eq('is_active', true)
    .single()

  if (templateError || !template) {
    console.error('Error fetching template:', templateError)
    return { error: 'Template not found' }
  }

  // Parse the date and time
  const [hours, minutes] = template.default_start_time.split(':').map(Number)
  const startDate = new Date(eventDate)
  startDate.setHours(hours, minutes, 0, 0)

  const endDate = new Date(startDate)
  endDate.setMinutes(endDate.getMinutes() + template.default_duration_minutes)

  // Create the event
  const { data: event, error: eventError } = await adminClient
    .from('events')
    .insert({
      church_id: profile.church_id,
      title: template.name,
      description: template.description,
      event_type: template.event_type,
      location_id: template.location_id,
      responsible_person_id: template.responsible_person_id,
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      is_all_day: false,
      status: 'published',
      visibility: template.visibility,
      created_by: profile.id,
    })
    .select()
    .single()

  if (eventError || !event) {
    console.error('Error creating event:', eventError)
    return { error: 'Failed to create event' }
  }

  // Create agenda items from template
  if (template.event_template_agenda_items && template.event_template_agenda_items.length > 0) {
    const agendaItems = template.event_template_agenda_items.map((item: {
      title: string
      description: string | null
      duration_seconds: number
      is_song_placeholder: boolean
      ministry_id: string | null
      sort_order: number
    }) => ({
      event_id: event.id,
      title: item.is_song_placeholder ? 'Song' : item.title,
      description: item.description,
      duration_seconds: item.duration_seconds,
      ministry_id: item.ministry_id,
      sort_order: item.sort_order,
      // Song placeholders become empty song slots (song_id = null)
      song_id: null,
      song_key: null,
      leader_id: null,
      // Preserve the song placeholder flag so we can style them differently
      is_song_placeholder: item.is_song_placeholder,
    }))

    const { error: agendaError } = await adminClient
      .from('event_agenda_items')
      .insert(agendaItems)

    if (agendaError) {
      console.error('Error creating agenda items:', agendaError)
      // Event was created, but agenda items failed - still return event
    }
  }

  // Create positions from template
  if (template.event_template_positions && template.event_template_positions.length > 0) {
    const positions = template.event_template_positions.map((pos: {
      ministry_id: string
      role_id: string | null
      title: string
      quantity_needed: number
      notes: string | null
      sort_order: number | null
    }) => ({
      event_id: event.id,
      ministry_id: pos.ministry_id,
      role_id: pos.role_id,
      title: pos.title,
      quantity_needed: pos.quantity_needed,
      notes: pos.notes,
      sort_order: pos.sort_order,
    }))

    const { error: positionsError } = await adminClient
      .from('event_positions')
      .insert(positions)

    if (positionsError) {
      console.error('Error creating positions:', positionsError)
      // Event was created, but positions failed - still return event
    }
  }

  // Copy campus from template to event
  if (template.campus_id) {
    const { error: campusError } = await adminClient
      .from('event_campuses')
      .insert({
        event_id: event.id,
        campus_id: template.campus_id,
      })

    if (campusError) {
      console.error('Error assigning campus to event:', campusError)
      // Event was created, but campus assignment failed - still return event
    }
  }

  revalidatePath('/dashboard/events')

  return { data: { eventId: event.id } }
}
