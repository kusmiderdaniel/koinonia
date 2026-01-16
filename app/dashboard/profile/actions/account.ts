'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  getAuthenticatedUserWithProfile,
  isAuthError,
} from '@/lib/utils/server-auth'

/**
 * Leave the church - marks the user as inactive (offline member)
 * The profile data is preserved but the user is detached from their auth account
 * This allows them to create or join a new church via onboarding
 */
export async function leaveChurch(reason?: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format

  const { error } = await adminClient
    .from('profiles')
    .update({
      active: false,
      role: 'member', // Revert role to member when leaving
      user_id: null, // Detach from auth user so they can go through onboarding again
      member_type: 'offline',
      date_of_departure: today,
      reason_for_departure: reason || null,
    })
    .eq('id', profile.id)

  if (error) {
    console.error('Error leaving church:', error)
    return { error: 'Failed to process your request' }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Delete account - marks the user as inactive and removes auth connection
 * The profile data is preserved but the user can no longer log in
 * This converts them to an "offline" member type for record-keeping
 */
export async function deleteAccount(reason?: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format

  // Update profile: mark as inactive, offline member, set departure info, revert role
  const { error: profileError } = await adminClient
    .from('profiles')
    .update({
      active: false,
      role: 'member', // Revert role to member when deleting account
      member_type: 'offline',
      user_id: null, // Remove auth connection
      date_of_departure: today,
      reason_for_departure: reason || null,
    })
    .eq('id', profile.id)

  if (profileError) {
    console.error('Error updating profile for deletion:', profileError)
    return { error: 'Failed to process your request' }
  }

  // Delete the auth user account
  // Note: This requires the service role client
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)

  if (deleteError) {
    console.error('Error deleting auth user:', deleteError)
    // Profile is already updated, but auth deletion failed
    // The user will be logged out when their session expires
    return { error: 'Account marked for deletion, but cleanup failed. Please contact support.' }
  }

  return { success: true }
}
