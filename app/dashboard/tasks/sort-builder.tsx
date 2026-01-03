'use client'

import { SortBuilder, type SortState } from '@/components/filters'
import { TASK_SORT_FIELDS } from './sort-types'

interface TaskSortBuilderProps {
  sortState: SortState
  onChange: (sortState: SortState) => void
}

export function TaskSortBuilder({ sortState, onChange }: TaskSortBuilderProps) {
  return (
    <SortBuilder
      sortState={sortState}
      onChange={onChange}
      sortFields={TASK_SORT_FIELDS}
    />
  )
}

// Re-export for backwards compatibility
export { SortBuilder }
