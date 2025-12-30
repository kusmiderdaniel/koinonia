// Generate unique ID (fallback for browsers without crypto.randomUUID)
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for older browsers
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}

// Filter field definitions
export type FilterFieldType = 'text' | 'select' | 'boolean' | 'date' | 'number' | 'multiSelect'

export interface FilterFieldDefinition {
  id: string
  label: string
  type: FilterFieldType
  options?: { value: string; label: string }[]
}

// Available fields for filtering
export const FILTER_FIELDS: FilterFieldDefinition[] = [
  { id: 'name', label: 'Name', type: 'text' },
  { id: 'email', label: 'Email', type: 'text' },
  { id: 'role', label: 'Role', type: 'select', options: [
    { value: 'owner', label: 'Owner' },
    { value: 'admin', label: 'Admin' },
    { value: 'leader', label: 'Leader' },
    { value: 'volunteer', label: 'Volunteer' },
    { value: 'member', label: 'Member' },
  ]},
  { id: 'active', label: 'Active', type: 'boolean' },
  { id: 'sex', label: 'Sex', type: 'select', options: [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
  ]},
  { id: 'date_of_birth', label: 'Date of Birth', type: 'date' },
  { id: 'age', label: 'Age', type: 'number' },
  { id: 'baptism', label: 'Baptized', type: 'boolean' },
  { id: 'baptism_date', label: 'Baptism Date', type: 'date' },
  { id: 'date_of_departure', label: 'Departure Date', type: 'date' },
  { id: 'created_at', label: 'Joined', type: 'date' },
  { id: 'ministry_roles', label: 'Ministry Roles', type: 'multiSelect' },
]

// Operators by field type
export const OPERATORS_BY_TYPE: Record<FilterFieldType, { value: string; label: string }[]> = {
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

// Filter rule structure
export interface FilterRule {
  id: string
  field: string
  operator: string
  value: string | boolean | null
}

// Filter group structure (supports nesting)
export interface FilterGroup {
  id: string
  conjunction: 'and' | 'or'
  rules: FilterRule[]
  groups: FilterGroup[]
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

// Helper to create a new rule
export function createFilterRule(): FilterRule {
  return {
    id: generateId(),
    field: 'name',
    operator: 'contains',
    value: '',
  }
}

// Helper to create a new group
export function createFilterGroup(): FilterGroup {
  return {
    id: generateId(),
    conjunction: 'and',
    rules: [createFilterRule()],
    groups: [],
  }
}

// Get default operator for a field type
export function getDefaultOperator(fieldType: FilterFieldType): string {
  switch (fieldType) {
    case 'text': return 'contains'
    case 'select': return 'is'
    case 'boolean': return 'is'
    case 'date': return 'is'
    case 'number': return 'eq'
    case 'multiSelect': return 'contains'
    default: return 'contains'
  }
}

// Check if operator needs a value input
export function operatorNeedsValue(operator: string): boolean {
  return !['is_empty', 'is_not_empty'].includes(operator)
}
