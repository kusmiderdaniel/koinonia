'use client'

import { useTranslations } from 'next-intl'
import { InlineBadgeEditor, type BadgeOption } from '@/components/editors'
import { TaskPriorityBadge } from './TaskBadges'
import type { TaskPriority } from '../types'

interface InlinePriorityEditorProps {
  priority: TaskPriority
  onUpdate: (priority: TaskPriority) => Promise<void>
  disabled?: boolean
}

const priorityValues: TaskPriority[] = ['low', 'medium', 'high', 'urgent']

export function InlinePriorityEditor({
  priority,
  onUpdate,
  disabled = false,
}: InlinePriorityEditorProps) {
  const t = useTranslations('tasks')

  const priorityOptions: BadgeOption<TaskPriority>[] = priorityValues.map((p) => ({
    value: p,
    label: t(`priority.${p}`),
  }))

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
