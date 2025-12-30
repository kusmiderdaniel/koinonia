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

  // Auto-generate subdomain from church name with random suffix for uniqueness
  const baseSubdomain = slugify(validatedChurch.data.name)
  const randomSuffix = generateRandomCode(4).toLowerCase()
  const subdomain = `${baseSubdomain}-${randomSuffix}`

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

export async function joinChurch(data: JoinChurchInput & { phone?: string }) {
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

  // Check if user already has a profile (might be joining a different church or re-joining)
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
      status: 'pending',
    })

  if (pendingError) {
    console.error('Pending registration creation error:', pendingError)
    return { error: 'Failed to submit your registration. Please try again.' }
  }

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
