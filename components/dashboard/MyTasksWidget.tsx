'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { CheckSquare, Calendar, ChevronRight, Loader2 } from 'lucide-react'
import { updateTaskStatus, getTask } from '@/app/dashboard/tasks/actions'
import { TaskPriorityBadge } from '@/app/dashboard/tasks/components/TaskBadges'
import { TaskDetailSheet } from '@/components/TaskDetailSheet'
import { toast } from 'sonner'
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns'
import type { DashboardTask } from '@/app/dashboard/actions'
import type { Task, Person, TaskMinistry, TaskCampus } from '@/app/dashboard/tasks/types'

interface TaskEvent {
  id: string
  title: string
  start_time: string
}

interface MyTasksWidgetProps {
  tasks: DashboardTask[]
  members?: Person[]
  ministries?: TaskMinistry[]
  campuses?: TaskCampus[]
  events?: TaskEvent[]
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
}

export function MyTasksWidget({
  tasks,
  members = [],
  ministries = [],
  campuses = [],
  events = [],
  weekStartsOn = 0,
}: MyTasksWidgetProps) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isLoadingTask, setIsLoadingTask] = useState(false)

  const handleToggleComplete = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setLoadingId(taskId)

    try {
      const result = await updateTaskStatus(taskId, 'completed')

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Task completed!')
        router.refresh()
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setLoadingId(null)
    }
  }

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

  const getStatusBadge = (status: DashboardTask['status']) => {
    switch (status) {
      case 'in_progress':
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-300 text-xs">
            In Progress
          </Badge>
        )
      case 'pending':
        return (
          <Badge className="bg-gray-100 text-gray-700 border-gray-300 text-xs">
            Pending
          </Badge>
        )
      default:
        return null
    }
  }

  const handleTaskClick = async (taskId: string) => {
    setIsLoadingTask(true)
    try {
      const result = await getTask(taskId)
      if (result.error) {
        toast.error(result.error)
      } else if (result.data) {
        setSelectedTask(result.data)
      }
    } catch (error) {
      toast.error('Failed to load task')
    } finally {
      setIsLoadingTask(false)
    }
  }

  const handleTaskUpdated = async () => {
    router.refresh()
    // Also refresh the selected task to show changes immediately in the detail sheet
    if (selectedTask) {
      const result = await getTask(selectedTask.id)
      if (result.data) {
        setSelectedTask(result.data)
      }
    }
  }

  const handleCloseSheet = () => {
    setSelectedTask(null)
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <CheckSquare className="w-5 h-5" />
          My Tasks
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No pending tasks</p>
            <p className="text-xs mt-1">Tasks assigned to you will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => {
              const dueDateInfo = formatDueDate(task.due_date)

              return (
                <div
                  key={task.id}
                  onClick={() => handleTaskClick(task.id)}
                  className="flex gap-3 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-zinc-900 cursor-pointer transition-colors"
                >
                  {/* Checkbox */}
                  <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                    {loadingId === task.id ? (
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    ) : (
                      <Checkbox
                        checked={false}
                        onCheckedChange={() => {}}
                        onClick={(e) => handleToggleComplete(task.id, e)}
                        className="h-5 w-5"
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Title and Priority */}
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm truncate flex-1">
                        {task.title}
                      </p>
                      <TaskPriorityBadge priority={task.priority} size="sm" />
                    </div>

                    {/* Due date, status, ministry */}
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                      {dueDateInfo && (
                        <span className={`flex items-center gap-1 ${
                          dueDateInfo.isOverdue ? 'text-red-600' :
                          dueDateInfo.isUrgent ? 'text-orange-600' : ''
                        }`}>
                          <Calendar className="h-3 w-3" />
                          {dueDateInfo.label}
                        </span>
                      )}
                      {getStatusBadge(task.status)}
                      {task.ministry && (
                        <Badge
                          variant="outline"
                          className="text-xs rounded-full"
                          style={{ borderColor: task.ministry.color, color: task.ministry.color }}
                        >
                          {task.ministry.name}
                        </Badge>
                      )}
                    </div>

                    {/* Linked event */}
                    {task.event && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        Event: {task.event.title}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}

            {/* View all link */}
            <Link
              href="/dashboard/tasks"
              className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground pt-2"
            >
              View all tasks
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </CardContent>

      {/* Task Detail Sheet */}
      <TaskDetailSheet
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => !open && handleCloseSheet()}
        onTaskUpdated={handleTaskUpdated}
        members={members}
        ministries={ministries}
        campuses={campuses}
        events={events}
        weekStartsOn={weekStartsOn}
        canDelete={false}
      />
    </Card>
  )
}
