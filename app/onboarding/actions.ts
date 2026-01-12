'use server'

import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import {
  createChurchSchema,
  joinChurchSchema,
  completeProfileSchema,
  type CreateChurchInput,
  type JoinChurchInput,
  type CompleteProfileInput,
} from '@/lib/validations/onboarding'
import { notifyLeadersOfPendingMember } from '@/lib/notifications/pending-member'
import { isReservedSubdomain } from '@/lib/constants/subdomains'

// Helper function to generate a URL-safe slug from a string
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Replace multiple hyphens with single
    .substring(0, 20)         // Limit length
}

// Helper function to generate random alphanumeric string
function generateRandomCode(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Check if a subdomain is available
export async function checkSubdomainAvailability(subdomain: string): Promise<{ available: boolean; error?: string }> {
  // Basic validation
  if (!subdomain || subdomain.length < 3) {
    return { available: false, error: 'Subdomain must be at least 3 characters' }
  }

  if (subdomain.length > 30) {
    return { available: false, error: 'Subdomain must be 30 characters or less' }
  }

  // Check format
  const validFormat = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(subdomain)
  if (!validFormat) {
    return { available: false, error: 'Invalid format' }
  }

  // Check if subdomain is reserved
  if (isReservedSubdomain(subdomain)) {
    return { available: false, error: 'This subdomain is reserved' }
  }

  const adminClient = createServiceRoleClient()

  const { data: existing } = await adminClient
    .from('churches')
    .select('id')
    .eq('subdomain', subdomain)
    .single()

  return { available: !existing }
}

export async function createChurch(data: CreateChurchInput) {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    console.error('Auth error:', authError)
    return { error: 'You must be signed in to create a church' }
  }

  // Get user info from metadata (set during signup)
  const firstName = user.user_metadata?.first_name
  const lastName = user.user_metadata?.last_name

  if (!firstName || !lastName) {
    return { error: 'User profile information is missing. Please sign up again.' }
  }

  // Validate inputs
  const validatedChurch = createChurchSchema.safeParse(data)
  if (!validatedChurch.success) {
    console.error('Validation error:', validatedChurch.error)
    return { error: 'Invalid church data provided' }
  }

  // Use service role client for database operations (bypasses RLS)
  // This is needed because user doesn't have a profile yet (chicken-and-egg problem)
  const adminClient = createServiceRoleClient()

  // Check if user already has a profile (can only be in one church)
  const { data: existingProfile } = await adminClient
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (existingProfile) {
    return { error: 'You are already a member of a church.' }
  }

  // Use user-provided subdomain (already validated)
  const subdomain = validatedChurch.data.subdomain

  // Double-check subdomain availability before creating
  const availabilityCheck = await checkSubdomainAvailability(subdomain)
  if (!availabilityCheck.available) {
    return { error: availabilityCheck.error || 'This subdomain is not available' }
  }

  // Generate a unique join code using the database function
  const { data: joinCodeResult, error: joinCodeError } = await adminClient
    .rpc('generate_unique_join_code')

  if (joinCodeError || !joinCodeResult) {
    console.error('Join code generation error:', joinCodeError)
    return { error: 'Failed to generate join code. Please try again.' }
  }

  // Create church with auto-generated subdomain and join_code
  const { data: church, error: churchError } = await adminClient
    .from('churches')
    .insert({
      name: validatedChurch.data.name,
      subdomain: subdomain,
      join_code: joinCodeResult,
      address: validatedChurch.data.address,
      city: validatedChurch.data.city,
      state: validatedChurch.data.state,
      zip_code: validatedChurch.data.zipCode,
      country: validatedChurch.data.country,
      phone: validatedChurch.data.phone,
      email: validatedChurch.data.email,
      timezone: validatedChurch.data.timezone,
    })
    .select()
    .single()

  if (churchError || !church) {
    console.error('Church creation error:', churchError)
    return { error: 'Failed to create church. Please try again.' }
  }

  // Create owner profile (church creator is always the owner)
  // Generate a new UUID for profile.id, and set user_id to link to auth.users
  const profileId = crypto.randomUUID()
  const { error: profileError } = await adminClient
    .from('profiles')
    .insert({
      id: profileId,
      user_id: user.id,
      church_id: church.id,
      role: 'owner',
      first_name: firstName,
      last_name: lastName,
      email: user.email!,
      phone: data.phone,
      member_type: 'authenticated',
    })

  if (profileError) {
    console.error('Profile creation error:', profileError)
    // Rollback: delete the church if profile creation fails
    await adminClient.from('churches').delete().eq('id', church.id)
    return { error: 'Failed to create your profile. Please try again.' }
  }

  // Create default campus for the church
  const { data: defaultCampus, error: campusError } = await adminClient
    .from('campuses')
    .insert({
      church_id: church.id,
      name: 'Main Campus',
      description: `Default campus for ${validatedChurch.data.name}`,
      address: validatedChurch.data.address || null,
      city: validatedChurch.data.city || null,
      state: validatedChurch.data.state || null,
      zip_code: validatedChurch.data.zipCode || null,
      country: validatedChurch.data.country || null,
      color: '#3B82F6', // Blue color
      is_default: true,
      is_active: true,
    })
    .select()
    .single()

  if (campusError) {
    console.error('Campus creation error:', campusError)
    // Continue anyway - this is not critical for church creation
  }

  // Assign owner to the default campus
  if (defaultCampus) {
    const { error: profileCampusError } = await adminClient
      .from('profile_campuses')
      .insert({
        profile_id: profileId,
        campus_id: defaultCampus.id,
        is_primary: true,
      })

    if (profileCampusError) {
      console.error('Profile campus assignment error:', profileCampusError)
      // Continue anyway
    }
  }

  // Create default Worship ministry (system ministry that cannot be deleted)
  const { data: worshipMinistry, error: ministryError } = await adminClient
    .from('ministries')
    .insert({
      church_id: church.id,
      name: 'Worship',
      description: 'Worship team ministry for music and praise',
      leader_id: profileId,
      color: '#8B5CF6', // Purple color for worship
      is_system: true,
      campus_id: defaultCampus?.id || null,
    })
    .select()
    .single()

  if (ministryError) {
    console.error('Ministry creation error:', ministryError)
    // Continue anyway - this is not critical
  }

  // Create default worship roles if ministry was created
  if (worshipMinistry) {
    const defaultRoles = [
      { ministry_id: worshipMinistry.id, name: 'Worship Leader', sort_order: 0 },
      { ministry_id: worshipMinistry.id, name: 'Vocalist', sort_order: 1 },
      { ministry_id: worshipMinistry.id, name: 'Keys', sort_order: 2 },
      { ministry_id: worshipMinistry.id, name: 'Bass', sort_order: 3 },
      { ministry_id: worshipMinistry.id, name: 'Electric Guitar', sort_order: 4 },
      { ministry_id: worshipMinistry.id, name: 'Acoustic Guitar', sort_order: 5 },
      { ministry_id: worshipMinistry.id, name: 'Drums', sort_order: 6 },
    ]

    const { error: rolesError } = await adminClient
      .from('ministry_roles')
      .insert(defaultRoles)

    if (rolesError) {
      console.error('Default roles creation error:', rolesError)
      // Continue anyway - roles can be added later
    }

    // Add church creator as a member of the Worship ministry
    const { error: memberError } = await adminClient
      .from('ministry_members')
      .insert({
        ministry_id: worshipMinistry.id,
        profile_id: profileId,
      })

    if (memberError) {
      console.error('Ministry member creation error:', memberError)
      // Continue anyway - member can be added later
    }
  }

  return { success: true }
}

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

  // Notify church leaders about the new pending member
  notifyLeadersOfPendingMember(
    { id: church.id, name: church.name },
    { firstName, lastName, email: user.email! }
  ).catch((err) => console.error('[Notification] Error notifying leaders of pending member:', err))

  return { success: true, pending: true }
}

export async function checkUserProfile() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { hasProfile: false }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  return { hasProfile: !!profile }
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
