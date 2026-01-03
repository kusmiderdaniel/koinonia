'use client'

import { useCallback } from 'react'
import { toast } from 'sonner'
import { updateTask } from '@/app/dashboard/tasks/actions'
import type { Task, TaskStatus, TaskPriority, TaskHandlers } from './types'

interface UseTaskHandlersParams {
  task: Task | null
  descriptionValue: string
  onTaskUpdated?: () => void
}

export function useTaskHandlers({
  task,
  descriptionValue,
  onTaskUpdated,
}: UseTaskHandlersParams): TaskHandlers {
  const handleStatusChange = useCallback(async (status: TaskStatus) => {
    if (!task) return
    const result = await updateTask(task.id, { status })
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Status updated')
      onTaskUpdated?.()
    }
  }, [task, onTaskUpdated])

  const handlePriorityChange = useCallback(async (priority: TaskPriority) => {
    if (!task) return
    const result = await updateTask(task.id, { priority })
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Priority updated')
      onTaskUpdated?.()
    }
  }, [task, onTaskUpdated])

  const handleAssigneeChange = useCallback(async (assigneeId: string | null) => {
    if (!task) return
    const result = await updateTask(task.id, { assignedTo: assigneeId })
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Assignee updated')
      onTaskUpdated?.()
    }
  }, [task, onTaskUpdated])

  const handleDueDateChange = useCallback(async (dueDate: Date | undefined) => {
    if (!task) return
    const result = await updateTask(task.id, { dueDate: dueDate ? dueDate.toISOString() : null })
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Due date updated')
      onTaskUpdated?.()
    }
  }, [task, onTaskUpdated])

  const handleMinistryChange = useCallback(async (ministryId: string | null) => {
    if (!task) return
    const result = await updateTask(task.id, { ministryId })
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Ministry updated')
      onTaskUpdated?.()
    }
  }, [task, onTaskUpdated])

  const handleCampusChange = useCallback(async (campusId: string | null) => {
    if (!task) return
    const result = await updateTask(task.id, { campusId })
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Campus updated')
      onTaskUpdated?.()
    }
  }, [task, onTaskUpdated])

  const handleEventChange = useCallback(async (eventId: string | null) => {
    if (!task) return
    const result = await updateTask(task.id, { eventId })
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Event updated')
      onTaskUpdated?.()
    }
  }, [task, onTaskUpdated])

  const handleDescriptionBlur = useCallback(async () => {
    if (!task) return
    const newDescription = descriptionValue.trim() || null
    if (newDescription !== task.description) {
      const result = await updateTask(task.id, { description: newDescription })
      if (result.error) {
        toast.error(result.error)
      } else {
        onTaskUpdated?.()
      }
    }
  }, [task, descriptionValue, onTaskUpdated])

  const handleTitleChange = useCallback(async (title: string) => {
    if (!task) return
    const result = await updateTask(task.id, { title })
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Title updated')
      onTaskUpdated?.()
    }
  }, [task, onTaskUpdated])

  return {
    handleStatusChange,
    handlePriorityChange,
    handleAssigneeChange,
    handleDueDateChange,
    handleMinistryChange,
    handleCampusChange,
    handleEventChange,
    handleDescriptionBlur,
    handleTitleChange,
  }
}
