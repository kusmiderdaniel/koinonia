// Task-specific filter definitions
// Re-export shared types for convenience

export {
  type FilterState,
  type FilterRule,
  type FilterGroup,
  type FilterFieldDefinition,
  type FilterFieldType,
  type OperatorsByType,
  createEmptyFilterState,
  createFilterRule,
  createFilterGroup,
  getDefaultOperator,
  operatorNeedsValue,
  countActiveFilters,
  generateFilterId,
} from '@/lib/filters/filter-types'

import { generateFilterId, type FilterState } from '@/lib/filters/filter-types'

// Default filter state showing only pending and in_progress tasks
// Status filters are in a group so users can add AND/OR filters without affecting the status logic
export function createDefaultTaskFilterState(): FilterState {
  return {
    conjunction: 'and',
    rules: [],
    groups: [
      {
        id: generateFilterId(),
        conjunction: 'or',
        rules: [
          {
            id: generateFilterId(),
            field: 'status',
            operator: 'equals',
            value: 'pending',
          },
          {
            id: generateFilterId(),
            field: 'status',
            operator: 'equals',
            value: 'in_progress',
          },
        ],
      },
    ],
  }
}

import type { FilterFieldDefinition, OperatorsByType } from '@/lib/filters/filter-types'

// Task-specific filter fields - options for dynamic fields (assignee, ministry, etc.)
// will be populated at runtime
export const TASK_FILTER_FIELDS: FilterFieldDefinition[] = [
  { id: 'title', label: 'Title', type: 'text' },
  {
    id: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'pending', label: 'Pending' },
      { value: 'in_progress', label: 'In Progress' },
      { value: 'completed', label: 'Completed' },
      { value: 'cancelled', label: 'Cancelled' },
    ],
  },
  {
    id: 'priority',
    label: 'Priority',
    type: 'select',
    options: [
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' },
      { value: 'urgent', label: 'Urgent' },
    ],
  },
  { id: 'due_date', label: 'Due Date', type: 'date' },
  { id: 'assignee_id', label: 'Assignee', type: 'select', options: [] },
  { id: 'ministry_id', label: 'Ministry', type: 'select', options: [] },
  { id: 'campus_id', label: 'Campus', type: 'select', options: [] },
  { id: 'event_id', label: 'Event', type: 'select', options: [] },
]

// Task-specific operators (can customize from defaults if needed)
export const TASK_OPERATORS_BY_TYPE: OperatorsByType = {
  text: [
    { value: 'contains', label: 'contains' },
    { value: 'not_contains', label: 'does not contain' },
    { value: 'equals', label: 'equals' },
    { value: 'not_equals', label: 'does not equal' },
    { value: 'is_empty', label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ],
  select: [
    { value: 'equals', label: 'is' },
    { value: 'not_equals', label: 'is not' },
    { value: 'is_empty', label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ],
  multiSelect: [
    { value: 'contains', label: 'contains' },
    { value: 'not_contains', label: 'does not contain' },
    { value: 'is_empty', label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ],
  date: [
    { value: 'equals', label: 'is' },
    { value: 'before', label: 'is before' },
    { value: 'after', label: 'is after' },
    { value: 'is_empty', label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ],
  boolean: [
    { value: 'equals', label: 'is' },
  ],
  number: [
    { value: 'eq', label: '=' },
    { value: 'neq', label: '≠' },
    { value: 'lt', label: '<' },
    { value: 'gt', label: '>' },
    { value: 'is_empty', label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ],
}

// Backwards compatibility exports (using shared naming)
export const BASE_FILTER_FIELDS = TASK_FILTER_FIELDS
export const OPERATORS_BY_TYPE = TASK_OPERATORS_BY_TYPE
