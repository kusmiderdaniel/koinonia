'use client'

import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TaskStatusBadge } from './TaskBadges'
import type { TaskStatus } from '../types'

interface InlineStatusEditorProps {
  status: TaskStatus
  onUpdate: (status: TaskStatus) => Promise<void>
  disabled?: boolean
}

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export function InlineStatusEditor({
  status,
  onUpdate,
  disabled = false,
}: InlineStatusEditorProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (newStatus === status || isUpdating) return
    setIsUpdating(true)
    try {
      await onUpdate(newStatus)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled || isUpdating}>
        <button className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full">
          <span className={isUpdating ? 'opacity-50' : ''}>
            <TaskStatusBadge status={status} size="sm" />
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="bg-white dark:bg-zinc-950">
        {statusOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleStatusChange(option.value)}
            className="cursor-pointer"
          >
            <TaskStatusBadge status={option.value} />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
