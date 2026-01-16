'use server'

import { createClient } from '@/lib/supabase/server'

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
