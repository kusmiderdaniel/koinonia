'use server'

import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Transfer church ownership to another admin and cancel deletion
 */
export async function transferOwnership(
  newOwnerId: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.email) {
    return { success: false, error: 'Not authenticated' }
  }

  // Verify password
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  })

  if (signInError) {
    return { success: false, error: 'Incorrect password' }
  }

  const adminClient = createServiceRoleClient()

  // Get current user's profile
  const { data: currentProfile } = await adminClient
    .from('profiles')
    .select('id, church_id, role')
    .eq('user_id', user.id)
    .single()

  if (!currentProfile || currentProfile.role !== 'owner') {
    return { success: false, error: 'Only church owners can transfer ownership' }
  }

  // Verify new owner is an admin in the same church
  const { data: newOwnerProfile } = await adminClient
    .from('profiles')
    .select('id, church_id, role')
    .eq('id', newOwnerId)
    .single()

  if (!newOwnerProfile) {
    return { success: false, error: 'Selected user not found' }
  }

  if (newOwnerProfile.church_id !== currentProfile.church_id) {
    return { success: false, error: 'Selected user is not in your church' }
  }

  if (newOwnerProfile.role !== 'admin') {
    return { success: false, error: 'Selected user must be an admin' }
  }

  // Perform the transfer in a transaction-like manner
  // 1. Update new owner to 'owner' role
  const { error: promoteError } = await adminClient
    .from('profiles')
    .update({ role: 'owner' })
    .eq('id', newOwnerId)

  if (promoteError) {
    console.error('Error promoting new owner:', promoteError)
    return { success: false, error: 'Failed to transfer ownership' }
  }

  // 2. Downgrade current owner to 'admin'
  const { error: demoteError } = await adminClient
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', currentProfile.id)

  if (demoteError) {
    console.error('Error demoting current owner:', demoteError)
    // Rollback the promotion
    await adminClient
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', newOwnerId)
    return { success: false, error: 'Failed to transfer ownership' }
  }

  // 3. Cancel any pending church deletions for this church
  const { error: cancelError } = await adminClient
    .from('legal_disagreements')
    .update({ status: 'transferred' })
    .eq('church_id', currentProfile.church_id)
    .eq('status', 'pending')
    .eq('disagreement_type', 'church_deletion')

  if (cancelError) {
    console.error('Error cancelling disagreements:', cancelError)
  }

  // 4. Cancel church deletion schedules
  await adminClient
    .from('church_deletion_schedules')
    .update({ status: 'cancelled' })
    .eq('church_id', currentProfile.church_id)
    .eq('status', 'pending')

  revalidatePath('/dashboard')
  revalidatePath('/legal/disagree')

  return { success: true }
}

/**
 * Get church data for export
 */
export async function exportChurchData(): Promise<{
  data?: {
    church: Record<string, unknown>
    members: Array<Record<string, unknown>>
    ministries: Array<Record<string, unknown>>
    events: Array<Record<string, unknown>>
  }
  error?: string
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const adminClient = createServiceRoleClient()

  // Get current user's profile
  const { data: profile } = await adminClient
    .from('profiles')
    .select('church_id, role')
    .eq('user_id', user.id)
    .single()

  if (!profile || profile.role !== 'owner') {
    return { error: 'Only church owners can export church data' }
  }

  if (!profile.church_id) {
    return { error: 'No church found' }
  }

  // Fetch church data
  const { data: church, error: churchError } = await adminClient
    .from('churches')
    .select('*')
    .eq('id', profile.church_id)
    .single()

  if (churchError) {
    return { error: 'Failed to fetch church data' }
  }

  // Fetch members (without sensitive auth data)
  const { data: members } = await adminClient
    .from('profiles')
    .select('id, first_name, last_name, role, created_at')
    .eq('church_id', profile.church_id)

  // Fetch ministries
  const { data: ministries } = await adminClient
    .from('ministries')
    .select('*')
    .eq('church_id', profile.church_id)

  // Fetch events
  const { data: events } = await adminClient
    .from('events')
    .select('*')
    .eq('church_id', profile.church_id)

  return {
    data: {
      church: church || {},
      members: members || [],
      ministries: ministries || [],
      events: events || [],
    },
  }
}

/**
 * Get pending church deletion schedule info
 */
export async function getChurchDeletionSchedule(): Promise<{
  data?: {
    scheduledAt: string
    daysRemaining: number
    memberCount: number
  }
  error?: string
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const adminClient = createServiceRoleClient()

  // Get current user's profile
  const { data: profile } = await adminClient
    .from('profiles')
    .select('church_id, role')
    .eq('user_id', user.id)
    .single()

  if (!profile || profile.role !== 'owner') {
    return { error: 'Only church owners can view deletion schedule' }
  }

  if (!profile.church_id) {
    return { error: 'No church found' }
  }

  // Get pending deletion schedule
  const { data: schedule } = await adminClient
    .from('church_deletion_schedules')
    .select('scheduled_deletion_at')
    .eq('church_id', profile.church_id)
    .eq('status', 'pending')
    .single()

  if (!schedule) {
    return { error: 'No pending deletion found' }
  }

  // Count members
  const { count } = await adminClient
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('church_id', profile.church_id)

  const scheduledAt = new Date(schedule.scheduled_deletion_at)
  const now = new Date()
  const daysRemaining = Math.ceil((scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  return {
    data: {
      scheduledAt: schedule.scheduled_deletion_at,
      daysRemaining: Math.max(0, daysRemaining),
      memberCount: count || 0,
    },
  }
}
