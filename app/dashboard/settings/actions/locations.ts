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

  // Get active locations for this church
  const { data: locations, error } = await adminClient
    .from('locations')
    .select('*')
    .eq('church_id', profile.church_id)
    .eq('is_active', true)
    .order('name')

  if (error) {
    console.error('Error fetching locations:', error)
    return { error: 'Failed to fetch locations' }
  }

  return { data: locations || [] }
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

  // Update location
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
