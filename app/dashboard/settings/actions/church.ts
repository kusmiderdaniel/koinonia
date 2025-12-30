'use server'

import { revalidatePath } from 'next/cache'
import {
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireRole,
  updateChurchSchema,
  type UpdateChurchInput,
} from './helpers'

export async function getChurchSettings() {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Get church details
  const { data: church, error: churchError } = await adminClient
    .from('churches')
    .select('*')
    .eq('id', profile.church_id)
    .single()

  if (churchError || !church) {
    return { error: 'Church not found' }
  }

  return {
    data: {
      ...church,
      role: profile.role,
    },
  }
}

export async function updateChurchSettings(data: UpdateChurchInput) {
  // Validate input
  const validated = updateChurchSchema.safeParse(data)
  if (!validated.success) {
    return { error: 'Invalid data provided' }
  }

  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Only admins can update church settings
  if (profile.role !== 'admin' && profile.role !== 'owner') {
    return { error: 'Only administrators can update church settings' }
  }

  // Update church
  const { error: updateError } = await adminClient
    .from('churches')
    .update({
      name: validated.data.name,
      address: validated.data.address || null,
      city: validated.data.city || null,
      country: validated.data.country || null,
      zip_code: validated.data.zipCode || null,
      phone: validated.data.phone || null,
      email: validated.data.email || null,
      website: validated.data.website || null,
    })
    .eq('id', profile.church_id)

  if (updateError) {
    console.error('Update error:', updateError)
    return { error: 'Failed to update church settings' }
  }

  // Revalidate dashboard to show updated church name
  revalidatePath('/dashboard')

  return { success: true }
}

export async function getChurchMembers() {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Get all members (excluding self)
  const { data: members } = await adminClient
    .from('profiles')
    .select('id, first_name, last_name, email, role')
    .eq('church_id', profile.church_id)
    .neq('id', profile.id)
    .order('first_name')

  return { data: members || [] }
}

export async function transferOwnership(newOwnerId: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Only owner can transfer ownership
  const permError = requireRole(profile.role, ['owner'], 'transfer ownership')
  if (permError) return { error: permError }

  // Get new owner's profile
  const { data: newOwnerProfile } = await adminClient
    .from('profiles')
    .select('church_id, role')
    .eq('id', newOwnerId)
    .single()

  if (!newOwnerProfile) {
    return { error: 'Selected member not found' }
  }

  // Verify same church
  if (profile.church_id !== newOwnerProfile.church_id) {
    return { error: 'Cannot transfer ownership to member from another church' }
  }

  // Cannot transfer to self
  if (newOwnerId === profile.id) {
    return { error: 'You are already the owner' }
  }

  // Transfer ownership: set new owner to 'owner', set old owner to 'admin'
  const { error: newOwnerError } = await adminClient
    .from('profiles')
    .update({ role: 'owner' })
    .eq('id', newOwnerId)

  if (newOwnerError) {
    console.error('Error setting new owner:', newOwnerError)
    return { error: 'Failed to transfer ownership' }
  }

  const { error: oldOwnerError } = await adminClient
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', profile.id)

  if (oldOwnerError) {
    // Rollback: revert new owner back
    await adminClient.from('profiles').update({ role: newOwnerProfile.role }).eq('id', newOwnerId)
    console.error('Error demoting old owner:', oldOwnerError)
    return { error: 'Failed to transfer ownership' }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard/people')

  return { success: true }
}

export async function regenerateJoinCode() {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Only admins can regenerate join code
  const permError = requireRole(profile.role, ['owner', 'admin'], 'regenerate join code')
  if (permError) return { error: permError }

  // Generate a new unique join code using the database function
  const { data: newCode, error: codeError } = await adminClient
    .rpc('generate_unique_join_code')

  if (codeError || !newCode) {
    console.error('Error generating join code:', codeError)
    return { error: 'Failed to generate new join code' }
  }

  // Update the church with the new join code
  const { error: updateError } = await adminClient
    .from('churches')
    .update({ join_code: newCode })
    .eq('id', profile.church_id)

  if (updateError) {
    console.error('Error updating join code:', updateError)
    return { error: 'Failed to update join code' }
  }

  revalidatePath('/dashboard/settings')

  return { success: true, joinCode: newCode }
}
