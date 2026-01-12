'use server'

import { revalidatePath } from 'next/cache'
import {
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireManagePermission,
  verifyNestedOwnership,
} from './helpers'
import { songSectionSchema, importSectionsSchema } from '@/lib/validations/song'
import type { SongSectionInput, ImportSectionsInput } from '@/lib/validations/song'
import { syncMasterArrangement } from './song-arrangements'

export async function getSongSections(songId: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Verify song belongs to church
  const { data: song, error: songError } = await adminClient
    .from('songs')
    .select('id')
    .eq('id', songId)
    .eq('church_id', profile.church_id)
    .single()

  if (songError || !song) {
    return { error: 'Song not found' }
  }

  // Get all sections for the song
  const { data: sections, error } = await adminClient
    .from('song_sections')
    .select('id, song_id, section_type, label, lyrics, section_number, sort_order, created_at, updated_at')
    .eq('song_id', songId)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching sections:', error)
    return { error: 'Failed to load sections' }
  }

  return { data: sections }
}

export async function createSongSection(songId: string, data: SongSectionInput) {
  const validated = songSectionSchema.safeParse(data)
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || 'Invalid data' }
  }

  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'create song sections')
  if (permError) return { error: permError }

  // Verify song belongs to church
  const { data: song, error: songError } = await adminClient
    .from('songs')
    .select('id')
    .eq('id', songId)
    .eq('church_id', profile.church_id)
    .single()

  if (songError || !song) {
    return { error: 'Song not found' }
  }

  // Get the next sort order
  const { data: lastSection } = await adminClient
    .from('song_sections')
    .select('sort_order')
    .eq('song_id', songId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const nextSortOrder = (lastSection?.sort_order ?? -1) + 1

  // Create the section
  const { data: section, error } = await adminClient
    .from('song_sections')
    .insert({
      song_id: songId,
      section_type: validated.data.sectionType,
      section_number: validated.data.sectionNumber,
      label: validated.data.label || null,
      lyrics: validated.data.lyrics,
      sort_order: nextSortOrder,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating section:', error)
    return { error: 'Failed to create section' }
  }

  // Sync master arrangement to include new section
  await syncMasterArrangement(songId)

  revalidatePath('/dashboard/songs')
  return { data: section }
}

export async function updateSongSection(sectionId: string, data: SongSectionInput) {
  const validated = songSectionSchema.safeParse(data)
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || 'Invalid data' }
  }

  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'update song sections')
  if (permError) return { error: permError }

  // Verify section belongs to a song in this church
  const { data: section, error: sectionError } = await adminClient
    .from('song_sections')
    .select('song_id, songs!inner(church_id)')
    .eq('id', sectionId)
    .single()

  if (sectionError || !section) {
    return { error: 'Section not found' }
  }

  const ownershipError = verifyNestedOwnership(section.songs, profile.church_id, 'Section not found')
  if (ownershipError) return { error: ownershipError }

  // Update the section
  const { error } = await adminClient
    .from('song_sections')
    .update({
      section_type: validated.data.sectionType,
      section_number: validated.data.sectionNumber,
      label: validated.data.label || null,
      lyrics: validated.data.lyrics,
    })
    .eq('id', sectionId)

  if (error) {
    console.error('Error updating section:', error)
    return { error: 'Failed to update section' }
  }

  revalidatePath('/dashboard/songs')
  return { success: true }
}

export async function deleteSongSection(sectionId: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'delete song sections')
  if (permError) return { error: permError }

  // Verify section belongs to a song in this church
  const { data: section, error: sectionError } = await adminClient
    .from('song_sections')
    .select('song_id, songs!inner(church_id)')
    .eq('id', sectionId)
    .single()

  if (sectionError || !section) {
    return { error: 'Section not found' }
  }

  const ownershipError = verifyNestedOwnership(section.songs, profile.church_id, 'Section not found')
  if (ownershipError) return { error: ownershipError }

  const songId = section.song_id

  // Delete the section
  const { error } = await adminClient
    .from('song_sections')
    .delete()
    .eq('id', sectionId)

  if (error) {
    console.error('Error deleting section:', error)
    return { error: 'Failed to delete section' }
  }

  // Sync master arrangement to remove deleted section
  await syncMasterArrangement(songId)

  revalidatePath('/dashboard/songs')
  return { success: true }
}

export async function reorderSongSections(songId: string, sectionIds: string[]) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'reorder song sections')
  if (permError) return { error: permError }

  // Verify song belongs to church
  const { data: song, error: songError } = await adminClient
    .from('songs')
    .select('id')
    .eq('id', songId)
    .eq('church_id', profile.church_id)
    .single()

  if (songError || !song) {
    return { error: 'Song not found' }
  }

  // Update sort_order for each section
  const updates = sectionIds.map((sectionId, index) =>
    adminClient
      .from('song_sections')
      .update({ sort_order: index })
      .eq('id', sectionId)
      .eq('song_id', songId)
  )

  const results = await Promise.all(updates)
  const hasError = results.some((r) => r.error)

  if (hasError) {
    console.error('Error reordering sections')
    return { error: 'Failed to reorder sections' }
  }

  // Sync master arrangement to reflect new order
  await syncMasterArrangement(songId)

  revalidatePath('/dashboard/songs')
  return { success: true }
}

export async function importSongSections(songId: string, sections: ImportSectionsInput) {
  const validated = importSectionsSchema.safeParse(sections)
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || 'Invalid data' }
  }

  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'import song sections')
  if (permError) return { error: permError }

  // Verify song belongs to church
  const { data: song, error: songError } = await adminClient
    .from('songs')
    .select('id')
    .eq('id', songId)
    .eq('church_id', profile.church_id)
    .single()

  if (songError || !song) {
    return { error: 'Song not found' }
  }

  // Get current max sort_order
  const { data: lastSection } = await adminClient
    .from('song_sections')
    .select('sort_order')
    .eq('song_id', songId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const startSortOrder = (lastSection?.sort_order ?? -1) + 1

  // Create all sections at once
  const sectionsToInsert = validated.data.map((section, index) => ({
    song_id: songId,
    section_type: section.sectionType,
    section_number: section.sectionNumber,
    label: section.label || null,
    lyrics: section.lyrics,
    sort_order: startSortOrder + index,
  }))

  const { data: createdSections, error } = await adminClient
    .from('song_sections')
    .insert(sectionsToInsert)
    .select()

  if (error) {
    console.error('Error importing sections:', error)
    return { error: 'Failed to import sections' }
  }

  // Sync master arrangement to include all new sections
  await syncMasterArrangement(songId)

  revalidatePath('/dashboard/songs')
  return { data: createdSections }
}
