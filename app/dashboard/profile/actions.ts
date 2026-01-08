'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import {
  getAuthenticatedUserWithProfile,
  isAuthError,
} from '@/lib/utils/server-auth'
import {
  type NotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from '@/types/notification-preferences'
import { parseNotificationPreferences } from '@/lib/notifications/preferences'

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  sex: z.enum(['male', 'female']).optional().nullable(),
})

type ProfileInput = z.infer<typeof profileSchema>

export async function getProfile() {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const { data: profileData, error } = await adminClient
    .from('profiles')
    .select('first_name, last_name, email, phone, avatar_url, date_of_birth, sex, role, notification_preferences')
    .eq('id', profile.id)
    .single()

  if (error) {
    return { error: 'Failed to load profile' }
  }

  // Get church settings for first day of week
  const { data: churchData } = await adminClient
    .from('churches')
    .select('first_day_of_week')
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
    firstDayOfWeek: churchData?.first_day_of_week ?? 0 // Default to Sunday (0)
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

export async function uploadAvatar(formData: FormData) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const file = formData.get('file') as File
  if (!file) {
    return { error: 'No file provided' }
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    return { error: 'Only JPEG, PNG, WebP, and GIF images are allowed' }
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { error: 'Image size must be less than 5MB' }
  }

  // Get current avatar to delete later
  const { data: currentProfile } = await adminClient
    .from('profiles')
    .select('avatar_url')
    .eq('id', profile.id)
    .single()

  // Generate unique file path
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const fileName = `${profile.id}/${Date.now()}.${fileExt}`

  // Upload to storage
  const { error: uploadError } = await adminClient.storage
    .from('avatars')
    .upload(fileName, file, {
      upsert: true,
    })

  if (uploadError) {
    console.error('Error uploading avatar:', uploadError)
    return { error: 'Failed to upload image' }
  }

  // Get public URL
  const { data: { publicUrl } } = adminClient.storage
    .from('avatars')
    .getPublicUrl(fileName)

  // Update profile with new avatar URL
  const { error: updateError } = await adminClient
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', profile.id)

  if (updateError) {
    // Clean up uploaded file
    await adminClient.storage.from('avatars').remove([fileName])
    console.error('Error updating avatar URL:', updateError)
    return { error: 'Failed to save avatar' }
  }

  // Delete old avatar if exists
  if (currentProfile?.avatar_url) {
    try {
      const oldPath = currentProfile.avatar_url.split('/avatars/')[1]
      if (oldPath) {
        await adminClient.storage.from('avatars').remove([oldPath])
      }
    } catch {
      // Ignore errors when deleting old avatar
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/profile')
  return { data: { avatarUrl: publicUrl } }
}

export async function removeAvatar() {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Get current avatar
  const { data: currentProfile } = await adminClient
    .from('profiles')
    .select('avatar_url')
    .eq('id', profile.id)
    .single()

  if (!currentProfile?.avatar_url) {
    return { success: true }
  }

  // Delete from storage
  try {
    const oldPath = currentProfile.avatar_url.split('/avatars/')[1]
    if (oldPath) {
      await adminClient.storage.from('avatars').remove([oldPath])
    }
  } catch {
    // Ignore errors when deleting
  }

  // Clear avatar URL in profile
  const { error } = await adminClient
    .from('profiles')
    .update({ avatar_url: null })
    .eq('id', profile.id)

  if (error) {
    console.error('Error removing avatar:', error)
    return { error: 'Failed to remove avatar' }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/profile')
  return { success: true }
}

export async function changePassword(currentPassword: string, newPassword: string) {
  if (!newPassword || newPassword.length < 6) {
    return { error: 'New password must be at least 6 characters' }
  }

  const supabase = await createClient()

  // Verify current password by attempting to sign in
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) {
    return { error: 'Not authenticated' }
  }

  // Try to sign in with current password to verify it
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })

  if (signInError) {
    return { error: 'Current password is incorrect' }
  }

  // Update password
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (updateError) {
    console.error('Error updating password:', updateError)
    return { error: 'Failed to update password' }
  }

  return { success: true }
}

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
