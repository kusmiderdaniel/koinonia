import { useState, useMemo, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { deleteSavedView, setDefaultView, updateSavedView } from '@/lib/actions/saved-views'
import { createDefaultTaskFilterState, generateFilterId } from '../filter-types'
import { createEmptySortState } from '../sort-types'
import type { SortState } from '../sort-types'
import type { FilterState } from '../filter-types'
import type { GroupByField } from '../components/GroupBySelector'
import type { SavedView, BuiltInView } from '@/types/saved-views'

interface UseTasksViewManagerOptions {
  initialViews: SavedView[]
  currentUserId: string
}

export function useTasksViewManager({
  initialViews,
  currentUserId,
}: UseTasksViewManagerOptions) {
  const t = useTranslations('tasks')
  const tViews = useTranslations('views')

  // Sort, Filter, and Group state
  const [searchQuery, setSearchQuery] = useState('')
  const [sortState, setSortState] = useState<SortState>(createEmptySortState)
  const [filterState, setFilterState] = useState<FilterState>(createDefaultTaskFilterState)
  const [groupBy, setGroupBy] = useState<GroupByField>('none')

  // Saved views state
  const [views, setViews] = useState<SavedView[]>(initialViews)
  const [selectedViewId, setSelectedViewId] = useState<string | null>(() => {
    const defaultView = initialViews.find((v) => v.is_default)
    return defaultView?.id || null
  })
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [editingView, setEditingView] = useState<SavedView | null>(null)
  const [viewToDelete, setViewToDelete] = useState<SavedView | null>(null)
  const [isDeletingView, setIsDeletingView] = useState(false)
  const [isSavingChanges, setIsSavingChanges] = useState(false)

  // Built-in view preferences (sort/group) stored in localStorage
  const [builtInViewPrefs, setBuiltInViewPrefs] = useState<
    Record<string, { sortState: SortState; groupBy: GroupByField }>
  >(() => {
    if (typeof window === 'undefined') return {}
    try {
      const stored = localStorage.getItem('builtInViewPrefs')
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  })

  // Built-in views (e.g., "My Tasks")
  const builtInViews = useMemo<BuiltInView[]>(() => {
    const myTasksPrefs = builtInViewPrefs['my-tasks']
    return [
      {
        id: 'my-tasks',
        name: t('builtInViews.myTasks'),
        filterState: {
          conjunction: 'and',
          rules: [
            {
              id: generateFilterId(),
              field: 'assignee_id',
              operator: 'equals',
              value: currentUserId,
            },
          ],
          groups: [
            {
              id: generateFilterId(),
              conjunction: 'or',
              rules: [
                {
                  id: generateFilterId(),
                  field: 'status',
                  operator: 'equals',
                  value: 'pending',
                },
                {
                  id: generateFilterId(),
                  field: 'status',
                  operator: 'equals',
                  value: 'in_progress',
                },
              ],
            },
          ],
        },
        sortState: myTasksPrefs?.sortState || [],
        groupBy: myTasksPrefs?.groupBy || 'none',
      },
    ]
  }, [currentUserId, builtInViewPrefs, t])

  // Handler for selecting a built-in view
  const handleSelectBuiltInView = useCallback((view: BuiltInView) => {
    setFilterState(view.filterState)
    setSortState(view.sortState)
    if (view.groupBy) setGroupBy(view.groupBy)
  }, [])

  // Detect if current state differs from selected view's saved state
  const hasUnsavedChanges = useMemo(() => {
    if (!selectedViewId) return false

    // Check if it's a built-in view
    const builtInView = builtInViews.find((v) => v.id === selectedViewId)
    if (builtInView) {
      const sortChanged =
        JSON.stringify(sortState) !== JSON.stringify(builtInView.sortState)
      const groupChanged = groupBy !== (builtInView.groupBy || 'none')
      return sortChanged || groupChanged
    }

    const selectedView = views.find((v) => v.id === selectedViewId)
    if (!selectedView) return false

    const filterChanged =
      JSON.stringify(filterState) !== JSON.stringify(selectedView.filter_state)
    const sortChanged =
      JSON.stringify(sortState) !== JSON.stringify(selectedView.sort_state)
    const groupChanged = groupBy !== (selectedView.group_by || 'none')

    return filterChanged || sortChanged || groupChanged
  }, [selectedViewId, views, builtInViews, filterState, sortState, groupBy])

  // Apply selected view's configuration
  useEffect(() => {
    if (selectedViewId) {
      const view = views.find((v) => v.id === selectedViewId)
      if (view) {
        setFilterState(view.filter_state)
        setSortState(view.sort_state)
        if (view.group_by) setGroupBy(view.group_by)
      }
    } else {
      // Reset to defaults when "All" is selected
      setFilterState(createDefaultTaskFilterState())
      setSortState(createEmptySortState())
      setGroupBy('none')
    }
  }, [selectedViewId, views])

  // Sync views when initialViews changes
  useEffect(() => {
    setViews(initialViews)
  }, [initialViews])

  // View handlers
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
      toast.success(tViews('dialog.viewDeleted'))
      setViews((prev) => prev.filter((v) => v.id !== viewToDelete.id))
      if (selectedViewId === viewToDelete.id) {
        setSelectedViewId(null)
      }
    }
    setViewToDelete(null)
  }, [viewToDelete, selectedViewId, tViews])

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
  }, [tViews])

  const handleSaveViewChanges = useCallback(async () => {
    if (!selectedViewId) return

    // Check if it's a built-in view
    const builtInView = builtInViews.find((v) => v.id === selectedViewId)
    if (builtInView) {
      const newPrefs = {
        ...builtInViewPrefs,
        [selectedViewId]: { sortState, groupBy },
      }
      setBuiltInViewPrefs(newPrefs)
      try {
        localStorage.setItem('builtInViewPrefs', JSON.stringify(newPrefs))
        toast.success(tViews('dialog.preferencesSaved'))
      } catch {
        toast.error(tViews('dialog.preferencesFailed'))
      }
      return
    }

    const selectedView = views.find((v) => v.id === selectedViewId)
    if (!selectedView) return

    setIsSavingChanges(true)
    const result = await updateSavedView(selectedViewId, {
      filter_state: filterState,
      sort_state: sortState,
      group_by: groupBy,
    })
    setIsSavingChanges(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(tViews('dialog.viewUpdated'))
      if (result.data) {
        setViews((prev) =>
          prev.map((v) => (v.id === result.data!.id ? result.data! : v))
        )
      }
    }
  }, [
    selectedViewId,
    views,
    builtInViews,
    builtInViewPrefs,
    filterState,
    sortState,
    groupBy,
    tViews,
  ])

  const handleOpenCreateView = useCallback(() => {
    setEditingView(null)
    setShowSaveDialog(true)
  }, [])

  const handleOpenEditView = useCallback((view: SavedView) => {
    setEditingView(view)
    setShowSaveDialog(true)
  }, [])

  return {
    // Filter/Sort/Group state
    searchQuery,
    setSearchQuery,
    sortState,
    setSortState,
    filterState,
    setFilterState,
    groupBy,
    setGroupBy,

    // Views state
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
    builtInViews,
    hasUnsavedChanges,

    // View handlers
    handleSelectBuiltInView,
    handleViewSuccess,
    handleDeleteViewConfirm,
    handleSetDefaultView,
    handleSaveViewChanges,
    handleOpenCreateView,
    handleOpenEditView,
  }
}
