import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { MinistriesPageClient } from './MinistriesPageClient'
import type { Ministry } from './types'

export default async function MinistriesPage() {
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

  // Fetch ministries server-side
  const { data: ministries } = await adminClient
    .from('ministries')
    .select(`
      *,
      leader:profiles!leader_id (
        id,
        first_name,
        last_name,
        email
      )
    `)
    .eq('church_id', profile.church_id)
    .order('name')

  return (
    <MinistriesPageClient
      initialData={{
        ministries: (ministries || []) as Ministry[],
        role: profile.role,
      }}
    />
  )
}
