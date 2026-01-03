// Shared sort type definitions

// Generate unique ID with fallback for older browsers
export function generateSortId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}

// Sort direction
export type SortDirection = 'asc' | 'desc'

// Sort field icon types
export type SortFieldIcon = 'text' | 'number' | 'date' | 'boolean' | 'select'

// Sort field definition
export interface SortFieldDefinition {
  id: string
  label: string
  icon: SortFieldIcon
}

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
export function createSortRule(
  existingSorts: SortState,
  sortFields: SortFieldDefinition[]
): SortRule {
  const usedFields = existingSorts.map((s) => s.field)
  const availableField = sortFields.find((f) => !usedFields.includes(f.id)) || sortFields[0]

  return {
    id: generateSortId(),
    field: availableField?.id ?? '',
    direction: 'asc',
  }
}

// Count active sorts
export function countActiveSorts(sortState: SortState): number {
  return sortState.length
}
