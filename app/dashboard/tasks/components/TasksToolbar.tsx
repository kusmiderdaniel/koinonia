'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { TaskSortBuilder } from '../sort-builder'
import { TaskFilterBuilder } from '../filter-builder'
import { GroupBySelector, type GroupByField } from './GroupBySelector'
import { ViewSelector, SaveViewDialog } from '@/components/saved-views'
import { useIsMobile } from '@/lib/hooks'
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
  const t = useTranslations('tasks')
  const isMobile = useIsMobile()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch from Radix UI random IDs
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className={`flex flex-col gap-2 ${isMobile ? 'mb-2' : 'mb-4'}`}>
      <div className="relative">
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground ${isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />
        <Input
          placeholder={t('search.placeholder')}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={isMobile ? 'pl-9 h-9 text-sm' : 'pl-10'}
        />
      </div>
      {mounted && (
        <div className="grid grid-cols-4 gap-1.5 sm:flex sm:items-center sm:gap-2">
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
      )}
    </div>
  )
}
