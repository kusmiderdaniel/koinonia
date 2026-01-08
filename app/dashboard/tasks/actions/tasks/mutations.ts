'use server'

import { revalidatePath } from 'next/cache'
import { isLeaderOrAbove, isAdminOrOwner } from '@/lib/permissions'
import {
  taskSchema,
  taskStatusSchema,
  getAuthenticatedUserWithProfile,
  isAuthError,
  type TaskInput,
  type TaskStatus,
} from '../helpers'
import { TASK_SELECT, getActivityMessage } from './shared'

export async function createTask(data: TaskInput) {
  const validated = taskSchema.safeParse(data)
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || 'Invalid data provided' }
  }

  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Determine due date: use provided date, or if event is linked, get event's start_time
  let dueDate = validated.data.dueDate || null

  if (validated.data.eventId && !dueDate) {
    const { data: event } = await adminClient
      .from('events')
      .select('start_time')
      .eq('id', validated.data.eventId)
      .single()

    if (event) {
      dueDate = event.start_time
    }
  }

  const { data: task, error } = await adminClient
    .from('tasks')
    .insert({
      church_id: profile.church_id,
      title: validated.data.title,
      description: validated.data.description || null,
      due_date: dueDate,
      assigned_to: validated.data.assignedTo || null,
      status: validated.data.status,
      priority: validated.data.priority,
      event_id: validated.data.eventId || null,
      ministry_id: validated.data.ministryId || null,
      campus_id: validated.data.campusId || null,
      created_by: profile.id,
    })
    .select(TASK_SELECT)
    .single()

  if (error) {
    console.error('Error creating task:', error)
    return { error: 'Failed to create task' }
  }

  // Log the creation activity
  await adminClient.from('task_comments').insert({
    task_id: task.id,
    content: 'Task created',
    activity_type: 'created',
    author_id: profile.id,
  })

  revalidatePath('/dashboard/tasks')
  if (validated.data.eventId) {
    revalidatePath(`/dashboard/events/${validated.data.eventId}`)
  }

  return { data: task }
}

export async function updateTask(id: string, data: Partial<TaskInput>) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { user, profile, adminClient } = auth

  // Get current task to check permissions and track changes
  const { data: currentTask } = await adminClient
    .from('tasks')
    .select('*, church_id, created_by, assigned_to')
    .eq('id', id)
    .eq('church_id', profile.church_id)
    .single()

  if (!currentTask) {
    return { error: 'Task not found' }
  }

  // Check permissions: creator, assignee, or admin/leader
  const isCreator = currentTask.created_by === user.id
  const isAssignee = currentTask.assigned_to === user.id
  const isAdminOrLeader = isLeaderOrAbove(profile.role)

  if (!isCreator && !isAssignee && !isAdminOrLeader) {
    return { error: 'You do not have permission to edit this task' }
  }

  // Build update object
  const updateData: Record<string, unknown> = {}
  const activityLogs: { type: string; oldValue?: string; newValue?: string }[] = []

  if (data.title !== undefined && data.title !== currentTask.title) {
    updateData.title = data.title
  }

  if (data.description !== undefined) {
    updateData.description = data.description || null
  }

  if (data.dueDate !== undefined && data.dueDate !== currentTask.due_date) {
    updateData.due_date = data.dueDate || null
    activityLogs.push({
      type: 'due_date_changed',
      oldValue: currentTask.due_date || 'None',
      newValue: data.dueDate || 'None',
    })
  }

  if (data.assignedTo !== undefined && data.assignedTo !== currentTask.assigned_to) {
    updateData.assigned_to = data.assignedTo || null
    activityLogs.push({
      type: 'assigned',
      oldValue: currentTask.assigned_to || 'Unassigned',
      newValue: data.assignedTo || 'Unassigned',
    })
  }

  if (data.status !== undefined && data.status !== currentTask.status) {
    updateData.status = data.status

    // Handle completion tracking
    if (data.status === 'completed') {
      updateData.completed_at = new Date().toISOString()
      updateData.completed_by = profile.id
      activityLogs.push({ type: 'completed' })
    } else if (currentTask.status === 'completed') {
      // Task is being reopened (status changing from completed to something else)
      updateData.completed_at = null
      updateData.completed_by = null
      activityLogs.push({ type: 'reopened' })
    } else {
      activityLogs.push({
        type: 'status_changed',
        oldValue: currentTask.status,
        newValue: data.status,
      })
    }
  }

  if (data.priority !== undefined && data.priority !== currentTask.priority) {
    updateData.priority = data.priority
    activityLogs.push({
      type: 'priority_changed',
      oldValue: currentTask.priority,
      newValue: data.priority,
    })
  }

  if (data.eventId !== undefined) {
    updateData.event_id = data.eventId || null
  }

  if (data.ministryId !== undefined) {
    updateData.ministry_id = data.ministryId || null
  }

  if (data.campusId !== undefined) {
    updateData.campus_id = data.campusId || null
  }

  // Only update if there are changes
  if (Object.keys(updateData).length === 0) {
    return { data: currentTask }
  }

  const { data: task, error } = await adminClient
    .from('tasks')
    .update(updateData)
    .eq('id', id)
    .select(TASK_SELECT)
    .single()

  if (error) {
    console.error('Error updating task:', error)
    return { error: 'Failed to update task' }
  }

  // Log activity changes
  for (const log of activityLogs) {
    await adminClient.from('task_comments').insert({
      task_id: id,
      content: getActivityMessage(log.type, log.oldValue, log.newValue),
      activity_type: log.type,
      old_value: log.oldValue || null,
      new_value: log.newValue || null,
      author_id: profile.id,
    })
  }

  revalidatePath('/dashboard/tasks')
  revalidatePath(`/dashboard/tasks/${id}`)
  if (currentTask.event_id) {
    revalidatePath(`/dashboard/events/${currentTask.event_id}`)
  }

  return { data: task }
}

export async function updateTaskStatus(id: string, status: TaskStatus) {
  const validated = taskStatusSchema.safeParse(status)
  if (!validated.success) {
    return { error: 'Invalid status' }
  }

  return updateTask(id, { status: validated.data })
}

export async function deleteTask(id: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { user, profile, adminClient } = auth

  // Get task to check permissions
  const { data: task } = await adminClient
    .from('tasks')
    .select('created_by, event_id, church_id')
    .eq('id', id)
    .eq('church_id', profile.church_id)
    .single()

  if (!task) {
    return { error: 'Task not found' }
  }

  // Check permissions: creator or admin
  const isCreator = task.created_by === user.id

  if (!isCreator && !isAdminOrOwner(profile.role)) {
    return { error: 'You do not have permission to delete this task' }
  }

  const { error } = await adminClient.from('tasks').delete().eq('id', id)

  if (error) {
    console.error('Error deleting task:', error)
    return { error: 'Failed to delete task' }
  }

  revalidatePath('/dashboard/tasks')
  if (task.event_id) {
    revalidatePath(`/dashboard/events/${task.event_id}`)
  }

  return { success: true }
}
