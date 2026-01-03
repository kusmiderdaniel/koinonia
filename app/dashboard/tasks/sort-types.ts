// Task-specific sort definitions
// Re-export shared types for convenience

export {
  type SortState,
  type SortRule,
  type SortDirection,
  type SortFieldDefinition,
  createEmptySortState,
  countActiveSorts,
} from '@/lib/filters/sort-types'

import {
  type SortState,
  type SortFieldDefinition,
  createSortRule as createGenericSortRule,
} from '@/lib/filters/sort-types'

// Task-specific sort fields
export const TASK_SORT_FIELDS: SortFieldDefinition[] = [
  { id: 'title', label: 'Title', icon: 'text' },
  { id: 'due_date', label: 'Due Date', icon: 'date' },
  { id: 'priority', label: 'Priority', icon: 'select' },
  { id: 'status', label: 'Status', icon: 'select' },
  { id: 'created_at', label: 'Created', icon: 'date' },
  { id: 'assignee', label: 'Assignee', icon: 'text' },
]

// Backwards compatibility exports
export const SORT_FIELDS = TASK_SORT_FIELDS

// Wrapper for createSortRule that uses task fields
export function createSortRule(existingSorts: SortState) {
  return createGenericSortRule(existingSorts, TASK_SORT_FIELDS)
}
