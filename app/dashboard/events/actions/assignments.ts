'use server'

import { revalidatePath } from 'next/cache'
import {
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireManagePermission,
} from './helpers'

export async function assignVolunteer(positionId: string, profileId: string, notes?: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { user, profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'assign volunteers')
  if (permError) return { error: permError }

  const { data: assignment, error } = await adminClient
    .from('event_assignments')
    .insert({
      position_id: positionId,
      profile_id: profileId,
      assigned_by: profile.id,
      notes: notes || null,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return { error: 'This person is already assigned to this position' }
    console.error('Error assigning volunteer:', error)
    return { error: 'Failed to assign volunteer' }
  }

  revalidatePath('/dashboard/events')
  return { data: assignment }
}

export async function unassignVolunteer(assignmentId: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'remove assignments')
  if (permError) return { error: permError }

  const { error } = await adminClient
    .from('event_assignments')
    .delete()
    .eq('id', assignmentId)

  if (error) {
    console.error('Error removing assignment:', error)
    return { error: 'Failed to remove assignment' }
  }

  revalidatePath('/dashboard/events')
  return { success: true }
}

export async function getEligibleVolunteers(positionId: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { adminClient } = auth

  const { data: position } = await adminClient
    .from('event_positions')
    .select(`
      ministry_id, role_id, event_id,
      event:events (church_id, start_time)
    `)
    .eq('id', positionId)
    .single()

  if (!position) return { error: 'Position not found' }

  // Parallel fetch: members and existing assignments (independent queries)
  const [membersResult, existingAssignmentsResult] = await Promise.all([
    adminClient
      .from('ministry_members')
      .select(`
        id,
        profile:profiles (id, first_name, last_name, email),
        ministry_member_roles (role:ministry_roles (id, name))
      `)
      .eq('ministry_id', position.ministry_id)
      .eq('is_active', true),
    adminClient
      .from('event_assignments')
      .select('profile_id')
      .eq('position_id', positionId),
  ])

  const members = membersResult.data
  if (!members) return { data: [] }

  const assignedProfileIds = new Set(existingAssignmentsResult.data?.map((a) => a.profile_id) || [])

  type ProfileData = { id: string; first_name: string; last_name: string; email: string }
  type RoleInfo = { id: string; name: string }
  type MemberRoleData = { role: RoleInfo | RoleInfo[] }
  type MemberData = {
    id: string
    profile: ProfileData | ProfileData[]
    ministry_member_roles: MemberRoleData[] | null
  }

  const profileIds = (members as unknown as MemberData[])
    .map((m) => {
      const profile = Array.isArray(m.profile) ? m.profile[0] : m.profile
      return profile?.id
    })
    .filter(Boolean) as string[]

  const eventData = Array.isArray(position.event) ? position.event[0] : position.event
  const eventDate = eventData?.start_time?.split('T')[0] || new Date().toISOString().split('T')[0]

  // Parallel fetch: unavailability and other event positions (independent queries)
  const [unavailabilityResult, eventPositionsResult] = await Promise.all([
    adminClient
      .from('volunteer_unavailability')
      .select('profile_id, reason')
      .in('profile_id', profileIds)
      .lte('start_date', eventDate)
      .gte('end_date', eventDate),
    adminClient
      .from('event_positions')
      .select(`id, title, event_assignments (profile_id)`)
      .eq('event_id', position.event_id)
      .neq('id', positionId),
  ])

  const unavailableMap = new Map<string, string | null>()
  unavailabilityResult.data?.forEach((u) => unavailableMap.set(u.profile_id, u.reason))

  const alreadyAssignedMap = new Map<string, string[]>()
  const eventPositions = eventPositionsResult.data
  eventPositions?.forEach((pos) => {
    pos.event_assignments?.forEach((assignment: { profile_id: string }) => {
      const existingRoles = alreadyAssignedMap.get(assignment.profile_id) || []
      existingRoles.push(pos.title)
      alreadyAssignedMap.set(assignment.profile_id, existingRoles)
    })
  })

  const eligibleVolunteers = (members as unknown as MemberData[])
    .filter((m) => {
      const profile = Array.isArray(m.profile) ? m.profile[0] : m.profile
      if (!profile || assignedProfileIds.has(profile.id)) return false
      if (position.role_id) {
        const roles = m.ministry_member_roles?.map((mr) => {
          const role = Array.isArray(mr.role) ? mr.role[0] : mr.role
          return role
        }).filter(Boolean) as RoleInfo[] || []
        if (!roles.some((r) => r.id === position.role_id)) return false
      }
      return true
    })
    .map((m) => {
      const profile = Array.isArray(m.profile) ? m.profile[0] : m.profile
      const roles = m.ministry_member_roles?.map((mr) => {
        const role = Array.isArray(mr.role) ? mr.role[0] : mr.role
        return role
      }).filter(Boolean) as RoleInfo[] || []
      const isUnavailable = unavailableMap.has(profile.id)
      const assignedPositions = alreadyAssignedMap.get(profile.id) || []
      return {
        id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        roles,
        isUnavailable,
        unavailableReason: unavailableMap.get(profile.id) || null,
        isAlreadyAssigned: assignedPositions.length > 0,
        assignedPositions,
      }
    })
    .sort((a, b) => {
      if (a.isUnavailable && !b.isUnavailable) return 1
      if (!a.isUnavailable && b.isUnavailable) return -1
      if (a.isAlreadyAssigned && !b.isAlreadyAssigned) return 1
      if (!a.isAlreadyAssigned && b.isAlreadyAssigned) return -1
      return 0
    })

  return { data: eligibleVolunteers }
}
