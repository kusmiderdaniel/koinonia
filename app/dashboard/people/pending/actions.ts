'use server'

import { revalidatePath } from 'next/cache'
import {
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireAdminPermission,
  requireManagePermission,
} from '@/lib/utils/server-auth'
import { getUserCampusIds } from '@/lib/utils/campus'
import { isAdminOrOwner, isLeader } from '@/lib/permissions'

export async function getPendingRegistrations() {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Leaders and above can view pending registrations
  const permError = requireManagePermission(profile.role, 'view pending registrations')
  if (permError) return { error: permError }

  const userIsAdmin = isAdminOrOwner(profile.role)
  const userIsLeader = isLeader(profile.role)

  // For leaders, get their campus IDs for filtering
  let leaderCampusIds: string[] = []
  if (userIsLeader) {
    leaderCampusIds = await getUserCampusIds(profile.id, adminClient)
    if (leaderCampusIds.length === 0) {
      // Leader has no campus, return empty data
      return { data: [] }
    }
  }

  let query = adminClient
    .from('pending_registrations')
    .select(`
      *,
      campus:campuses (
        id,
        name,
        color
      )
    `)
    .eq('church_id', profile.church_id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  // Leaders can only see registrations for their campus
  if (userIsLeader) {
    query = query.in('campus_id', leaderCampusIds)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching pending registrations:', error)
    return { error: 'Failed to fetch pending registrations' }
  }

  return { data, isAdmin: userIsAdmin }
}

export async function approveRegistration(registrationId: string, campusId?: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Leaders and above can approve registrations
  const permError = requireManagePermission(profile.role, 'approve registrations')
  if (permError) return { error: permError }

  const userIsLeader = isLeader(profile.role)

  // Get the pending registration
  const { data: registration, error: fetchError } = await adminClient
    .from('pending_registrations')
    .select('*')
    .eq('id', registrationId)
    .eq('church_id', profile.church_id)
    .single()

  if (fetchError || !registration) {
    return { error: 'Registration not found' }
  }

  if (registration.status !== 'pending') {
    return { error: 'Registration has already been processed' }
  }

  // For leaders, verify they can only approve registrations for their campus
  if (userIsLeader) {
    const leaderCampusIds = await getUserCampusIds(profile.id, adminClient)
    if (!registration.campus_id || !leaderCampusIds.includes(registration.campus_id)) {
      return { error: 'You can only approve registrations for your campus' }
    }
  }

  // Use provided campusId, or fall back to registration's campus_id, or get default campus
  let finalCampusId = campusId || registration.campus_id
  if (!finalCampusId) {
    const { data: defaultCampus } = await adminClient
      .from('campuses')
      .select('id')
      .eq('church_id', registration.church_id)
      .eq('is_default', true)
      .single()
    finalCampusId = defaultCampus?.id
  }

  // Create profile for the user with all collected information
  const profileId = crypto.randomUUID()
  const { error: profileError } = await adminClient
    .from('profiles')
    .insert({
      id: profileId,
      user_id: registration.user_id,
      church_id: registration.church_id,
      first_name: registration.first_name,
      last_name: registration.last_name,
      email: registration.email,
      phone: registration.phone || null,
      date_of_birth: registration.date_of_birth || null,
      sex: registration.sex || null,
      role: 'member',
      member_type: 'authenticated',
    })

  if (profileError) {
    console.error('Error creating profile:', profileError)
    return { error: 'Failed to create member profile' }
  }

  // Create profile_campuses entry if campus is available
  if (finalCampusId) {
    const { error: campusError } = await adminClient
      .from('profile_campuses')
      .insert({
        profile_id: profileId,
        campus_id: finalCampusId,
        is_primary: true,
      })

    if (campusError) {
      console.error('Error assigning campus:', campusError)
      // Continue anyway - campus can be assigned later
    }
  }

  // Update registration status
  const { error: updateError } = await adminClient
    .from('pending_registrations')
    .update({
      status: 'approved',
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', registrationId)

  if (updateError) {
    console.error('Error updating registration:', updateError)
    // Rollback profile creation
    await adminClient.from('profiles').delete().eq('id', profileId)
    return { error: 'Failed to update registration status' }
  }

  revalidatePath('/dashboard/people/pending')
  revalidatePath('/dashboard/people')

  return { success: true }
}

export async function rejectRegistration(registrationId: string, reason?: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Leaders and above can reject registrations
  const permError = requireManagePermission(profile.role, 'reject registrations')
  if (permError) return { error: permError }

  const userIsLeader = isLeader(profile.role)

  // Get the pending registration
  const { data: registration, error: fetchError } = await adminClient
    .from('pending_registrations')
    .select('*')
    .eq('id', registrationId)
    .eq('church_id', profile.church_id)
    .single()

  if (fetchError || !registration) {
    return { error: 'Registration not found' }
  }

  if (registration.status !== 'pending') {
    return { error: 'Registration has already been processed' }
  }

  // For leaders, verify they can only reject registrations for their campus
  if (userIsLeader) {
    const leaderCampusIds = await getUserCampusIds(profile.id, adminClient)
    if (!registration.campus_id || !leaderCampusIds.includes(registration.campus_id)) {
      return { error: 'You can only reject registrations for your campus' }
    }
  }

  // Update registration status to rejected
  const { error: updateError } = await adminClient
    .from('pending_registrations')
    .update({
      status: 'rejected',
      rejection_reason: reason || null,
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', registrationId)

  if (updateError) {
    console.error('Error rejecting registration:', updateError)
    return { error: 'Failed to reject registration' }
  }

  revalidatePath('/dashboard/people/pending')

  return { success: true }
}

export async function linkRegistrationToProfile(registrationId: string, profileId: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile: currentProfile, adminClient } = auth

  // Only admins can link registrations
  const permError = requireAdminPermission(currentProfile.role, 'link registrations')
  if (permError) return { error: permError }

  // Get the pending registration
  const { data: registration, error: fetchError } = await adminClient
    .from('pending_registrations')
    .select('*')
    .eq('id', registrationId)
    .eq('church_id', currentProfile.church_id)
    .single()

  if (fetchError || !registration) {
    return { error: 'Registration not found' }
  }

  if (registration.status !== 'pending') {
    return { error: 'Registration has already been processed' }
  }

  // Get the target profile (must be offline member in same church)
  const { data: targetProfile, error: profileFetchError } = await adminClient
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .eq('church_id', currentProfile.church_id)
    .single()

  if (profileFetchError || !targetProfile) {
    return { error: 'Target profile not found' }
  }

  if (targetProfile.member_type !== 'offline') {
    return { error: 'Can only link to offline members' }
  }

  if (targetProfile.user_id) {
    return { error: 'This member already has an account linked' }
  }

  // Update the profile to link it to the user
  // Overwrite with registration data and clear departure fields (user is rejoining)
  const { error: linkError } = await adminClient
    .from('profiles')
    .update({
      user_id: registration.user_id,
      member_type: 'authenticated',
      email: registration.email,
      phone: registration.phone || targetProfile.phone || null,
      date_of_birth: registration.date_of_birth || targetProfile.date_of_birth || null,
      sex: registration.sex || targetProfile.sex || null,
      active: true,
      date_of_departure: null,
      reason_for_departure: null,
    })
    .eq('id', profileId)

  if (linkError) {
    console.error('Error linking profile:', linkError)
    return { error: 'Failed to link profile to user' }
  }

  // If registration has campus_id, add to profile_campuses if not already assigned
  if (registration.campus_id) {
    // Check if profile already has this campus
    const { data: existingCampus } = await adminClient
      .from('profile_campuses')
      .select('id')
      .eq('profile_id', profileId)
      .eq('campus_id', registration.campus_id)
      .single()

    if (!existingCampus) {
      // Check if profile has any campuses
      const { data: anyCampus } = await adminClient
        .from('profile_campuses')
        .select('id')
        .eq('profile_id', profileId)
        .limit(1)
        .single()

      const { error: campusError } = await adminClient
        .from('profile_campuses')
        .insert({
          profile_id: profileId,
          campus_id: registration.campus_id,
          is_primary: !anyCampus, // Make primary if first campus
        })

      if (campusError) {
        console.error('Error assigning campus to linked profile:', campusError)
        // Continue anyway
      }
    }
  }

  // Update registration status
  const { error: updateError } = await adminClient
    .from('pending_registrations')
    .update({
      status: 'linked',
      linked_profile_id: profileId,
      reviewed_by: currentProfile.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', registrationId)

  if (updateError) {
    console.error('Error updating registration:', updateError)
    return { error: 'Failed to update registration status' }
  }

  revalidatePath('/dashboard/people/pending')
  revalidatePath('/dashboard/people')

  return { success: true }
}

export async function getOfflineMembers() {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Only admins can view offline members for linking
  const permError = requireAdminPermission(profile.role, 'view members')
  if (permError) return { error: permError }

  const { data, error } = await adminClient
    .from('profiles')
    .select('id, first_name, last_name, email, date_of_birth')
    .eq('church_id', profile.church_id)
    .eq('member_type', 'offline')
    .is('user_id', null)
    .order('first_name', { ascending: true })

  if (error) {
    console.error('Error fetching offline members:', error)
    return { error: 'Failed to fetch offline members' }
  }

  return { data }
}
