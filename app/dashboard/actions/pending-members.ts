'use server'

import {
  getAuthenticatedUserWithProfile,
  isAuthError,
} from '@/lib/utils/server-auth'
import { isLeaderOrAbove } from '@/lib/permissions'

export interface DashboardPendingMember {
  id: string
  first_name: string
  last_name: string
  email: string
  created_at: string
}

/**
 * Get pending member registrations for leaders and above
 */
export async function getPendingMembers(): Promise<{
  data?: DashboardPendingMember[]
  error?: string
}> {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Only leaders and above can see pending members
  if (!isLeaderOrAbove(profile.role)) {
    return { data: [] }
  }

  const { data, error } = await adminClient
    .from('pending_registrations')
    .select('id, first_name, last_name, email, created_at')
    .eq('church_id', profile.church_id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error fetching pending members:', error)
    return { error: 'Failed to fetch pending members' }
  }

  return { data: data || [] }
}
