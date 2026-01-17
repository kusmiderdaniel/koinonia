'use client'

import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { TaskStatus, TaskPriority } from '../types'

interface TaskStatusBadgeProps {
  status: TaskStatus
  size?: 'sm' | 'default'
}

const statusStyles: Record<TaskStatus, string> = {
  pending: 'border-gray-500 text-gray-500 bg-gray-50 dark:bg-gray-500/20 dark:text-gray-300',
  in_progress: 'border-blue-500 text-blue-500 bg-blue-50 dark:bg-blue-500/20 dark:text-blue-300',
  completed: 'border-green-400 text-green-600 bg-green-50 dark:bg-green-500/20 dark:text-green-300',
  cancelled: 'border-red-400 text-red-600 bg-red-50 dark:bg-red-500/20 dark:text-red-300',
}

export function TaskStatusBadge({ status, size = 'default' }: TaskStatusBadgeProps) {
  const t = useTranslations('tasks')

  return (
    <Badge
      variant="outline"
      className={cn(
        'rounded-full',
        statusStyles[status],
        size === 'sm' && 'text-xs px-1.5 py-0'
      )}
    >
      {t(`status.${status}`)}
    </Badge>
  )
}

interface TaskPriorityBadgeProps {
  priority: TaskPriority
  size?: 'sm' | 'default'
}

const priorityStyles: Record<TaskPriority, string> = {
  low: 'bg-gray-100 text-gray-600 border-transparent dark:bg-gray-500/20 dark:text-gray-300',
  medium: 'bg-blue-100 text-blue-600 border-transparent dark:bg-blue-500/20 dark:text-blue-300',
  high: 'bg-orange-100 text-orange-600 border-transparent dark:bg-orange-500/20 dark:text-orange-300',
  urgent: 'bg-red-100 text-red-600 border-transparent dark:bg-red-500/20 dark:text-red-300',
}

export function TaskPriorityBadge({ priority, size = 'default' }: TaskPriorityBadgeProps) {
  const t = useTranslations('tasks')

  return (
    <Badge
      variant="outline"
      className={cn(
        'rounded-full',
        priorityStyles[priority],
        size === 'sm' && 'text-xs px-1.5 py-0'
      )}
    >
      {t(`priority.${priority}`)}
    </Badge>
  )
}
