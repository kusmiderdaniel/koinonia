'use server'

import {
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireAdminPermission,
} from '@/lib/utils/server-auth'
import { ROLE_HIERARCHY, type UserRole } from '@/lib/permissions'
import { ASSIGNABLE_ROLES, type AssignableChurchRole } from '@/lib/types/entities'

export async function updateMemberRole(memberId: string, newRole: AssignableChurchRole) {
  // Validate that newRole is assignable (not owner)
  if (!ASSIGNABLE_ROLES.includes(newRole)) {
    return { error: 'Invalid role. Owner role can only be transferred from Settings.' }
  }

  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Only owners and admins can change roles
  const permError = requireAdminPermission(profile.role, 'change member roles')
  if (permError) return { error: permError }

  // Get target member's profile
  const { data: targetProfile } = await adminClient
    .from('profiles')
    .select('role, church_id')
    .eq('id', memberId)
    .single()

  if (!targetProfile) {
    return { error: 'Member not found' }
  }

  // Verify same church
  if (profile.church_id !== targetProfile.church_id) {
    return { error: 'Cannot modify members from other churches' }
  }

  // Prevent self-modification
  if (memberId === profile.id) {
    return { error: 'You cannot change your own role' }
  }

  // Cannot modify owner role from here
  if (targetProfile.role === 'owner') {
    return { error: 'Owner role can only be transferred from Church Settings' }
  }

  const currentUserRoleLevel = ROLE_HIERARCHY[profile.role as UserRole]
  const targetRoleLevel = ROLE_HIERARCHY[targetProfile.role as UserRole]

  // Check if current user has higher role than target
  if (currentUserRoleLevel <= targetRoleLevel) {
    return { error: 'You can only modify roles of members with lower access level' }
  }

  // Update role
  const { error: updateError } = await adminClient
    .from('profiles')
    .update({ role: newRole })
    .eq('id', memberId)

  if (updateError) {
    console.error('Update error:', updateError)
    return { error: 'Failed to update role' }
  }

  // No revalidatePath - optimistic updates handle UI instantly
  return { success: true }
}
