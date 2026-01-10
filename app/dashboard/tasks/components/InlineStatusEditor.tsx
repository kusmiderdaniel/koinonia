'use client'

import { useTranslations } from 'next-intl'
import { InlineBadgeEditor, type BadgeOption } from '@/components/editors'
import { TaskStatusBadge } from './TaskBadges'
import type { TaskStatus } from '../types'

interface InlineStatusEditorProps {
  status: TaskStatus
  onUpdate: (status: TaskStatus) => Promise<void>
  disabled?: boolean
}

const statusValues: TaskStatus[] = ['pending', 'in_progress', 'completed', 'cancelled']

export function InlineStatusEditor({
  status,
  onUpdate,
  disabled = false,
}: InlineStatusEditorProps) {
  const t = useTranslations('tasks')

  const statusOptions: BadgeOption<TaskStatus>[] = statusValues.map((s) => ({
    value: s,
    label: t(`status.${s}`),
  }))

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
