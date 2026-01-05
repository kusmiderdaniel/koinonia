'use client'

import { InlineEntityEditor } from '@/components/editors'
import type { TaskCampus } from '../types'

interface InlineCampusEditorProps {
  campusId: string | null
  campus: TaskCampus | null | undefined
  campuses: TaskCampus[]
  onUpdate: (campusId: string | null) => Promise<void>
  disabled?: boolean
}

export function InlineCampusEditor({
  campusId,
  campus,
  campuses,
  onUpdate,
  disabled = false,
}: InlineCampusEditorProps) {
  return (
    <InlineEntityEditor
      value={campusId}
      entity={campus}
      options={campuses}
      onUpdate={onUpdate}
      emptyLabel="No campus"
      disabled={disabled}
    />
  )
}
