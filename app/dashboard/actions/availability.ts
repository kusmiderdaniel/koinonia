'use server'

import {
  getAuthenticatedUserWithProfile,
  isAuthError,
} from '@/lib/utils/server-auth'

/**
 * Get count of upcoming unavailability entries
 */
export async function getUnavailabilityCount(): Promise<{ count: number; error?: string }> {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { count: 0, error: auth.error }

  const { profile, adminClient } = auth

  const today = new Date().toISOString().split('T')[0]

  const { count, error } = await adminClient
    .from('unavailability')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', profile.id)
    .gte('end_date', today)

  if (error) {
    console.error('Error fetching unavailability count:', error)
    return { count: 0, error: 'Failed to fetch unavailability' }
  }

  return { count: count || 0 }
}
