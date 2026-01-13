'use server'

import { revalidatePath } from 'next/cache'
import {
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireManagePermission,
  locationSchema,
  type LocationInput,
} from './helpers'

export async function getLocations() {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Get active locations for this church with campus info via junction table
  const { data: locations, error } = await adminClient
    .from('locations')
    .select(`
      id,
      name,
      address,
      notes,
      location_campuses (
        campus:campuses (
          id,
          name,
          color
        )
      )
    `)
    .eq('church_id', profile.church_id)
    .eq('is_active', true)
    .order('name')

  if (error) {
    console.error('Error fetching locations:', error)
    return { error: 'Failed to fetch locations' }
  }

  // Transform to flatten campuses array
  // Type assertion needed because Supabase types may not be regenerated yet
  const transformedLocations = (locations || []).map((loc) => {
    const locationCampuses = loc.location_campuses as unknown as Array<{ campus: { id: string; name: string; color: string } | null }> | null
    return {
      id: loc.id,
      name: loc.name,
      address: loc.address,
      notes: loc.notes,
      campuses: locationCampuses
        ?.map((lc) => lc.campus)
        .filter((c): c is { id: string; name: string; color: string } => c !== null) || [],
    }
  })

  return { data: transformedLocations }
}

export async function createLocation(data: LocationInput) {
  // Validate input
  const validated = locationSchema.safeParse(data)
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || 'Invalid data' }
  }

  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'create locations')
  if (permError) return { error: permError }

  // Create location
  const { data: location, error } = await adminClient
    .from('locations')
    .insert({
      church_id: profile.church_id,
      name: validated.data.name,
      address: validated.data.address || null,
      notes: validated.data.notes || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating location:', error)
    return { error: 'Failed to create location' }
  }

  // Add campus associations if provided
  const campusIds = validated.data.campusIds || []
  if (campusIds.length > 0) {
    const { error: campusError } = await adminClient
      .from('location_campuses')
      .insert(
        campusIds.map((campusId) => ({
          location_id: location.id,
          campus_id: campusId,
        }))
      )

    if (campusError) {
      console.error('Error adding campus associations:', campusError)
      // Location was created, but campus associations failed - don't fail the whole operation
    }
  }

  revalidatePath('/dashboard/settings')

  return { data: location }
}

export async function updateLocation(id: string, data: LocationInput) {
  // Validate input
  const validated = locationSchema.safeParse(data)
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || 'Invalid data' }
  }

  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'update locations')
  if (permError) return { error: permError }

  // Update location basic info
  const { error } = await adminClient
    .from('locations')
    .update({
      name: validated.data.name,
      address: validated.data.address || null,
      notes: validated.data.notes || null,
    })
    .eq('id', id)
    .eq('church_id', profile.church_id)

  if (error) {
    console.error('Error updating location:', error)
    return { error: 'Failed to update location' }
  }

  // Update campus associations if provided
  if (validated.data.campusIds !== undefined) {
    // Delete existing campus associations
    const { error: deleteError } = await adminClient
      .from('location_campuses')
      .delete()
      .eq('location_id', id)

    if (deleteError) {
      console.error('Error removing old campus associations:', deleteError)
    }

    // Add new campus associations
    const campusIds = validated.data.campusIds || []
    if (campusIds.length > 0) {
      const { error: insertError } = await adminClient
        .from('location_campuses')
        .insert(
          campusIds.map((campusId) => ({
            location_id: id,
            campus_id: campusId,
          }))
        )

      if (insertError) {
        console.error('Error adding campus associations:', insertError)
      }
    }
  }

  revalidatePath('/dashboard/settings')

  return { success: true }
}

export async function deleteLocation(id: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'delete locations')
  if (permError) return { error: permError }

  // Soft delete by setting is_active = false
  // Junction table entries will remain but location won't be shown
  const { error } = await adminClient
    .from('locations')
    .update({ is_active: false })
    .eq('id', id)
    .eq('church_id', profile.church_id)

  if (error) {
    console.error('Error deleting location:', error)
    return { error: 'Failed to delete location' }
  }

  revalidatePath('/dashboard/settings')

  return { success: true }
}
