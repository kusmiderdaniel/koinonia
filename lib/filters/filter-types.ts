// Shared filter type definitions

// Generate unique ID with fallback for older browsers
export function generateFilterId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}

// Field types supported by the filter builder
export type FilterFieldType = 'text' | 'select' | 'boolean' | 'date' | 'number' | 'multiSelect'

// Option for select/multiSelect fields
export interface FilterSelectOption {
  value: string
  label: string
}

// Field definition for filter configuration
export interface FilterFieldDefinition {
  id: string
  label: string
  type: FilterFieldType
  options?: FilterSelectOption[]
}

// Operator definition
export interface FilterOperator {
  value: string
  label: string
}

// Operators by type configuration
export type OperatorsByType = Record<FilterFieldType, FilterOperator[]>

// Default operators for each field type
export const DEFAULT_OPERATORS_BY_TYPE: OperatorsByType = {
  text: [
    { value: 'contains', label: 'contains' },
    { value: 'not_contains', label: 'does not contain' },
    { value: 'equals', label: 'equals' },
    { value: 'not_equals', label: 'does not equal' },
    { value: 'starts_with', label: 'starts with' },
    { value: 'ends_with', label: 'ends with' },
    { value: 'is_empty', label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ],
  select: [
    { value: 'equals', label: 'is' },
    { value: 'not_equals', label: 'is not' },
    { value: 'is_empty', label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ],
  boolean: [
    { value: 'equals', label: 'is' },
  ],
  date: [
    { value: 'equals', label: 'is' },
    { value: 'before', label: 'is before' },
    { value: 'after', label: 'is after' },
    { value: 'is_empty', label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ],
  number: [
    { value: 'eq', label: '=' },
    { value: 'neq', label: '≠' },
    { value: 'lt', label: '<' },
    { value: 'gt', label: '>' },
    { value: 'lte', label: '≤' },
    { value: 'gte', label: '≥' },
    { value: 'is_empty', label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ],
  multiSelect: [
    { value: 'contains', label: 'contains' },
    { value: 'not_contains', label: 'does not contain' },
    { value: 'is_empty', label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ],
}

// Filter rule structure
export interface FilterRule {
  id: string
  field: string
  operator: string
  value: string | boolean | string[] | null
}

// Filter group structure (supports nesting)
export interface FilterGroup {
  id: string
  conjunction: 'and' | 'or'
  rules: FilterRule[]
  groups?: FilterGroup[]
}

// Root filter state
export interface FilterState {
  conjunction: 'and' | 'or'
  rules: FilterRule[]
  groups: FilterGroup[]
}

// Helper to create empty filter state
export function createEmptyFilterState(): FilterState {
  return {
    conjunction: 'and',
    rules: [],
    groups: [],
  }
}

// Helper to create a new rule with customizable default field
export function createFilterRule(defaultField: string = 'title'): FilterRule {
  return {
    id: generateFilterId(),
    field: defaultField,
    operator: 'contains',
    value: '',
  }
}

// Helper to create a new group
export function createFilterGroup(defaultField: string = 'title'): FilterGroup {
  return {
    id: generateFilterId(),
    conjunction: 'and',
    rules: [createFilterRule(defaultField)],
    groups: [],
  }
}

// Get default operator for a field type
export function getDefaultOperator(fieldType: FilterFieldType): string {
  switch (fieldType) {
    case 'text':
      return 'contains'
    case 'select':
    case 'multiSelect':
      return 'equals'
    case 'date':
      return 'equals'
    case 'number':
      return 'eq'
    case 'boolean':
      return 'equals'
    default:
      return 'contains'
  }
}

// Check if operator needs a value input
export function operatorNeedsValue(operator: string): boolean {
  return !['is_empty', 'is_not_empty'].includes(operator)
}

// Count active filters in a filter state
export function countActiveFilters(filterState: FilterState): number {
  let count = filterState.rules.length

  function countGroupFilters(group: FilterGroup): number {
    const groupsCount = group.groups?.reduce((sum, g) => sum + countGroupFilters(g), 0) ?? 0
    return group.rules.length + groupsCount
  }

  count += filterState.groups.reduce((sum, g) => sum + countGroupFilters(g), 0)
  return count
}
