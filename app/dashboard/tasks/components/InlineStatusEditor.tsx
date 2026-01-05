'use client'

import { InlineBadgeEditor, type BadgeOption } from '@/components/editors'
import { TaskStatusBadge } from './TaskBadges'
import type { TaskStatus } from '../types'

interface InlineStatusEditorProps {
  status: TaskStatus
  onUpdate: (status: TaskStatus) => Promise<void>
  disabled?: boolean
}

const statusOptions: BadgeOption<TaskStatus>[] = [
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
  return (
    <InlineBadgeEditor
      value={status}
      options={statusOptions}
      onUpdate={onUpdate}
      renderBadge={(value, size) => <TaskStatusBadge status={value} size={size} />}
      disabled={disabled}
    />
  )
}
