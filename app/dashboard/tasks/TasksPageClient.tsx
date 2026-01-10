'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { TaskDialog } from './task-dialog'
import { TaskDetailSheet } from '@/components/TaskDetailSheet'
import { SaveViewDialog } from '@/components/saved-views'
import { TasksHeader } from './components/TasksHeader'
import { TasksToolbar } from './components/TasksToolbar'
import { TasksContent } from './components/TasksContent'
import { applySorts } from './sort-logic'
import { applyFilters } from './filter-logic'
import { groupTasks } from './group-logic'
import { useTaskPageHandlers, useTasksViewManager } from './hooks'
import { useIsMobile } from '@/lib/hooks'
import type { Task, TaskMinistry, TaskCampus, Person, TaskStatus, TaskPriority } from './types'
import type { SavedView } from '@/types/saved-views'

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
    timeFormat?: '12h' | '24h'
    savedViews: SavedView[]
    canManageViews: boolean
    defaultCampusId?: string
  }
}

export function TasksPageClient({ initialData }: TasksPageClientProps) {
  const t = useTranslations('tasks')
  const isMobile = useIsMobile()

  // Task state
  const [tasks, setTasks] = useState<Task[]>(initialData.tasks)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  // Sync tasks when initialData changes
  useEffect(() => {
    setTasks(initialData.tasks)
  }, [initialData.tasks])

  // View manager hook
  const viewManager = useTasksViewManager({
    initialViews: initialData.savedViews,
    currentUserId: initialData.currentUserId,
  })

  // Task handlers hook
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

  // Current view name for header
  const currentViewName = useMemo(() => {
    if (!viewManager.selectedViewId) return null
    const savedView = viewManager.views.find((v) => v.id === viewManager.selectedViewId)
    if (savedView) return savedView.name
    const builtInView = viewManager.builtInViews.find((v) => v.id === viewManager.selectedViewId)
    if (builtInView) return builtInView.name
    return null
  }, [viewManager.selectedViewId, viewManager.views, viewManager.builtInViews])

  // Apply filters and sorts to tasks
  const filteredAndSortedTasks = useMemo(() => {
    let result = tasks
    if (viewManager.searchQuery) {
      const query = viewManager.searchQuery.toLowerCase()
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query)
      )
    }

    result = applyFilters(result, viewManager.filterState)
    return applySorts(result, viewManager.sortState)
  }, [tasks, viewManager.searchQuery, viewManager.filterState, viewManager.sortState])

  // Group tasks
  const taskGroups = useMemo(
    () => groupTasks(filteredAndSortedTasks, viewManager.groupBy),
    [filteredAndSortedTasks, viewManager.groupBy]
  )

  // Async handler wrappers for table
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

  return (
    <div className="flex h-[calc(100vh-3.5rem)] md:h-screen overflow-hidden">
      <div className={`flex-1 flex flex-col overflow-hidden ${isMobile ? 'p-3' : 'p-4 md:p-6'}`}>
        <TasksHeader
          taskCount={filteredAndSortedTasks.length}
          onCreateTask={handlers.handleCreateTask}
          currentViewName={currentViewName}
        />

        <TasksToolbar
          searchQuery={viewManager.searchQuery}
          onSearchChange={viewManager.setSearchQuery}
          groupBy={viewManager.groupBy}
          onGroupByChange={viewManager.setGroupBy}
          sortState={viewManager.sortState}
          onSortChange={viewManager.setSortState}
          filterState={viewManager.filterState}
          onFilterChange={viewManager.setFilterState}
          ministries={initialData.ministries}
          campuses={initialData.campuses}
          members={initialData.members}
          events={initialData.events}
          views={viewManager.views}
          selectedViewId={viewManager.selectedViewId}
          onSelectView={viewManager.setSelectedViewId}
          onCreateView={viewManager.handleOpenCreateView}
          onEditView={viewManager.handleOpenEditView}
          onDeleteView={viewManager.setViewToDelete}
          onSetDefault={viewManager.handleSetDefaultView}
          canManageViews={initialData.canManageViews}
          hasUnsavedChanges={viewManager.hasUnsavedChanges}
          onSaveChanges={viewManager.handleSaveViewChanges}
          isSavingChanges={viewManager.isSavingChanges}
          builtInViews={viewManager.builtInViews}
          onSelectBuiltInView={viewManager.handleSelectBuiltInView}
        />

        <TasksContent
          tasks={filteredAndSortedTasks}
          groups={taskGroups}
          showGroupHeaders={viewManager.groupBy !== 'none'}
          isMobile={isMobile}
          ministries={initialData.ministries}
          campuses={initialData.campuses}
          members={initialData.members}
          selectedTaskId={selectedTaskId}
          weekStartsOn={initialData.firstDayOfWeek}
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
          onMobileStatusChange={handlers.handleStatusChange}
        />
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
        timeFormat={initialData.timeFormat}
        defaultCampusId={initialData.defaultCampusId}
      />

      <ConfirmDialog
        open={handlers.deleteConfirmOpen}
        onOpenChange={handlers.setDeleteConfirmOpen}
        title={t('deleteDialog.title')}
        description={t('deleteDialog.description', { title: handlers.taskToDelete?.title ?? '' })}
        confirmLabel={t('deleteDialog.confirm')}
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
        open={viewManager.showSaveDialog}
        onOpenChange={viewManager.setShowSaveDialog}
        viewType="tasks"
        currentFilterState={viewManager.filterState}
        currentSortState={viewManager.sortState}
        currentGroupBy={viewManager.groupBy}
        editingView={viewManager.editingView}
        onSuccess={viewManager.handleViewSuccess}
      />

      <ConfirmDialog
        open={!!viewManager.viewToDelete}
        onOpenChange={(open) => !open && viewManager.setViewToDelete(null)}
        title={t('deleteViewDialog.title')}
        description={t('deleteViewDialog.description', { name: viewManager.viewToDelete?.name ?? '' })}
        confirmLabel={t('deleteDialog.confirm')}
        destructive
        onConfirm={viewManager.handleDeleteViewConfirm}
        isLoading={viewManager.isDeletingView}
      />
    </div>
  )
}
