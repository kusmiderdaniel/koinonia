'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
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
import { useIsMobile } from '@/lib/hooks'
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
  initialTasks?: Task[]
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
  initialTasks,
}: EventTasksTabProps) {
  const t = useTranslations('events.tasks')
  const isMobile = useIsMobile()
  const [tasks, setTasks] = useState<Task[]>(initialTasks || [])
  const [isLoading, setIsLoading] = useState(!initialTasks)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [detailSheetOpen, setDetailSheetOpen] = useState(false)

  // Fetch tasks for this event (only when refreshKey changes or no initialTasks provided)
  useEffect(() => {
    // Skip initial fetch if we have pre-loaded tasks
    if (initialTasks && refreshKey === undefined) {
      return
    }
    setIsLoading(true)
    getTasksForEvent(eventId).then((result) => {
      if (result.data) {
        setTasks(result.data as Task[])
      }
      setIsLoading(false)
    })
  }, [eventId, refreshKey, initialTasks])

  const handleStatusChange = useCallback(async (taskId: string, newStatus: TaskStatus) => {
    const result = await updateTaskStatus(taskId, newStatus)
    if (result.error) {
      toast.error(result.error)
    } else {
      setTasks(prev => prev.map(task =>
        task.id === taskId ? { ...task, status: newStatus } : task
      ))
      toast.success(newStatus === 'completed' ? t('taskCompleted') : t('statusUpdated'))
    }
  }, [t])

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
      setTasks(prev => prev.filter(task => task.id !== taskToDelete.id))
      toast.success(t('deleted'))
    }

    setDeleteConfirmOpen(false)
    setTaskToDelete(null)
  }, [taskToDelete, t])

  // Format due date with relative labels
  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return null

    const date = parseISO(dueDate)

    if (isToday(date)) {
      return { label: t('today'), isOverdue: false, isUrgent: true }
    }
    if (isTomorrow(date)) {
      return { label: t('tomorrow'), isOverdue: false, isUrgent: true }
    }
    if (isPast(date)) {
      return { label: format(date, 'MMM d'), isOverdue: true, isUrgent: false }
    }
    return { label: format(date, 'MMM d'), isOverdue: false, isUrgent: false }
  }

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">{t('loading')}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Fixed header */}
      <div className={`flex-shrink-0 ${isMobile ? 'px-3 py-2' : 'pl-6 pr-6 py-4'}`}>
        {isMobile ? (
          <div className="space-y-1.5">
            {canManage && (
              <Button
                variant="outline-pill"
                size="sm"
                className="!border !border-black/20 dark:!border-white/20 text-xs h-8"
                onClick={onAddTask}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                {t('addTask')}
              </Button>
            )}
            {tasks.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {t('taskCount', { count: tasks.length })}
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between min-h-[40px]">
            <div className="flex items-center gap-3">
              {tasks.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {t('taskCount', { count: tasks.length })}
                </p>
              )}
            </div>
            {canManage && (
              <div className="flex gap-2 ml-auto">
                <Button
                  variant="outline-pill"
                  size="sm"
                  className="!border !border-black/20 dark:!border-white/20"
                  onClick={onAddTask}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {t('addTask')}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scrollable content */}
      <div className={`flex-1 min-h-0 overflow-y-auto scrollbar-minimal ${isMobile ? 'px-3 pb-3' : 'pl-6 pr-6 pb-6'}`}>
        {tasks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <CheckSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{t('noTasks')}</p>
          {canManage && (
            <Button variant="outline" size="sm" className="mt-4 !rounded-full !border-black/20 dark:!border-white/20" onClick={onAddTask}>
              <Plus className="w-4 h-4 mr-1" />
              {t('addATask')}
            </Button>
          )}
        </div>
      ) : (
        <div className={isMobile ? 'space-y-1.5' : 'space-y-2'}>
          {tasks.map((task) => {
            const dueDateInfo = formatDueDate(task.due_date)
            const isCompleted = task.status === 'completed'

            return (
              <div
                key={task.id}
                className={`flex items-center gap-2 border border-black/20 dark:border-white/20 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer ${isMobile ? 'p-2' : 'p-3 gap-3'}`}
                onClick={() => handleTaskClick(task)}
              >
                {/* Checkbox for completion */}
                <div onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={isCompleted}
                    onCheckedChange={(checked) => {
                      handleStatusChange(task.id, checked ? 'completed' : 'pending')
                    }}
                    className={isMobile ? 'h-4 w-4' : 'h-5 w-5'}
                  />
                </div>

                {/* Task info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`font-medium truncate ${isMobile ? 'text-xs' : 'text-sm'} ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </span>
                    <TaskPriorityBadge priority={task.priority} size="sm" />
                  </div>
                  <div className={`flex items-center gap-2 text-muted-foreground ${isMobile ? 'text-[10px]' : 'text-xs gap-3'}`}>
                    {task.assignee && (
                      <span className="flex items-center gap-0.5">
                        <User className={isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
                        {task.assignee.first_name}
                      </span>
                    )}
                    {dueDateInfo && (
                      <span className={`flex items-center gap-0.5 ${
                        dueDateInfo.isOverdue ? 'text-red-600' :
                        dueDateInfo.isUrgent ? 'text-orange-600' : ''
                      }`}>
                        <Calendar className={isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
                        {dueDateInfo.label}
                      </span>
                    )}
                    {task.ministry && !isMobile && (
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
                        <Button variant="ghost" size="icon" className={isMobile ? 'h-6 w-6' : 'h-7 w-7'}>
                          <MoreHorizontal className={isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(task)}
                          className="text-red-600 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('deleteTask')}
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
      </div>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={t('deleteTask')}
        description={t('deleteConfirmation', { name: taskToDelete?.title ?? '' })}
        confirmLabel={t('deleteTask')}
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
    </div>
  )
}
