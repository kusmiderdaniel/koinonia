// Column definitions for the People table

export type PeopleColumnKey =
  | 'active'
  | 'name'
  | 'email'
  | 'phone'
  | 'role'
  | 'campus'
  | 'ministry_roles'
  | 'gender'
  | 'date_of_birth'
  | 'age'
  | 'baptized'
  | 'baptism_date'
  | 'departure_date'
  | 'departure_reason'
  | 'joined'

export interface PeopleColumn {
  key: PeopleColumnKey
  labelKey: string // Translation key for the column header
  defaultVisible: boolean
  canHide: boolean // Some columns like 'name' should always be visible
}

export const PEOPLE_COLUMNS: PeopleColumn[] = [
  { key: 'active', labelKey: 'tableHeader.active', defaultVisible: true, canHide: true },
  { key: 'name', labelKey: 'tableHeader.name', defaultVisible: true, canHide: false },
  { key: 'email', labelKey: 'tableHeader.email', defaultVisible: true, canHide: true },
  { key: 'phone', labelKey: 'tableHeader.phone', defaultVisible: true, canHide: true },
  { key: 'role', labelKey: 'tableHeader.role', defaultVisible: true, canHide: true },
  { key: 'campus', labelKey: 'tableHeader.campus', defaultVisible: true, canHide: true },
  { key: 'ministry_roles', labelKey: 'tableHeader.ministryRoles', defaultVisible: true, canHide: true },
  { key: 'gender', labelKey: 'tableHeader.gender', defaultVisible: true, canHide: true },
  { key: 'date_of_birth', labelKey: 'tableHeader.dateOfBirth', defaultVisible: true, canHide: true },
  { key: 'age', labelKey: 'tableHeader.age', defaultVisible: true, canHide: true },
  { key: 'baptized', labelKey: 'tableHeader.baptized', defaultVisible: true, canHide: true },
  { key: 'baptism_date', labelKey: 'tableHeader.baptismDate', defaultVisible: true, canHide: true },
  { key: 'departure_date', labelKey: 'tableHeader.departureDate', defaultVisible: true, canHide: true },
  { key: 'departure_reason', labelKey: 'tableHeader.departureReason', defaultVisible: true, canHide: true },
  { key: 'joined', labelKey: 'tableHeader.joined', defaultVisible: true, canHide: true },
]

// Get all column keys
export const ALL_PEOPLE_COLUMN_KEYS: PeopleColumnKey[] = PEOPLE_COLUMNS.map(c => c.key)

// Get default visible columns
export const DEFAULT_VISIBLE_COLUMNS: PeopleColumnKey[] = PEOPLE_COLUMNS
  .filter(c => c.defaultVisible)
  .map(c => c.key)

// Get columns that cannot be hidden
export const REQUIRED_COLUMNS: PeopleColumnKey[] = PEOPLE_COLUMNS
  .filter(c => !c.canHide)
  .map(c => c.key)

// Helper to check if a column is visible
export function isColumnVisible(
  columnKey: PeopleColumnKey,
  visibleColumns: PeopleColumnKey[] | null | undefined
): boolean {
  // If no visible columns specified, show all
  if (!visibleColumns) return true
  return visibleColumns.includes(columnKey)
}
