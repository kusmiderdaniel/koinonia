'use server'

import { revalidatePath } from 'next/cache'
import {
  ministrySchema,
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireAdminPermission,
} from './helpers'
import { isAdminOrOwner } from '@/lib/permissions'
import type { MinistryInput } from './helpers'

export async function getMinistries() {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const { data: ministries, error } = await adminClient
    .from('ministries')
    .select(`
      *,
      leader:profiles!leader_id (
        id,
        first_name,
        last_name,
        email
      ),
      campus:campuses (
        id,
        name,
        color
      )
    `)
    .eq('church_id', profile.church_id)
    .order('name')

  if (error) {
    console.error('Error fetching ministries:', error)
    return { error: 'Failed to load ministries' }
  }

  return { data: ministries, role: profile.role }
}

export async function createMinistry(data: MinistryInput) {
  const validated = ministrySchema.safeParse(data)
  if (!validated.success) {
    return { error: 'Invalid data provided' }
  }

  if (!validated.data.leaderId) {
    return { error: 'A ministry leader must be assigned' }
  }

  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireAdminPermission(profile.role, 'create ministries')
  if (permError) return { error: permError }

  const { data: ministry, error } = await adminClient
    .from('ministries')
    .insert({
      church_id: profile.church_id,
      name: validated.data.name,
      description: validated.data.description || null,
      color: validated.data.color,
      leader_id: validated.data.leaderId || null,
      campus_id: validated.data.campusId || null,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return { error: 'A ministry with this name already exists' }
    }
    console.error('Error creating ministry:', error)
    return { error: 'Failed to create ministry' }
  }

  revalidatePath('/dashboard/ministries')
  return { data: ministry }
}

export async function updateMinistry(id: string, data: MinistryInput) {
  const validated = ministrySchema.safeParse(data)
  if (!validated.success) {
    return { error: 'Invalid data provided' }
  }

  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { user, profile, adminClient } = auth

  // Get the ministry to check ownership
  const { data: ministry } = await adminClient
    .from('ministries')
    .select('church_id, leader_id')
    .eq('id', id)
    .single()

  if (!ministry) {
    return { error: 'Ministry not found' }
  }

  // Check permissions: admin/owner or ministry leader
  const isMinistryLeader = ministry.leader_id === user.id

  if (!isAdminOrOwner(profile.role) && !isMinistryLeader) {
    return { error: 'You do not have permission to edit this ministry' }
  }

  const updateData: Record<string, unknown> = {
    name: validated.data.name,
    description: validated.data.description || null,
    color: validated.data.color,
    leader_id: validated.data.leaderId || null,
  }
  if (validated.data.campusId !== undefined) {
    updateData.campus_id = validated.data.campusId || null
  }

  const { error } = await adminClient
    .from('ministries')
    .update(updateData)
    .eq('id', id)

  if (error) {
    if (error.code === '23505') {
      return { error: 'A ministry with this name already exists' }
    }
    console.error('Error updating ministry:', error)
    return { error: 'Failed to update ministry' }
  }

  revalidatePath('/dashboard/ministries')
  return { success: true }
}

export async function deleteMinistry(id: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireAdminPermission(profile.role, 'delete ministries')
  if (permError) return { error: permError }

  // Check if ministry is a system ministry (cannot be deleted)
  const { data: ministry } = await adminClient
    .from('ministries')
    .select('is_system')
    .eq('id', id)
    .single()

  if (ministry?.is_system) {
    return { error: 'System ministries cannot be deleted. You can modify its roles and members instead.' }
  }

  const { error } = await adminClient
    .from('ministries')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting ministry:', error)
    return { error: 'Failed to delete ministry' }
  }

  revalidatePath('/dashboard/ministries')
  return { success: true }
}

export async function getChurchLeaders() {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Fetch leaders
  const { data: leaders } = await adminClient
    .from('profiles')
    .select('id, first_name, last_name, email, role')
    .eq('church_id', profile.church_id)
    .in('role', ['owner', 'admin', 'leader', 'volunteer'])
    .order('first_name')

  if (!leaders || leaders.length === 0) {
    return { data: [] }
  }

  // Fetch campus assignments for all leaders
  const leaderIds = leaders.map(l => l.id)
  const { data: profileCampuses } = await adminClient
    .from('profile_campuses')
    .select('profile_id, campus_id')
    .in('profile_id', leaderIds)

  // Build a map of profile_id -> campus_ids
  const campusesByProfile = new Map<string, string[]>()
  for (const pc of profileCampuses || []) {
    const existing = campusesByProfile.get(pc.profile_id) || []
    existing.push(pc.campus_id)
    campusesByProfile.set(pc.profile_id, existing)
  }

  // Combine leaders with their campus IDs
  const leadersWithCampuses = leaders.map(leader => ({
    ...leader,
    campus_ids: campusesByProfile.get(leader.id) || [],
  }))

  return { data: leadersWithCampuses }
}
