import type { FilterState } from '@/lib/filters/filter-types'
import type { SortState } from '@/lib/filters/sort-types'
import type { GroupByField } from '@/app/dashboard/tasks/components/GroupBySelector'

// View types available
export type ViewType = 'people' | 'tasks'

// Base saved view from database
export interface SavedView {
  id: string
  church_id: string
  view_type: ViewType
  name: string
  description: string | null
  filter_state: FilterState
  sort_state: SortState
  group_by: GroupByField | null
  visible_columns: string[] | null // Column keys to display, null means all
  is_default: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

// For creating a new view
export interface CreateSavedViewInput {
  name: string
  description?: string | null
  view_type: ViewType
  filter_state: FilterState
  sort_state: SortState
  group_by?: GroupByField | null
  visible_columns?: string[] | null
  is_default?: boolean
}

// For updating an existing view
export interface UpdateSavedViewInput {
  name?: string
  description?: string | null
  filter_state?: FilterState
  sort_state?: SortState
  group_by?: GroupByField | null
  visible_columns?: string[] | null
  is_default?: boolean
}

// Action result types
export interface SavedViewActionResult {
  success?: boolean
  error?: string
  data?: SavedView
}

// Built-in view definition (predefined views like "My Tasks")
export interface BuiltInView {
  id: string // e.g., 'my-tasks'
  name: string
  filterState: FilterState
  sortState: SortState
  groupBy?: GroupByField | null
}

// Props for view selector component
export interface ViewSelectorProps {
  viewType: ViewType
  views: SavedView[]
  selectedViewId: string | null
  onSelectView: (viewId: string | null) => void
  onCreateView: () => void
  onEditView: (view: SavedView) => void
  onDeleteView: (view: SavedView) => void
  onSetDefault: (view: SavedView) => void
  canManageViews: boolean
  isLoading?: boolean
  hasUnsavedChanges?: boolean
  onSaveChanges?: () => void
  isSavingChanges?: boolean
  builtInViews?: BuiltInView[]
  onSelectBuiltInView?: (view: BuiltInView) => void
}

// Props for save view dialog
export interface SaveViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  viewType: ViewType
  currentFilterState: FilterState
  currentSortState: SortState
  currentGroupBy?: GroupByField
  currentVisibleColumns?: string[] | null
  editingView?: SavedView | null
  onSuccess?: (view: SavedView) => void
}
