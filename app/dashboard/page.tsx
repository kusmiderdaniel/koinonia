import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getMyAssignments, getUpcomingEvents } from './actions'
import { MyAssignmentsWidget } from '@/components/dashboard/MyAssignmentsWidget'
import { UpcomingEventsWidget } from '@/components/dashboard/UpcomingEventsWidget'

export default async function DashboardPage() {
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

  // Fetch dashboard data
  const [assignmentsResult, eventsResult] = await Promise.all([
    getMyAssignments(),
    getUpcomingEvents(),
  ])

  const assignments = assignmentsResult.data || []
  const events = eventsResult.data || []

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Welcome back, {profile.first_name}!</h1>
        <p className="text-muted-foreground">Here's what's happening at {profile.church.name}</p>
      </div>

      {/* Widgets Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        <MyAssignmentsWidget assignments={assignments} />
        <UpcomingEventsWidget events={events} />
      </div>
    </div>
  )
}
