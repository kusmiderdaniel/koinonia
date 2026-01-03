'use client'

import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TaskPriorityBadge } from './TaskBadges'
import type { TaskPriority } from '../types'

interface InlinePriorityEditorProps {
  priority: TaskPriority
  onUpdate: (priority: TaskPriority) => Promise<void>
  disabled?: boolean
}

const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

export function InlinePriorityEditor({
  priority,
  onUpdate,
  disabled = false,
}: InlinePriorityEditorProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  const handlePriorityChange = async (newPriority: TaskPriority) => {
    if (newPriority === priority || isUpdating) return
    setIsUpdating(true)
    try {
      await onUpdate(newPriority)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled || isUpdating}>
        <button className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full">
          <span className={isUpdating ? 'opacity-50' : ''}>
            <TaskPriorityBadge priority={priority} size="sm" />
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="bg-white dark:bg-zinc-950">
        {priorityOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handlePriorityChange(option.value)}
            className="cursor-pointer"
          >
            <TaskPriorityBadge priority={option.value} />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
