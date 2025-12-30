'use server'

import { revalidatePath } from 'next/cache'
import {
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireAdminPermission,
} from '@/lib/utils/server-auth'

type Role = 'owner' | 'admin' | 'leader' | 'volunteer' | 'member'
type AssignableRole = 'admin' | 'leader' | 'volunteer' | 'member'

const roleHierarchy: Record<Role, number> = {
  owner: 5,
  admin: 4,
  leader: 3,
  volunteer: 2,
  member: 1,
}

const assignableRoles: AssignableRole[] = ['admin', 'leader', 'volunteer', 'member']

export async function updateMemberRole(memberId: string, newRole: AssignableRole) {
  // Validate that newRole is assignable (not owner)
  if (!assignableRoles.includes(newRole)) {
    return { error: 'Invalid role. Owner role can only be transferred from Settings.' }
  }

  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { user, profile, adminClient } = auth

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

  const currentUserRoleLevel = roleHierarchy[profile.role as Role]
  const targetRoleLevel = roleHierarchy[targetProfile.role as Role]

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

  revalidatePath('/dashboard/people')

  return { success: true }
}

export async function updateMemberActive(memberId: string, active: boolean) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { user, profile, adminClient } = auth

  // Only leaders or higher can change active status
  const allowedRoles = ['owner', 'admin', 'leader']
  if (!allowedRoles.includes(profile.role)) {
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
  const currentUserRoleLevel = roleHierarchy[profile.role as Role]
  const targetRoleLevel = roleHierarchy[targetProfile.role as Role]
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

  revalidatePath('/dashboard/people')

  return { success: true }
}

export async function updateMemberDeparture(
  memberId: string,
  dateOfDeparture: string | null,
  reasonForDeparture: string | null
) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { user, profile, adminClient } = auth

  // Only leaders or higher can update departure info
  const allowedRoles = ['owner', 'admin', 'leader']
  if (!allowedRoles.includes(profile.role)) {
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
  const currentUserRoleLevel = roleHierarchy[profile.role as Role]
  const targetRoleLevel = roleHierarchy[targetProfile.role as Role]
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

  revalidatePath('/dashboard/people')

  return { success: true }
}

export async function updateMemberBaptism(
  memberId: string,
  baptism: boolean,
  baptismDate: string | null
) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Only leaders or higher can update baptism info
  const allowedRoles = ['owner', 'admin', 'leader']
  if (!allowedRoles.includes(profile.role)) {
    return { error: 'Only leaders or higher can update baptism information' }
  }

  // Get target member's profile
  const { data: targetProfile } = await adminClient
    .from('profiles')
    .select('church_id')
    .eq('id', memberId)
    .single()

  if (!targetProfile) {
    return { error: 'Member not found' }
  }

  // Verify same church
  if (profile.church_id !== targetProfile.church_id) {
    return { error: 'Cannot modify members from other churches' }
  }

  // Update baptism info
  const { error: updateError } = await adminClient
    .from('profiles')
    .update({
      baptism,
      baptism_date: baptismDate,
    })
    .eq('id', memberId)

  if (updateError) {
    console.error('Update error:', updateError)
    return { error: 'Failed to update baptism information' }
  }

  revalidatePath('/dashboard/people')

  return { success: true }
}

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

  // Only admins can create offline members
  const permError = requireAdminPermission(profile.role, 'create offline members')
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

  revalidatePath('/dashboard/people')

  return { success: true, profileId }
}
