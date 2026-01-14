export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { SettingsPageClient } from './SettingsPageClient'
import { hasPageAccess } from '@/lib/permissions'
import type { ChurchSettingsData, Location, Member } from './types'
import type { Campus } from './actions'

interface PageProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function SettingsPage({ searchParams }: PageProps) {
  const { tab } = await searchParams
  // Get authenticated user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Get user's profile with church context
  const adminClient = createServiceRoleClient()
  const { data: profile } = await adminClient
    .from('profiles')
    .select('id, church_id, role')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    redirect('/onboarding')
  }

  // Check page access - block leaders, volunteers, and members from settings page
  if (!hasPageAccess(profile.role, 'settings')) {
    redirect('/dashboard')
  }

  // Fetch church settings
  const { data: church } = await adminClient
    .from('churches')
    .select('id, name, subdomain, join_code, timezone, time_format, first_day_of_week, default_event_visibility, links_page_enabled, logo_url, address, city, state, zip_code, country, phone, email, website, created_at, updated_at')
    .eq('id', profile.church_id)
    .single()

  if (!church) {
    redirect('/dashboard')
  }

  // Fetch church members (excluding self) for ownership transfer
  const { data: members } = await adminClient
    .from('profiles')
    .select('id, first_name, last_name, email, role')
    .eq('church_id', profile.church_id)
    .neq('id', profile.id)
    .order('first_name')

  // Fetch locations with campus info
  const { data: locations } = await adminClient
    .from('locations')
    .select(`
      *,
      campus:campuses (
        id,
        name,
        color
      )
    `)
    .eq('church_id', profile.church_id)
    .eq('is_active', true)
    .order('name')

  // Fetch campuses
  const { data: campuses } = await adminClient
    .from('campuses')
    .select('id, church_id, name, description, address, city, state, zip_code, country, color, is_default, is_active, created_at, updated_at')
    .eq('church_id', profile.church_id)
    .eq('is_active', true)
    .order('is_default', { ascending: false })
    .order('name')

  // Fetch agenda presets and ministries for presets tab (admin only)
  const [presetsResult, ministriesResult] = await Promise.all([
    adminClient
      .from('agenda_item_presets')
      .select(`
        *,
        ministry:ministries (id, name, color)
      `)
      .eq('church_id', profile.church_id)
      .eq('is_active', true)
      .order('title'),
    adminClient
      .from('ministries')
      .select('id, name, color')
      .eq('church_id', profile.church_id)
      .eq('is_active', true)
      .order('name'),
  ])

  const presets = presetsResult.data || []
  const ministries = ministriesResult.data || []

  // Build the church settings data with role
  const churchSettings: ChurchSettingsData = {
    name: church.name,
    subdomain: church.subdomain,
    join_code: church.join_code,
    role: profile.role,
    address: church.address,
    city: church.city,
    country: church.country,
    zip_code: church.zip_code,
    phone: church.phone,
    email: church.email,
    website: church.website,
    timezone: church.timezone,
    first_day_of_week: church.first_day_of_week,
    time_format: church.time_format as '12h' | '24h',
    default_event_visibility: church.default_event_visibility,
    logo_url: church.logo_url,
  }

  return (
    <SettingsPageClient
      initialData={{
        church: churchSettings,
        members: (members || []) as Member[],
        locations: (locations || []) as Location[],
        campuses: (campuses || []) as Campus[],
        presets: presets as { id: string; title: string; description: string | null; duration_seconds: number; ministry_id: string | null; ministry: { id: string; name: string; color: string } | null }[],
        ministries: ministries as { id: string; name: string; color: string }[],
      }}
      defaultTab={tab}
    />
  )
}
