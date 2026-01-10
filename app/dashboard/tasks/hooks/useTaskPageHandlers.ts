import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { updateTaskStatus, updateTask, deleteTask } from '../actions'
import type { Task, TaskMinistry, TaskCampus, TaskStatus, TaskPriority, Person } from '../types'

interface UseTaskPageHandlersOptions {
  tasks: Task[]
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
  selectedTaskId: string | null
  setSelectedTaskId: React.Dispatch<React.SetStateAction<string | null>>
  ministries: TaskMinistry[]
  campuses: TaskCampus[]
  members: Person[]
  events: { id: string; title: string; start_time: string }[]
}

export function useTaskPageHandlers({
  tasks,
  setTasks,
  selectedTaskId,
  setSelectedTaskId,
  ministries,
  campuses,
  members,
  events,
}: UseTaskPageHandlersOptions) {
  const router = useRouter()
  const t = useTranslations('tasks')

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Refresh handler
  const handleRefresh = useCallback(() => {
    router.refresh()
  }, [router])

  // Dialog handlers
  const handleCreateTask = useCallback(() => {
    setEditingTask(null)
    setIsDialogOpen(true)
  }, [])

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task)
    setIsDialogOpen(true)
  }, [])

  const handleDialogClose = useCallback(
    (success?: boolean) => {
      setIsDialogOpen(false)
      setEditingTask(null)
      if (success) {
        handleRefresh()
      }
    },
    [handleRefresh]
  )

  // Status change handler
  const handleStatusChange = useCallback(async (taskId: string, newStatus: TaskStatus) => {
    const result = await updateTaskStatus(taskId, newStatus)
    if (result.error) {
      toast.error(result.error)
    } else {
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task))
      )
      toast.success(newStatus === 'completed' ? t('toast.taskCompleted') : t('toast.statusUpdated'))
    }
  }, [setTasks, t])

  // Priority change handler
  const handlePriorityChange = useCallback(
    async (taskId: string, newPriority: TaskPriority) => {
      const result = await updateTask(taskId, { priority: newPriority })
      if (result.error) {
        toast.error(result.error)
      } else {
        setTasks((prev) =>
          prev.map((task) => (task.id === taskId ? { ...task, priority: newPriority } : task))
        )
        toast.success(t('toast.priorityUpdated'))
      }
    },
    [setTasks, t]
  )

  // Assignee change handler
  const handleAssigneeChange = useCallback(
    async (taskId: string, assigneeId: string | null) => {
      const result = await updateTask(taskId, { assignedTo: assigneeId || undefined })
      if (result.error) {
        toast.error(result.error)
      } else {
        const assignee = assigneeId ? members.find((m) => m.id === assigneeId) : null
        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId ? { ...task, assigned_to: assigneeId, assignee: assignee || null } : task
          )
        )
        toast.success(assigneeId ? t('toast.assigneeUpdated') : t('toast.assigneeRemoved'))
      }
    },
    [members, setTasks, t]
  )

  // Due date change handler
  const handleDueDateChange = useCallback(
    async (taskId: string, dueDate: Date | undefined) => {
      const result = await updateTask(taskId, { dueDate: dueDate?.toISOString() })
      if (result.error) {
        toast.error(result.error)
      } else {
        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId ? { ...task, due_date: dueDate?.toISOString() || null } : task
          )
        )
        toast.success(dueDate ? t('toast.dueDateUpdated') : t('toast.dueDateRemoved'))
      }
    },
    [setTasks, t]
  )

  // Event change handler
  const handleEventChange = useCallback(
    async (taskId: string, eventId: string | null) => {
      const result = await updateTask(taskId, { eventId: eventId || undefined })
      if (result.error) {
        toast.error(result.error)
      } else {
        const event = eventId ? events.find((e) => e.id === eventId) : null
        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  event_id: eventId,
                  event: event ? { ...event, end_time: event.start_time } : null,
                }
              : task
          )
        )
        toast.success(eventId ? t('toast.eventLinked') : t('toast.eventRemoved'))
      }
    },
    [events, setTasks, t]
  )

  // Ministry change handler
  const handleMinistryChange = useCallback(
    async (taskId: string, ministryId: string | null) => {
      const result = await updateTask(taskId, { ministryId: ministryId || undefined })
      if (result.error) {
        toast.error(result.error)
      } else {
        const ministry = ministryId ? ministries.find((m) => m.id === ministryId) : null
        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId ? { ...task, ministry_id: ministryId, ministry: ministry || null } : task
          )
        )
        toast.success(ministryId ? t('toast.ministryUpdated') : t('toast.ministryRemoved'))
      }
    },
    [ministries, setTasks, t]
  )

  // Campus change handler
  const handleCampusChange = useCallback(
    async (taskId: string, campusId: string | null) => {
      const result = await updateTask(taskId, { campusId: campusId || undefined })
      if (result.error) {
        toast.error(result.error)
      } else {
        const campus = campusId ? campuses.find((c) => c.id === campusId) : null
        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId ? { ...task, campus_id: campusId, campus: campus || null } : task
          )
        )
        toast.success(campusId ? t('toast.campusUpdated') : t('toast.campusRemoved'))
      }
    },
    [campuses, setTasks, t]
  )

  // Description change handler
  const handleDescriptionChange = useCallback(
    async (taskId: string, description: string | null) => {
      const result = await updateTask(taskId, { description: description || undefined })
      if (result.error) {
        toast.error(result.error)
      } else {
        setTasks((prev) =>
          prev.map((task) => (task.id === taskId ? { ...task, description } : task))
        )
        toast.success(description ? t('toast.descriptionUpdated') : t('toast.descriptionRemoved'))
      }
    },
    [setTasks, t]
  )

  // Delete handlers
  const handleDeleteClick = useCallback((task: Task) => {
    setTaskToDelete(task)
    setDeleteConfirmOpen(true)
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    if (!taskToDelete) return

    setIsDeleting(true)
    const result = await deleteTask(taskToDelete.id)
    setIsDeleting(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      setTasks((prev) => prev.filter((task) => task.id !== taskToDelete.id))
      if (selectedTaskId === taskToDelete.id) {
        setSelectedTaskId(null)
      }
      toast.success(t('toast.taskDeleted'))
    }

    setDeleteConfirmOpen(false)
    setTaskToDelete(null)
  }, [taskToDelete, selectedTaskId, setTasks, setSelectedTaskId, t])

  // Selection handlers
  const handleSelectTask = useCallback(
    (taskId: string) => {
      setSelectedTaskId(taskId)
    },
    [setSelectedTaskId]
  )

  const handleCloseDetail = useCallback(() => {
    setSelectedTaskId(null)
  }, [setSelectedTaskId])

  return {
    // Dialog state
    isDialogOpen,
    setIsDialogOpen,
    editingTask,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    taskToDelete,
    isDeleting,

    // Handlers
    handleRefresh,
    handleCreateTask,
    handleEditTask,
    handleDialogClose,
    handleStatusChange,
    handlePriorityChange,
    handleAssigneeChange,
    handleDueDateChange,
    handleEventChange,
    handleMinistryChange,
    handleCampusChange,
    handleDescriptionChange,
    handleDeleteClick,
    handleDeleteConfirm,
    handleSelectTask,
    handleCloseDetail,
  }
}
