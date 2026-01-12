// People-specific sort definitions
// Re-export shared types for convenience

export {
  type SortState,
  type SortRule,
  type SortDirection,
  type SortFieldDefinition,
  createEmptySortState,
  countActiveSorts,
  generateSortId,
} from '@/lib/filters/sort-types'

import {
  type SortState,
  type SortFieldDefinition,
  createSortRule as createGenericSortRule,
  generateSortId,
} from '@/lib/filters/sort-types'

// People-specific sort fields
export const PEOPLE_SORT_FIELDS: SortFieldDefinition[] = [
  { id: 'name', label: 'Name', icon: 'text' },
  { id: 'email', label: 'Email', icon: 'text' },
  { id: 'role', label: 'Role', icon: 'select' },
  { id: 'active', label: 'Active', icon: 'boolean' },
  { id: 'sex', label: 'Gender', icon: 'select' },
  { id: 'date_of_birth', label: 'Date of Birth', icon: 'date' },
  { id: 'age', label: 'Age', icon: 'number' },
  { id: 'baptism', label: 'Baptized', icon: 'boolean' },
  { id: 'baptism_date', label: 'Baptism Date', icon: 'date' },
  { id: 'date_of_departure', label: 'Departure Date', icon: 'date' },
  { id: 'created_at', label: 'Joined', icon: 'date' },
]

// Backwards compatibility exports
export const SORT_FIELDS = PEOPLE_SORT_FIELDS

// Wrapper for createSortRule that uses people fields
export function createSortRule(existingSorts: SortState) {
  return createGenericSortRule(existingSorts, PEOPLE_SORT_FIELDS)
}

// Create default sort state for people (sorted by name ascending)
export function createDefaultPeopleSortState(): SortState {
  return [
    {
      id: generateSortId(),
      field: 'name',
      direction: 'asc',
    },
  ]
}
