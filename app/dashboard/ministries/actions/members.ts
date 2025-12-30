'use server'

import { revalidatePath } from 'next/cache'
import {
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireManagePermission,
} from './helpers'

export async function getMinistryMembers(ministryId: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { adminClient } = auth

  const { data: members, error } = await adminClient
    .from('ministry_members')
    .select(`
      *,
      profile:profiles!profile_id (
        id,
        first_name,
        last_name,
        email
      ),
      ministry_member_roles (
        role:ministry_roles (
          id,
          name
        )
      )
    `)
    .eq('ministry_id', ministryId)
    .eq('is_active', true)
    .order('joined_at')

  if (error) {
    console.error('Error fetching ministry members:', error)
    return { error: 'Failed to load members' }
  }

  // Transform to flatten roles array
  const transformedMembers = members?.map((member) => ({
    ...member,
    roles: member.ministry_member_roles?.map((mr: { role: { id: string; name: string } }) => mr.role) || [],
  }))

  return { data: transformedMembers }
}

export async function addMinistryMember(ministryId: string, profileId: string, roleIds?: string[]) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'add members')
  if (permError) return { error: permError }

  // First create the ministry member
  const { data: member, error } = await adminClient
    .from('ministry_members')
    .insert({
      ministry_id: ministryId,
      profile_id: profileId,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return { error: 'This person is already a member of this ministry' }
    }
    console.error('Error adding member:', error)
    return { error: 'Failed to add member' }
  }

  // Then add role assignments if any
  if (roleIds && roleIds.length > 0) {
    const roleAssignments = roleIds.map((roleId) => ({
      member_id: member.id,
      role_id: roleId,
    }))

    const { error: rolesError } = await adminClient
      .from('ministry_member_roles')
      .insert(roleAssignments)

    if (rolesError) {
      console.error('Error assigning roles:', rolesError)
    }
  }

  revalidatePath('/dashboard/ministries')
  return { data: member }
}

export async function updateMinistryMemberRoles(memberId: string, roleIds: string[]) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'update members')
  if (permError) return { error: permError }

  // Delete existing role assignments
  const { error: deleteError } = await adminClient
    .from('ministry_member_roles')
    .delete()
    .eq('member_id', memberId)

  if (deleteError) {
    console.error('Error removing existing roles:', deleteError)
    return { error: 'Failed to update roles' }
  }

  // Insert new role assignments if any
  if (roleIds.length > 0) {
    const roleAssignments = roleIds.map((roleId) => ({
      member_id: memberId,
      role_id: roleId,
    }))

    const { error: insertError } = await adminClient
      .from('ministry_member_roles')
      .insert(roleAssignments)

    if (insertError) {
      console.error('Error assigning roles:', insertError)
      return { error: 'Failed to assign roles' }
    }
  }

  revalidatePath('/dashboard/ministries')
  return { success: true }
}

export async function removeMinistryMember(memberId: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'remove members')
  if (permError) return { error: permError }

  const { error } = await adminClient
    .from('ministry_members')
    .delete()
    .eq('id', memberId)

  if (error) {
    console.error('Error removing member:', error)
    return { error: 'Failed to remove member' }
  }

  revalidatePath('/dashboard/ministries')
  return { success: true }
}

export async function getChurchMembers() {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const { data: members } = await adminClient
    .from('profiles')
    .select('id, first_name, last_name, email, role')
    .eq('church_id', profile.church_id)
    .order('first_name')

  return { data: members || [] }
}
