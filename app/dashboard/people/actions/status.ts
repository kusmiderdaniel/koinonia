'use server'

import {
  getAuthenticatedUserWithProfile,
  isAuthError,
} from '@/lib/utils/server-auth'
import { ROLE_HIERARCHY, isLeaderOrAbove, type UserRole } from '@/lib/permissions'

export async function updateMemberActive(memberId: string, active: boolean) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Only leaders or higher can change active status
  if (!isLeaderOrAbove(profile.role)) {
    return { error: 'Only leaders or higher can change member active status' }
  }

  // Prevent changing own active status
  if (memberId === profile.id) {
    return { error: 'You cannot change your own active status' }
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

  // Owner's active status cannot be changed
  if (targetProfile.role === 'owner') {
    return { error: 'Owner active status cannot be changed' }
  }

  // Check role hierarchy - can only modify users with lower role
  const currentUserRoleLevel = ROLE_HIERARCHY[profile.role as UserRole]
  const targetRoleLevel = ROLE_HIERARCHY[targetProfile.role as UserRole]
  if (currentUserRoleLevel <= targetRoleLevel) {
    return { error: 'You can only change active status of members with lower access level' }
  }

  // Update active status - if setting to inactive, also set role to member
  const updateData: { active: boolean; role?: string } = { active }
  if (!active) {
    updateData.role = 'member'
  }

  const { error: updateError } = await adminClient
    .from('profiles')
    .update(updateData)
    .eq('id', memberId)

  if (updateError) {
    console.error('Update error:', updateError)
    return { error: 'Failed to update active status' }
  }

  // No revalidatePath - optimistic updates handle UI instantly
  return { success: true }
}

export async function updateMemberDeparture(
  memberId: string,
  dateOfDeparture: string | null,
  reasonForDeparture: string | null
) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Only leaders or higher can update departure info
  if (!isLeaderOrAbove(profile.role)) {
    return { error: 'Only leaders or higher can update departure information' }
  }

  // Prevent editing own departure info
  if (memberId === profile.id) {
    return { error: 'You cannot edit your own departure information' }
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

  // Cannot modify owner's departure info
  if (targetProfile.role === 'owner') {
    return { error: 'Cannot modify owner departure information' }
  }

  // Check role hierarchy - can only modify users with lower role
  const currentUserRoleLevel = ROLE_HIERARCHY[profile.role as UserRole]
  const targetRoleLevel = ROLE_HIERARCHY[targetProfile.role as UserRole]
  if (currentUserRoleLevel <= targetRoleLevel) {
    return { error: 'You can only modify departure info of members with lower access level' }
  }

  // Update departure info - if date is set, also set active to false and role to member
  const updateData: { date_of_departure: string | null; reason_for_departure: string | null; active?: boolean; role?: string } = {
    date_of_departure: dateOfDeparture,
    reason_for_departure: reasonForDeparture,
  }

  if (dateOfDeparture) {
    updateData.active = false
    updateData.role = 'member'
  }

  const { error: updateError } = await adminClient
    .from('profiles')
    .update(updateData)
    .eq('id', memberId)

  if (updateError) {
    console.error('Update error:', updateError)
    return { error: 'Failed to update departure information' }
  }

  // No revalidatePath - optimistic updates handle UI instantly
  return { success: true }
}
