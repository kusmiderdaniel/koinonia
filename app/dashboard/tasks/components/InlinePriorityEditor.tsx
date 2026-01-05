'use client'

import { InlineBadgeEditor, type BadgeOption } from '@/components/editors'
import { TaskPriorityBadge } from './TaskBadges'
import type { TaskPriority } from '../types'

interface InlinePriorityEditorProps {
  priority: TaskPriority
  onUpdate: (priority: TaskPriority) => Promise<void>
  disabled?: boolean
}

const priorityOptions: BadgeOption<TaskPriority>[] = [
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
  return (
    <InlineBadgeEditor
      value={priority}
      options={priorityOptions}
      onUpdate={onUpdate}
      renderBadge={(value, size) => <TaskPriorityBadge priority={value} size={size} />}
      disabled={disabled}
    />
  )
}
