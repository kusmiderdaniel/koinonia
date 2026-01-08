'use server'

import { revalidatePath } from 'next/cache'
import {
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireManagePermission,
  verifyNestedOwnership,
} from './helpers'
import { songArrangementSchema } from '@/lib/validations/song'
import type { SongArrangementInput } from '@/lib/validations/song'

export async function getSongArrangements(songId: string) {
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

  // Get all arrangements for the song with their sections
  const { data: arrangements, error } = await adminClient
    .from('song_arrangements')
    .select(`
      *,
      song_arrangement_sections (
        id,
        section_id,
        sort_order,
        section:song_sections (
          id,
          section_type,
          section_number,
          label,
          lyrics,
          sort_order
        )
      )
    `)
    .eq('song_id', songId)
    .order('is_default', { ascending: false })
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching arrangements:', error)
    return { error: 'Failed to load arrangements' }
  }

  // Transform to sort arrangement sections by sort_order
  const transformedArrangements = arrangements?.map((arr) => ({
    ...arr,
    sections: arr.song_arrangement_sections
      ?.sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
      .map((sas: { id: string; section_id: string; sort_order: number; section: unknown }) => ({
        id: sas.id,
        arrangement_id: arr.id,
        section_id: sas.section_id,
        sort_order: sas.sort_order,
        section: sas.section,
      })) || [],
  }))

  return { data: transformedArrangements }
}

/**
 * Syncs the Master arrangement to include all sections in order.
 * Creates the Master arrangement if it doesn't exist.
 * Called automatically when sections are added, removed, or reordered.
 */
export async function syncMasterArrangement(songId: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Get all sections for the song
  const { data: sections, error: sectionsError } = await adminClient
    .from('song_sections')
    .select('id')
    .eq('song_id', songId)
    .order('sort_order', { ascending: true })

  if (sectionsError) {
    console.error('Error fetching sections for sync:', sectionsError)
    return { error: 'Failed to sync master arrangement' }
  }

  // If no sections, delete the master arrangement if it exists
  if (!sections || sections.length === 0) {
    await adminClient
      .from('song_arrangements')
      .delete()
      .eq('song_id', songId)
      .eq('is_default', true)

    return { success: true }
  }

  // Check if master arrangement exists
  const { data: masterArrangement, error: masterError } = await adminClient
    .from('song_arrangements')
    .select('id')
    .eq('song_id', songId)
    .eq('is_default', true)
    .single()

  let masterId: string

  if (masterError || !masterArrangement) {
    // Create master arrangement
    const { data: newMaster, error: createError } = await adminClient
      .from('song_arrangements')
      .insert({
        song_id: songId,
        name: 'Master',
        is_default: true,
        created_by: profile.id,
      })
      .select('id')
      .single()

    if (createError || !newMaster) {
      console.error('Error creating master arrangement:', createError)
      return { error: 'Failed to create master arrangement' }
    }

    masterId = newMaster.id
  } else {
    masterId = masterArrangement.id

    // Delete existing arrangement sections for master
    await adminClient
      .from('song_arrangement_sections')
      .delete()
      .eq('arrangement_id', masterId)
  }

  // Insert all sections in order
  const arrangementSections = sections.map((section, index) => ({
    arrangement_id: masterId,
    section_id: section.id,
    sort_order: index,
  }))

  const { error: insertError } = await adminClient
    .from('song_arrangement_sections')
    .insert(arrangementSections)

  if (insertError) {
    console.error('Error inserting arrangement sections:', insertError)
    return { error: 'Failed to sync master arrangement sections' }
  }

  return { success: true }
}

export async function createSongArrangement(songId: string, data: SongArrangementInput) {
  const validated = songArrangementSchema.safeParse(data)
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || 'Invalid data' }
  }

  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'create song arrangements')
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

  // Check for duplicate name
  const { data: existing } = await adminClient
    .from('song_arrangements')
    .select('id')
    .eq('song_id', songId)
    .eq('name', validated.data.name)
    .single()

  if (existing) {
    return { error: 'An arrangement with this name already exists' }
  }

  // Create the arrangement
  const { data: arrangement, error } = await adminClient
    .from('song_arrangements')
    .insert({
      song_id: songId,
      name: validated.data.name,
      is_default: false,
      duration_seconds: validated.data.durationSeconds || null,
      created_by: profile.id,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating arrangement:', error)
    return { error: 'Failed to create arrangement' }
  }

  // Insert arrangement sections
  const arrangementSections = validated.data.sectionIds.map((sectionId, index) => ({
    arrangement_id: arrangement.id,
    section_id: sectionId,
    sort_order: index,
  }))

  const { error: sectionsError } = await adminClient
    .from('song_arrangement_sections')
    .insert(arrangementSections)

  if (sectionsError) {
    console.error('Error creating arrangement sections:', sectionsError)
    // Rollback arrangement creation
    await adminClient.from('song_arrangements').delete().eq('id', arrangement.id)
    return { error: 'Failed to create arrangement sections' }
  }

  revalidatePath('/dashboard/songs')
  return { data: arrangement }
}

export async function updateSongArrangement(arrangementId: string, data: SongArrangementInput) {
  const validated = songArrangementSchema.safeParse(data)
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || 'Invalid data' }
  }

  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'update song arrangements')
  if (permError) return { error: permError }

  // Verify arrangement belongs to a song in this church
  const { data: arrangement, error: arrangementError } = await adminClient
    .from('song_arrangements')
    .select('id, song_id, is_default, name, songs!inner(church_id)')
    .eq('id', arrangementId)
    .single()

  if (arrangementError || !arrangement) {
    return { error: 'Arrangement not found' }
  }

  const ownershipError = verifyNestedOwnership(arrangement.songs, profile.church_id, 'Arrangement not found')
  if (ownershipError) return { error: ownershipError }

  // Can't rename Master arrangement
  if (arrangement.is_default && validated.data.name !== 'Master') {
    return { error: 'Cannot rename the Master arrangement' }
  }

  // Check for duplicate name (excluding current arrangement)
  if (!arrangement.is_default && validated.data.name !== arrangement.name) {
    const { data: existing } = await adminClient
      .from('song_arrangements')
      .select('id')
      .eq('song_id', arrangement.song_id)
      .eq('name', validated.data.name)
      .neq('id', arrangementId)
      .single()

    if (existing) {
      return { error: 'An arrangement with this name already exists' }
    }
  }

  // Update the arrangement (name only for non-master, duration for all)
  const updateData: { name?: string; duration_seconds?: number | null } = {
    duration_seconds: validated.data.durationSeconds ?? null,
  }

  if (!arrangement.is_default) {
    updateData.name = validated.data.name
  }

  const { error: updateError } = await adminClient
    .from('song_arrangements')
    .update(updateData)
    .eq('id', arrangementId)

  if (updateError) {
    console.error('Error updating arrangement:', updateError)
    return { error: 'Failed to update arrangement' }
  }

  // Update arrangement sections
  // Delete existing sections
  await adminClient
    .from('song_arrangement_sections')
    .delete()
    .eq('arrangement_id', arrangementId)

  // Insert new sections
  const arrangementSections = validated.data.sectionIds.map((sectionId, index) => ({
    arrangement_id: arrangementId,
    section_id: sectionId,
    sort_order: index,
  }))

  const { error: sectionsError } = await adminClient
    .from('song_arrangement_sections')
    .insert(arrangementSections)

  if (sectionsError) {
    console.error('Error updating arrangement sections:', sectionsError)
    return { error: 'Failed to update arrangement sections' }
  }

  revalidatePath('/dashboard/songs')
  return { success: true }
}

export async function deleteSongArrangement(arrangementId: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'delete song arrangements')
  if (permError) return { error: permError }

  // Verify arrangement belongs to a song in this church
  const { data: arrangement, error: arrangementError } = await adminClient
    .from('song_arrangements')
    .select('id, is_default, songs!inner(church_id)')
    .eq('id', arrangementId)
    .single()

  if (arrangementError || !arrangement) {
    return { error: 'Arrangement not found' }
  }

  const ownershipError = verifyNestedOwnership(arrangement.songs, profile.church_id, 'Arrangement not found')
  if (ownershipError) return { error: ownershipError }

  // Can't delete Master arrangement
  if (arrangement.is_default) {
    return { error: 'Cannot delete the Master arrangement' }
  }

  // Delete the arrangement (cascades to arrangement_sections)
  const { error } = await adminClient
    .from('song_arrangements')
    .delete()
    .eq('id', arrangementId)

  if (error) {
    console.error('Error deleting arrangement:', error)
    return { error: 'Failed to delete arrangement' }
  }

  revalidatePath('/dashboard/songs')
  return { success: true }
}
