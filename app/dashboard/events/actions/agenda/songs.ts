'use server'

import { revalidatePath } from 'next/cache'
import {
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireManagePermission,
} from '../helpers'
import type { SongSection } from '@/app/dashboard/songs/types'

export async function getSongsForAgenda() {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const { data: songs, error } = await adminClient
    .from('songs')
    .select(`
      id, title, artist, default_key, duration_seconds,
      song_tag_assignments (tag:song_tags (id, name, color)),
      song_arrangements (id, name, is_default)
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
    }).filter(Boolean) || [],
    arrangements: song.song_arrangements
      ?.sort((a: { is_default: boolean; name: string }, b: { is_default: boolean; name: string }) => {
        if (a.is_default && !b.is_default) return -1
        if (!a.is_default && b.is_default) return 1
        return a.name.localeCompare(b.name)
      }) || []
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

export async function addSongToAgenda(
  eventId: string,
  songId: string,
  songKey?: string | null,
  arrangementId?: string | null
) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'add songs to agenda')
  if (permError) return { error: permError }

  // Parallel fetch: song, worship ministry, max sort order, and arrangement (all independent)
  const [songResult, worshipMinistryResult, maxOrderResult, arrangementResult] = await Promise.all([
    adminClient
      .from('songs')
      .select('title, default_key, duration_seconds')
      .eq('id', songId)
      .single(),
    // Get the system ministry (Worship) - query by is_system flag, not name (name can be changed)
    adminClient
      .from('ministries')
      .select('id')
      .eq('church_id', profile.church_id)
      .eq('is_system', true)
      .single(),
    adminClient
      .from('event_agenda_items')
      .select('sort_order')
      .eq('event_id', eventId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single(),
    // Only fetch arrangement if one is specified
    arrangementId
      ? adminClient
          .from('song_arrangements')
          .select('is_default, duration_seconds')
          .eq('id', arrangementId)
          .single()
      : Promise.resolve({ data: null }),
  ])

  const song = songResult.data
  if (!song) return { error: 'Song not found' }

  const worshipMinistry = worshipMinistryResult.data
  const maxOrderItem = maxOrderResult.data
  const nextSortOrder = (maxOrderItem?.sort_order ?? -1) + 1

  // Determine duration: use arrangement duration if it's not Master and has custom duration
  const arrangement = arrangementResult.data
  let durationSeconds = song.duration_seconds || 300
  if (arrangement && !arrangement.is_default && arrangement.duration_seconds) {
    durationSeconds = arrangement.duration_seconds
  }

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
      arrangement_id: arrangementId || null,
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

export async function replaceSongPlaceholder(
  agendaItemId: string,
  songId: string,
  arrangementId?: string | null
) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'modify agenda')
  if (permError) return { error: permError }

  // Parallel fetch: song, worship ministry, and arrangement (all independent)
  const [songResult, worshipMinistryResult, arrangementResult] = await Promise.all([
    adminClient
      .from('songs')
      .select('*')
      .eq('id', songId)
      .eq('church_id', profile.church_id)
      .single(),
    // Get the system ministry (Worship) - query by is_system flag, not name (name can be changed)
    adminClient
      .from('ministries')
      .select('id')
      .eq('church_id', profile.church_id)
      .eq('is_system', true)
      .single(),
    // Only fetch arrangement if one is specified
    arrangementId
      ? adminClient
          .from('song_arrangements')
          .select('is_default, duration_seconds')
          .eq('id', arrangementId)
          .single()
      : Promise.resolve({ data: null }),
  ])

  const { data: song, error: songError } = songResult
  if (songError || !song) return { error: 'Song not found' }

  const worshipMinistry = worshipMinistryResult.data

  // Determine duration: use arrangement duration if it's not Master and has custom duration
  const arrangement = arrangementResult.data
  let durationSeconds = song.duration_seconds || 300
  if (arrangement && !arrangement.is_default && arrangement.duration_seconds) {
    durationSeconds = arrangement.duration_seconds
  }

  const { data: agendaItem, error } = await adminClient
    .from('event_agenda_items')
    .update({
      song_id: songId,
      title: song.title,
      duration_seconds: durationSeconds,
      song_key: song.default_key,
      is_song_placeholder: false,
      ministry_id: worshipMinistry?.id || null,
      arrangement_id: arrangementId || null,
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

  const { profile, adminClient } = auth

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
      created_by: profile.id,
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

export async function updateAgendaItemArrangement(
  agendaItemId: string,
  arrangementId: string | null
) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'modify agenda')
  if (permError) return { error: permError }

  // Build update data
  const updateData: { arrangement_id: string | null; duration_seconds?: number } = {
    arrangement_id: arrangementId,
  }

  // If arrangement is selected, check if it has a custom duration
  if (arrangementId) {
    const { data: arrangement } = await adminClient
      .from('song_arrangements')
      .select('duration_seconds')
      .eq('id', arrangementId)
      .single()

    if (arrangement?.duration_seconds) {
      updateData.duration_seconds = arrangement.duration_seconds
    }
  }

  const { data, error } = await adminClient
    .from('event_agenda_items')
    .update(updateData)
    .eq('id', agendaItemId)
    .select()
    .single()

  if (error) {
    console.error('Error updating agenda item arrangement:', error)
    return { error: 'Failed to update arrangement' }
  }

  revalidatePath('/dashboard/events')
  return { data }
}

export async function getArrangementsForSong(songId: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const { data: arrangements, error } = await adminClient
    .from('song_arrangements')
    .select('id, name, is_default, duration_seconds')
    .eq('song_id', songId)
    .order('is_default', { ascending: false })
    .order('name')

  if (error) {
    console.error('Error fetching arrangements:', error)
    return { error: 'Failed to fetch arrangements' }
  }

  return { data: arrangements || [] }
}

export async function getSongLyricsForAgenda(
  songId: string,
  arrangementId: string | null
): Promise<{
  data?: {
    song: { id: string; title: string; artist: string | null; default_key: string | null }
    sections: SongSection[]
    arrangementName: string | null
  }
  error?: string
}> {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Fetch song with sections
  const { data: song, error: songError } = await adminClient
    .from('songs')
    .select(`
      id, title, artist, default_key,
      song_sections (*)
    `)
    .eq('id', songId)
    .eq('church_id', profile.church_id)
    .single()

  if (songError || !song) {
    console.error('Error fetching song for lyrics:', songError)
    return { error: 'Song not found' }
  }

  const allSections = (song.song_sections || []) as SongSection[]

  // If no arrangement, return sections in default order
  if (!arrangementId) {
    const sortedSections = allSections.sort((a, b) => a.sort_order - b.sort_order)
    return {
      data: {
        song: { id: song.id, title: song.title, artist: song.artist, default_key: song.default_key },
        sections: sortedSections,
        arrangementName: null,
      },
    }
  }

  // Fetch arrangement with section order
  const { data: arrangement, error: arrError } = await adminClient
    .from('song_arrangements')
    .select(`
      id, name,
      song_arrangement_sections (section_id, sort_order)
    `)
    .eq('id', arrangementId)
    .single()

  if (arrError || !arrangement) {
    // Fallback to default order if arrangement not found
    const sortedSections = allSections.sort((a, b) => a.sort_order - b.sort_order)
    return {
      data: {
        song: { id: song.id, title: song.title, artist: song.artist, default_key: song.default_key },
        sections: sortedSections,
        arrangementName: null,
      },
    }
  }

  // Build sections in arrangement order (can have duplicates)
  const arrangementSections = (arrangement.song_arrangement_sections || [])
    .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
    .map((as: { section_id: string }) => allSections.find((s) => s.id === as.section_id))
    .filter(Boolean) as SongSection[]

  return {
    data: {
      song: { id: song.id, title: song.title, artist: song.artist, default_key: song.default_key },
      sections: arrangementSections,
      arrangementName: arrangement.name,
    },
  }
}
