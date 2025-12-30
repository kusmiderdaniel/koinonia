import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from './sidebar'

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

  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar
        user={{
          firstName: profile.first_name,
          lastName: profile.last_name,
          email: profile.email,
          role: profile.role,
        }}
        churchName={profile.church.name}
      />
      <main className="pl-64">
        {children}
      </main>
    </div>
  )
}
