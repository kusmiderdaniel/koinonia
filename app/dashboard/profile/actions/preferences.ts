'use server'

import { revalidatePath } from 'next/cache'
import {
  getAuthenticatedUserWithProfile,
  isAuthError,
} from '@/lib/utils/server-auth'
import { type NotificationPreferences } from '@/types/notification-preferences'
import { isValidLocale } from '@/lib/i18n/config'

export type ThemePreference = 'light' | 'dark' | 'system'

const VALID_THEMES: ThemePreference[] = ['light', 'dark', 'system']

export async function updateNotificationPreferences(
  preferences: NotificationPreferences
) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const { error } = await adminClient
    .from('profiles')
    .update({
      notification_preferences: preferences,
    })
    .eq('id', profile.id)

  if (error) {
    console.error('Error updating notification preferences:', error)
    return { error: 'Failed to update notification settings' }
  }

  revalidatePath('/dashboard/profile')
  return { success: true }
}

export async function updateLanguagePreference(language: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Validate language code
  if (!isValidLocale(language)) {
    return { error: 'Invalid language code' }
  }

  const { error } = await adminClient
    .from('profiles')
    .update({ language })
    .eq('id', profile.id)

  if (error) {
    console.error('Error updating language preference:', error)
    return { error: 'Failed to update language preference' }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateThemePreference(theme: ThemePreference) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Validate theme value
  if (!VALID_THEMES.includes(theme)) {
    return { error: 'Invalid theme value' }
  }

  const { error } = await adminClient
    .from('profiles')
    .update({ theme_preference: theme })
    .eq('id', profile.id)

  if (error) {
    console.error('Error updating theme preference:', error)
    return { error: 'Failed to update theme preference' }
  }

  revalidatePath('/dashboard')
  return { success: true }
}
