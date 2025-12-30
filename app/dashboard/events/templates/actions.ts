'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireManagePermission,
  requireAdminPermission,
} from '@/lib/utils/server-auth'

// ============================================================================
// SCHEMAS
// ============================================================================

const templateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  eventType: z.enum(['service', 'rehearsal', 'meeting', 'special_event', 'other']),
  locationId: z.string().uuid().optional().nullable(),
  responsiblePersonId: z.string().uuid().optional().nullable(),
  defaultStartTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  defaultDurationMinutes: z.number().int().positive().default(120),
  visibility: z.enum(['members', 'volunteers', 'leaders', 'hidden']).default('members'),
})

type TemplateInput = z.infer<typeof templateSchema>

const templateAgendaItemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  durationSeconds: z.number().int().positive().default(300),
  isSongPlaceholder: z.boolean().default(false),
  ministryId: z.string().uuid().optional().nullable(),
})

type TemplateAgendaItemInput = z.infer<typeof templateAgendaItemSchema>

// ============================================================================
// TEMPLATE CRUD ACTIONS
// ============================================================================

export async function getEventTemplates() {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Get all active templates for the church
  const { data: templates, error } = await adminClient
    .from('event_templates')
    .select(`
      *,
      location:locations (
        id,
        name,
        address
      ),
      responsible_person:profiles!event_templates_responsible_person_id_fkey (
        id,
        first_name,
        last_name,
        email
      ),
      event_template_agenda_items (
        id
      ),
      event_template_positions (
        id,
        quantity_needed
      )
    `)
    .eq('church_id', profile.church_id)
    .eq('is_active', true)
    .order('name')

  if (error) {
    console.error('Error fetching templates:', error)
    return { error: 'Failed to load templates' }
  }

  // Transform to include counts
  const transformedTemplates = templates?.map((template) => ({
    ...template,
    agendaItemCount: template.event_template_agenda_items?.length || 0,
    positionCount: template.event_template_positions?.reduce(
      (sum: number, p: { quantity_needed: number }) => sum + p.quantity_needed,
      0
    ) || 0,
  }))

  return {
    data: transformedTemplates,
    canManage: ['owner', 'admin', 'leader'].includes(profile.role),
  }
}

export async function getEventTemplate(templateId: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Get template with all related data
  const { data: template, error } = await adminClient
    .from('event_templates')
    .select(`
      *,
      location:locations (
        id,
        name,
        address
      ),
      responsible_person:profiles!event_templates_responsible_person_id_fkey (
        id,
        first_name,
        last_name,
        email
      ),
      event_template_agenda_items (
        *,
        ministry:ministries (
          id,
          name
        )
      ),
      event_template_positions (
        *,
        ministry:ministries (
          id,
          name
        ),
        role:ministry_roles (
          id,
          name
        )
      )
    `)
    .eq('id', templateId)
    .eq('church_id', profile.church_id)
    .single()

  if (error || !template) {
    console.error('Error fetching template:', error)
    return { error: 'Template not found' }
  }

  // Sort agenda items and positions by sort_order
  template.event_template_agenda_items?.sort((a: { sort_order: number }, b: { sort_order: number }) =>
    a.sort_order - b.sort_order
  )
  template.event_template_positions?.sort((a: { sort_order: number }, b: { sort_order: number }) =>
    (a.sort_order || 0) - (b.sort_order || 0)
  )

  return {
    data: template,
    canManage: ['owner', 'admin', 'leader'].includes(profile.role),
    canDelete: ['owner', 'admin'].includes(profile.role),
  }
}

export async function createEventTemplate(data: TemplateInput) {
  // Validate input
  const validated = templateSchema.safeParse(data)
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || 'Invalid data' }
  }

  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { user, profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'create templates')
  if (permError) return { error: permError }

  // Create template
  const { data: template, error } = await adminClient
    .from('event_templates')
    .insert({
      church_id: profile.church_id,
      name: validated.data.name,
      description: validated.data.description || null,
      event_type: validated.data.eventType,
      location_id: validated.data.locationId || null,
      responsible_person_id: validated.data.responsiblePersonId || null,
      default_start_time: validated.data.defaultStartTime + ':00', // Add seconds
      default_duration_minutes: validated.data.defaultDurationMinutes,
      visibility: validated.data.visibility,
      created_by: profile.id,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating template:', error)
    if (error.code === '23505') {
      return { error: 'A template with this name already exists' }
    }
    return { error: 'Failed to create template' }
  }

  revalidatePath('/dashboard/events')

  return { data: template }
}

export async function updateEventTemplate(templateId: string, data: Partial<TemplateInput>) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'update templates')
  if (permError) return { error: permError }

  // Build update object
  const updateData: Record<string, unknown> = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.description !== undefined) updateData.description = data.description || null
  if (data.eventType !== undefined) updateData.event_type = data.eventType
  if (data.locationId !== undefined) updateData.location_id = data.locationId || null
  if (data.responsiblePersonId !== undefined) updateData.responsible_person_id = data.responsiblePersonId || null
  if (data.defaultStartTime !== undefined) updateData.default_start_time = data.defaultStartTime + ':00'
  if (data.defaultDurationMinutes !== undefined) updateData.default_duration_minutes = data.defaultDurationMinutes
  if (data.visibility !== undefined) updateData.visibility = data.visibility

  const { error } = await adminClient
    .from('event_templates')
    .update(updateData)
    .eq('id', templateId)
    .eq('church_id', profile.church_id)

  if (error) {
    console.error('Error updating template:', error)
    if (error.code === '23505') {
      return { error: 'A template with this name already exists' }
    }
    return { error: 'Failed to update template' }
  }

  revalidatePath('/dashboard/events')

  return { success: true }
}

export async function deleteEventTemplate(templateId: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireAdminPermission(profile.role, 'delete templates')
  if (permError) return { error: permError }

  // Soft delete by setting is_active = false
  const { error } = await adminClient
    .from('event_templates')
    .update({ is_active: false })
    .eq('id', templateId)
    .eq('church_id', profile.church_id)

  if (error) {
    console.error('Error deleting template:', error)
    return { error: 'Failed to delete template' }
  }

  revalidatePath('/dashboard/events')

  return { success: true }
}

// ============================================================================
// TEMPLATE AGENDA ITEM ACTIONS
// ============================================================================

export async function addTemplateAgendaItem(templateId: string, data: TemplateAgendaItemInput) {
  // Validate input
  const validated = templateAgendaItemSchema.safeParse(data)
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || 'Invalid data' }
  }

  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'modify templates')
  if (permError) return { error: permError }

  // Verify template belongs to user's church
  const { data: template } = await adminClient
    .from('event_templates')
    .select('id')
    .eq('id', templateId)
    .eq('church_id', profile.church_id)
    .single()

  if (!template) {
    return { error: 'Template not found' }
  }

  // Get max sort_order
  const { data: maxOrderItem } = await adminClient
    .from('event_template_agenda_items')
    .select('sort_order')
    .eq('template_id', templateId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const nextSortOrder = (maxOrderItem?.sort_order ?? -1) + 1

  // Create agenda item
  const { data: item, error } = await adminClient
    .from('event_template_agenda_items')
    .insert({
      template_id: templateId,
      title: validated.data.title,
      description: validated.data.description || null,
      duration_seconds: validated.data.durationSeconds,
      is_song_placeholder: validated.data.isSongPlaceholder,
      ministry_id: validated.data.ministryId || null,
      sort_order: nextSortOrder,
    })
    .select(`
      *,
      ministry:ministries (
        id,
        name
      )
    `)
    .single()

  if (error) {
    console.error('Error creating template agenda item:', error)
    return { error: 'Failed to add agenda item' }
  }

  revalidatePath('/dashboard/events')

  return { data: item }
}

export async function updateTemplateAgendaItem(itemId: string, data: Partial<TemplateAgendaItemInput>) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'modify templates')
  if (permError) return { error: permError }

  // Build update object
  const updateData: Record<string, unknown> = {}
  if (data.title !== undefined) updateData.title = data.title
  if (data.description !== undefined) updateData.description = data.description || null
  if (data.durationSeconds !== undefined) updateData.duration_seconds = data.durationSeconds
  if (data.isSongPlaceholder !== undefined) updateData.is_song_placeholder = data.isSongPlaceholder
  if (data.ministryId !== undefined) updateData.ministry_id = data.ministryId || null

  const { error } = await adminClient
    .from('event_template_agenda_items')
    .update(updateData)
    .eq('id', itemId)

  if (error) {
    console.error('Error updating template agenda item:', error)
    return { error: 'Failed to update agenda item' }
  }

  revalidatePath('/dashboard/events')

  return { success: true }
}

export async function removeTemplateAgendaItem(itemId: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'modify templates')
  if (permError) return { error: permError }

  const { error } = await adminClient
    .from('event_template_agenda_items')
    .delete()
    .eq('id', itemId)

  if (error) {
    console.error('Error removing template agenda item:', error)
    return { error: 'Failed to remove agenda item' }
  }

  revalidatePath('/dashboard/events')

  return { success: true }
}

export async function reorderTemplateAgendaItems(templateId: string, itemIds: string[]) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'modify templates')
  if (permError) return { error: permError }

  // Update sort_order for each item
  const updates = itemIds.map((id, index) =>
    adminClient
      .from('event_template_agenda_items')
      .update({ sort_order: index })
      .eq('id', id)
      .eq('template_id', templateId)
  )

  const results = await Promise.all(updates)
  const hasError = results.some((r) => r.error)

  if (hasError) {
    console.error('Error reordering template agenda items')
    return { error: 'Failed to reorder agenda items' }
  }

  revalidatePath('/dashboard/events')

  return { success: true }
}

// ============================================================================
// TEMPLATE POSITION ACTIONS
// ============================================================================

export async function addTemplatePositions(
  templateId: string,
  positions: { ministryId: string; roleId: string; roleName: string }[]
) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'modify templates')
  if (permError) return { error: permError }

  // Verify template belongs to user's church
  const { data: template } = await adminClient
    .from('event_templates')
    .select('id')
    .eq('id', templateId)
    .eq('church_id', profile.church_id)
    .single()

  if (!template) {
    return { error: 'Template not found' }
  }

  // Get current max sort_order
  const { data: maxOrderPosition } = await adminClient
    .from('event_template_positions')
    .select('sort_order')
    .eq('template_id', templateId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  let nextSortOrder = (maxOrderPosition?.sort_order ?? -1) + 1

  // Create positions
  const positionsToInsert = positions.map((p) => ({
    template_id: templateId,
    ministry_id: p.ministryId,
    role_id: p.roleId || null,
    title: p.roleName,
    quantity_needed: 1,
    sort_order: nextSortOrder++,
  }))

  const { data: insertedPositions, error } = await adminClient
    .from('event_template_positions')
    .insert(positionsToInsert)
    .select(`
      *,
      ministry:ministries (
        id,
        name
      ),
      role:ministry_roles (
        id,
        name
      )
    `)

  if (error) {
    console.error('Error creating template positions:', error)
    return { error: 'Failed to add positions' }
  }

  revalidatePath('/dashboard/events')

  return { data: insertedPositions }
}

export async function updateTemplatePosition(
  positionId: string,
  data: { title?: string; quantityNeeded?: number; notes?: string }
) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'modify templates')
  if (permError) return { error: permError }

  // Build update object
  const updateData: Record<string, unknown> = {}
  if (data.title !== undefined) updateData.title = data.title
  if (data.quantityNeeded !== undefined) updateData.quantity_needed = data.quantityNeeded
  if (data.notes !== undefined) updateData.notes = data.notes || null

  const { error } = await adminClient
    .from('event_template_positions')
    .update(updateData)
    .eq('id', positionId)

  if (error) {
    console.error('Error updating template position:', error)
    return { error: 'Failed to update position' }
  }

  revalidatePath('/dashboard/events')

  return { success: true }
}

export async function removeTemplatePosition(positionId: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'modify templates')
  if (permError) return { error: permError }

  const { error } = await adminClient
    .from('event_template_positions')
    .delete()
    .eq('id', positionId)

  if (error) {
    console.error('Error removing template position:', error)
    return { error: 'Failed to remove position' }
  }

  revalidatePath('/dashboard/events')

  return { success: true }
}

// ============================================================================
// CREATE EVENT FROM TEMPLATE
// ============================================================================

export async function createEventFromTemplate(templateId: string, eventDate: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { user, profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'create events')
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

  revalidatePath('/dashboard/events')

  return { data: { eventId: event.id } }
}

// ============================================================================
// HELPER ACTIONS
// ============================================================================

export async function getChurchSettings() {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Get church settings
  const { data: church } = await adminClient
    .from('churches')
    .select('first_day_of_week')
    .eq('id', profile.church_id)
    .single()

  return {
    data: {
      firstDayOfWeek: church?.first_day_of_week ?? 1,
    }
  }
}

export async function getMinistries() {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const { data: ministries, error } = await adminClient
    .from('ministries')
    .select(`
      id,
      name,
      color,
      ministry_roles (
        id,
        name
      )
    `)
    .eq('church_id', profile.church_id)
    .eq('is_active', true)
    .order('name')

  if (error) {
    console.error('Error fetching ministries:', error)
    return { error: 'Failed to load ministries' }
  }

  return { data: ministries }
}
