'use server'

import { createServiceRoleClient } from '@/lib/supabase/server'
import { subMonths, startOfMonth, format } from 'date-fns'

export interface UserWithChurch {
  id: string
  user_id: string | null
  first_name: string
  last_name: string
  email: string | null
  role: string
  active: boolean
  is_super_admin: boolean | null
  created_at: string
  updated_at: string
  church: {
    id: string
    name: string
    subdomain: string
  } | null
}

export async function getUsers(): Promise<{
  data?: UserWithChurch[]
  error?: string
}> {
  const adminClient = createServiceRoleClient()

  const { data: users, error } = await adminClient
    .from('profiles')
    .select(`
      id,
      user_id,
      first_name,
      last_name,
      email,
      role,
      active,
      is_super_admin,
      created_at,
      updated_at,
      church:churches (
        id,
        name,
        subdomain
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching users:', error)
    return { error: 'Failed to fetch users' }
  }

  // Transform the data to match our interface (Supabase returns church as array)
  const transformedUsers = users?.map((user) => ({
    ...user,
    church: Array.isArray(user.church) ? user.church[0] || null : user.church,
  })) as UserWithChurch[]

  return { data: transformedUsers }
}

export async function getUserDetails(userId: string): Promise<{
  data?: {
    user: UserWithChurch & {
      phone: string | null
      date_of_birth: string | null
      bio: string | null
      avatar_url: string | null
      language: string | null
    }
    stats: {
      eventsAttended: number
      ministriesJoined: number
      formsSubmitted: number
    }
    ministries: {
      id: string
      name: string
      role: string
    }[]
  }
  error?: string
}> {
  const adminClient = createServiceRoleClient()

  // Get user details
  const { data: user, error: userError } = await adminClient
    .from('profiles')
    .select(`
      id,
      user_id,
      first_name,
      last_name,
      email,
      phone,
      role,
      active,
      is_super_admin,
      date_of_birth,
      bio,
      avatar_url,
      language,
      created_at,
      updated_at,
      church:churches (
        id,
        name,
        subdomain
      )
    `)
    .eq('id', userId)
    .single()

  if (userError || !user) {
    return { error: 'User not found' }
  }

  // Get events attended count
  const { count: eventsAttended } = await adminClient
    .from('event_assignments')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', userId)

  // Get ministries
  const { data: ministryMembers } = await adminClient
    .from('ministry_members')
    .select(`
      ministry_id,
      role,
      ministry:ministries (
        id,
        name
      )
    `)
    .eq('profile_id', userId)

  const ministries = ministryMembers?.map((mm) => {
    // Supabase returns relations as arrays, extract the first item
    const ministry = Array.isArray(mm.ministry) ? mm.ministry[0] : mm.ministry
    return {
      id: ministry?.id || '',
      name: ministry?.name || '',
      role: mm.role,
    }
  }) || []

  // Get forms submitted count
  const { count: formsSubmitted } = await adminClient
    .from('form_responses')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', userId)

  // Transform user data to match expected interface
  const transformedUser = {
    ...user,
    church: Array.isArray(user.church) ? user.church[0] || null : user.church,
  }

  return {
    data: {
      user: transformedUser,
      stats: {
        eventsAttended: eventsAttended || 0,
        ministriesJoined: ministries.length,
        formsSubmitted: formsSubmitted || 0,
      },
      ministries,
    },
  }
}

export async function toggleSuperAdmin(userId: string, isSuperAdmin: boolean): Promise<{
  success?: boolean
  error?: string
}> {
  const adminClient = createServiceRoleClient()

  const { error } = await adminClient
    .from('profiles')
    .update({ is_super_admin: isSuperAdmin })
    .eq('id', userId)

  if (error) {
    console.error('Error updating super admin status:', error)
    return { error: 'Failed to update super admin status' }
  }

  return { success: true }
}

export interface GrowthDataPoint {
  month: string
  count: number
  cumulative: number
}

export async function getUsersGrowthData(): Promise<{
  data?: GrowthDataPoint[]
  error?: string
}> {
  const adminClient = createServiceRoleClient()

  // Get all users with their created_at dates
  const { data: users, error } = await adminClient
    .from('profiles')
    .select('created_at')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching users growth data:', error)
    return { error: 'Failed to fetch growth data' }
  }

  if (!users || users.length === 0) {
    return { data: [] }
  }

  // Generate last 12 months
  const months: GrowthDataPoint[] = []
  const now = new Date()

  for (let i = 11; i >= 0; i--) {
    const monthDate = startOfMonth(subMonths(now, i))
    const monthKey = format(monthDate, 'yyyy-MM')
    const monthLabel = format(monthDate, 'MMM yyyy')

    // Count users created in this month
    const count = users.filter((u) => {
      const createdMonth = format(new Date(u.created_at), 'yyyy-MM')
      return createdMonth === monthKey
    }).length

    // Calculate cumulative (total up to and including this month)
    const endOfMonth = new Date(monthDate)
    endOfMonth.setMonth(endOfMonth.getMonth() + 1)
    const cumulative = users.filter(
      (u) => new Date(u.created_at) < endOfMonth
    ).length

    months.push({
      month: monthLabel,
      count,
      cumulative,
    })
  }

  return { data: months }
}
