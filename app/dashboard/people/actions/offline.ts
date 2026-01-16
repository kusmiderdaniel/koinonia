'use server'

import { revalidatePath } from 'next/cache'
import {
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireAdminPermission,
  requireManagePermission,
} from '@/lib/utils/server-auth'

export async function createOfflineMember(data: {
  firstName: string
  lastName: string
  dateOfBirth?: string | null
  sex?: string | null
  email?: string | null
  phone?: string | null
}) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Leaders and above can create offline members
  const permError = requireManagePermission(profile.role, 'create offline members')
  if (permError) return { error: permError }

  // Validate required fields
  if (!data.firstName || !data.lastName) {
    return { error: 'First name and last name are required' }
  }

  // Create offline member profile
  const profileId = crypto.randomUUID()
  const { error: createError } = await adminClient
    .from('profiles')
    .insert({
      id: profileId,
      user_id: null, // No user account
      church_id: profile.church_id,
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email || null,
      phone: data.phone || null,
      date_of_birth: data.dateOfBirth || null,
      sex: data.sex || null,
      role: 'member', // Offline members are always regular members
      member_type: 'offline',
    })

  if (createError) {
    console.error('Error creating offline member:', createError)
    return { error: 'Failed to create member' }
  }

  // Assign default campus if one exists
  const { data: defaultCampus } = await adminClient
    .from('campuses')
    .select('id')
    .eq('church_id', profile.church_id)
    .eq('is_default', true)
    .single()

  if (defaultCampus) {
    await adminClient
      .from('profile_campuses')
      .insert({
        profile_id: profileId,
        campus_id: defaultCampus.id,
        is_primary: true,
      })
  }

  revalidatePath('/dashboard/people')

  return { success: true, profileId }
}

export async function deleteOfflineMember(memberId: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Only admins and owners can delete offline members
  const permError = requireAdminPermission(profile.role, 'delete offline members')
  if (permError) return { error: permError }

  // Get target member's profile
  const { data: targetProfile } = await adminClient
    .from('profiles')
    .select('church_id, member_type')
    .eq('id', memberId)
    .single()

  if (!targetProfile) {
    return { error: 'Member not found' }
  }

  // Verify same church
  if (profile.church_id !== targetProfile.church_id) {
    return { error: 'Cannot delete members from other churches' }
  }

  // Only allow deleting offline members
  if (targetProfile.member_type !== 'offline') {
    return { error: 'Can only delete offline members' }
  }

  // Delete the member (cascade will handle related records)
  const { error: deleteError } = await adminClient
    .from('profiles')
    .delete()
    .eq('id', memberId)

  if (deleteError) {
    console.error('Delete error:', deleteError)
    return { error: 'Failed to delete member' }
  }

  revalidatePath('/dashboard/people')

  return { success: true }
}
