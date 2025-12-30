// Sort field definitions
export interface SortFieldDefinition {
  id: string
  label: string
  icon: 'text' | 'number' | 'date' | 'boolean' | 'select'
}

// Available fields for sorting
export const SORT_FIELDS: SortFieldDefinition[] = [
  { id: 'name', label: 'Name', icon: 'text' },
  { id: 'email', label: 'Email', icon: 'text' },
  { id: 'role', label: 'Role', icon: 'select' },
  { id: 'active', label: 'Active', icon: 'boolean' },
  { id: 'sex', label: 'Sex', icon: 'select' },
  { id: 'date_of_birth', label: 'Date of Birth', icon: 'date' },
  { id: 'age', label: 'Age', icon: 'number' },
  { id: 'baptism', label: 'Baptized', icon: 'boolean' },
  { id: 'baptism_date', label: 'Baptism Date', icon: 'date' },
  { id: 'date_of_departure', label: 'Departure Date', icon: 'date' },
  { id: 'created_at', label: 'Joined', icon: 'date' },
]

// Sort direction
export type SortDirection = 'asc' | 'desc'

// Sort rule structure
export interface SortRule {
  id: string
  field: string
  direction: SortDirection
}

// Sort state (array of rules applied in order)
export type SortState = SortRule[]

// Helper to create empty sort state
export function createEmptySortState(): SortState {
  return []
}

// Helper to create a new sort rule
export function createSortRule(existingSorts: SortState): SortRule {
  // Find a field that's not already being sorted
  const usedFields = existingSorts.map(s => s.field)
  const availableField = SORT_FIELDS.find(f => !usedFields.includes(f.id)) || SORT_FIELDS[0]

  return {
    id: crypto.randomUUID(),
    field: availableField.id,
    direction: 'asc',
  }
}
