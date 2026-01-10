'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Trash2, Calendar, User } from 'lucide-react'
import { TaskStatusBadge, TaskPriorityBadge } from './TaskBadges'
import { useIsMobile } from '@/lib/hooks'
import { format, parseISO, isToday, isTomorrow, isPast, isValid } from 'date-fns'
import type { Task, TaskStatus, TaskPriority } from '../types'

interface TaskCardProps {
  task: Task
  isSelected: boolean
  onTitleClick: (taskId: string) => void
  onStatusChange: (taskId: string, status: TaskStatus) => void
  onCompletionToggle: (taskId: string, completed: boolean) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

const statusOptions: TaskStatus[] = ['pending', 'in_progress', 'completed', 'cancelled']

export const TaskCard = memo(function TaskCard({
  task,
  isSelected,
  onTitleClick,
  onStatusChange,
  onCompletionToggle,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const t = useTranslations('tasks')
  const isMobile = useIsMobile()
  const isCompleted = task.status === 'completed'

  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return null
    const date = parseISO(dueDate)
    if (!isValid(date)) return null

    if (isToday(date)) {
      return { label: t('dates.today'), className: 'text-orange-600' }
    }
    if (isTomorrow(date)) {
      return { label: t('dates.tomorrow'), className: 'text-orange-600' }
    }
    if (isPast(date)) {
      return { label: format(date, 'MMM d'), className: 'text-red-600' }
    }
    return { label: format(date, 'MMM d'), className: 'text-muted-foreground' }
  }

  const dueDateInfo = formatDueDate(task.due_date)

  return (
    <div
      className={`flex items-center border-b cursor-pointer transition-colors hover:bg-muted/50 ${
        isMobile ? 'gap-2 p-2' : 'gap-3 p-4'
      } ${isSelected ? 'bg-muted' : ''}`}
    >
      {/* Checkbox for completion */}
      <Checkbox
        checked={isCompleted}
        onCheckedChange={(checked) => onCompletionToggle(task.id, checked as boolean)}
        onClick={(e) => e.stopPropagation()}
        className={`shrink-0 ${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`}
      />

      {/* Task info */}
      <div className="flex-1 min-w-0" onClick={() => onTitleClick(task.id)}>
        <div className={`flex items-center gap-1.5 ${isMobile ? 'mb-0.5' : 'mb-1'}`}>
          <span
            className={`font-medium truncate ${isMobile ? 'text-sm' : ''} ${
              isCompleted ? 'line-through text-muted-foreground' : ''
            }`}
          >
            {task.title}
          </span>
          <TaskPriorityBadge priority={task.priority} size="sm" />
        </div>
        <div className={`flex items-center text-muted-foreground ${isMobile ? 'gap-2 text-xs' : 'gap-3 text-sm'}`}>
          {task.assignee && (
            <span className="flex items-center gap-0.5">
              <User className={isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
              {task.assignee.first_name}
            </span>
          )}
          {dueDateInfo && (
            <span className={`flex items-center gap-0.5 ${dueDateInfo.className}`}>
              <Calendar className={isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
              {dueDateInfo.label}
            </span>
          )}
          {task.ministry && !isMobile && (
            <Badge
              variant="outline"
              className="text-xs rounded-full"
              style={{
                borderColor: task.ministry.color,
                color: task.ministry.color,
              }}
            >
              {task.ministry.name}
            </Badge>
          )}
        </div>
      </div>

      {/* Status dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <button className="focus:outline-none shrink-0">
            <TaskStatusBadge status={task.status} size={isMobile ? 'sm' : 'default'} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-white dark:bg-zinc-950">
          {statusOptions.map((status) => (
            <DropdownMenuItem
              key={status}
              onClick={(e) => {
                e.stopPropagation()
                onStatusChange(task.id, status)
              }}
              className="cursor-pointer"
            >
              <TaskStatusBadge status={status} />
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className={`shrink-0 ${isMobile ? 'h-6 w-6' : 'h-8 w-8'}`}>
            <MoreHorizontal className={isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              onEdit(task)
            }}
          >
            {t('actions.edit')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              onDelete(task)
            }}
            className="text-red-600"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t('actions.delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
})
