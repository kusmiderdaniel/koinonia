'use server'

import { revalidatePath } from 'next/cache'
import {
  songSchema,
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireManagePermission,
} from './helpers'
import type { SongInput } from './helpers'

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

  const canManage = ['owner', 'admin', 'leader'].includes(profile.role)

  return { data: transformedSongs, canManage }
}

export async function getSong(songId: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Get song with tags and attachments
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

  // Transform to flatten tags
  const transformedSong = {
    ...song,
    tags: song.song_tag_assignments
      ?.map((sta: { tag: { id: string; name: string; color: string } | null }) => sta.tag)
      .filter(Boolean) || [],
  }

  const canManage = ['owner', 'admin', 'leader'].includes(profile.role)

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
