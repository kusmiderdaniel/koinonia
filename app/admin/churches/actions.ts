'use server'

import { subMonths, startOfMonth, format } from 'date-fns'
import { requireSuperAdmin, isAdminAuthError } from '@/lib/utils/admin-auth'

export interface ChurchWithStats {
  id: string
  name: string
  subdomain: string
  email: string | null
  phone: string | null
  city: string | null
  country: string | null
  website: string | null
  logo_url: string | null
  created_at: string
  updated_at: string
  member_count: number
  owner: {
    id: string
    first_name: string
    last_name: string
    email: string | null
  } | null
}

export async function getChurches(): Promise<{
  data?: ChurchWithStats[]
  error?: string
}> {
  const auth = await requireSuperAdmin()
  if (isAdminAuthError(auth)) return { error: auth.error }

  const { adminClient } = auth

  // Get all churches
  const { data: churches, error: churchesError } = await adminClient
    .from('churches')
    .select('id, name, subdomain, email, phone, city, country, website, logo_url, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (churchesError) {
    console.error('Error fetching churches:', churchesError)
    return { error: 'Failed to fetch churches' }
  }

  if (!churches) {
    return { data: [] }
  }

  // Get member counts and owners for each church
  const churchesWithStats: ChurchWithStats[] = await Promise.all(
    churches.map(async (church) => {
      // Get member count
      const { count: memberCount } = await adminClient
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('church_id', church.id)
        .eq('active', true)

      // Get owner
      const { data: owner } = await adminClient
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('church_id', church.id)
        .eq('role', 'owner')
        .limit(1)
        .single()

      return {
        ...church,
        member_count: memberCount || 0,
        owner: owner || null,
      }
    })
  )

  return { data: churchesWithStats }
}

export async function getChurchDetails(churchId: string): Promise<{
  data?: {
    church: ChurchWithStats
    members: {
      id: string
      first_name: string
      last_name: string
      email: string | null
      role: string
      created_at: string
    }[]
    stats: {
      totalEvents: number
      totalMinistries: number
      totalForms: number
    }
  }
  error?: string
}> {
  const auth = await requireSuperAdmin()
  if (isAdminAuthError(auth)) return { error: auth.error }

  const { adminClient } = auth

  // Get church details
  const { data: church, error: churchError } = await adminClient
    .from('churches')
    .select('id, name, subdomain, email, phone, city, country, website, logo_url, created_at, updated_at')
    .eq('id', churchId)
    .single()

  if (churchError || !church) {
    return { error: 'Church not found' }
  }

  // Get members
  const { data: members } = await adminClient
    .from('profiles')
    .select('id, first_name, last_name, email, role, created_at')
    .eq('church_id', churchId)
    .eq('active', true)
    .order('role', { ascending: true })
    .order('created_at', { ascending: false })

  // Get member count
  const { count: memberCount } = await adminClient
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('church_id', churchId)
    .eq('active', true)

  // Get owner
  const owner = members?.find((m) => m.role === 'owner') || null

  // Get stats
  const { count: totalEvents } = await adminClient
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('church_id', churchId)

  const { count: totalMinistries } = await adminClient
    .from('ministries')
    .select('*', { count: 'exact', head: true })
    .eq('church_id', churchId)

  const { count: totalForms } = await adminClient
    .from('forms')
    .select('*', { count: 'exact', head: true })
    .eq('church_id', churchId)

  return {
    data: {
      church: {
        ...church,
        member_count: memberCount || 0,
        owner: owner
          ? {
              id: owner.id,
              first_name: owner.first_name,
              last_name: owner.last_name,
              email: owner.email,
            }
          : null,
      },
      members: members || [],
      stats: {
        totalEvents: totalEvents || 0,
        totalMinistries: totalMinistries || 0,
        totalForms: totalForms || 0,
      },
    },
  }
}

export interface GrowthDataPoint {
  month: string
  count: number
  cumulative: number
}

export async function getChurchesGrowthData(): Promise<{
  data?: GrowthDataPoint[]
  error?: string
}> {
  const auth = await requireSuperAdmin()
  if (isAdminAuthError(auth)) return { error: auth.error }

  const { adminClient } = auth

  // Get all churches with their created_at dates
  const { data: churches, error } = await adminClient
    .from('churches')
    .select('created_at')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching churches growth data:', error)
    return { error: 'Failed to fetch growth data' }
  }

  if (!churches || churches.length === 0) {
    return { data: [] }
  }

  // Generate last 12 months
  const months: GrowthDataPoint[] = []
  const now = new Date()

  for (let i = 11; i >= 0; i--) {
    const monthDate = startOfMonth(subMonths(now, i))
    const monthKey = format(monthDate, 'yyyy-MM')
    const monthLabel = format(monthDate, 'MMM yyyy')

    // Count churches created in this month
    const count = churches.filter((c) => {
      const createdMonth = format(new Date(c.created_at), 'yyyy-MM')
      return createdMonth === monthKey
    }).length

    // Calculate cumulative (total up to and including this month)
    const endOfMonth = new Date(monthDate)
    endOfMonth.setMonth(endOfMonth.getMonth() + 1)
    const cumulative = churches.filter(
      (c) => new Date(c.created_at) < endOfMonth
    ).length

    months.push({
      month: monthLabel,
      count,
      cumulative,
    })
  }

  return { data: months }
}
