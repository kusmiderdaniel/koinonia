'use server'

import {
  getAuthenticatedUserWithProfile,
  isAuthError,
} from './helpers'

export async function getAllMinistriesWithMembers() {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const { data: ministries, error } = await adminClient
    .from('ministries')
    .select(`
      id,
      name,
      ministry_members (
        profile_id,
        ministry_member_roles (
          ministry_roles (
            name
          )
        )
      )
    `)
    .eq('church_id', profile.church_id)

  if (error) {
    console.error('Error fetching ministries with members:', error)
    return { error: 'Failed to load ministries' }
  }

  type MinistryRoleData = { name: string } | { name: string }[] | null
  type MemberRole = { ministry_roles: MinistryRoleData }
  type MemberData = { profile_id: string; ministry_member_roles: MemberRole[] | null }

  const transformed = ministries?.map((m) => ({
    id: m.id,
    name: m.name,
    members: m.ministry_members?.map((mm: MemberData) => {
      const roleNames = mm.ministry_member_roles
        ?.map((mr) => {
          const role = Array.isArray(mr.ministry_roles)
            ? mr.ministry_roles[0]
            : mr.ministry_roles
          return role?.name
        })
        .filter((name): name is string => !!name) || []
      return {
        profile_id: mm.profile_id,
        role_names: roleNames,
      }
    }) || [],
  }))

  return { data: transformed || [] }
}

// Combined action to get all ministry details in one request
export async function getMinistryDetails(ministryId: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Fetch all data in parallel using Promise.all
  const [rolesResult, membersResult, churchMembersResult, allMinistriesResult] = await Promise.all([
    adminClient
      .from('ministry_roles')
      .select('*')
      .eq('ministry_id', ministryId)
      .order('sort_order')
      .order('name'),

    adminClient
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
      .order('joined_at'),

    adminClient
      .from('profiles')
      .select('id, first_name, last_name, email, role')
      .eq('church_id', profile.church_id)
      .eq('active', true)
      .eq('member_type', 'authenticated')
      .order('first_name'),

    adminClient
      .from('ministries')
      .select(`
        id,
        name,
        ministry_members (
          profile_id,
          ministry_member_roles (
            ministry_roles (
              name
            )
          )
        )
      `)
      .eq('church_id', profile.church_id),
  ])

  // Transform members to flatten roles array
  const transformedMembers = membersResult.data?.map((member) => ({
    ...member,
    roles: member.ministry_member_roles?.map((mr: { role: { id: string; name: string } }) => mr.role) || [],
  })) || []

  type MinistryRoleData = { name: string } | { name: string }[] | null
  type MemberRole = { ministry_roles: MinistryRoleData }
  type MemberData = { profile_id: string; ministry_member_roles: MemberRole[] | null }

  const transformedAllMinistries = allMinistriesResult.data?.map((m) => ({
    id: m.id,
    name: m.name,
    members: m.ministry_members?.map((mm: MemberData) => {
      const roleNames = mm.ministry_member_roles
        ?.map((mr) => {
          const role = Array.isArray(mr.ministry_roles)
            ? mr.ministry_roles[0]
            : mr.ministry_roles
          return role?.name
        })
        .filter((name): name is string => !!name) || []
      return {
        profile_id: mm.profile_id,
        role_names: roleNames,
      }
    }) || [],
  })) || []

  return {
    data: {
      roles: rolesResult.data || [],
      members: transformedMembers,
      churchMembers: churchMembersResult.data || [],
      allMinistries: transformedAllMinistries,
    }
  }
}

interface Campus {
  id: string
  name: string
  color: string
  is_default: boolean
}

export async function getCampuses(): Promise<{ data?: Campus[]; error?: string }> {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const { data: campuses, error } = await adminClient
    .from('campuses')
    .select('id, name, color, is_default')
    .eq('church_id', profile.church_id)
    .eq('is_active', true)
    .order('is_default', { ascending: false })
    .order('name')

  if (error) {
    console.error('Error fetching campuses:', error)
    return { error: 'Failed to fetch campuses' }
  }

  return { data: campuses || [] }
}
