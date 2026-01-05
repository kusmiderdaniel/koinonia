'use client'

import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { TaskSortBuilder } from '../sort-builder'
import { TaskFilterBuilder } from '../filter-builder'
import { GroupBySelector, type GroupByField } from './GroupBySelector'
import { ViewSelector, SaveViewDialog } from '@/components/saved-views'
import type { SortState } from '../sort-types'
import type { FilterState } from '../filter-types'
import type { TaskMinistry, TaskCampus, Person } from '../types'
import type { SavedView, BuiltInView } from '@/types/saved-views'

interface TasksToolbarProps {
  // Search
  searchQuery: string
  onSearchChange: (query: string) => void

  // Group
  groupBy: GroupByField
  onGroupByChange: (value: GroupByField) => void

  // Sort
  sortState: SortState
  onSortChange: (state: SortState) => void

  // Filter
  filterState: FilterState
  onFilterChange: (state: FilterState) => void
  ministries: TaskMinistry[]
  campuses: TaskCampus[]
  members: Person[]
  events: { id: string; title: string; start_time: string }[]

  // Views
  views: SavedView[]
  selectedViewId: string | null
  onSelectView: (viewId: string | null) => void
  onCreateView: () => void
  onEditView: (view: SavedView) => void
  onDeleteView: (view: SavedView) => void
  onSetDefault: (view: SavedView) => void
  canManageViews: boolean
  hasUnsavedChanges: boolean
  onSaveChanges: () => void
  isSavingChanges: boolean
  builtInViews: BuiltInView[]
  onSelectBuiltInView: (view: BuiltInView) => void
}

export function TasksToolbar({
  searchQuery,
  onSearchChange,
  groupBy,
  onGroupByChange,
  sortState,
  onSortChange,
  filterState,
  onFilterChange,
  ministries,
  campuses,
  members,
  events,
  views,
  selectedViewId,
  onSelectView,
  onCreateView,
  onEditView,
  onDeleteView,
  onSetDefault,
  canManageViews,
  hasUnsavedChanges,
  onSaveChanges,
  isSavingChanges,
  builtInViews,
  onSelectBuiltInView,
}: TasksToolbarProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="grid grid-cols-4 sm:flex sm:items-center gap-2">
          <GroupBySelector value={groupBy} onChange={onGroupByChange} />
          <TaskSortBuilder sortState={sortState} onChange={onSortChange} />
          <TaskFilterBuilder
            filterState={filterState}
            onChange={onFilterChange}
            ministries={ministries}
            campuses={campuses}
            members={members}
            events={events}
          />
          <ViewSelector
            viewType="tasks"
            views={views}
            selectedViewId={selectedViewId}
            onSelectView={onSelectView}
            onCreateView={onCreateView}
            onEditView={onEditView}
            onDeleteView={onDeleteView}
            onSetDefault={onSetDefault}
            canManageViews={canManageViews}
            hasUnsavedChanges={hasUnsavedChanges}
            onSaveChanges={onSaveChanges}
            isSavingChanges={isSavingChanges}
            builtInViews={builtInViews}
            onSelectBuiltInView={onSelectBuiltInView}
          />
        </div>
      </div>
    </div>
  )
}
