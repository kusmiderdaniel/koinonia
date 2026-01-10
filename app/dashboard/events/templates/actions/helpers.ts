'use server'

import {
  getAuthenticatedUserWithProfile,
  isAuthError,
} from '@/lib/utils/server-auth'

export async function getChurchSettings() {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Get church settings
  const { data: church } = await adminClient
    .from('churches')
    .select('first_day_of_week')
    .eq('id', profile.church_id)
    .single()

  return {
    data: {
      firstDayOfWeek: church?.first_day_of_week ?? 1,
    }
  }
}

export async function getMinistries() {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const { data: ministries, error } = await adminClient
    .from('ministries')
    .select(`
      id,
      name,
      color,
      is_system,
      ministry_roles (
        id,
        name
      )
    `)
    .eq('church_id', profile.church_id)
    .eq('is_active', true)
    .order('name')

  if (error) {
    console.error('Error fetching ministries:', error)
    return { error: 'Failed to load ministries' }
  }

  return { data: ministries }
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
