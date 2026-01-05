'use client'

import { InlineEntityEditor } from '@/components/editors'
import type { TaskMinistry } from '../types'

interface InlineMinistryEditorProps {
  ministryId: string | null
  ministry: TaskMinistry | null | undefined
  ministries: TaskMinistry[]
  onUpdate: (ministryId: string | null) => Promise<void>
  disabled?: boolean
}

export function InlineMinistryEditor({
  ministryId,
  ministry,
  ministries,
  onUpdate,
  disabled = false,
}: InlineMinistryEditorProps) {
  return (
    <InlineEntityEditor
      value={ministryId}
      entity={ministry}
      options={ministries}
      onUpdate={onUpdate}
      emptyLabel="No ministry"
      disabled={disabled}
    />
  )
}
