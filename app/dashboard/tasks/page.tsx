import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { TasksPageClient } from './TasksPageClient'
import type { Task, TaskMinistry, TaskCampus } from './types'
import type { SavedView } from '@/types/saved-views'

export default async function TasksPage() {
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

  // Fetch church settings for first day of week
  const { data: church } = await adminClient
    .from('churches')
    .select('first_day_of_week')
    .eq('id', profile.church_id)
    .single()

  const firstDayOfWeek = (church?.first_day_of_week ?? 0) as 0 | 1 | 2 | 3 | 4 | 5 | 6

  // Fetch tasks, ministries, campuses, members, events and saved views in parallel
  const [tasksResult, ministriesResult, campusesResult, membersResult, eventsResult, savedViewsResult] = await Promise.all([
    adminClient
      .from('tasks')
      .select(`
        *,
        assignee:profiles!assigned_to (
          id,
          first_name,
          last_name,
          email
        ),
        event:events!event_id (
          id,
          title,
          start_time,
          end_time
        ),
        ministry:ministries!ministry_id (
          id,
          name,
          color
        ),
        campus:campuses!campus_id (
          id,
          name,
          color
        ),
        created_by_profile:profiles!created_by (
          id,
          first_name,
          last_name
        )
      `)
      .eq('church_id', profile.church_id)
      .order('status')
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false }),
    adminClient
      .from('ministries')
      .select('id, name, color, campus_id')
      .eq('church_id', profile.church_id)
      .order('name'),
    adminClient
      .from('campuses')
      .select('id, name, color')
      .eq('church_id', profile.church_id)
      .eq('is_active', true)
      .order('name'),
    adminClient
      .from('profiles')
      .select('id, first_name, last_name, email')
      .eq('church_id', profile.church_id)
      .eq('active', true)
      .order('first_name'),
    adminClient
      .from('events')
      .select('id, title, start_time')
      .eq('church_id', profile.church_id)
      .gte('start_time', new Date().toISOString())
      .order('start_time')
      .limit(50),
    adminClient
      .from('saved_views')
      .select('*')
      .eq('church_id', profile.church_id)
      .eq('view_type', 'tasks')
      .order('is_default', { ascending: false })
      .order('name'),
  ])

  const canManageViews = ['owner', 'admin', 'leader'].includes(profile.role)

  return (
    <TasksPageClient
      initialData={{
        tasks: (tasksResult.data || []) as Task[],
        ministries: (ministriesResult.data || []) as TaskMinistry[],
        campuses: (campusesResult.data || []) as TaskCampus[],
        members: membersResult.data || [],
        events: eventsResult.data || [],
        currentUserId: profile.id,
        role: profile.role,
        firstDayOfWeek,
        savedViews: (savedViewsResult.data || []) as SavedView[],
        canManageViews,
      }}
    />
  )
}
