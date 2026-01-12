'use server'

import { revalidatePath } from 'next/cache'
import {
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireRole,
  updateChurchSchema,
  type UpdateChurchInput,
} from './helpers'

export async function getChurchSettings() {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Get church details
  const { data: church, error: churchError } = await adminClient
    .from('churches')
    .select('id, name, subdomain, join_code, timezone, time_format, first_day_of_week, default_event_visibility, links_page_enabled, logo_url, address, city, state, zip_code, country, phone, email, website, created_at, updated_at')
    .eq('id', profile.church_id)
    .single()

  if (churchError || !church) {
    return { error: 'Church not found' }
  }

  return {
    data: {
      ...church,
      role: profile.role,
    },
  }
}

export async function updateChurchSettings(data: UpdateChurchInput) {
  // Validate input
  const validated = updateChurchSchema.safeParse(data)
  if (!validated.success) {
    return { error: 'Invalid data provided' }
  }

  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Only admins can update church settings
  if (profile.role !== 'admin' && profile.role !== 'owner') {
    return { error: 'Only administrators can update church settings' }
  }

  // Update church
  const { error: updateError } = await adminClient
    .from('churches')
    .update({
      name: validated.data.name,
      address: validated.data.address || null,
      city: validated.data.city || null,
      country: validated.data.country || null,
      zip_code: validated.data.zipCode || null,
      phone: validated.data.phone || null,
      email: validated.data.email || null,
      website: validated.data.website || null,
    })
    .eq('id', profile.church_id)

  if (updateError) {
    console.error('Update error:', updateError)
    return { error: 'Failed to update church settings' }
  }

  // Revalidate dashboard to show updated church name
  revalidatePath('/dashboard')

  return { success: true }
}

export async function getChurchMembers() {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Get all members (excluding self)
  const { data: members } = await adminClient
    .from('profiles')
    .select('id, first_name, last_name, email, role')
    .eq('church_id', profile.church_id)
    .neq('id', profile.id)
    .order('first_name')

  return { data: members || [] }
}

export async function transferOwnership(newOwnerId: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Only owner can transfer ownership
  const permError = requireRole(profile.role, ['owner'], 'transfer ownership')
  if (permError) return { error: permError }

  // Get new owner's profile
  const { data: newOwnerProfile } = await adminClient
    .from('profiles')
    .select('church_id, role')
    .eq('id', newOwnerId)
    .single()

  if (!newOwnerProfile) {
    return { error: 'Selected member not found' }
  }

  // Verify same church
  if (profile.church_id !== newOwnerProfile.church_id) {
    return { error: 'Cannot transfer ownership to member from another church' }
  }

  // Cannot transfer to self
  if (newOwnerId === profile.id) {
    return { error: 'You are already the owner' }
  }

  // Transfer ownership: set new owner to 'owner', set old owner to 'admin'
  const { error: newOwnerError } = await adminClient
    .from('profiles')
    .update({ role: 'owner' })
    .eq('id', newOwnerId)

  if (newOwnerError) {
    console.error('Error setting new owner:', newOwnerError)
    return { error: 'Failed to transfer ownership' }
  }

  const { error: oldOwnerError } = await adminClient
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', profile.id)

  if (oldOwnerError) {
    // Rollback: revert new owner back
    await adminClient.from('profiles').update({ role: newOwnerProfile.role }).eq('id', newOwnerId)
    console.error('Error demoting old owner:', oldOwnerError)
    return { error: 'Failed to transfer ownership' }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard/people')

  return { success: true }
}

export async function regenerateJoinCode() {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Only admins can regenerate join code
  const permError = requireRole(profile.role, ['owner', 'admin'], 'regenerate join code')
  if (permError) return { error: permError }

  // Generate a new unique join code using the database function
  const { data: newCode, error: codeError } = await adminClient
    .rpc('generate_unique_join_code')

  if (codeError || !newCode) {
    console.error('Error generating join code:', codeError)
    return { error: 'Failed to generate new join code' }
  }

  // Update the church with the new join code
  const { error: updateError } = await adminClient
    .from('churches')
    .update({ join_code: newCode })
    .eq('id', profile.church_id)

  if (updateError) {
    console.error('Error updating join code:', updateError)
    return { error: 'Failed to update join code' }
  }

  revalidatePath('/dashboard/settings')

  return { success: true, joinCode: newCode }
}

export async function uploadChurchLogo(formData: FormData) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Only admins can upload church logo
  const permError = requireRole(profile.role, ['owner', 'admin'], 'upload church logo')
  if (permError) return { error: permError }

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

  // Get current logo to delete later
  const { data: currentChurch } = await adminClient
    .from('churches')
    .select('logo_url')
    .eq('id', profile.church_id)
    .single()

  // Generate unique file path
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const fileName = `${profile.church_id}/${Date.now()}.${fileExt}`

  // Upload to storage
  const { error: uploadError } = await adminClient.storage
    .from('church-logos')
    .upload(fileName, file, {
      upsert: true,
    })

  if (uploadError) {
    console.error('Error uploading church logo:', uploadError)
    return { error: 'Failed to upload image' }
  }

  // Get public URL
  const { data: { publicUrl } } = adminClient.storage
    .from('church-logos')
    .getPublicUrl(fileName)

  // Update church with new logo URL
  const { error: updateError } = await adminClient
    .from('churches')
    .update({ logo_url: publicUrl })
    .eq('id', profile.church_id)

  if (updateError) {
    // Clean up uploaded file
    await adminClient.storage.from('church-logos').remove([fileName])
    console.error('Error updating logo URL:', updateError)
    return { error: 'Failed to save logo' }
  }

  // Delete old logo if exists
  if (currentChurch?.logo_url) {
    try {
      const oldPath = currentChurch.logo_url.split('/church-logos/')[1]
      if (oldPath) {
        await adminClient.storage.from('church-logos').remove([oldPath])
      }
    } catch {
      // Ignore errors when deleting old logo
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings')
  return { data: { logoUrl: publicUrl } }
}

export async function removeChurchLogo() {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Only admins can remove church logo
  const permError = requireRole(profile.role, ['owner', 'admin'], 'remove church logo')
  if (permError) return { error: permError }

  // Get current logo
  const { data: currentChurch } = await adminClient
    .from('churches')
    .select('logo_url')
    .eq('id', profile.church_id)
    .single()

  if (!currentChurch?.logo_url) {
    return { success: true }
  }

  // Delete from storage
  try {
    const path = currentChurch.logo_url.split('/church-logos/')[1]
    if (path) {
      await adminClient.storage.from('church-logos').remove([path])
    }
  } catch {
    // Continue even if storage delete fails
  }

  // Clear logo_url in database
  const { error: updateError } = await adminClient
    .from('churches')
    .update({ logo_url: null })
    .eq('id', profile.church_id)

  if (updateError) {
    console.error('Error removing logo URL:', updateError)
    return { error: 'Failed to remove logo' }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings')
  return { success: true }
}
