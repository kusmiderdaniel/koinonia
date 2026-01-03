'use server'

import { revalidatePath } from 'next/cache'
import {
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireManagePermission,
} from '../helpers'

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
