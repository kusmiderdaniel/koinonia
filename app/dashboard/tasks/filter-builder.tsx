'use client'

import { useMemo } from 'react'
import { FilterBuilder, type FilterState, type FilterFieldDefinition } from '@/components/filters'
import { TASK_FILTER_FIELDS, TASK_OPERATORS_BY_TYPE } from './filter-types'
import type { TaskMinistry, TaskCampus, Person } from './types'

interface TaskFilterBuilderProps {
  filterState: FilterState
  onChange: (filterState: FilterState) => void
  ministries: TaskMinistry[]
  campuses: TaskCampus[]
  members: Person[]
  events: { id: string; title: string }[]
}

export function TaskFilterBuilder({
  filterState,
  onChange,
  ministries,
  campuses,
  members,
  events,
}: TaskFilterBuilderProps) {
  // Build filter fields with dynamic options
  const filterFields = useMemo((): FilterFieldDefinition[] => {
    return TASK_FILTER_FIELDS.map((field) => {
      if (field.id === 'assignee_id') {
        return {
          ...field,
          options: [
            { value: '__unassigned__', label: 'Unassigned' },
            ...members.map((m) => ({ value: m.id, label: `${m.first_name} ${m.last_name}` })),
          ],
        }
      }
      if (field.id === 'ministry_id') {
        return {
          ...field,
          options: [
            { value: '__none__', label: 'No ministry' },
            ...ministries.map((m) => ({ value: m.id, label: m.name })),
          ],
        }
      }
      if (field.id === 'campus_id') {
        return {
          ...field,
          options: [
            { value: '__none__', label: 'No campus' },
            ...campuses.map((c) => ({ value: c.id, label: c.name })),
          ],
        }
      }
      if (field.id === 'event_id') {
        return {
          ...field,
          options: [
            { value: '__none__', label: 'No event' },
            ...events.map((e) => ({ value: e.id, label: e.title })),
          ],
        }
      }
      return field
    })
  }, [ministries, campuses, members, events])

  return (
    <FilterBuilder
      filterState={filterState}
      onChange={onChange}
      filterFields={filterFields}
      operatorsByType={TASK_OPERATORS_BY_TYPE}
      defaultField="title"
    />
  )
}

// Re-export for backwards compatibility
export { FilterBuilder }
