'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
  getAuthenticatedUserWithProfile,
  isAuthError,
} from '@/lib/utils/server-auth'
import { parseNotificationPreferences } from '@/lib/notifications/preferences'

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  sex: z.enum(['male', 'female']).optional().nullable(),
})

export type ProfileInput = z.infer<typeof profileSchema>

export async function getProfile() {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const { data: profileData, error } = await adminClient
    .from('profiles')
    .select('first_name, last_name, email, phone, avatar_url, date_of_birth, sex, role, notification_preferences, language, theme_preference')
    .eq('id', profile.id)
    .single()

  if (error) {
    return { error: 'Failed to load profile' }
  }

  // Get church settings for first day of week and church name
  const { data: churchData } = await adminClient
    .from('churches')
    .select('first_day_of_week, name')
    .eq('id', profile.church_id)
    .single()

  // Parse notification preferences with defaults
  const notificationPreferences = parseNotificationPreferences(
    profileData.notification_preferences
  )

  return {
    data: {
      ...profileData,
      notification_preferences: notificationPreferences,
    },
    role: profileData.role,
    firstDayOfWeek: churchData?.first_day_of_week ?? 0, // Default to Sunday (0)
    churchName: churchData?.name ?? '',
  }
}

export async function updateProfile(data: ProfileInput) {
  const validated = profileSchema.safeParse(data)
  if (!validated.success) {
    return { error: 'Invalid data provided' }
  }

  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const { error } = await adminClient
    .from('profiles')
    .update({
      first_name: validated.data.firstName,
      last_name: validated.data.lastName,
      phone: validated.data.phone || null,
      date_of_birth: validated.data.dateOfBirth || null,
      sex: validated.data.sex || null,
    })
    .eq('id', profile.id)

  if (error) {
    console.error('Error updating profile:', error)
    return { error: 'Failed to update profile' }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/profile')
  return { success: true }
}
