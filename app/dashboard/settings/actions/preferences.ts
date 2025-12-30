'use server'

import { revalidatePath } from 'next/cache'
import {
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireAdminPermission,
  churchPreferencesSchema,
  type ChurchPreferencesInput,
} from './helpers'

export async function updateChurchPreferences(data: ChurchPreferencesInput) {
  // Validate input
  const validated = churchPreferencesSchema.safeParse(data)
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || 'Invalid data' }
  }

  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireAdminPermission(profile.role, 'update church preferences')
  if (permError) return { error: permError }

  // Update church preferences
  const { error } = await adminClient
    .from('churches')
    .update({
      timezone: validated.data.timezone,
      first_day_of_week: validated.data.firstDayOfWeek,
      default_event_visibility: validated.data.defaultEventVisibility,
    })
    .eq('id', profile.church_id)

  if (error) {
    console.error('Error updating church preferences:', error)
    return { error: 'Failed to update church preferences' }
  }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard/events')

  return { success: true }
}
