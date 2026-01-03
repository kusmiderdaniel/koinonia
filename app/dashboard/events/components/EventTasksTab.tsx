'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, Calendar, User, MoreHorizontal, Trash2, CheckSquare } from 'lucide-react'
import { toast } from 'sonner'
import { format, parseISO, isToday, isTomorrow, isPast } from 'date-fns'
import { getTasksForEvent, getTask, updateTaskStatus, deleteTask } from '@/app/dashboard/tasks/actions'
import { TaskStatusBadge, TaskPriorityBadge } from '@/app/dashboard/tasks/components/TaskBadges'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { TaskDetailSheet } from '@/components/TaskDetailSheet'
import type { Task, TaskStatus, Person, TaskMinistry, TaskCampus } from '@/app/dashboard/tasks/types'

interface EventTasksTabProps {
  eventId: string
  canManage: boolean
  onAddTask: () => void
  refreshKey?: number
  members?: Person[]
  ministries?: TaskMinistry[]
  campuses?: TaskCampus[]
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
}

export function EventTasksTab({
  eventId,
  canManage,
  onAddTask,
  refreshKey,
  members = [],
  ministries = [],
  campuses = [],
  weekStartsOn = 0,
}: EventTasksTabProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [detailSheetOpen, setDetailSheetOpen] = useState(false)

  // Fetch tasks for this event
  useEffect(() => {
    setIsLoading(true)
    getTasksForEvent(eventId).then((result) => {
      if (result.data) {
        setTasks(result.data as Task[])
      }
      setIsLoading(false)
    })
  }, [eventId, refreshKey])

  const handleStatusChange = useCallback(async (taskId: string, newStatus: TaskStatus) => {
    const result = await updateTaskStatus(taskId, newStatus)
    if (result.error) {
      toast.error(result.error)
    } else {
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, status: newStatus } : t
      ))
      toast.success(newStatus === 'completed' ? 'Task completed!' : 'Status updated')
    }
  }, [])

  const handleDeleteClick = useCallback((task: Task) => {
    setTaskToDelete(task)
    setDeleteConfirmOpen(true)
  }, [])

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task)
    setDetailSheetOpen(true)
  }, [])

  const handleTaskUpdated = useCallback(async () => {
    // Re-fetch tasks for the event list
    const tasksResult = await getTasksForEvent(eventId)
    if (tasksResult.data) {
      setTasks(tasksResult.data as Task[])
    }

    // Also fetch the selected task directly to get its latest state
    // (it may no longer be linked to this event)
    if (selectedTask) {
      const taskResult = await getTask(selectedTask.id)
      if (taskResult.data) {
        setSelectedTask(taskResult.data)
      }
    }
  }, [eventId, selectedTask])

  const handleDeleteConfirm = useCallback(async () => {
    if (!taskToDelete) return

    setIsDeleting(true)
    const result = await deleteTask(taskToDelete.id)
    setIsDeleting(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      setTasks(prev => prev.filter(t => t.id !== taskToDelete.id))
      toast.success('Task deleted')
    }

    setDeleteConfirmOpen(false)
    setTaskToDelete(null)
  }, [taskToDelete])

  // Format due date with relative labels
  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return null

    const date = parseISO(dueDate)

    if (isToday(date)) {
      return { label: 'Today', isOverdue: false, isUrgent: true }
    }
    if (isTomorrow(date)) {
      return { label: 'Tomorrow', isOverdue: false, isUrgent: true }
    }
    if (isPast(date)) {
      return { label: format(date, 'MMM d'), isOverdue: true, isUrgent: false }
    }
    return { label: format(date, 'MMM d'), isOverdue: false, isUrgent: false }
  }

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">Loading tasks...</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {tasks.length} task{tasks.length !== 1 ? 's' : ''}
        </p>
        {canManage && (
          <Button
            variant="outline-pill"
            size="sm"
            className="!border !border-gray-300 dark:!border-zinc-600"
            onClick={onAddTask}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Task
          </Button>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <CheckSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No tasks linked to this event</p>
          {canManage && (
            <Button variant="outline" size="sm" className="mt-4" onClick={onAddTask}>
              <Plus className="w-4 h-4 mr-1" />
              Add a task
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => {
            const dueDateInfo = formatDueDate(task.due_date)
            const isCompleted = task.status === 'completed'

            return (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => handleTaskClick(task)}
              >
                {/* Checkbox for completion */}
                <div onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={isCompleted}
                    onCheckedChange={(checked) => {
                      handleStatusChange(task.id, checked ? 'completed' : 'pending')
                    }}
                    className="h-5 w-5"
                  />
                </div>

                {/* Task info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-medium text-sm truncate ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </span>
                    <TaskPriorityBadge priority={task.priority} size="sm" />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {task.assignee && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {task.assignee.first_name}
                      </span>
                    )}
                    {dueDateInfo && (
                      <span className={`flex items-center gap-1 ${
                        dueDateInfo.isOverdue ? 'text-red-600' :
                        dueDateInfo.isUrgent ? 'text-orange-600' : ''
                      }`}>
                        <Calendar className="h-3 w-3" />
                        {dueDateInfo.label}
                      </span>
                    )}
                    {task.ministry && (
                      <Badge
                        variant="outline"
                        className="text-xs rounded-full py-0"
                        style={{ borderColor: task.ministry.color, color: task.ministry.color }}
                      >
                        {task.ministry.name}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="focus:outline-none">
                        <TaskStatusBadge status={task.status} size="sm" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white dark:bg-zinc-950">
                      <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'pending')} className="cursor-pointer">
                        <TaskStatusBadge status="pending" />
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'in_progress')} className="cursor-pointer">
                        <TaskStatusBadge status="in_progress" />
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'completed')} className="cursor-pointer">
                        <TaskStatusBadge status="completed" />
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'cancelled')} className="cursor-pointer">
                        <TaskStatusBadge status="cancelled" />
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Actions */}
                {canManage && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(task)}
                          className="text-red-600 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Task"
        description={`Are you sure you want to delete "${taskToDelete?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />

      <TaskDetailSheet
        task={selectedTask}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        onTaskUpdated={handleTaskUpdated}
        members={members}
        ministries={ministries}
        campuses={campuses}
        weekStartsOn={weekStartsOn}
      />
    </>
  )
}
