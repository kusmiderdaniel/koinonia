import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { hasPageAccess } from '@/lib/permissions'
import { getSettings, getLinks, getAnalytics, getChurchInfo } from './actions'
import { LinksPageClient } from './LinksPageClient'

export default async function LinksPage() {
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

  if (!profile || !hasPageAccess(profile.role, 'links')) {
    redirect('/dashboard')
  }

  const [settingsResult, linksResult, analyticsResult, churchInfoResult] = await Promise.all([
    getSettings(),
    getLinks(),
    getAnalytics(),
    getChurchInfo(),
  ])

  return (
    <LinksPageClient
      initialSettings={settingsResult.settings}
      initialLinks={linksResult.links}
      initialAnalytics={analyticsResult.analytics}
      churchSubdomain={churchInfoResult.subdomain}
      churchName={churchInfoResult.name}
      churchLogo={churchInfoResult.logoUrl}
      linksPageEnabled={churchInfoResult.linksPageEnabled}
    />
  )
}
