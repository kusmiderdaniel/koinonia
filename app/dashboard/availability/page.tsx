import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { hasPageAccess } from '@/lib/permissions'
import { AvailabilityPageClient } from './AvailabilityPageClient'

export default async function AvailabilityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Check page access
  const adminClient = createServiceRoleClient()
  const { data: profile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!profile || !hasPageAccess(profile.role, 'availability')) {
    redirect('/dashboard')
  }

  return <AvailabilityPageClient />
}
