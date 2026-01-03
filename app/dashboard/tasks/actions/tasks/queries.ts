'use server'

import {
  getAuthenticatedUserWithProfile,
  isAuthError,
  type TaskFilters,
} from '../helpers'
import { TASK_SELECT } from './shared'

export async function getTasks(filters?: TaskFilters) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  let query = adminClient
    .from('tasks')
    .select(TASK_SELECT)
    .eq('church_id', profile.church_id)

  // Apply filters
  if (filters?.status && filters.status.length > 0) {
    query = query.in('status', filters.status)
  }

  if (filters?.priority && filters.priority.length > 0) {
    query = query.in('priority', filters.priority)
  }

  if (filters?.assignedTo) {
    query = query.eq('assigned_to', filters.assignedTo)
  }

  if (filters?.ministryId) {
    query = query.eq('ministry_id', filters.ministryId)
  }

  if (filters?.eventId) {
    query = query.eq('event_id', filters.eventId)
  }

  if (filters?.createdBy) {
    query = query.eq('created_by', filters.createdBy)
  }

  if (filters?.dueBefore) {
    query = query.lte('due_date', filters.dueBefore)
  }

  if (filters?.dueAfter) {
    query = query.gte('due_date', filters.dueAfter)
  }

  if (filters?.search) {
    query = query.ilike('title', `%${filters.search}%`)
  }

  // Default ordering: pending/in_progress first, then by due date, then by created_at
  query = query
    .order('status', { ascending: true })
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  const { data: tasks, error } = await query

  if (error) {
    console.error('Error fetching tasks:', error)
    return { error: 'Failed to load tasks' }
  }

  return { data: tasks || [] }
}

export async function getTask(id: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const { data: task, error } = await adminClient
    .from('tasks')
    .select(TASK_SELECT)
    .eq('id', id)
    .eq('church_id', profile.church_id)
    .single()

  if (error) {
    console.error('Error fetching task:', error)
    return { error: 'Task not found' }
  }

  return { data: task }
}

export async function getTasksForEvent(eventId: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const { data: tasks, error } = await adminClient
    .from('tasks')
    .select(TASK_SELECT)
    .eq('event_id', eventId)
    .eq('church_id', profile.church_id)
    .order('status')
    .order('due_date', { ascending: true, nullsFirst: false })

  if (error) {
    console.error('Error fetching tasks for event:', error)
    return { error: 'Failed to load tasks' }
  }

  return { data: tasks || [] }
}

export async function getMyTasks() {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { user, profile, adminClient } = auth

  const { data: tasks, error } = await adminClient
    .from('tasks')
    .select(TASK_SELECT)
    .eq('church_id', profile.church_id)
    .eq('assigned_to', user.id)
    .neq('status', 'completed')
    .neq('status', 'cancelled')
    .order('due_date', { ascending: true, nullsFirst: false })

  if (error) {
    console.error('Error fetching my tasks:', error)
    return { error: 'Failed to load tasks' }
  }

  return { data: tasks || [] }
}
