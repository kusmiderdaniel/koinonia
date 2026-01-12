'use server'

import { revalidatePath } from 'next/cache'
import {
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireAdminPermission,
  campusSchema,
  type CampusInput,
} from './helpers'

export interface Campus {
  id: string
  church_id: string
  name: string
  description: string | null
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  country: string | null
  color: string
  is_default: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function getCampuses() {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Get active campuses for this church
  const { data: campuses, error } = await adminClient
    .from('campuses')
    .select('id, church_id, name, description, address, city, state, zip_code, country, color, is_default, is_active, created_at, updated_at')
    .eq('church_id', profile.church_id)
    .eq('is_active', true)
    .order('is_default', { ascending: false })
    .order('name')

  if (error) {
    console.error('Error fetching campuses:', error)
    return { error: 'Failed to fetch campuses' }
  }

  return { data: campuses as Campus[] || [] }
}

export async function createCampus(data: CampusInput) {
  // Validate input
  const validated = campusSchema.safeParse(data)
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || 'Invalid data' }
  }

  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireAdminPermission(profile.role, 'create campuses')
  if (permError) return { error: permError }

  // Create campus
  const { data: campus, error } = await adminClient
    .from('campuses')
    .insert({
      church_id: profile.church_id,
      name: validated.data.name,
      description: validated.data.description || null,
      address: validated.data.address || null,
      city: validated.data.city || null,
      state: validated.data.state || null,
      zip_code: validated.data.zipCode || null,
      country: validated.data.country || null,
      color: validated.data.color || '#3B82F6',
      is_default: validated.data.isDefault || false,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating campus:', error)
    if (error.code === '23505') {
      return { error: 'A campus with this name already exists' }
    }
    return { error: 'Failed to create campus' }
  }

  revalidatePath('/dashboard/settings')

  return { data: campus }
}

export async function updateCampus(id: string, data: CampusInput) {
  // Validate input
  const validated = campusSchema.safeParse(data)
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || 'Invalid data' }
  }

  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireAdminPermission(profile.role, 'update campuses')
  if (permError) return { error: permError }

  // Update campus
  const { error } = await adminClient
    .from('campuses')
    .update({
      name: validated.data.name,
      description: validated.data.description || null,
      address: validated.data.address || null,
      city: validated.data.city || null,
      state: validated.data.state || null,
      zip_code: validated.data.zipCode || null,
      country: validated.data.country || null,
      color: validated.data.color || '#3B82F6',
      is_default: validated.data.isDefault || false,
    })
    .eq('id', id)
    .eq('church_id', profile.church_id)

  if (error) {
    console.error('Error updating campus:', error)
    if (error.code === '23505') {
      return { error: 'A campus with this name already exists' }
    }
    return { error: 'Failed to update campus' }
  }

  revalidatePath('/dashboard/settings')

  return { success: true }
}

export async function deleteCampus(id: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireAdminPermission(profile.role, 'delete campuses')
  if (permError) return { error: permError }

  // Check if this is the only campus
  const { data: campuses } = await adminClient
    .from('campuses')
    .select('id')
    .eq('church_id', profile.church_id)
    .eq('is_active', true)

  if (campuses && campuses.length <= 1) {
    return { error: 'Cannot delete the last campus. Every church must have at least one campus.' }
  }

  // Check if this is the default campus
  const { data: campus } = await adminClient
    .from('campuses')
    .select('is_default')
    .eq('id', id)
    .single()

  if (campus?.is_default) {
    return { error: 'Cannot delete the default campus. Please set another campus as default first.' }
  }

  // Soft delete by setting is_active = false
  const { error } = await adminClient
    .from('campuses')
    .update({ is_active: false })
    .eq('id', id)
    .eq('church_id', profile.church_id)

  if (error) {
    console.error('Error deleting campus:', error)
    return { error: 'Failed to delete campus' }
  }

  revalidatePath('/dashboard/settings')

  return { success: true }
}

export async function setDefaultCampus(id: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireAdminPermission(profile.role, 'update campuses')
  if (permError) return { error: permError }

  // The trigger will handle unsetting other defaults
  const { error } = await adminClient
    .from('campuses')
    .update({ is_default: true })
    .eq('id', id)
    .eq('church_id', profile.church_id)

  if (error) {
    console.error('Error setting default campus:', error)
    return { error: 'Failed to set default campus' }
  }

  revalidatePath('/dashboard/settings')

  return { success: true }
}
