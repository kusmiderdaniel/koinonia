'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createChurch(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const address = formData.get('address') as string
  const city = formData.get('city') as string
  const state = formData.get('state') as string
  const zipCode = formData.get('zip_code') as string

  // Validate required fields
  if (!name) {
    return { error: 'Church name is required' }
  }

  // Generate slug from name
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  // Use the database function to create church and assign owner atomically
  // This bypasses RLS issues where users can't SELECT their newly created church
  const { data, error } = await supabase.rpc('create_church_with_owner', {
    p_name: name,
    p_slug: slug,
    p_email: email || null,
    p_phone: phone || null,
    p_address: address || null,
    p_city: city || null,
    p_state: state || null,
    p_zip_code: zipCode || null,
  })

  if (error) {
    return { error: error.message }
  }

  if (!data || data.length === 0) {
    return { error: 'Failed to create church' }
  }

  const result = data[0]

  revalidatePath('/dashboard')
  return {
    success: true,
    churchId: result.church_id,
    inviteCode: result.invite_code
  }
}

export async function joinChurch(inviteCode: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  if (!inviteCode || inviteCode.length !== 6) {
    return { error: 'Invalid invite code' }
  }

  // Find church by invite code
  const { data: church, error: churchError } = await supabase
    .from('churches')
    .select('id, name')
    .eq('invite_code', inviteCode.toUpperCase())
    .single()

  if (churchError || !church) {
    return { error: 'Invalid invite code' }
  }

  // Check if user is already a member of this church
  const { data: existingMembership } = await supabase
    .from('church_members')
    .select('id')
    .eq('user_id', user.id)
    .eq('church_id', church.id)
    .single()

  if (existingMembership) {
    // Already a member, just set as active church
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ church_id: church.id })
      .eq('id', user.id)

    if (profileError) {
      return { error: profileError.message }
    }

    revalidatePath('/dashboard')
    return { success: true, churchId: church.id, churchName: church.name }
  }

  // Add user as a member in church_members table
  const { error: memberError } = await supabase
    .from('church_members')
    .insert({
      user_id: user.id,
      church_id: church.id,
      role: 'member',
    })

  if (memberError) {
    return { error: memberError.message }
  }

  // Set this as the user's active church
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ church_id: church.id })
    .eq('id', user.id)

  if (profileError) {
    return { error: profileError.message }
  }

  revalidatePath('/dashboard')
  return { success: true, churchId: church.id, churchName: church.name }
}

export async function switchChurch(churchId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify user is a member of this church
  const { data: membership, error: membershipError } = await supabase
    .from('church_members')
    .select('id')
    .eq('user_id', user.id)
    .eq('church_id', churchId)
    .single()

  if (membershipError || !membership) {
    return { error: 'You are not a member of this church' }
  }

  // Update user's active church
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ church_id: churchId })
    .eq('id', user.id)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function getUserChurches() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated', churches: [] }
  }

  // Get all churches the user is a member of
  const { data: memberships, error } = await supabase
    .from('church_members')
    .select(`
      church_id,
      role,
      joined_at,
      churches!inner (
        id,
        name
      )
    `)
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })

  if (error) {
    console.error('Error fetching user churches:', error)
    return { error: error.message, churches: [] }
  }

  if (!memberships || memberships.length === 0) {
    return { churches: [] }
  }

  const churches = memberships.map((m: any) => ({
    id: m.churches.id,
    name: m.churches.name,
    role: m.role,
  }))

  return { churches }
}

export async function regenerateInviteCode() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Get user's profile with church
  const { data: profile } = await supabase
    .from('profiles')
    .select('church_id')
    .eq('id', user.id)
    .single()

  if (!profile?.church_id) {
    return { error: 'Not a member of any church' }
  }

  // Check if user is owner or admin of the current church
  const { data: membership } = await supabase
    .from('church_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('church_id', profile.church_id)
    .single()

  if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
    return { error: 'Only church owners and admins can regenerate invite codes' }
  }

  // Generate new unique invite code
  const { data: inviteCodeData, error: inviteCodeError } = await supabase.rpc(
    'generate_unique_invite_code'
  )

  if (inviteCodeError || !inviteCodeData) {
    return { error: 'Failed to generate invite code' }
  }

  // Update church with new invite code
  const { error: updateError } = await supabase
    .from('churches')
    .update({
      invite_code: inviteCodeData,
      invite_code_generated_at: new Date().toISOString(),
    })
    .eq('id', profile.church_id)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/dashboard')
  return { success: true, inviteCode: inviteCodeData }
}
