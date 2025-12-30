'use server'

import {
  getAuthenticatedUserWithProfile,
  isAuthError,
} from '@/lib/utils/server-auth'

// ============ SHARED QUERIES (Server Actions) ============

interface ChurchMember {
  id: string
  first_name: string
  last_name: string
  email: string | null
}

export async function getChurchMembers(): Promise<{ data?: ChurchMember[]; error?: string }> {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const { data: members, error } = await adminClient
    .from('profiles')
    .select('id, first_name, last_name, email')
    .eq('church_id', profile.church_id)
    .eq('active', true)
    .eq('member_type', 'authenticated')
    .order('first_name')

  if (error) {
    console.error('Error fetching church members:', error)
    return { error: 'Failed to fetch church members' }
  }

  return { data: members || [] }
}

export async function getMinistriesWithRoles() {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const { data: ministries, error } = await adminClient
    .from('ministries')
    .select(`id, name, color, ministry_roles (id, name, sort_order)`)
    .eq('church_id', profile.church_id)
    .order('name')

  if (error) {
    console.error('Error fetching ministries with roles:', error)
    return { error: 'Failed to fetch ministries' }
  }

  const sortedMinistries = ministries?.map(m => ({
    ...m,
    ministry_roles: m.ministry_roles?.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)) || []
  })) || []

  return { data: sortedMinistries }
}

export async function getMinistryMembersForAgenda(ministryId: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { adminClient } = auth

  const { data: members, error } = await adminClient
    .from('ministry_members')
    .select(`id, profile:profiles!profile_id (id, first_name, last_name, email)`)
    .eq('ministry_id', ministryId)
    .eq('is_active', true)

  if (error) {
    console.error('Error fetching ministry members:', error)
    return { error: 'Failed to fetch ministry members' }
  }

  const transformedMembers = members?.map(m => {
    const profile = Array.isArray(m.profile) ? m.profile[0] : m.profile
    return profile ? {
      id: profile.id,
      first_name: profile.first_name,
      last_name: profile.last_name,
      email: profile.email,
    } : null
  }).filter(Boolean) || []

  return { data: transformedMembers }
}
