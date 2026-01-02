'use server'

import { nanoid } from 'nanoid'
import { revalidatePath } from 'next/cache'
import {
  getAuthenticatedUserWithProfile,
  isAuthError,
} from '@/lib/utils/server-auth'

/**
 * Get or create a calendar token for the current user.
 * If the user doesn't have a token yet, one is created automatically.
 */
export async function getOrCreateCalendarToken(): Promise<{
  data?: { token: string }
  error?: string
}> {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Check if token exists
  const { data: existing } = await adminClient
    .from('calendar_tokens')
    .select('token')
    .eq('profile_id', profile.id)
    .single()

  if (existing) {
    return { data: { token: existing.token } }
  }

  // Create new token
  const token = nanoid(32)
  const { error } = await adminClient.from('calendar_tokens').insert({
    profile_id: profile.id,
    church_id: profile.church_id,
    token,
  })

  if (error) {
    console.error('Error creating calendar token:', error)
    return { error: 'Failed to create calendar token' }
  }

  return { data: { token } }
}

/**
 * Regenerate the calendar token for the current user.
 * This invalidates any existing calendar subscriptions.
 */
export async function regenerateCalendarToken(): Promise<{
  data?: { token: string }
  error?: string
}> {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const newToken = nanoid(32)

  // Upsert: update if exists, insert if not
  const { error } = await adminClient.from('calendar_tokens').upsert(
    {
      profile_id: profile.id,
      church_id: profile.church_id,
      token: newToken,
    },
    {
      onConflict: 'profile_id',
    }
  )

  if (error) {
    console.error('Error regenerating calendar token:', error)
    return { error: 'Failed to regenerate calendar token' }
  }

  revalidatePath('/dashboard/calendar-integration')
  return { data: { token: newToken } }
}

/**
 * Get campuses for the current user's church.
 */
export async function getChurchCampuses(): Promise<{
  data?: Array<{ id: string; name: string; color: string | null }>
  churchSubdomain?: string
  error?: string
}> {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Get church subdomain
  const { data: church } = await adminClient
    .from('churches')
    .select('subdomain')
    .eq('id', profile.church_id)
    .single()

  // Get active campuses
  const { data: campuses, error } = await adminClient
    .from('campuses')
    .select('id, name, color')
    .eq('church_id', profile.church_id)
    .eq('is_active', true)
    .order('is_default', { ascending: false })
    .order('name')

  if (error) {
    console.error('Error fetching campuses:', error)
    return { error: 'Failed to fetch campuses' }
  }

  return {
    data: campuses || [],
    churchSubdomain: church?.subdomain || '',
  }
}
