'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import type { CustomFieldDefinition } from '@/types/custom-fields'
import type { ColumnConfig } from '@/types/saved-views'
import {
  getAllColumns,
  getOrderedColumns,
  getColumnWidths,
  isColumnVisibleInConfig,
  updateColumnConfig,
  reorderColumnsConfig,
  createDefaultColumnsConfig,
  migrateVisibleColumnsToConfig,
  isPinnedColumn,
  isColumnFrozen as checkIsColumnFrozen,
  isLastFrozenColumn as checkIsLastFrozenColumn,
  calculateFrozenOffsets,
  DEFAULT_FREEZE_COLUMN_KEY,
  type PeopleColumn,
  type PeopleColumnKey,
} from './columns'

interface UseColumnConfigOptions {
  customFields: CustomFieldDefinition[]
  initialColumnsConfig: ColumnConfig[] | null
  // For backward compatibility with old saved views
  initialVisibleColumns?: string[] | null
  // Column freeze boundary
  initialFreezeColumnKey?: string | null
}

interface UseColumnConfigReturn {
  // All columns in the correct order (pinned first, then as per config)
  orderedColumns: PeopleColumn[]
  // All columns (unordered, for reference)
  allColumns: PeopleColumn[]
  // Column widths map (key -> width in pixels)
  columnWidths: Record<string, number>
  // Current columns config (for persistence)
  columnsConfig: ColumnConfig[] | null
  // Check if a column is visible
  isColumnVisible: (key: PeopleColumnKey) => boolean
  // Check if a column is pinned (cannot be reordered)
  isColumnPinned: (key: PeopleColumnKey) => boolean
  // Reorder columns
  reorderColumns: (activeKey: string, overKey: string) => void
  // Resize a column
  resizeColumn: (key: string, width: number) => void
  // Toggle column visibility
  toggleColumnVisibility: (key: string) => void
  // Set column visibility explicitly
  setColumnVisibility: (key: string, visible: boolean) => void
  // Reset to default configuration
  resetToDefault: () => void
  // Set entire config (for loading from saved view)
  setColumnsConfig: (config: ColumnConfig[] | null) => void
  // Check if config has changed from initial
  hasChanges: boolean
  // Column freezing
  freezeColumnKey: string | null
  setFreezeColumnKey: (key: string | null) => void
  frozenColumnOffsets: Record<string, number>
  isColumnFrozen: (key: PeopleColumnKey) => boolean
  isLastFrozenColumn: (key: PeopleColumnKey) => boolean
}

export function useColumnConfig({
  customFields,
  initialColumnsConfig,
  initialVisibleColumns,
  initialFreezeColumnKey,
}: UseColumnConfigOptions): UseColumnConfigReturn {
  // Get all available columns
  const allColumns = useMemo(
    () => getAllColumns(customFields),
    [customFields]
  )

  // Initialize config - migrate from visible_columns if needed
  const [columnsConfig, setColumnsConfig] = useState<ColumnConfig[] | null>(
    () => {
      if (initialColumnsConfig) {
        return initialColumnsConfig
      }
      // Migrate from old visible_columns format
      if (initialVisibleColumns) {
        return migrateVisibleColumnsToConfig(initialVisibleColumns, allColumns)
      }
      return null
    }
  )

  // Track initial config for change detection
  const [initialConfig] = useState<ColumnConfig[] | null>(columnsConfig)

  // Column freeze state - default to 'name' to freeze Active and Name columns
  const [freezeColumnKey, setFreezeColumnKey] = useState<string | null>(
    initialFreezeColumnKey ?? DEFAULT_FREEZE_COLUMN_KEY
  )

  // Track initial freeze state for change detection
  const [initialFreezeKey] = useState<string | null>(freezeColumnKey)

  // Get ordered columns based on config
  const orderedColumns = useMemo(
    () => getOrderedColumns(allColumns, columnsConfig),
    [allColumns, columnsConfig]
  )

  // Get column widths map
  const columnWidths = useMemo(
    () => getColumnWidths(columnsConfig),
    [columnsConfig]
  )

  // Calculate frozen column offsets
  const frozenColumnOffsets = useMemo(
    () => calculateFrozenOffsets(orderedColumns, columnWidths, freezeColumnKey),
    [orderedColumns, columnWidths, freezeColumnKey]
  )

  // Check if a column is frozen
  const isColumnFrozen = useCallback(
    (key: PeopleColumnKey) =>
      checkIsColumnFrozen(key, orderedColumns, freezeColumnKey),
    [orderedColumns, freezeColumnKey]
  )

  // Check if a column is the last frozen column
  const isLastFrozenColumn = useCallback(
    (key: PeopleColumnKey) => checkIsLastFrozenColumn(key, freezeColumnKey),
    [freezeColumnKey]
  )

  // Check if a column is visible
  const isColumnVisible = useCallback(
    (key: PeopleColumnKey) => isColumnVisibleInConfig(key, columnsConfig),
    [columnsConfig]
  )

  // Check if a column is pinned
  const isColumnPinned = useCallback(
    (key: PeopleColumnKey) => isPinnedColumn(key),
    []
  )

  // Reorder columns
  const reorderColumns = useCallback(
    (activeKey: string, overKey: string) => {
      setColumnsConfig((current) =>
        reorderColumnsConfig(current, allColumns, activeKey, overKey)
      )
    },
    [allColumns]
  )

  // Resize a column
  const resizeColumn = useCallback(
    (key: string, width: number) => {
      setColumnsConfig((current) =>
        updateColumnConfig(current, allColumns, key, { width })
      )
    },
    [allColumns]
  )

  // Toggle column visibility
  const toggleColumnVisibility = useCallback(
    (key: string) => {
      const currentVisible = isColumnVisibleInConfig(
        key as PeopleColumnKey,
        columnsConfig
      )
      setColumnsConfig((current) =>
        updateColumnConfig(current, allColumns, key, { visible: !currentVisible })
      )
    },
    [allColumns, columnsConfig]
  )

  // Set column visibility explicitly
  const setColumnVisibility = useCallback(
    (key: string, visible: boolean) => {
      setColumnsConfig((current) =>
        updateColumnConfig(current, allColumns, key, { visible })
      )
    },
    [allColumns]
  )

  // Reset to default configuration
  const resetToDefault = useCallback(() => {
    setColumnsConfig(null)
  }, [])

  // Check if config has changed from initial
  const hasChanges = useMemo(() => {
    // Check freeze column key change
    if (freezeColumnKey !== initialFreezeKey) return true

    // Check columns config change
    if (initialConfig === null && columnsConfig === null) return false
    if (initialConfig === null || columnsConfig === null) return true
    return JSON.stringify(initialConfig) !== JSON.stringify(columnsConfig)
  }, [initialConfig, columnsConfig, freezeColumnKey, initialFreezeKey])

  // Sync config when allColumns changes (e.g., new custom field added)
  useEffect(() => {
    if (columnsConfig) {
      // Add any new columns that aren't in the config
      const configKeys = new Set(columnsConfig.map((c) => c.key))
      const newColumns = allColumns.filter((c) => !configKeys.has(c.key))

      if (newColumns.length > 0) {
        setColumnsConfig((current) => {
          if (!current) return current
          return [
            ...current,
            ...newColumns.map((c) => ({
              key: c.key,
              visible: c.defaultVisible,
            })),
          ]
        })
      }
    }
  }, [allColumns, columnsConfig])

  return {
    orderedColumns,
    allColumns,
    columnWidths,
    columnsConfig,
    isColumnVisible,
    isColumnPinned,
    reorderColumns,
    resizeColumn,
    toggleColumnVisibility,
    setColumnVisibility,
    resetToDefault,
    setColumnsConfig,
    hasChanges,
    // Column freezing
    freezeColumnKey,
    setFreezeColumnKey,
    frozenColumnOffsets,
    isColumnFrozen,
    isLastFrozenColumn,
  }
}
