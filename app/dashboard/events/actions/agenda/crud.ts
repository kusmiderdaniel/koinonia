'use server'

import { revalidatePath } from 'next/cache'
import {
  agendaItemSchema,
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireManagePermission,
} from '../helpers'
import type { AgendaItemInput } from '../helpers'

export async function addAgendaItem(eventId: string, data: AgendaItemInput) {
  const validated = agendaItemSchema.safeParse(data)
  if (!validated.success) return { error: validated.error.issues[0]?.message || 'Invalid data' }

  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'add agenda items')
  if (permError) return { error: permError }

  const { data: maxOrderItem } = await adminClient
    .from('event_agenda_items')
    .select('sort_order')
    .eq('event_id', eventId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const nextSortOrder = (maxOrderItem?.sort_order ?? -1) + 1

  const { data: agendaItem, error } = await adminClient
    .from('event_agenda_items')
    .insert({
      event_id: eventId,
      title: validated.data.title,
      description: validated.data.description || null,
      duration_seconds: validated.data.durationSeconds,
      leader_id: validated.data.leaderId || null,
      ministry_id: validated.data.ministryId,
      sort_order: nextSortOrder,
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding agenda item:', error)
    return { error: 'Failed to add agenda item' }
  }

  // Auto-save to presets library if title exists and not already in library
  if (validated.data.title) {
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
  return { data: agendaItem }
}

export async function updateAgendaItem(itemId: string, data: Partial<AgendaItemInput>) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'update agenda items')
  if (permError) return { error: permError }

  const updateData: Record<string, unknown> = {}
  if (data.title !== undefined) updateData.title = data.title
  if (data.description !== undefined) updateData.description = data.description || null
  if (data.durationSeconds !== undefined) updateData.duration_seconds = data.durationSeconds
  if (data.leaderId !== undefined) updateData.leader_id = data.leaderId || null
  if (data.ministryId !== undefined) updateData.ministry_id = data.ministryId
  if (data.sortOrder !== undefined) updateData.sort_order = data.sortOrder

  const { error } = await adminClient
    .from('event_agenda_items')
    .update(updateData)
    .eq('id', itemId)

  if (error) {
    console.error('Error updating agenda item:', error)
    return { error: 'Failed to update agenda item' }
  }

  revalidatePath('/dashboard/events')
  return { success: true }
}

export async function removeAgendaItem(itemId: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'remove agenda items')
  if (permError) return { error: permError }

  const { error } = await adminClient
    .from('event_agenda_items')
    .delete()
    .eq('id', itemId)

  if (error) {
    console.error('Error removing agenda item:', error)
    return { error: 'Failed to remove agenda item' }
  }

  revalidatePath('/dashboard/events')
  return { success: true }
}

export async function reorderAgendaItems(eventId: string, itemIds: string[]) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'reorder agenda items')
  if (permError) return { error: permError }

  // Batch all updates in parallel instead of sequential
  const updatePromises = itemIds.map((itemId, index) =>
    adminClient
      .from('event_agenda_items')
      .update({ sort_order: index })
      .eq('id', itemId)
      .eq('event_id', eventId)
  )

  const results = await Promise.all(updatePromises)
  const failedUpdate = results.find(result => result.error)

  if (failedUpdate?.error) {
    console.error('Error reordering agenda items:', failedUpdate.error)
    return { error: 'Failed to reorder agenda items' }
  }

  revalidatePath('/dashboard/events')
  return { success: true }
}

export async function updateAgendaItemSongKey(itemId: string, songKey: string | null) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'update agenda items')
  if (permError) return { error: permError }

  const { error } = await adminClient
    .from('event_agenda_items')
    .update({ song_key: songKey })
    .eq('id', itemId)

  if (error) {
    console.error('Error updating song key:', error)
    return { error: 'Failed to update song key' }
  }

  revalidatePath('/dashboard/events')
  return { success: true }
}

export async function updateAgendaItemLeader(itemId: string, leaderId: string | null) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'update agenda items')
  if (permError) return { error: permError }

  const { error } = await adminClient
    .from('event_agenda_items')
    .update({ leader_id: leaderId })
    .eq('id', itemId)

  if (error) {
    console.error('Error updating leader:', error)
    return { error: 'Failed to update leader' }
  }

  revalidatePath('/dashboard/events')
  return { success: true }
}

export async function updateAgendaItemDuration(itemId: string, durationSeconds: number) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'update agenda items')
  if (permError) return { error: permError }

  const { error } = await adminClient
    .from('event_agenda_items')
    .update({ duration_seconds: durationSeconds })
    .eq('id', itemId)

  if (error) {
    console.error('Error updating duration:', error)
    return { error: 'Failed to update duration' }
  }

  revalidatePath('/dashboard/events')
  return { success: true }
}

export async function updateAgendaItemDescription(itemId: string, description: string | null) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'update agenda items')
  if (permError) return { error: permError }

  const { error } = await adminClient
    .from('event_agenda_items')
    .update({ description: description || null })
    .eq('id', itemId)

  if (error) {
    console.error('Error updating description:', error)
    return { error: 'Failed to update description' }
  }

  revalidatePath('/dashboard/events')
  return { success: true }
}
