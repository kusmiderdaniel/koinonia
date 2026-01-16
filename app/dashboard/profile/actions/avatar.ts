'use server'

import { revalidatePath } from 'next/cache'
import {
  getAuthenticatedUserWithProfile,
  isAuthError,
} from '@/lib/utils/server-auth'
import { validateImageFile } from '@/lib/validations/upload'

export async function uploadAvatar(formData: FormData) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const file = formData.get('file') as File
  if (!file) {
    return { error: 'No file provided' }
  }

  // Validate file type and size, get safe extension from MIME type
  const validation = validateImageFile(file)
  if (!validation.isValid) {
    return { error: validation.error }
  }

  // Get current avatar to delete later
  const { data: currentProfile } = await adminClient
    .from('profiles')
    .select('avatar_url')
    .eq('id', profile.id)
    .single()

  // Generate unique file path using MIME-derived extension (not user-provided filename)
  const fileName = `${profile.id}/${Date.now()}.${validation.extension}`

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
