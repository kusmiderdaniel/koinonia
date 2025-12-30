import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { SettingsPageClient } from './SettingsPageClient'
import type { ChurchSettingsData, Location, Member } from './types'

export default async function SettingsPage() {
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

  // Fetch church settings
  const { data: church } = await adminClient
    .from('churches')
    .select('*')
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

  // Fetch locations
  const { data: locations } = await adminClient
    .from('locations')
    .select('*')
    .eq('church_id', profile.church_id)
    .eq('is_active', true)
    .order('name')

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
    default_event_visibility: church.default_event_visibility,
  }

  return (
    <SettingsPageClient
      initialData={{
        church: churchSettings,
        members: (members || []) as Member[],
        locations: (locations || []) as Location[],
      }}
    />
  )
}
