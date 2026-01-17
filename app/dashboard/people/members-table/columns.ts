// Column definitions for the People table
import type { CustomFieldDefinition } from '@/types/custom-fields'
import type { ColumnConfig } from '@/types/saved-views'

// Static column keys (built-in columns)
export type StaticColumnKey =
  | 'active'
  | 'name'
  | 'user_type'
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

// Custom field column keys have prefix cf_<uuid>
export type CustomFieldColumnKey = `cf_${string}`

// Combined column key type
export type PeopleColumnKey = StaticColumnKey | CustomFieldColumnKey

export interface PeopleColumn {
  key: PeopleColumnKey
  labelKey: string // Translation key for the column header (or direct label for custom fields)
  defaultVisible: boolean
  canHide: boolean // Some columns like 'name' should always be visible
  isCustomField?: boolean // Flag to identify custom field columns
  fieldDefinition?: CustomFieldDefinition // The custom field definition (for custom field columns)
}

export const PEOPLE_COLUMNS: PeopleColumn[] = [
  { key: 'active', labelKey: 'tableHeader.active', defaultVisible: true, canHide: true },
  { key: 'name', labelKey: 'tableHeader.name', defaultVisible: true, canHide: false },
  { key: 'user_type', labelKey: 'tableHeader.userType', defaultVisible: true, canHide: true },
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

// Helper to check if a column key is a custom field
export function isCustomFieldColumn(key: PeopleColumnKey): key is CustomFieldColumnKey {
  return key.startsWith('cf_')
}

// Extract the field ID from a custom field column key
export function getFieldIdFromColumnKey(key: CustomFieldColumnKey): string {
  return key.slice(3) // Remove 'cf_' prefix
}

// Generate column key for a custom field
export function getColumnKeyForField(fieldId: string): CustomFieldColumnKey {
  return `cf_${fieldId}`
}

// Convert custom field definition to column
export function customFieldToColumn(field: CustomFieldDefinition): PeopleColumn {
  return {
    key: getColumnKeyForField(field.id),
    labelKey: field.name, // Direct name, not a translation key
    defaultVisible: field.default_visible,
    canHide: true,
    isCustomField: true,
    fieldDefinition: field,
  }
}

// Merge static columns with custom field columns
export function getAllColumns(customFields: CustomFieldDefinition[]): PeopleColumn[] {
  const customColumns = customFields
    .sort((a, b) => a.display_order - b.display_order)
    .map(customFieldToColumn)

  return [...PEOPLE_COLUMNS, ...customColumns]
}

// Get all column keys including custom fields
export function getAllColumnKeys(customFields: CustomFieldDefinition[]): PeopleColumnKey[] {
  return getAllColumns(customFields).map(c => c.key)
}

// Get default visible columns including custom fields that are visible by default
export function getDefaultVisibleColumns(customFields: CustomFieldDefinition[]): PeopleColumnKey[] {
  return getAllColumns(customFields)
    .filter(c => c.defaultVisible)
    .map(c => c.key)
}

// =============================================================================
// Column Ordering and Resizing Helpers
// =============================================================================

// Pinned columns that cannot be reordered (always at the start)
export const PINNED_COLUMNS: PeopleColumnKey[] = ['active', 'name']

// Columns that should have centered content (checkboxes and dates)
export const CENTERED_COLUMNS: StaticColumnKey[] = [
  'active',
  'baptized',
  'age',
  'date_of_birth',
  'baptism_date',
  'departure_date',
  'joined',
]

// Check if a column should be centered
export function isColumnCentered(key: PeopleColumnKey, column?: PeopleColumn): boolean {
  // Static columns that are centered
  if (CENTERED_COLUMNS.includes(key as StaticColumnKey)) {
    return true
  }
  // Custom field columns - check field type
  if (column?.isCustomField && column.fieldDefinition) {
    const fieldType = column.fieldDefinition.field_type
    return fieldType === 'checkbox' || fieldType === 'date'
  }
  return false
}

// Default freeze column key - freezes Active and Name columns by default
export const DEFAULT_FREEZE_COLUMN_KEY: PeopleColumnKey = 'name'

// Check if a column is pinned
export function isPinnedColumn(key: PeopleColumnKey): boolean {
  return PINNED_COLUMNS.includes(key)
}

// Minimum widths for columns (in pixels)
// These are used for frozen columns to prevent collapse during horizontal scroll
export const COLUMN_MIN_WIDTHS: Partial<Record<PeopleColumnKey, number>> = {
  active: 70,
  name: 250,
  user_type: 80,
  email: 180,
  phone: 120,
  role: 100,
  campus: 120,
  ministry_roles: 150,
  gender: 80,
  date_of_birth: 120,
  age: 60,
  baptized: 80,
  baptism_date: 120,
  departure_date: 120,
  departure_reason: 150,
  joined: 100,
}

// Default minimum width for custom fields and unlisted columns
export const DEFAULT_MIN_WIDTH = 80

// Get minimum width for a column
export function getColumnMinWidth(key: PeopleColumnKey): number {
  return COLUMN_MIN_WIDTHS[key] ?? DEFAULT_MIN_WIDTH
}

// Create default columns config from available columns
export function createDefaultColumnsConfig(
  allColumns: PeopleColumn[]
): ColumnConfig[] {
  return allColumns.map((col) => ({
    key: col.key,
    visible: col.defaultVisible,
    // Don't set width - let it auto-size by default
  }))
}

// Get ordered columns based on config
// Returns columns in the order specified by config, with pinned columns always first
export function getOrderedColumns(
  allColumns: PeopleColumn[],
  columnsConfig: ColumnConfig[] | null
): PeopleColumn[] {
  // If no config, return columns in default order
  if (!columnsConfig || columnsConfig.length === 0) {
    return allColumns
  }

  // Create a map for quick lookup
  const columnMap = new Map(allColumns.map((c) => [c.key, c]))

  // Separate pinned and reorderable columns from config
  const pinnedResult: PeopleColumn[] = []
  const reorderableResult: PeopleColumn[] = []

  // First, add pinned columns in their defined order
  for (const pinnedKey of PINNED_COLUMNS) {
    const col = columnMap.get(pinnedKey)
    if (col) {
      pinnedResult.push(col)
    }
  }

  // Then, add columns in config order (excluding pinned)
  for (const config of columnsConfig) {
    if (PINNED_COLUMNS.includes(config.key as PeopleColumnKey)) {
      continue // Skip pinned columns, they're already added
    }
    const col = columnMap.get(config.key as PeopleColumnKey)
    if (col) {
      reorderableResult.push(col)
    }
  }

  // Finally, add any columns that are in allColumns but not in config
  // (e.g., newly added custom fields)
  const configKeys = new Set(columnsConfig.map((c) => c.key))
  for (const col of allColumns) {
    if (!configKeys.has(col.key) && !PINNED_COLUMNS.includes(col.key)) {
      reorderableResult.push(col)
    }
  }

  return [...pinnedResult, ...reorderableResult]
}

// Get column widths map from config
export function getColumnWidths(
  columnsConfig: ColumnConfig[] | null
): Record<string, number> {
  if (!columnsConfig) return {}
  const widths: Record<string, number> = {}
  for (const config of columnsConfig) {
    if (config.width !== undefined) {
      widths[config.key] = config.width
    }
  }
  return widths
}

// Check if a column is visible based on config
export function isColumnVisibleInConfig(
  columnKey: PeopleColumnKey,
  columnsConfig: ColumnConfig[] | null
): boolean {
  // If no config, all columns are visible
  if (!columnsConfig) return true

  const config = columnsConfig.find((c) => c.key === columnKey)
  // If not in config, treat as visible (for new columns)
  if (!config) return true
  // Explicit false means hidden, undefined/true means visible
  return config.visible !== false
}

// Migrate visible_columns (old format) to columns_config (new format)
export function migrateVisibleColumnsToConfig(
  visibleColumns: string[] | null,
  allColumns: PeopleColumn[]
): ColumnConfig[] | null {
  // If no visible_columns, return null (use defaults)
  if (!visibleColumns) return null

  // Create config from visible_columns
  // Order follows visibleColumns array, visibility is based on inclusion
  const allKeys = new Set(allColumns.map((c) => c.key))
  const visibleSet = new Set(visibleColumns)

  const config: ColumnConfig[] = []

  // First, add columns in their visible order
  for (const key of visibleColumns) {
    if (allKeys.has(key as PeopleColumnKey)) {
      config.push({ key, visible: true })
    }
  }

  // Then, add remaining columns as hidden
  for (const col of allColumns) {
    if (!visibleSet.has(col.key)) {
      config.push({ key: col.key, visible: false })
    }
  }

  return config
}

// Update a single column's config (width or visibility)
export function updateColumnConfig(
  currentConfig: ColumnConfig[] | null,
  allColumns: PeopleColumn[],
  columnKey: string,
  updates: { width?: number; visible?: boolean }
): ColumnConfig[] {
  // If no current config, create default first
  const config = currentConfig
    ? [...currentConfig]
    : createDefaultColumnsConfig(allColumns)

  const index = config.findIndex((c) => c.key === columnKey)
  if (index >= 0) {
    config[index] = { ...config[index], ...updates }
  } else {
    // Column not in config (e.g., new custom field)
    config.push({ key: columnKey, ...updates })
  }

  return config
}

// Reorder columns - move a column from one position to another
export function reorderColumnsConfig(
  currentConfig: ColumnConfig[] | null,
  allColumns: PeopleColumn[],
  activeKey: string,
  overKey: string
): ColumnConfig[] {
  // If no current config, create default first
  const config = currentConfig
    ? [...currentConfig]
    : createDefaultColumnsConfig(allColumns)

  // Don't allow reordering pinned columns
  if (isPinnedColumn(activeKey as PeopleColumnKey) || isPinnedColumn(overKey as PeopleColumnKey)) {
    return config
  }

  const activeIndex = config.findIndex((c) => c.key === activeKey)
  const overIndex = config.findIndex((c) => c.key === overKey)

  if (activeIndex < 0 || overIndex < 0) {
    return config
  }

  // Move the item
  const [item] = config.splice(activeIndex, 1)
  config.splice(overIndex, 0, item)

  return config
}

// =============================================================================
// Column Freezing Helpers
// =============================================================================

// Get all frozen column keys (all columns up to and including freezeColumnKey)
export function getFrozenColumnKeys(
  orderedColumns: PeopleColumn[],
  freezeColumnKey: string | null
): PeopleColumnKey[] {
  if (!freezeColumnKey) return []

  const frozenKeys: PeopleColumnKey[] = []
  for (const col of orderedColumns) {
    frozenKeys.push(col.key)
    if (col.key === freezeColumnKey) {
      break
    }
  }
  return frozenKeys
}

// Check if a column is frozen
export function isColumnFrozen(
  columnKey: PeopleColumnKey,
  orderedColumns: PeopleColumn[],
  freezeColumnKey: string | null
): boolean {
  if (!freezeColumnKey) return false
  const frozenKeys = getFrozenColumnKeys(orderedColumns, freezeColumnKey)
  return frozenKeys.includes(columnKey)
}

// Check if a column is the last frozen column (for visual separator)
export function isLastFrozenColumn(
  columnKey: PeopleColumnKey,
  freezeColumnKey: string | null
): boolean {
  return freezeColumnKey === columnKey
}

// Calculate left offsets for frozen columns
// Returns a map of column key to left offset in pixels
export function calculateFrozenOffsets(
  orderedColumns: PeopleColumn[],
  columnWidths: Record<string, number>,
  freezeColumnKey: string | null
): Record<string, number> {
  if (!freezeColumnKey) return {}

  const offsets: Record<string, number> = {}
  let currentOffset = 0

  for (const col of orderedColumns) {
    offsets[col.key] = currentOffset
    // Use explicit width if set, otherwise use minimum width as fallback
    const width = columnWidths[col.key] ?? getColumnMinWidth(col.key)
    currentOffset += width

    if (col.key === freezeColumnKey) {
      break
    }
  }

  return offsets
}
