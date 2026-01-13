import { useState, useEffect, useMemo, useCallback } from 'react'
import { toast } from 'sonner'
import { deleteSavedView, setDefaultView, updateSavedView } from '@/lib/actions/saved-views'
import { createEmptyFilterState } from '../filter-types'
import { createEmptySortState } from '../sort-types'
import type { SavedView, FilterState, SortState } from './types'
import type { PeopleColumnKey } from './columns'

interface UseSavedViewsManagerOptions {
  savedViews: SavedView[]
  filterState: FilterState
  sortState: SortState
  visibleColumns: PeopleColumnKey[] | null
  setFilterState: (state: FilterState) => void
  setSortState: (state: SortState) => void
  setVisibleColumns: (columns: PeopleColumnKey[] | null) => void
}

export function useSavedViewsManager({
  savedViews,
  filterState,
  sortState,
  visibleColumns,
  setFilterState,
  setSortState,
  setVisibleColumns,
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
    if (!selectedViewId) return false
    const selectedView = views.find((v) => v.id === selectedViewId)
    if (!selectedView) return false

    const filterChanged = JSON.stringify(filterState) !== JSON.stringify(selectedView.filter_state)
    const sortChanged = JSON.stringify(sortState) !== JSON.stringify(selectedView.sort_state)
    const columnsChanged = JSON.stringify(visibleColumns) !== JSON.stringify(selectedView.visible_columns)

    return filterChanged || sortChanged || columnsChanged
  }, [selectedViewId, views, filterState, sortState, visibleColumns])

  // Apply selected view's configuration
  useEffect(() => {
    if (selectedViewId) {
      const view = views.find((v) => v.id === selectedViewId)
      if (view) {
        setFilterState(view.filter_state as FilterState)
        setSortState(view.sort_state as SortState)
        setVisibleColumns(view.visible_columns as PeopleColumnKey[] | null)
      }
    } else {
      setFilterState(createEmptyFilterState())
      setSortState(createEmptySortState())
      setVisibleColumns(null) // Show all columns when no view selected
    }
  }, [selectedViewId, views, setFilterState, setSortState, setVisibleColumns])

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
      visible_columns: visibleColumns,
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
  }, [selectedViewId, views, filterState, sortState, visibleColumns])

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
    visibleColumns,

    // Handlers
    handleViewSuccess,
    handleDeleteViewConfirm,
    handleSetDefaultView,
    handleSaveViewChanges,
    handleCreateView,
    handleEditView,
  }
}
