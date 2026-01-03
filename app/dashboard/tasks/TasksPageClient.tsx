'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, Search } from 'lucide-react'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { TaskDialog } from './task-dialog'
import { TaskDetailSheet } from '@/components/TaskDetailSheet'
import { TaskSortBuilder } from './sort-builder'
import { TaskFilterBuilder } from './filter-builder'
import { TasksTable } from './components/TasksTable'
import { TaskCard } from './components/TaskCard'
import { GroupBySelector, type GroupByField } from './components/GroupBySelector'
import { SortState, createEmptySortState } from './sort-types'
import { FilterState, createDefaultTaskFilterState, generateFilterId } from './filter-types'
import { applySorts } from './sort-logic'
import { applyFilters } from './filter-logic'
import { groupTasks } from './group-logic'
import { useTaskPageHandlers } from './hooks'
import { useIsMobile } from '@/lib/hooks'
import { ViewSelector, SaveViewDialog } from '@/components/saved-views'
import { ConfirmDialog as DeleteViewConfirmDialog } from '@/components/ConfirmDialog'
import { deleteSavedView, setDefaultView, updateSavedView } from '@/lib/actions/saved-views'
import { toast } from 'sonner'
import type { Task, TaskMinistry, TaskCampus, Person, TaskStatus, TaskPriority } from './types'
import type { SavedView, BuiltInView } from '@/types/saved-views'

interface TasksPageClientProps {
  initialData: {
    tasks: Task[]
    ministries: TaskMinistry[]
    campuses: TaskCampus[]
    members: Person[]
    events: { id: string; title: string; start_time: string }[]
    currentUserId: string
    role: string
    firstDayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6
    savedViews: SavedView[]
    canManageViews: boolean
  }
}

export function TasksPageClient({ initialData }: TasksPageClientProps) {
  const isMobile = useIsMobile()

  // State
  const [tasks, setTasks] = useState<Task[]>(initialData.tasks)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  // Sync tasks when initialData changes (after router.refresh())
  useEffect(() => {
    setTasks(initialData.tasks)
  }, [initialData.tasks])

  // Sort, Filter, and Group state
  const [searchQuery, setSearchQuery] = useState('')
  const [sortState, setSortState] = useState<SortState>(createEmptySortState)
  const [filterState, setFilterState] = useState<FilterState>(createDefaultTaskFilterState)
  const [groupBy, setGroupBy] = useState<GroupByField>('none')

  // Saved views state
  const [views, setViews] = useState<SavedView[]>(initialData.savedViews)
  const [selectedViewId, setSelectedViewId] = useState<string | null>(() => {
    const defaultView = initialData.savedViews.find((v) => v.is_default)
    return defaultView?.id || null
  })
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [editingView, setEditingView] = useState<SavedView | null>(null)
  const [viewToDelete, setViewToDelete] = useState<SavedView | null>(null)
  const [isDeletingView, setIsDeletingView] = useState(false)
  const [isSavingChanges, setIsSavingChanges] = useState(false)

  // Built-in view preferences (sort/group) stored in localStorage
  const [builtInViewPrefs, setBuiltInViewPrefs] = useState<Record<string, { sortState: SortState; groupBy: GroupByField }>>(() => {
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
        name: 'My Tasks',
        filterState: {
          conjunction: 'and',
          rules: [
            {
              id: generateFilterId(),
              field: 'assignee_id',
              operator: 'equals',
              value: initialData.currentUserId,
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
  }, [initialData.currentUserId, builtInViewPrefs])

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
      // For built-in views, only check sort and group changes (filter is fixed)
      const sortChanged = JSON.stringify(sortState) !== JSON.stringify(builtInView.sortState)
      const groupChanged = groupBy !== (builtInView.groupBy || 'none')
      return sortChanged || groupChanged
    }

    const selectedView = views.find((v) => v.id === selectedViewId)
    if (!selectedView) return false

    // Compare filter state
    const filterChanged = JSON.stringify(filterState) !== JSON.stringify(selectedView.filter_state)
    // Compare sort state
    const sortChanged = JSON.stringify(sortState) !== JSON.stringify(selectedView.sort_state)
    // Compare group by
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

  // Sync views when initialData changes
  useEffect(() => {
    setViews(initialData.savedViews)
  }, [initialData.savedViews])

  // Use handlers hook
  const handlers = useTaskPageHandlers({
    tasks,
    setTasks,
    selectedTaskId,
    setSelectedTaskId,
    ministries: initialData.ministries,
    campuses: initialData.campuses,
    members: initialData.members,
    events: initialData.events,
  })

  // Selected task
  const selectedTask = useMemo(
    () => tasks.find((t) => t.id === selectedTaskId) || null,
    [tasks, selectedTaskId]
  )

  // Apply filters and sorts to tasks
  const filteredAndSortedTasks = useMemo(() => {
    let result = tasks
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query)
      )
    }

    result = applyFilters(result, filterState)
    return applySorts(result, sortState)
  }, [tasks, searchQuery, filterState, sortState])

  // Group tasks
  const taskGroups = useMemo(
    () => groupTasks(filteredAndSortedTasks, groupBy),
    [filteredAndSortedTasks, groupBy]
  )


  // Wrapper handlers for table - converting to async with proper types
  const handleStatusChangeAsync = useCallback(
    async (taskId: string, status: TaskStatus) => {
      await handlers.handleStatusChange(taskId, status)
    },
    [handlers]
  )

  const handlePriorityChangeAsync = useCallback(
    async (taskId: string, priority: TaskPriority) => {
      await handlers.handlePriorityChange(taskId, priority)
    },
    [handlers]
  )

  const handleAssigneeChangeAsync = useCallback(
    async (taskId: string, assigneeId: string | null) => {
      await handlers.handleAssigneeChange(taskId, assigneeId)
    },
    [handlers]
  )

  const handleMinistryChangeAsync = useCallback(
    async (taskId: string, ministryId: string | null) => {
      await handlers.handleMinistryChange(taskId, ministryId)
    },
    [handlers]
  )

  const handleCampusChangeAsync = useCallback(
    async (taskId: string, campusId: string | null) => {
      await handlers.handleCampusChange(taskId, campusId)
    },
    [handlers]
  )

  const handleDueDateChangeAsync = useCallback(
    async (taskId: string, dueDate: Date | null) => {
      await handlers.handleDueDateChange(taskId, dueDate ?? undefined)
    },
    [handlers]
  )

  const handleCompletionToggle = useCallback(
    (taskId: string, completed: boolean) => {
      handlers.handleStatusChange(taskId, completed ? 'completed' : 'pending')
    },
    [handlers]
  )

  // View handlers
  const handleViewSuccess = useCallback((newView: SavedView) => {
    setViews((prev) => {
      const filtered = prev.filter((v) => v.id !== newView.id)
      // If new view is default, unset others
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

    // Check if it's a built-in view
    const builtInView = builtInViews.find((v) => v.id === selectedViewId)
    if (builtInView) {
      // Save sort/group preferences to localStorage
      const newPrefs = {
        ...builtInViewPrefs,
        [selectedViewId]: { sortState, groupBy },
      }
      setBuiltInViewPrefs(newPrefs)
      try {
        localStorage.setItem('builtInViewPrefs', JSON.stringify(newPrefs))
        toast.success('View preferences saved')
      } catch {
        toast.error('Failed to save preferences')
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
      toast.success('View updated')
      if (result.data) {
        setViews((prev) =>
          prev.map((v) => (v.id === result.data!.id ? result.data! : v))
        )
      }
    }
  }, [selectedViewId, views, builtInViews, builtInViewPrefs, filterState, sortState, groupBy])

  return (
    <div className="flex h-[calc(100vh-3.5rem)] md:h-screen overflow-hidden">
      {/* Main List */}
      <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold">Tasks</h1>
            <p className="text-muted-foreground">
              {filteredAndSortedTasks.length} task
              {filteredAndSortedTasks.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button
            onClick={handlers.handleCreateTask}
            variant="outline"
            className="rounded-full !border !border-gray-300 dark:!border-gray-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>

        {/* Sort, Filter, and Group toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
          <div className="flex flex-col md:flex-row gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="grid grid-cols-4 sm:flex sm:items-center gap-2">
              <GroupBySelector value={groupBy} onChange={setGroupBy} />
              <TaskSortBuilder sortState={sortState} onChange={setSortState} />
              <TaskFilterBuilder
                filterState={filterState}
                onChange={setFilterState}
                ministries={initialData.ministries}
                campuses={initialData.campuses}
                members={initialData.members}
                events={initialData.events}
              />
              <ViewSelector
                viewType="tasks"
                views={views}
                selectedViewId={selectedViewId}
                onSelectView={setSelectedViewId}
                onCreateView={() => {
                  setEditingView(null)
                  setShowSaveDialog(true)
                }}
                onEditView={(view) => {
                  setEditingView(view)
                  setShowSaveDialog(true)
                }}
                onDeleteView={setViewToDelete}
                onSetDefault={handleSetDefaultView}
                canManageViews={initialData.canManageViews}
                hasUnsavedChanges={hasUnsavedChanges}
                onSaveChanges={handleSaveViewChanges}
                isSavingChanges={isSavingChanges}
                builtInViews={builtInViews}
                onSelectBuiltInView={handleSelectBuiltInView}
              />
            </div>
          </div>
        </div>

        {/* Task List/Table */}
        <Card className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            {isMobile ? (
              // Mobile: Card-based layout with grouping
              filteredAndSortedTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <div className="text-muted-foreground mb-4">No tasks found</div>
                  <Button onClick={handlers.handleCreateTask} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Create your first task
                  </Button>
                </div>
              ) : groupBy !== 'none' ? (
                // Grouped mobile view
                <div>
                  {taskGroups.map((group) => (
                    <div key={group.id}>
                      {/* Group header */}
                      <div className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm px-4 py-2 border-b">
                        <div className="flex items-center gap-2 font-medium">
                          {group.color && (
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: group.color }}
                            />
                          )}
                          <span>{group.label}</span>
                          <span className="text-muted-foreground font-normal text-sm">
                            ({group.tasks.length})
                          </span>
                        </div>
                      </div>
                      {/* Tasks in group */}
                      {group.tasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          isSelected={task.id === selectedTaskId}
                          onTitleClick={handlers.handleSelectTask}
                          onStatusChange={handlers.handleStatusChange}
                          onCompletionToggle={handleCompletionToggle}
                          onEdit={handlers.handleEditTask}
                          onDelete={handlers.handleDeleteClick}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                // Flat mobile view
                <div>
                  {filteredAndSortedTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      isSelected={task.id === selectedTaskId}
                      onTitleClick={handlers.handleSelectTask}
                      onStatusChange={handlers.handleStatusChange}
                      onCompletionToggle={handleCompletionToggle}
                      onEdit={handlers.handleEditTask}
                      onDelete={handlers.handleDeleteClick}
                    />
                  ))}
                </div>
              )
            ) : (
              // Desktop: Table layout
              <TasksTable
                tasks={filteredAndSortedTasks}
                groups={taskGroups}
                showGroupHeaders={groupBy !== 'none'}
                ministries={initialData.ministries}
                campuses={initialData.campuses}
                members={initialData.members}
                selectedTaskId={selectedTaskId}
                onTitleClick={handlers.handleSelectTask}
                onStatusChange={handleStatusChangeAsync}
                onPriorityChange={handlePriorityChangeAsync}
                onAssigneeChange={handleAssigneeChangeAsync}
                onMinistryChange={handleMinistryChangeAsync}
                onCampusChange={handleCampusChangeAsync}
                onDueDateChange={handleDueDateChangeAsync}
                onCompletionToggle={handleCompletionToggle}
                onEdit={handlers.handleEditTask}
                onDelete={handlers.handleDeleteClick}
                onCreateTask={handlers.handleCreateTask}
                weekStartsOn={initialData.firstDayOfWeek}
              />
            )}
          </ScrollArea>
        </Card>
      </div>

      {/* Dialogs */}
      <TaskDialog
        open={handlers.isDialogOpen}
        onClose={handlers.handleDialogClose}
        task={handlers.editingTask}
        ministries={initialData.ministries}
        campuses={initialData.campuses}
        members={initialData.members}
        events={initialData.events}
        weekStartsOn={initialData.firstDayOfWeek}
      />

      <ConfirmDialog
        open={handlers.deleteConfirmOpen}
        onOpenChange={handlers.setDeleteConfirmOpen}
        title="Delete Task"
        description={`Are you sure you want to delete "${handlers.taskToDelete?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handlers.handleDeleteConfirm}
        isLoading={handlers.isDeleting}
      />

      <TaskDetailSheet
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => !open && handlers.handleCloseDetail()}
        onTaskUpdated={handlers.handleRefresh}
        onDelete={selectedTask ? () => handlers.handleDeleteClick(selectedTask) : undefined}
        members={initialData.members}
        ministries={initialData.ministries}
        campuses={initialData.campuses}
        weekStartsOn={initialData.firstDayOfWeek}
      />

      {/* Saved Views Dialogs */}
      <SaveViewDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        viewType="tasks"
        currentFilterState={filterState}
        currentSortState={sortState}
        currentGroupBy={groupBy}
        editingView={editingView}
        onSuccess={handleViewSuccess}
      />

      <DeleteViewConfirmDialog
        open={!!viewToDelete}
        onOpenChange={(open) => !open && setViewToDelete(null)}
        title="Delete View"
        description={`Are you sure you want to delete the view "${viewToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDeleteViewConfirm}
        isLoading={isDeletingView}
      />
    </div>
  )
}
