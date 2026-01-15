'use server'

import { createServiceRoleClient } from '@/lib/supabase/server'

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
  const adminClient = createServiceRoleClient()

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
  const adminClient = createServiceRoleClient()

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
