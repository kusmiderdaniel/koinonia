import { useState, useEffect, useMemo, useCallback } from 'react'
import { toast } from 'sonner'
import { deleteSavedView, setDefaultView, updateSavedView } from '@/lib/actions/saved-views'
import { createEmptyFilterState } from '../filter-types'
import { createEmptySortState } from '../sort-types'
import type { SavedView, FilterState, SortState } from './types'
import type { ColumnConfig } from '@/types/saved-views'
import { DEFAULT_FREEZE_COLUMN_KEY, type PeopleColumnKey } from './columns'

interface UseSavedViewsManagerOptions {
  savedViews: SavedView[]
  filterState: FilterState
  sortState: SortState
  visibleColumns: PeopleColumnKey[] | null // DEPRECATED - kept for backward compatibility
  columnsConfig: ColumnConfig[] | null // NEW - column order, widths, visibility
  freezeColumnKey: string | null // Column freeze boundary
  hasColumnConfigChanges?: boolean // NEW - from useColumnConfig.hasChanges
  setFilterState: (state: FilterState) => void
  setSortState: (state: SortState) => void
  setVisibleColumns: (columns: PeopleColumnKey[] | null) => void // DEPRECATED
  setColumnsConfig: (config: ColumnConfig[] | null) => void // NEW
  setFreezeColumnKey: (key: string | null) => void // Column freeze boundary setter
}

export function useSavedViewsManager({
  savedViews,
  filterState,
  sortState,
  visibleColumns,
  columnsConfig,
  freezeColumnKey,
  hasColumnConfigChanges = false,
  setFilterState,
  setSortState,
  setVisibleColumns,
  setColumnsConfig,
  setFreezeColumnKey,
}: UseSavedViewsManagerOptions) {
  const [views, setViews] = useState<SavedView[]>(savedViews)
  const [selectedViewId, setSelectedViewId] = useState<string | null>(() => {
    const defaultView = savedViews.find((v) => v.is_default)
    return defaultView?.id || null
  })
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [editingView, setEditingView] = useState<SavedView | null>(null)
  const [viewToDelete, setViewToDelete] = useState<SavedView | null>(null)
  const [isDeletingView, setIsDeletingView] = useState(false)
  const [isSavingChanges, setIsSavingChanges] = useState(false)

  // Detect if current state differs from selected view's saved state
  const hasUnsavedChanges = useMemo(() => {
    if (!selectedViewId) {
      // For "All" view, use hasColumnConfigChanges from useColumnConfig
      return hasColumnConfigChanges
    }
    const selectedView = views.find((v) => v.id === selectedViewId)
    if (!selectedView) return false

    const filterChanged = JSON.stringify(filterState) !== JSON.stringify(selectedView.filter_state)
    const sortChanged = JSON.stringify(sortState) !== JSON.stringify(selectedView.sort_state)

    // Check columnsConfig (new format)
    const savedColumnsConfig = selectedView.columns_config
    const columnsConfigChanged = JSON.stringify(columnsConfig) !== JSON.stringify(savedColumnsConfig)

    // Check freeze column key
    const freezeChanged = freezeColumnKey !== selectedView.freeze_column_key

    return filterChanged || sortChanged || columnsConfigChanged || freezeChanged
  }, [selectedViewId, views, filterState, sortState, columnsConfig, freezeColumnKey, hasColumnConfigChanges])

  // Apply selected view's configuration
  useEffect(() => {
    if (selectedViewId) {
      const view = views.find((v) => v.id === selectedViewId)
      if (view) {
        setFilterState(view.filter_state as FilterState)
        setSortState(view.sort_state as SortState)
        // Use columnsConfig if available, otherwise keep visibleColumns for backward compatibility
        setColumnsConfig(view.columns_config as ColumnConfig[] | null)
        // Also update visibleColumns for components that still use it
        setVisibleColumns(view.visible_columns as PeopleColumnKey[] | null)
        // Set freeze column key
        setFreezeColumnKey(view.freeze_column_key ?? null)
      }
    } else {
      setFilterState(createEmptyFilterState())
      setSortState(createEmptySortState())
      setColumnsConfig(null) // Reset to default column config
      setVisibleColumns(null) // Show all columns when no view selected
      setFreezeColumnKey(DEFAULT_FREEZE_COLUMN_KEY) // Default: freeze Active and Name columns
    }
  }, [selectedViewId, views, setFilterState, setSortState, setVisibleColumns, setColumnsConfig, setFreezeColumnKey])

  // Sync views when savedViews prop changes
  useEffect(() => {
    setViews(savedViews)
  }, [savedViews])

  const handleViewSuccess = useCallback((newView: SavedView) => {
    setViews((prev) => {
      const filtered = prev.filter((v) => v.id !== newView.id)
      const updated = newView.is_default
        ? filtered.map((v) => ({ ...v, is_default: false }))
        : filtered
      return [...updated, newView].sort((a, b) => {
        if (a.is_default !== b.is_default) return a.is_default ? -1 : 1
        return a.name.localeCompare(b.name)
      })
    })
    setSelectedViewId(newView.id)
  }, [])

  const handleDeleteViewConfirm = useCallback(async () => {
    if (!viewToDelete) return
    setIsDeletingView(true)
    const result = await deleteSavedView(viewToDelete.id)
    setIsDeletingView(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('View deleted')
      setViews((prev) => prev.filter((v) => v.id !== viewToDelete.id))
      if (selectedViewId === viewToDelete.id) {
        setSelectedViewId(null)
      }
    }
    setViewToDelete(null)
  }, [viewToDelete, selectedViewId])

  const handleSetDefaultView = useCallback(async (view: SavedView) => {
    const result = await setDefaultView(view.id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`"${view.name}" set as default`)
      setViews((prev) =>
        prev.map((v) => ({
          ...v,
          is_default: v.id === view.id,
        }))
      )
    }
  }, [])

  const handleSaveViewChanges = useCallback(async () => {
    if (!selectedViewId) return
    const selectedView = views.find((v) => v.id === selectedViewId)
    if (!selectedView) return

    setIsSavingChanges(true)
    const result = await updateSavedView(selectedViewId, {
      filter_state: filterState,
      sort_state: sortState,
      visible_columns: visibleColumns, // Keep for backward compatibility
      columns_config: columnsConfig, // Column order, widths, visibility
      freeze_column_key: freezeColumnKey, // Column freeze boundary
    })
    setIsSavingChanges(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('View updated')
      if (result.data) {
        setViews((prev) =>
          prev.map((v) => (v.id === result.data!.id ? result.data! : v))
        )
      }
    }
  }, [selectedViewId, views, filterState, sortState, visibleColumns, columnsConfig, freezeColumnKey])

  const handleCreateView = useCallback(() => {
    setEditingView(null)
    setShowSaveDialog(true)
  }, [])

  const handleEditView = useCallback((view: SavedView) => {
    setEditingView(view)
    setShowSaveDialog(true)
  }, [])

  return {
    // State
    views,
    selectedViewId,
    setSelectedViewId,
    showSaveDialog,
    setShowSaveDialog,
    editingView,
    viewToDelete,
    setViewToDelete,
    isDeletingView,
    isSavingChanges,
    hasUnsavedChanges,
    visibleColumns, // DEPRECATED
    columnsConfig,
    freezeColumnKey,

    // Handlers
    handleViewSuccess,
    handleDeleteViewConfirm,
    handleSetDefaultView,
    handleSaveViewChanges,
    handleCreateView,
    handleEditView,
  }
}
