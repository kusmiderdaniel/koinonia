import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getMyAssignments, getUpcomingEvents, getMyTasks } from './actions'
import { MyAssignmentsWidget } from '@/components/dashboard/MyAssignmentsWidget'
import { UpcomingEventsWidget } from '@/components/dashboard/UpcomingEventsWidget'
import { UnavailabilityWidget } from '@/components/dashboard/UnavailabilityWidget'
import { MyTasksWidget } from '@/components/dashboard/MyTasksWidget'

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
  const [assignmentsResult, eventsResult, tasksResult, membersData, ministriesData, campusesData, allEventsData] = await Promise.all([
    getMyAssignments(),
    getUpcomingEvents(),
    getMyTasks(),
    adminClient
      .from('profiles')
      .select('id, first_name, last_name, email')
      .eq('church_id', profile.church_id)
      .eq('is_active', true)
      .order('first_name'),
    adminClient
      .from('ministries')
      .select('id, name, color, campus_id')
      .eq('church_id', profile.church_id)
      .eq('is_active', true)
      .order('name'),
    adminClient
      .from('campuses')
      .select('id, name, color')
      .eq('church_id', profile.church_id)
      .order('name'),
    adminClient
      .from('events')
      .select('id, title, start_time')
      .eq('church_id', profile.church_id)
      .gte('start_time', new Date().toISOString())
      .order('start_time')
      .limit(50),
  ])

  const assignments = assignmentsResult.data || []
  const events = eventsResult.data || []
  const tasks = tasksResult.data || []
  const members = membersData.data || []
  const ministries = ministriesData.data || []
  const campuses = campusesData.data || []
  const allEvents = allEventsData.data || []

  // Get first day of week preference
  const firstDayOfWeek = (profile.church?.first_day_of_week ?? 0) as 0 | 1 | 2 | 3 | 4 | 5 | 6

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold">Welcome back, {profile.first_name}!</h1>
        <p className="text-muted-foreground text-sm md:text-base">Here's what's happening at {profile.church.name}</p>
      </div>

      {/* Widgets Grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        <MyAssignmentsWidget assignments={assignments} />
        <MyTasksWidget
          tasks={tasks}
          members={members}
          ministries={ministries}
          campuses={campuses}
          events={allEvents}
          weekStartsOn={firstDayOfWeek}
        />
        <UpcomingEventsWidget events={events} />
        <UnavailabilityWidget />
      </div>
    </div>
  )
}
