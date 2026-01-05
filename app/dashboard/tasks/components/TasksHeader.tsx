'use client'

import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface TasksHeaderProps {
  taskCount: number
  onCreateTask: () => void
}

export function TasksHeader({ taskCount, onCreateTask }: TasksHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
      <div>
        <h1 className="text-2xl font-bold">Tasks</h1>
        <p className="text-muted-foreground">
          {taskCount} task{taskCount !== 1 ? 's' : ''}
        </p>
      </div>
      <Button
        onClick={onCreateTask}
        variant="outline"
        className="rounded-full !border !border-gray-300 dark:!border-gray-600"
      >
        <Plus className="h-4 w-4 mr-2" />
        New Task
      </Button>
    </div>
  )
}
