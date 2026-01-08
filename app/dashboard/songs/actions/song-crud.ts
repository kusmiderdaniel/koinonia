'use server'

import { revalidatePath } from 'next/cache'
import { isLeaderOrAbove } from '@/lib/permissions'
import {
  songSchema,
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireManagePermission,
} from './helpers'
import type { SongInput } from './helpers'

export async function getArtists() {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Get all unique non-null artists from songs in this church
  const { data: songs, error } = await adminClient
    .from('songs')
    .select('artist')
    .eq('church_id', profile.church_id)
    .not('artist', 'is', null)
    .order('artist', { ascending: true })

  if (error) {
    console.error('Error fetching artists:', error)
    return { error: 'Failed to load artists' }
  }

  // Extract unique artists
  const uniqueArtists = [...new Set(songs?.map(s => s.artist).filter(Boolean) as string[])]

  return { data: uniqueArtists }
}

export async function getSongs() {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Get all songs with their tags
  const { data: songs, error } = await adminClient
    .from('songs')
    .select(`
      *,
      created_by_profile:profiles!songs_created_by_fkey (
        id,
        first_name,
        last_name
      ),
      song_tag_assignments (
        tag:song_tags (
          id,
          name,
          color
        )
      )
    `)
    .eq('church_id', profile.church_id)
    .order('title', { ascending: true })

  if (error) {
    console.error('Error fetching songs:', error)
    return { error: 'Failed to load songs' }
  }

  // Transform to flatten tags
  const transformedSongs = songs?.map((song) => ({
    ...song,
    tags: song.song_tag_assignments
      ?.map((sta: { tag: { id: string; name: string; color: string } | null }) => sta.tag)
      .filter(Boolean) || [],
  }))

  const canManage = isLeaderOrAbove(profile.role)

  return { data: transformedSongs, canManage }
}

export async function getSong(songId: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Get song with tags, attachments, sections, and arrangements
  const { data: song, error } = await adminClient
    .from('songs')
    .select(`
      *,
      created_by_profile:profiles!songs_created_by_fkey (
        id,
        first_name,
        last_name
      ),
      song_tag_assignments (
        tag:song_tags (
          id,
          name,
          color
        )
      ),
      song_attachments (
        id,
        file_name,
        file_path,
        file_size,
        created_at
      ),
      song_sections (
        id,
        section_type,
        section_number,
        label,
        lyrics,
        sort_order,
        created_at,
        updated_at
      ),
      song_arrangements (
        id,
        name,
        is_default,
        created_by,
        created_at,
        updated_at,
        song_arrangement_sections (
          id,
          section_id,
          sort_order
        )
      )
    `)
    .eq('id', songId)
    .eq('church_id', profile.church_id)
    .single()

  if (error) {
    console.error('Error fetching song:', error)
    return { error: 'Failed to load song' }
  }

  if (!song) {
    return { error: 'Song not found' }
  }

  // Transform to flatten tags and sort sections/arrangements
  const transformedSong = {
    ...song,
    tags: song.song_tag_assignments
      ?.map((sta: { tag: { id: string; name: string; color: string } | null }) => sta.tag)
      .filter(Boolean) || [],
    song_sections: song.song_sections
      ?.sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order) || [],
    song_arrangements: song.song_arrangements
      ?.sort((a: { is_default: boolean; name: string }, b: { is_default: boolean; name: string }) => {
        // Master (is_default) first, then alphabetically
        if (a.is_default && !b.is_default) return -1
        if (!a.is_default && b.is_default) return 1
        return a.name.localeCompare(b.name)
      })
      .map((arr: { song_arrangement_sections?: { sort_order: number }[] }) => ({
        ...arr,
        sections: arr.song_arrangement_sections
          ?.sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order) || [],
      })) || [],
  }

  const canManage = isLeaderOrAbove(profile.role)

  return { data: transformedSong, canManage }
}

export async function createSong(data: SongInput) {
  const validated = songSchema.safeParse(data)
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || 'Invalid data' }
  }

  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'create songs')
  if (permError) return { error: permError }

  // Create the song
  const { data: song, error } = await adminClient
    .from('songs')
    .insert({
      church_id: profile.church_id,
      title: validated.data.title,
      artist: validated.data.artist || null,
      default_key: validated.data.defaultKey || null,
      duration_seconds: validated.data.durationSeconds || null,
      created_by: profile.id,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating song:', error)
    return { error: 'Failed to create song' }
  }

  // Assign tags if provided
  if (validated.data.tagIds && validated.data.tagIds.length > 0) {
    const tagAssignments = validated.data.tagIds.map((tagId) => ({
      song_id: song.id,
      tag_id: tagId,
    }))

    await adminClient.from('song_tag_assignments').insert(tagAssignments)
  }

  revalidatePath('/dashboard/songs')
  return { data: song }
}

export async function updateSong(songId: string, data: SongInput) {
  const validated = songSchema.safeParse(data)
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || 'Invalid data' }
  }

  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'update songs')
  if (permError) return { error: permError }

  // Update the song
  const { error } = await adminClient
    .from('songs')
    .update({
      title: validated.data.title,
      artist: validated.data.artist || null,
      default_key: validated.data.defaultKey || null,
      duration_seconds: validated.data.durationSeconds || null,
    })
    .eq('id', songId)
    .eq('church_id', profile.church_id)

  if (error) {
    console.error('Error updating song:', error)
    return { error: 'Failed to update song' }
  }

  // Update tag assignments
  if (validated.data.tagIds !== undefined) {
    // Remove existing assignments
    await adminClient
      .from('song_tag_assignments')
      .delete()
      .eq('song_id', songId)

    // Add new assignments
    if (validated.data.tagIds.length > 0) {
      const tagAssignments = validated.data.tagIds.map((tagId) => ({
        song_id: songId,
        tag_id: tagId,
      }))

      await adminClient.from('song_tag_assignments').insert(tagAssignments)
    }
  }

  revalidatePath('/dashboard/songs')
  return { success: true }
}

export async function deleteSong(songId: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'delete songs')
  if (permError) return { error: permError }

  // Get attachments to delete from storage
  const { data: attachments } = await adminClient
    .from('song_attachments')
    .select('file_path')
    .eq('song_id', songId)

  // Delete files from storage
  if (attachments && attachments.length > 0) {
    const filePaths = attachments.map((a) => a.file_path)
    await adminClient.storage.from('song-attachments').remove(filePaths)
  }

  // Delete the song (cascades to attachments and tag assignments)
  const { error } = await adminClient
    .from('songs')
    .delete()
    .eq('id', songId)
    .eq('church_id', profile.church_id)

  if (error) {
    console.error('Error deleting song:', error)
    return { error: 'Failed to delete song' }
  }

  revalidatePath('/dashboard/songs')
  return { success: true }
}
