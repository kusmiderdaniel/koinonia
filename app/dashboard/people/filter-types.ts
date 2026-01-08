// People-specific filter definitions
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
} from '@/lib/filters/filter-types'

import type { FilterFieldDefinition, OperatorsByType } from '@/lib/filters/filter-types'

// People-specific filter fields
export const PEOPLE_FILTER_FIELDS: FilterFieldDefinition[] = [
  { id: 'name', label: 'Name', type: 'text' },
  { id: 'email', label: 'Email', type: 'text' },
  {
    id: 'role',
    label: 'Role',
    type: 'select',
    options: [
      { value: 'owner', label: 'Owner' },
      { value: 'admin', label: 'Admin' },
      { value: 'leader', label: 'Leader' },
      { value: 'volunteer', label: 'Volunteer' },
      { value: 'member', label: 'Member' },
    ],
  },
  { id: 'active', label: 'Active', type: 'boolean' },
  {
    id: 'sex',
    label: 'Gender',
    type: 'select',
    options: [
      { value: 'male', label: 'Male' },
      { value: 'female', label: 'Female' },
    ],
  },
  { id: 'date_of_birth', label: 'Date of Birth', type: 'date' },
  { id: 'age', label: 'Age', type: 'number' },
  { id: 'baptism', label: 'Baptized', type: 'boolean' },
  { id: 'baptism_date', label: 'Baptism Date', type: 'date' },
  { id: 'date_of_departure', label: 'Departure Date', type: 'date' },
  { id: 'created_at', label: 'Joined', type: 'date' },
  { id: 'ministry_roles', label: 'Ministry Roles', type: 'multiSelect' },
]

// People-specific operators (using 'is'/'is_not' naming convention)
export const PEOPLE_OPERATORS_BY_TYPE: OperatorsByType = {
  text: [
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Does not contain' },
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Does not equal' },
    { value: 'starts_with', label: 'Starts with' },
    { value: 'ends_with', label: 'Ends with' },
    { value: 'is_empty', label: 'Is empty' },
    { value: 'is_not_empty', label: 'Is not empty' },
  ],
  select: [
    { value: 'is', label: 'Is' },
    { value: 'is_not', label: 'Is not' },
    { value: 'is_empty', label: 'Is empty' },
    { value: 'is_not_empty', label: 'Is not empty' },
  ],
  boolean: [
    { value: 'is', label: 'Is' },
  ],
  date: [
    { value: 'is', label: 'Is' },
    { value: 'is_before', label: 'Is before' },
    { value: 'is_after', label: 'Is after' },
    { value: 'is_empty', label: 'Is empty' },
    { value: 'is_not_empty', label: 'Is not empty' },
  ],
  number: [
    { value: 'eq', label: '=' },
    { value: 'neq', label: '≠' },
    { value: 'lt', label: '<' },
    { value: 'gt', label: '>' },
    { value: 'lte', label: '≤' },
    { value: 'gte', label: '≥' },
    { value: 'is_empty', label: 'Is empty' },
    { value: 'is_not_empty', label: 'Is not empty' },
  ],
  multiSelect: [
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Does not contain' },
    { value: 'is_empty', label: 'Is empty' },
    { value: 'is_not_empty', label: 'Is not empty' },
  ],
}

// Backwards compatibility exports
export const FILTER_FIELDS = PEOPLE_FILTER_FIELDS
export const OPERATORS_BY_TYPE = PEOPLE_OPERATORS_BY_TYPE
