import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
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
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      )
      toast.success(newStatus === 'completed' ? 'Task completed!' : 'Status updated')
    }
  }, [setTasks])

  // Priority change handler
  const handlePriorityChange = useCallback(
    async (taskId: string, newPriority: TaskPriority) => {
      const result = await updateTask(taskId, { priority: newPriority })
      if (result.error) {
        toast.error(result.error)
      } else {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, priority: newPriority } : t))
        )
        toast.success('Priority updated')
      }
    },
    [setTasks]
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
          prev.map((t) =>
            t.id === taskId ? { ...t, assigned_to: assigneeId, assignee: assignee || null } : t
          )
        )
        toast.success(assigneeId ? 'Assignee updated' : 'Assignee removed')
      }
    },
    [members, setTasks]
  )

  // Due date change handler
  const handleDueDateChange = useCallback(
    async (taskId: string, dueDate: Date | undefined) => {
      const result = await updateTask(taskId, { dueDate: dueDate?.toISOString() })
      if (result.error) {
        toast.error(result.error)
      } else {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, due_date: dueDate?.toISOString() || null } : t
          )
        )
        toast.success(dueDate ? 'Due date updated' : 'Due date removed')
      }
    },
    [setTasks]
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
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  event_id: eventId,
                  event: event ? { ...event, end_time: event.start_time } : null,
                }
              : t
          )
        )
        toast.success(eventId ? 'Event linked' : 'Event removed')
      }
    },
    [events, setTasks]
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
          prev.map((t) =>
            t.id === taskId ? { ...t, ministry_id: ministryId, ministry: ministry || null } : t
          )
        )
        toast.success(ministryId ? 'Ministry updated' : 'Ministry removed')
      }
    },
    [ministries, setTasks]
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
          prev.map((t) =>
            t.id === taskId ? { ...t, campus_id: campusId, campus: campus || null } : t
          )
        )
        toast.success(campusId ? 'Campus updated' : 'Campus removed')
      }
    },
    [campuses, setTasks]
  )

  // Description change handler
  const handleDescriptionChange = useCallback(
    async (taskId: string, description: string | null) => {
      const result = await updateTask(taskId, { description: description || undefined })
      if (result.error) {
        toast.error(result.error)
      } else {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, description } : t))
        )
        toast.success(description ? 'Description updated' : 'Description removed')
      }
    },
    [setTasks]
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
      setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id))
      if (selectedTaskId === taskToDelete.id) {
        setSelectedTaskId(null)
      }
      toast.success('Task deleted')
    }

    setDeleteConfirmOpen(false)
    setTaskToDelete(null)
  }, [taskToDelete, selectedTaskId, setTasks, setSelectedTaskId])

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
