'use server'

import { revalidatePath } from 'next/cache'
import {
  roleSchema,
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireManagePermission,
} from './helpers'
import { getUserCampusIds } from '@/lib/utils/campus'
import { isAdminOrOwner, isLeader } from '@/lib/permissions'
import type { RoleInput } from './helpers'

/**
 * Check if a leader has access to a ministry based on campus
 * Returns an error message if access is denied, null if allowed
 */
async function checkLeaderMinistryAccess(
  profileId: string,
  profileRole: string,
  ministryId: string,
  adminClient: ReturnType<typeof import('@/lib/supabase/server').createServiceRoleClient>
): Promise<string | null> {
  // Admin and owner can access all ministries
  if (isAdminOrOwner(profileRole)) {
    return null
  }

  // For leaders, check campus access
  if (isLeader(profileRole)) {
    // Get the ministry's campus
    const { data: ministry } = await adminClient
      .from('ministries')
      .select('campus_id')
      .eq('id', ministryId)
      .single()

    // If ministry has no campus, it's accessible to all
    if (!ministry?.campus_id) {
      return null
    }

    // Check if user is in the ministry's campus
    const userCampusIds = await getUserCampusIds(profileId, adminClient)
    if (!userCampusIds.includes(ministry.campus_id)) {
      return 'You can only manage roles in ministries that belong to your campus'
    }

    return null
  }

  return 'You do not have permission to manage roles'
}

export async function getMinistryRoles(ministryId: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { adminClient } = auth

  const { data: roles, error } = await adminClient
    .from('ministry_roles')
    .select('id, ministry_id, name, description, sort_order, created_at, updated_at')
    .eq('ministry_id', ministryId)
    .order('sort_order')
    .order('name')

  if (error) {
    console.error('Error fetching ministry roles:', error)
    return { error: 'Failed to load roles' }
  }

  return { data: roles }
}

export async function createMinistryRole(ministryId: string, data: RoleInput) {
  const validated = roleSchema.safeParse(data)
  if (!validated.success) {
    return { error: 'Invalid data provided' }
  }

  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'create roles')
  if (permError) return { error: permError }

  // For leaders, check campus access
  const campusError = await checkLeaderMinistryAccess(profile.id, profile.role, ministryId, adminClient)
  if (campusError) return { error: campusError }

  // Get highest sort order
  const { data: existingRoles } = await adminClient
    .from('ministry_roles')
    .select('sort_order')
    .eq('ministry_id', ministryId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextSortOrder = existingRoles && existingRoles.length > 0
    ? (existingRoles[0].sort_order || 0) + 1
    : 0

  const { data: role, error } = await adminClient
    .from('ministry_roles')
    .insert({
      ministry_id: ministryId,
      name: validated.data.name,
      description: validated.data.description || null,
      sort_order: nextSortOrder,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return { error: 'A role with this name already exists in this ministry' }
    }
    console.error('Error creating role:', error)
    return { error: 'Failed to create role' }
  }

  revalidatePath('/dashboard/ministries')
  return { data: role }
}

export async function updateMinistryRole(roleId: string, data: RoleInput) {
  const validated = roleSchema.safeParse(data)
  if (!validated.success) {
    return { error: 'Invalid data provided' }
  }

  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'update roles')
  if (permError) return { error: permError }

  // Get the role's ministry_id for campus check
  const { data: role } = await adminClient
    .from('ministry_roles')
    .select('ministry_id')
    .eq('id', roleId)
    .single()

  if (!role) return { error: 'Role not found' }

  // For leaders, check campus access
  const campusError = await checkLeaderMinistryAccess(profile.id, profile.role, role.ministry_id, adminClient)
  if (campusError) return { error: campusError }

  const { error } = await adminClient
    .from('ministry_roles')
    .update({
      name: validated.data.name,
      description: validated.data.description || null,
    })
    .eq('id', roleId)

  if (error) {
    if (error.code === '23505') {
      return { error: 'A role with this name already exists in this ministry' }
    }
    console.error('Error updating role:', error)
    return { error: 'Failed to update role' }
  }

  revalidatePath('/dashboard/ministries')
  return { success: true }
}

export async function deleteMinistryRole(roleId: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'delete roles')
  if (permError) return { error: permError }

  // Get the role's ministry_id for campus check
  const { data: role } = await adminClient
    .from('ministry_roles')
    .select('ministry_id')
    .eq('id', roleId)
    .single()

  if (!role) return { error: 'Role not found' }

  // For leaders, check campus access
  const campusError = await checkLeaderMinistryAccess(profile.id, profile.role, role.ministry_id, adminClient)
  if (campusError) return { error: campusError }

  const { error } = await adminClient
    .from('ministry_roles')
    .delete()
    .eq('id', roleId)

  if (error) {
    console.error('Error deleting role:', error)
    return { error: 'Failed to delete role' }
  }

  revalidatePath('/dashboard/ministries')
  return { success: true }
}
