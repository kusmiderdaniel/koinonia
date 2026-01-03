'use server'

import { revalidatePath } from 'next/cache'
import {
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireAdminPermission,
} from '@/lib/utils/server-auth'
import { templateAgendaItemSchema, type TemplateAgendaItemInput } from './schemas'

export async function addTemplateAgendaItem(templateId: string, data: TemplateAgendaItemInput) {
  const validated = templateAgendaItemSchema.safeParse(data)
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || 'Invalid data' }
  }

  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireAdminPermission(profile.role, 'modify templates')
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

  // Auto-save to presets library if not a song placeholder and title exists
  if (validated.data.title && !validated.data.isSongPlaceholder) {
    const { data: existingPreset } = await adminClient
      .from('agenda_item_presets')
      .select('id')
      .eq('church_id', profile.church_id)
      .eq('title', validated.data.title)
      .eq('is_active', true)
      .single()

    if (!existingPreset) {
      await adminClient.from('agenda_item_presets').insert({
        church_id: profile.church_id,
        title: validated.data.title,
        description: validated.data.description || null,
        duration_seconds: validated.data.durationSeconds,
        ministry_id: validated.data.ministryId || null,
      })
    }
  }

  revalidatePath('/dashboard/events')
  revalidatePath('/dashboard/settings')

  return { data: item }
}

export async function updateTemplateAgendaItem(itemId: string, data: Partial<TemplateAgendaItemInput>) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireAdminPermission(profile.role, 'modify templates')
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

  const permError = requireAdminPermission(profile.role, 'modify templates')
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

  const permError = requireAdminPermission(profile.role, 'modify templates')
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
