'use server'

import { revalidatePath } from 'next/cache'
import {
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireAdminPermission,
} from '@/lib/utils/server-auth'
import { templateSchema, type TemplateInput } from './schemas'

export async function getEventTemplates() {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

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
      campus:campuses (
        id,
        name,
        color
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
    canManage: ['owner', 'admin'].includes(profile.role),
  }
}

export async function getEventTemplate(templateId: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

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
      campus:campuses (
        id,
        name,
        color
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

  template.event_template_agenda_items?.sort((a: { sort_order: number }, b: { sort_order: number }) =>
    a.sort_order - b.sort_order
  )
  template.event_template_positions?.sort((a: { sort_order: number }, b: { sort_order: number }) =>
    (a.sort_order || 0) - (b.sort_order || 0)
  )

  return {
    data: template,
    canManage: ['owner', 'admin'].includes(profile.role),
    canDelete: ['owner', 'admin'].includes(profile.role),
  }
}

export async function createEventTemplate(data: TemplateInput) {
  const validated = templateSchema.safeParse(data)
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || 'Invalid data' }
  }

  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireAdminPermission(profile.role, 'create templates')
  if (permError) return { error: permError }

  const { data: template, error } = await adminClient
    .from('event_templates')
    .insert({
      church_id: profile.church_id,
      name: validated.data.name,
      description: validated.data.description || null,
      event_type: validated.data.eventType,
      location_id: validated.data.locationId || null,
      responsible_person_id: validated.data.responsiblePersonId || null,
      default_start_time: validated.data.defaultStartTime + ':00',
      default_duration_minutes: validated.data.defaultDurationMinutes,
      visibility: validated.data.visibility,
      campus_id: validated.data.campusId || null,
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

  const permError = requireAdminPermission(profile.role, 'update templates')
  if (permError) return { error: permError }

  const updateData: Record<string, unknown> = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.description !== undefined) updateData.description = data.description || null
  if (data.eventType !== undefined) updateData.event_type = data.eventType
  if (data.locationId !== undefined) updateData.location_id = data.locationId || null
  if (data.responsiblePersonId !== undefined) updateData.responsible_person_id = data.responsiblePersonId || null
  if (data.defaultStartTime !== undefined) updateData.default_start_time = data.defaultStartTime + ':00'
  if (data.defaultDurationMinutes !== undefined) updateData.default_duration_minutes = data.defaultDurationMinutes
  if (data.visibility !== undefined) updateData.visibility = data.visibility
  if (data.campusId !== undefined) updateData.campus_id = data.campusId || null

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

export async function duplicateEventTemplate(templateId: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireAdminPermission(profile.role, 'duplicate templates')
  if (permError) return { error: permError }

  const { data: original, error: fetchError } = await adminClient
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

  if (fetchError || !original) {
    console.error('Error fetching template:', fetchError)
    return { error: 'Template not found' }
  }

  const { data: newTemplate, error: createError } = await adminClient
    .from('event_templates')
    .insert({
      church_id: profile.church_id,
      name: `${original.name} - copy`,
      description: original.description,
      event_type: original.event_type,
      location_id: original.location_id,
      responsible_person_id: original.responsible_person_id,
      default_start_time: original.default_start_time,
      default_duration_minutes: original.default_duration_minutes,
      visibility: original.visibility,
      campus_id: original.campus_id,
      created_by: profile.id,
    })
    .select()
    .single()

  if (createError || !newTemplate) {
    console.error('Error creating duplicate template:', createError)
    if (createError?.code === '23505') {
      return { error: 'A template with this name already exists. Please rename the original first.' }
    }
    return { error: 'Failed to duplicate template' }
  }

  // Copy agenda items
  if (original.event_template_agenda_items && original.event_template_agenda_items.length > 0) {
    const agendaItems = original.event_template_agenda_items.map((item: {
      title: string
      description: string | null
      duration_seconds: number
      is_song_placeholder: boolean
      ministry_id: string | null
      sort_order: number
    }) => ({
      template_id: newTemplate.id,
      title: item.title,
      description: item.description,
      duration_seconds: item.duration_seconds,
      is_song_placeholder: item.is_song_placeholder,
      ministry_id: item.ministry_id,
      sort_order: item.sort_order,
    }))

    await adminClient.from('event_template_agenda_items').insert(agendaItems)
  }

  // Copy positions
  if (original.event_template_positions && original.event_template_positions.length > 0) {
    const positions = original.event_template_positions.map((pos: {
      ministry_id: string
      role_id: string | null
      title: string
      quantity_needed: number
      notes: string | null
      sort_order: number | null
    }) => ({
      template_id: newTemplate.id,
      ministry_id: pos.ministry_id,
      role_id: pos.role_id,
      title: pos.title,
      quantity_needed: pos.quantity_needed,
      notes: pos.notes,
      sort_order: pos.sort_order,
    }))

    await adminClient.from('event_template_positions').insert(positions)
  }

  revalidatePath('/dashboard/events')

  return { data: { templateId: newTemplate.id } }
}
