'use server'

import {
  getAuthenticatedUserWithProfile,
  isAuthError,
} from '@/lib/utils/server-auth'
import { isLeaderOrAbove } from '@/lib/permissions'

export async function updateMemberBaptism(
  memberId: string,
  baptism: boolean,
  baptismDate: string | null
) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Only leaders or higher can update baptism info
  if (!isLeaderOrAbove(profile.role)) {
    return { error: 'Only leaders or higher can update baptism information' }
  }

  // Get target member's profile
  const { data: targetProfile } = await adminClient
    .from('profiles')
    .select('church_id')
    .eq('id', memberId)
    .single()

  if (!targetProfile) {
    return { error: 'Member not found' }
  }

  // Verify same church
  if (profile.church_id !== targetProfile.church_id) {
    return { error: 'Cannot modify members from other churches' }
  }

  // Update baptism info
  const { error: updateError } = await adminClient
    .from('profiles')
    .update({
      baptism,
      baptism_date: baptismDate,
    })
    .eq('id', memberId)

  if (updateError) {
    console.error('Update error:', updateError)
    return { error: 'Failed to update baptism information' }
  }

  // No revalidatePath - optimistic updates handle UI instantly
  return { success: true }
}
