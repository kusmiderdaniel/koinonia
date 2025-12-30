'use server'

import { revalidatePath } from 'next/cache'
import {
  agendaItemSchema,
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireManagePermission,
} from './helpers'
import type { AgendaItemInput } from './helpers'

// ============ AGENDA ITEM ACTIONS ============

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

  revalidatePath('/dashboard/events')
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

// ============ AGENDA TEMPLATE ACTIONS ============

export async function getAgendaTemplates() {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const { data: templates, error } = await adminClient
    .from('agenda_item_templates')
    .select('*')
    .eq('church_id', profile.church_id)
    .order('title')

  if (error) {
    console.error('Error fetching agenda templates:', error)
    return { error: 'Failed to fetch agenda templates' }
  }

  return { data: templates || [] }
}

export async function createAgendaTemplate(title: string, defaultDurationMinutes: number) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'create templates')
  if (permError) return { error: permError }

  const { data: template, error } = await adminClient
    .from('agenda_item_templates')
    .insert({
      church_id: profile.church_id,
      title: title.trim(),
      default_duration_minutes: defaultDurationMinutes,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return { error: 'An agenda item with this title already exists' }
    console.error('Error creating agenda template:', error)
    return { error: 'Failed to create template' }
  }

  return { data: template }
}

export async function addAgendaItemFromTemplate(
  eventId: string,
  templateId: string,
  ministryId: string,
  overrides?: { durationSeconds?: number; description?: string; leaderId?: string | null }
) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'add agenda items')
  if (permError) return { error: permError }

  const { data: template } = await adminClient
    .from('agenda_item_templates')
    .select('*')
    .eq('id', templateId)
    .single()

  if (!template) return { error: 'Template not found' }

  const { data: maxOrderItem } = await adminClient
    .from('event_agenda_items')
    .select('sort_order')
    .eq('event_id', eventId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const nextSortOrder = (maxOrderItem?.sort_order ?? -1) + 1
  const durationSeconds = overrides?.durationSeconds ?? (template.default_duration_minutes * 60)

  const { data: agendaItem, error } = await adminClient
    .from('event_agenda_items')
    .insert({
      event_id: eventId,
      title: template.title,
      description: overrides?.description || null,
      duration_seconds: durationSeconds,
      leader_id: overrides?.leaderId || null,
      ministry_id: ministryId,
      sort_order: nextSortOrder,
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding agenda item from template:', error)
    return { error: 'Failed to add agenda item' }
  }

  revalidatePath('/dashboard/events')
  return { data: agendaItem }
}

// ============ SONG AGENDA ACTIONS ============

export async function getSongsForAgenda() {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const { data: songs, error } = await adminClient
    .from('songs')
    .select(`
      id, title, artist, default_key, duration_seconds,
      song_tag_assignments (tag:song_tags (id, name, color))
    `)
    .eq('church_id', profile.church_id)
    .order('title')

  if (error) {
    console.error('Error fetching songs for agenda:', error)
    return { error: 'Failed to fetch songs' }
  }

  const transformedSongs = songs?.map(song => ({
    ...song,
    tags: song.song_tag_assignments?.map(sta => {
      const tag = Array.isArray(sta.tag) ? sta.tag[0] : sta.tag
      return tag
    }).filter(Boolean) || []
  })) || []

  return { data: transformedSongs }
}

export async function getSongTags() {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const { data: tags, error } = await adminClient
    .from('song_tags')
    .select('id, name, color')
    .eq('church_id', profile.church_id)
    .order('name')

  if (error) {
    console.error('Error fetching song tags:', error)
    return { error: 'Failed to fetch tags' }
  }

  return { data: tags || [] }
}

export async function addSongToAgenda(eventId: string, songId: string, songKey?: string | null) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'add songs to agenda')
  if (permError) return { error: permError }

  // Parallel fetch: song, worship ministry, and max sort order (all independent)
  const [songResult, worshipMinistryResult, maxOrderResult] = await Promise.all([
    adminClient
      .from('songs')
      .select('title, default_key, duration_seconds')
      .eq('id', songId)
      .single(),
    adminClient
      .from('ministries')
      .select('id')
      .eq('church_id', profile.church_id)
      .eq('is_system', true)
      .eq('name', 'Worship')
      .single(),
    adminClient
      .from('event_agenda_items')
      .select('sort_order')
      .eq('event_id', eventId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single(),
  ])

  const song = songResult.data
  if (!song) return { error: 'Song not found' }

  const worshipMinistry = worshipMinistryResult.data
  const maxOrderItem = maxOrderResult.data
  const nextSortOrder = (maxOrderItem?.sort_order ?? -1) + 1
  const durationSeconds = song.duration_seconds || 300

  const { data: agendaItem, error } = await adminClient
    .from('event_agenda_items')
    .insert({
      event_id: eventId,
      title: song.title,
      song_id: songId,
      song_key: songKey || song.default_key || null,
      duration_seconds: durationSeconds,
      sort_order: nextSortOrder,
      ministry_id: worshipMinistry?.id || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding song to agenda:', error)
    return { error: 'Failed to add song to agenda' }
  }

  revalidatePath('/dashboard/events')
  return { data: agendaItem }
}

export async function replaceSongPlaceholder(agendaItemId: string, songId: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'modify agenda')
  if (permError) return { error: permError }

  // Parallel fetch: song and worship ministry (independent queries)
  const [songResult, worshipMinistryResult] = await Promise.all([
    adminClient
      .from('songs')
      .select('*')
      .eq('id', songId)
      .eq('church_id', profile.church_id)
      .single(),
    adminClient
      .from('ministries')
      .select('id')
      .eq('church_id', profile.church_id)
      .eq('is_system', true)
      .eq('name', 'Worship')
      .single(),
  ])

  const { data: song, error: songError } = songResult
  if (songError || !song) return { error: 'Song not found' }

  const worshipMinistry = worshipMinistryResult.data

  const { data: agendaItem, error } = await adminClient
    .from('event_agenda_items')
    .update({
      song_id: songId,
      title: song.title,
      duration_seconds: song.duration_seconds || 300,
      song_key: song.default_key,
      is_song_placeholder: false,
      ministry_id: worshipMinistry?.id || null,
    })
    .eq('id', agendaItemId)
    .select()
    .single()

  if (error) {
    console.error('Error replacing song placeholder:', error)
    return { error: 'Failed to replace song placeholder' }
  }

  revalidatePath('/dashboard/events')
  return { data: agendaItem }
}

export async function createSongAndAddToAgenda(
  eventId: string,
  songData: {
    title: string
    artist?: string
    defaultKey?: string
    durationSeconds?: number
    tagIds?: string[]
    replaceAgendaItemId?: string
  }
) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { user, profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'create songs')
  if (permError) return { error: permError }

  const { data: song, error: songError } = await adminClient
    .from('songs')
    .insert({
      church_id: profile.church_id,
      title: songData.title,
      artist: songData.artist || null,
      default_key: songData.defaultKey || null,
      duration_seconds: songData.durationSeconds || null,
      created_by: user.id,
    })
    .select()
    .single()

  if (songError) {
    console.error('Error creating song:', songError)
    return { error: 'Failed to create song' }
  }

  if (songData.tagIds && songData.tagIds.length > 0) {
    const tagAssignments = songData.tagIds.map(tagId => ({
      song_id: song.id,
      tag_id: tagId,
    }))
    await adminClient.from('song_tag_assignments').insert(tagAssignments)
  }

  let agendaResult
  if (songData.replaceAgendaItemId) {
    agendaResult = await replaceSongPlaceholder(songData.replaceAgendaItemId, song.id)
  } else {
    agendaResult = await addSongToAgenda(eventId, song.id, songData.defaultKey)
  }

  if (agendaResult.error) return { error: agendaResult.error }

  revalidatePath('/dashboard/events')
  revalidatePath('/dashboard/songs')
  return { data: { song, agendaItem: agendaResult.data } }
}
