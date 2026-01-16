'use server'

import { headers } from 'next/headers'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import {
  createChurchSchema,
  type CreateChurchInput,
} from '@/lib/validations/onboarding'
import { checkSubdomainAvailability } from './validation'

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

  // Record DPA and Admin Terms consent
  const headersList = await headers()
  const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0] ||
                    headersList.get('x-real-ip') ||
                    null
  const userAgent = headersList.get('user-agent') || null

  // Get current legal documents
  const { data: dpaDoc } = await adminClient
    .from('legal_documents')
    .select('id, version')
    .eq('document_type', 'dpa')
    .eq('is_current', true)
    .single()

  const { data: adminTermsDoc } = await adminClient
    .from('legal_documents')
    .select('id, version')
    .eq('document_type', 'church_admin_terms')
    .eq('is_current', true)
    .single()

  // Record consents (linked to the church)
  const consents = [
    {
      user_id: user.id,
      church_id: church.id,
      consent_type: 'dpa',
      document_id: dpaDoc?.id || null,
      document_version: dpaDoc?.version || null,
      action: 'granted',
      ip_address: ipAddress,
      user_agent: userAgent,
    },
    {
      user_id: user.id,
      church_id: church.id,
      consent_type: 'church_admin_terms',
      document_id: adminTermsDoc?.id || null,
      document_version: adminTermsDoc?.version || null,
      action: 'granted',
      ip_address: ipAddress,
      user_agent: userAgent,
    },
  ]

  await adminClient.from('consent_records').insert(consents)

  return { success: true }
}
