'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { TaskStatus, TaskPriority } from '../types'

interface TaskStatusBadgeProps {
  status: TaskStatus
  size?: 'sm' | 'default'
}

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  pending: {
    label: 'Pending',
    className: 'border-gray-500 text-gray-500 bg-gray-50',
  },
  in_progress: {
    label: 'In Progress',
    className: 'border-blue-500 text-blue-500 bg-blue-50',
  },
  completed: {
    label: 'Completed',
    className: 'border-green-400 text-green-600 bg-green-50',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'border-red-400 text-red-600 bg-red-50',
  },
}

export function TaskStatusBadge({ status, size = 'default' }: TaskStatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <Badge
      variant="outline"
      className={cn(
        'rounded-full',
        config.className,
        size === 'sm' && 'text-xs px-1.5 py-0'
      )}
    >
      {config.label}
    </Badge>
  )
}

interface TaskPriorityBadgeProps {
  priority: TaskPriority
  size?: 'sm' | 'default'
}

const priorityConfig: Record<TaskPriority, { label: string; className: string }> = {
  low: {
    label: 'Low',
    className: 'bg-gray-100 text-gray-600 border-transparent',
  },
  medium: {
    label: 'Medium',
    className: 'bg-blue-100 text-blue-600 border-transparent',
  },
  high: {
    label: 'High',
    className: 'bg-orange-100 text-orange-600 border-transparent',
  },
  urgent: {
    label: 'Urgent',
    className: 'bg-red-100 text-red-600 border-transparent',
  },
}

export function TaskPriorityBadge({ priority, size = 'default' }: TaskPriorityBadgeProps) {
  const config = priorityConfig[priority]

  return (
    <Badge
      variant="outline"
      className={cn(
        'rounded-full',
        config.className,
        size === 'sm' && 'text-xs px-1.5 py-0'
      )}
    >
      {config.label}
    </Badge>
  )
}
