'use server'

import { revalidatePath } from 'next/cache'
import {
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireAdminPermission,
} from '@/lib/utils/server-auth'

export async function getPendingRegistrations() {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Only admins can view pending registrations
  const permError = requireAdminPermission(profile.role, 'view pending registrations')
  if (permError) return { error: permError }

  const { data, error } = await adminClient
    .from('pending_registrations')
    .select('*')
    .eq('church_id', profile.church_id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching pending registrations:', error)
    return { error: 'Failed to fetch pending registrations' }
  }

  return { data }
}

export async function approveRegistration(registrationId: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Only admins can approve registrations
  const permError = requireAdminPermission(profile.role, 'approve registrations')
  if (permError) return { error: permError }

  // Get the pending registration
  const { data: registration, error: fetchError } = await adminClient
    .from('pending_registrations')
    .select('*')
    .eq('id', registrationId)
    .eq('church_id', profile.church_id)
    .single()

  if (fetchError || !registration) {
    return { error: 'Registration not found' }
  }

  if (registration.status !== 'pending') {
    return { error: 'Registration has already been processed' }
  }

  // Create profile for the user
  const profileId = crypto.randomUUID()
  const { error: profileError } = await adminClient
    .from('profiles')
    .insert({
      id: profileId,
      user_id: registration.user_id,
      church_id: registration.church_id,
      first_name: registration.first_name,
      last_name: registration.last_name,
      email: registration.email,
      role: 'member',
      member_type: 'authenticated',
    })

  if (profileError) {
    console.error('Error creating profile:', profileError)
    return { error: 'Failed to create member profile' }
  }

  // Update registration status
  const { error: updateError } = await adminClient
    .from('pending_registrations')
    .update({
      status: 'approved',
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', registrationId)

  if (updateError) {
    console.error('Error updating registration:', updateError)
    // Rollback profile creation
    await adminClient.from('profiles').delete().eq('id', profileId)
    return { error: 'Failed to update registration status' }
  }

  revalidatePath('/dashboard/people/pending')
  revalidatePath('/dashboard/people')

  return { success: true }
}

export async function rejectRegistration(registrationId: string, reason?: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Only admins can reject registrations
  const permError = requireAdminPermission(profile.role, 'reject registrations')
  if (permError) return { error: permError }

  // Get the pending registration
  const { data: registration, error: fetchError } = await adminClient
    .from('pending_registrations')
    .select('*')
    .eq('id', registrationId)
    .eq('church_id', profile.church_id)
    .single()

  if (fetchError || !registration) {
    return { error: 'Registration not found' }
  }

  if (registration.status !== 'pending') {
    return { error: 'Registration has already been processed' }
  }

  // Update registration status to rejected
  const { error: updateError } = await adminClient
    .from('pending_registrations')
    .update({
      status: 'rejected',
      rejection_reason: reason || null,
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', registrationId)

  if (updateError) {
    console.error('Error rejecting registration:', updateError)
    return { error: 'Failed to reject registration' }
  }

  revalidatePath('/dashboard/people/pending')

  return { success: true }
}

export async function linkRegistrationToProfile(registrationId: string, profileId: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile: currentProfile, adminClient } = auth

  // Only admins can link registrations
  const permError = requireAdminPermission(currentProfile.role, 'link registrations')
  if (permError) return { error: permError }

  // Get the pending registration
  const { data: registration, error: fetchError } = await adminClient
    .from('pending_registrations')
    .select('*')
    .eq('id', registrationId)
    .eq('church_id', currentProfile.church_id)
    .single()

  if (fetchError || !registration) {
    return { error: 'Registration not found' }
  }

  if (registration.status !== 'pending') {
    return { error: 'Registration has already been processed' }
  }

  // Get the target profile (must be offline member in same church)
  const { data: targetProfile, error: profileFetchError } = await adminClient
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .eq('church_id', currentProfile.church_id)
    .single()

  if (profileFetchError || !targetProfile) {
    return { error: 'Target profile not found' }
  }

  if (targetProfile.member_type !== 'offline') {
    return { error: 'Can only link to offline members' }
  }

  if (targetProfile.user_id) {
    return { error: 'This member already has an account linked' }
  }

  // Update the profile to link it to the user
  const { error: linkError } = await adminClient
    .from('profiles')
    .update({
      user_id: registration.user_id,
      member_type: 'authenticated',
      email: registration.email,
    })
    .eq('id', profileId)

  if (linkError) {
    console.error('Error linking profile:', linkError)
    return { error: 'Failed to link profile to user' }
  }

  // Update registration status
  const { error: updateError } = await adminClient
    .from('pending_registrations')
    .update({
      status: 'linked',
      linked_profile_id: profileId,
      reviewed_by: currentProfile.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', registrationId)

  if (updateError) {
    console.error('Error updating registration:', updateError)
    return { error: 'Failed to update registration status' }
  }

  revalidatePath('/dashboard/people/pending')
  revalidatePath('/dashboard/people')

  return { success: true }
}

export async function getOfflineMembers() {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Only admins can view offline members for linking
  const permError = requireAdminPermission(profile.role, 'view members')
  if (permError) return { error: permError }

  const { data, error } = await adminClient
    .from('profiles')
    .select('id, first_name, last_name, email, date_of_birth')
    .eq('church_id', profile.church_id)
    .eq('member_type', 'offline')
    .is('user_id', null)
    .order('first_name', { ascending: true })

  if (error) {
    console.error('Error fetching offline members:', error)
    return { error: 'Failed to fetch offline members' }
  }

  return { data }
}
