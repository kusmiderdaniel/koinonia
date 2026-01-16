'use server'

import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import {
  joinChurchSchema,
  type JoinChurchInput,
} from '@/lib/validations/onboarding'
import { notifyLeadersOfPendingMember } from '@/lib/notifications/pending-member'
import { recordDataSharingConsent } from './helpers'

export async function joinChurch(data: JoinChurchInput & {
  phone?: string
  dateOfBirth?: string
  sex?: 'male' | 'female'
  campusId?: string
}) {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'You must be signed in to join a church' }
  }

  // Get user info from metadata (set during signup), with fallbacks
  let firstName = user.user_metadata?.first_name
  let lastName = user.user_metadata?.last_name

  // If names are missing, try to derive from email
  if (!firstName || !lastName) {
    const emailName = user.email?.split('@')[0] || 'User'
    firstName = firstName || emailName.charAt(0).toUpperCase() + emailName.slice(1)
    lastName = lastName || 'Member'
  }

  // Validate inputs
  const validatedJoin = joinChurchSchema.safeParse(data)
  if (!validatedJoin.success) {
    return { error: 'Invalid join code. Please enter a valid 6-character code.' }
  }

  // Use service role client for database operations (bypasses RLS)
  const adminClient = createServiceRoleClient()

  // Find church by join_code (case-insensitive - schema transforms to uppercase)
  const { data: church, error: churchError } = await adminClient
    .from('churches')
    .select('id, name')
    .eq('join_code', validatedJoin.data.joinCode)
    .single()

  if (churchError || !church) {
    return { error: 'Church not found. Please check the join code and try again.' }
  }

  // Check if user already has an active profile linked to their account
  const { data: existingProfile } = await adminClient
    .from('profiles')
    .select('id, church_id')
    .eq('user_id', user.id)
    .single()

  if (existingProfile) {
    if (existingProfile.church_id === church.id) {
      // Already a member of this church - redirect them
      return { success: true }
    }
    return { error: 'You are already a member of another church.' }
  }

  // Check if user has an inactive profile in this church (they left and are returning)
  // Match by email since user_id was set to null when they left
  const { data: inactiveProfile } = await adminClient
    .from('profiles')
    .select('id, campus_id')
    .eq('church_id', church.id)
    .eq('email', user.email!)
    .eq('active', false)
    .is('user_id', null)
    .single()

  if (inactiveProfile) {
    // Reactivate the returning member's profile
    const campusId = data.campusId || inactiveProfile.campus_id

    const { error: reactivateError } = await adminClient
      .from('profiles')
      .update({
        user_id: user.id,
        active: true,
        member_type: 'authenticated',
        date_of_departure: null,
        reason_for_departure: null,
        phone: data.phone || null,
        date_of_birth: data.dateOfBirth || null,
        sex: data.sex || null,
        campus_id: campusId,
      })
      .eq('id', inactiveProfile.id)

    if (reactivateError) {
      console.error('Profile reactivation error:', reactivateError)
      return { error: 'Failed to reactivate your membership. Please try again.' }
    }

    // Update campus assignment if changed
    if (campusId && campusId !== inactiveProfile.campus_id) {
      await adminClient
        .from('profile_campuses')
        .upsert({
          profile_id: inactiveProfile.id,
          campus_id: campusId,
          is_primary: true,
        }, { onConflict: 'profile_id,campus_id' })
    }

    // Clean up any old pending registrations
    await adminClient
      .from('pending_registrations')
      .delete()
      .eq('user_id', user.id)
      .eq('church_id', church.id)

    // Record data sharing consent for returning member
    await recordDataSharingConsent(adminClient, user.id, church.id)

    return { success: true }
  }

  // Check if user already has a pending registration for this church
  const { data: existingPending } = await adminClient
    .from('pending_registrations')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('church_id', church.id)
    .single()

  if (existingPending) {
    if (existingPending.status === 'pending') {
      return { success: true, pending: true }
    }
    if (existingPending.status === 'rejected') {
      return { error: 'Your previous registration was rejected. Please contact the church administrator.' }
    }
    // Status is 'approved' - this shouldn't happen normally but clean it up
    // Delete the old record so a new one can be created
    await adminClient
      .from('pending_registrations')
      .delete()
      .eq('id', existingPending.id)
  }

  // If no campus specified, get the default campus
  let campusId = data.campusId
  if (!campusId) {
    const { data: defaultCampus } = await adminClient
      .from('campuses')
      .select('id')
      .eq('church_id', church.id)
      .eq('is_default', true)
      .single()

    campusId = defaultCampus?.id
  }

  // Create pending registration (admin must approve)
  const { error: pendingError } = await adminClient
    .from('pending_registrations')
    .insert({
      user_id: user.id,
      church_id: church.id,
      first_name: firstName,
      last_name: lastName,
      email: user.email!,
      phone: data.phone || null,
      date_of_birth: data.dateOfBirth || null,
      sex: data.sex || null,
      status: 'pending',
      campus_id: campusId || null,
    })

  if (pendingError) {
    console.error('Pending registration creation error:', pendingError)
    return { error: 'Failed to submit your registration. Please try again.' }
  }

  // Record data sharing consent for new member
  await recordDataSharingConsent(adminClient, user.id, church.id)

  // Notify church leaders about the new pending member
  notifyLeadersOfPendingMember(
    { id: church.id, name: church.name },
    { firstName, lastName, email: user.email! }
  ).catch((err) => console.error('[Notification] Error notifying leaders of pending member:', err))

  return { success: true, pending: true }
}

export async function getCampusesByJoinCode(joinCode: string) {
  // Use service role client to look up church by join code
  const adminClient = createServiceRoleClient()

  // Find church by join_code (including first_day_of_week for date picker)
  const { data: church, error: churchError } = await adminClient
    .from('churches')
    .select('id, name, first_day_of_week')
    .eq('join_code', joinCode.toUpperCase())
    .single()

  if (churchError || !church) {
    return { error: 'Church not found' }
  }

  // Get active campuses for this church
  const { data: campuses, error: campusError } = await adminClient
    .from('campuses')
    .select('id, name, color, is_default')
    .eq('church_id', church.id)
    .eq('is_active', true)
    .order('is_default', { ascending: false })
    .order('name')

  if (campusError) {
    console.error('Error fetching campuses:', campusError)
    return { error: 'Failed to fetch campuses' }
  }

  return {
    church: {
      id: church.id,
      name: church.name,
      firstDayOfWeek: (church.first_day_of_week ?? 0) as 0 | 1 | 2 | 3 | 4 | 5 | 6,
    },
    campuses: campuses || [],
  }
}
