import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from './sidebar'
import { MobileHeader } from './MobileHeader'
import { MobileSidebar } from './MobileSidebar'
import { MainContent } from './MainContent'
import { PushNotificationProvider } from '@/components/PushNotificationProvider'
import { PushPermissionBanner } from '@/components/PushPermissionBanner'
import { PWARefreshButton } from '@/components/PWARefreshButton'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/signin')
  }

  const adminClient = createServiceRoleClient()

  const { data: profile } = await adminClient
    .from('profiles')
    .select('*, church:churches(*)')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    redirect('/onboarding')
  }

  const userProps = {
    firstName: profile.first_name,
    lastName: profile.last_name,
    email: profile.email,
    role: profile.role,
    isSuperAdmin: profile.is_super_admin === true,
  }

  return (
    <PushNotificationProvider>
      <div className="min-h-screen bg-muted/30">
        {/* Mobile Header - shown only on mobile */}
        <MobileHeader churchName={profile.church.name} churchLogoUrl={profile.church.logo_url} />

        {/* Desktop Sidebar - hidden on mobile */}
        <Sidebar
          user={userProps}
          churchName={profile.church.name}
          churchLogoUrl={profile.church.logo_url}
          className="hidden md:flex"
        />

        {/* Mobile Sidebar Drawer */}
        <MobileSidebar
          user={userProps}
          churchName={profile.church.name}
          churchLogoUrl={profile.church.logo_url}
        />

        {/* Main content - responsive padding */}
        <MainContent>
          {children}
        </MainContent>

        {/* Push notification permission banner */}
        <PushPermissionBanner />

        {/* Refresh button for standalone PWA mode */}
        <PWARefreshButton />
      </div>
    </PushNotificationProvider>
  )
}
