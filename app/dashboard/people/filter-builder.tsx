'use client'

import { FilterBuilder, type FilterState } from '@/components/filters'
import { PEOPLE_FILTER_FIELDS, PEOPLE_OPERATORS_BY_TYPE } from './filter-types'

interface PeopleFilterBuilderProps {
  filterState: FilterState
  onChange: (filterState: FilterState) => void
}

export function PeopleFilterBuilder({ filterState, onChange }: PeopleFilterBuilderProps) {
  return (
    <FilterBuilder
      filterState={filterState}
      onChange={onChange}
      filterFields={PEOPLE_FILTER_FIELDS}
      operatorsByType={PEOPLE_OPERATORS_BY_TYPE}
      defaultField="name"
    />
  )
}

// Re-export for backwards compatibility
export { FilterBuilder }
