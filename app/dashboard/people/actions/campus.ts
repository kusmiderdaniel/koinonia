'use server'

import {
  getAuthenticatedUserWithProfile,
  isAuthError,
} from '@/lib/utils/server-auth'
import { ROLE_HIERARCHY, isLeaderOrAbove, type UserRole } from '@/lib/permissions'

export async function updateMemberCampuses(
  memberId: string,
  campusIds: string[]
) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Only leaders or higher can update campus assignments
  if (!isLeaderOrAbove(profile.role)) {
    return { error: 'Only leaders or higher can update campus assignments' }
  }

  // Get target member's profile
  const { data: targetProfile } = await adminClient
    .from('profiles')
    .select('church_id, role')
    .eq('id', memberId)
    .single()

  if (!targetProfile) {
    return { error: 'Member not found' }
  }

  // Verify same church
  if (profile.church_id !== targetProfile.church_id) {
    return { error: 'Cannot modify members from other churches' }
  }

  // Check role hierarchy - can only modify users with lower role (or same for leaders)
  const currentUserRoleLevel = ROLE_HIERARCHY[profile.role as UserRole]
  const targetRoleLevel = ROLE_HIERARCHY[targetProfile.role as UserRole]

  // Cannot modify owner's campuses unless you're the owner
  if (targetProfile.role === 'owner' && profile.role !== 'owner') {
    return { error: 'Cannot modify owner campus assignments' }
  }

  // Only allow modifying users with lower or equal role (for leaders)
  if (currentUserRoleLevel < targetRoleLevel) {
    return { error: 'You can only modify campus assignments of members with lower or equal access level' }
  }

  // Verify all campuses belong to the same church
  if (campusIds.length > 0) {
    const { data: campuses, error: campusError } = await adminClient
      .from('campuses')
      .select('id')
      .eq('church_id', profile.church_id)
      .in('id', campusIds)

    if (campusError || !campuses || campuses.length !== campusIds.length) {
      return { error: 'One or more campuses are invalid' }
    }
  }

  // Delete existing campus assignments
  const { error: deleteError } = await adminClient
    .from('profile_campuses')
    .delete()
    .eq('profile_id', memberId)

  if (deleteError) {
    console.error('Delete error:', deleteError)
    return { error: 'Failed to update campus assignments' }
  }

  // Insert new campus assignments
  if (campusIds.length > 0) {
    const assignments = campusIds.map((campusId, index) => ({
      profile_id: memberId,
      campus_id: campusId,
      is_primary: index === 0, // First campus is primary
    }))

    const { error: insertError } = await adminClient
      .from('profile_campuses')
      .insert(assignments)

    if (insertError) {
      console.error('Insert error:', insertError)
      return { error: 'Failed to update campus assignments' }
    }
  }

  // No revalidatePath - optimistic updates handle UI instantly
  return { success: true }
}
