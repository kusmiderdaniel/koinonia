'use server'

import {
  getAuthenticatedUserWithProfile,
  isAuthError,
} from '@/lib/utils/server-auth'
import { isLeaderOrAbove } from '@/lib/permissions'

export async function updateMemberProfile(
  memberId: string,
  data: {
    sex?: string | null
    dateOfBirth?: string | null
    phone?: string | null
    email?: string | null
  }
) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Only leaders or higher can update member profiles
  if (!isLeaderOrAbove(profile.role)) {
    return { error: 'Only leaders or higher can update member profiles' }
  }

  // Get target member's profile
  const { data: targetProfile } = await adminClient
    .from('profiles')
    .select('church_id, member_type, role')
    .eq('id', memberId)
    .single()

  if (!targetProfile) {
    return { error: 'Member not found' }
  }

  // Verify same church
  if (profile.church_id !== targetProfile.church_id) {
    return { error: 'Cannot modify members from other churches' }
  }

  // Only allow editing offline members' profiles
  if (targetProfile.member_type !== 'offline') {
    return { error: 'Can only edit profile details of offline members' }
  }

  // Build update data
  const updateData: { sex?: string | null; date_of_birth?: string | null; phone?: string | null; email?: string | null } = {}

  if (data.sex !== undefined) {
    updateData.sex = data.sex
  }
  if (data.dateOfBirth !== undefined) {
    updateData.date_of_birth = data.dateOfBirth
  }
  if (data.phone !== undefined) {
    updateData.phone = data.phone
  }
  if (data.email !== undefined) {
    updateData.email = data.email
  }

  const { error: updateError } = await adminClient
    .from('profiles')
    .update(updateData)
    .eq('id', memberId)

  if (updateError) {
    console.error('Update error:', updateError)
    return { error: 'Failed to update member profile' }
  }

  // No revalidatePath - optimistic updates handle UI instantly
  return { success: true }
}
