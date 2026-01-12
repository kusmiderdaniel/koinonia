'use server'

import {
  getAuthenticatedUserWithProfile,
  isAuthError,
} from '@/lib/utils/server-auth'

export interface DashboardTask {
  id: string
  title: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  due_date: string | null
  ministry: {
    id: string
    name: string
    color: string
  } | null
  event: {
    id: string
    title: string
  } | null
}

/**
 * Get user's tasks (assigned to them, not completed/cancelled)
 */
export async function getMyTasks(): Promise<{ data?: DashboardTask[]; error?: string }> {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const { data, error } = await adminClient
    .from('tasks')
    .select(`
      id,
      title,
      status,
      priority,
      due_date,
      ministry:ministries (
        id,
        name,
        color
      ),
      event:events (
        id,
        title
      )
    `)
    .eq('assigned_to', profile.id)
    .in('status', ['pending', 'in_progress'])
    .order('due_date', { ascending: true, nullsFirst: false })
    .limit(10)

  if (error) {
    console.error('Error fetching tasks:', error)
    return { error: 'Failed to fetch tasks' }
  }

  const tasks: DashboardTask[] = (data || []).map((t) => {
    const ministry = Array.isArray(t.ministry) ? t.ministry[0] : t.ministry
    const event = Array.isArray(t.event) ? t.event[0] : t.event

    return {
      id: t.id,
      title: t.title,
      status: t.status as DashboardTask['status'],
      priority: t.priority as DashboardTask['priority'],
      due_date: t.due_date,
      ministry: ministry ? {
        id: ministry.id,
        name: ministry.name,
        color: ministry.color,
      } : null,
      event: event ? {
        id: event.id,
        title: event.title,
      } : null,
    }
  })

  return { data: tasks }
}
