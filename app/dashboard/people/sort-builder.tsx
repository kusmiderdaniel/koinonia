'use client'

import { SortBuilder, type SortState } from '@/components/filters'
import { PEOPLE_SORT_FIELDS } from './sort-types'

interface PeopleSortBuilderProps {
  sortState: SortState
  onChange: (sortState: SortState) => void
}

export function PeopleSortBuilder({ sortState, onChange }: PeopleSortBuilderProps) {
  return (
    <SortBuilder
      sortState={sortState}
      onChange={onChange}
      sortFields={PEOPLE_SORT_FIELDS}
    />
  )
}

// Re-export for backwards compatibility
export { SortBuilder }
