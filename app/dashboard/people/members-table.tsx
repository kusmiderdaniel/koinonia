'use client'

import { useState, memo, useMemo, useCallback, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Info } from 'lucide-react'
import { useIsMobile } from '@/lib/hooks'
import { updateMemberRole, updateMemberActive, updateMemberDeparture, updateMemberBaptism } from './actions'
import { PeopleFilterBuilder } from './filter-builder'
import { FilterState, createEmptyFilterState, countActiveFilters } from './filter-types'
import { applyFilters } from './filter-logic'
import { PeopleSortBuilder } from './sort-builder'
import { SortState, createEmptySortState, countActiveSorts } from './sort-types'
import { applySorts } from './sort-logic'
import { MemberRow, MemberCard } from './components'
import {
  type Member,
  type Role,
  type AssignableRole,
  roleHierarchy,
} from './components/member-table-types'
import { ViewSelector, SaveViewDialog } from '@/components/saved-views'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { deleteSavedView, setDefaultView, updateSavedView } from '@/lib/actions/saved-views'
import { toast } from 'sonner'
import type { SavedView } from '@/types/saved-views'

interface MembersTableProps {
  members: Member[]
  currentUserId: string
  currentUserRole: string
  savedViews: SavedView[]
  canManageViews: boolean
}

export const MembersTable = memo(function MembersTable({
  members,
  currentUserId,
  currentUserRole,
  savedViews,
  canManageViews,
}: MembersTableProps) {
  const isMobile = useIsMobile()
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [updatingActiveId, setUpdatingActiveId] = useState<string | null>(null)
  const [updatingDepartureId, setUpdatingDepartureId] = useState<string | null>(null)
  const [updatingBaptismId, setUpdatingBaptismId] = useState<string | null>(null)
  const [filterState, setFilterState] = useState<FilterState>(createEmptyFilterState)
  const [sortState, setSortState] = useState<SortState>(createEmptySortState)

  // Saved views state
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

    // Compare filter state
    const filterChanged = JSON.stringify(filterState) !== JSON.stringify(selectedView.filter_state)
    // Compare sort state
    const sortChanged = JSON.stringify(sortState) !== JSON.stringify(selectedView.sort_state)

    return filterChanged || sortChanged
  }, [selectedViewId, views, filterState, sortState])

  // Apply selected view's configuration
  useEffect(() => {
    if (selectedViewId) {
      const view = views.find((v) => v.id === selectedViewId)
      if (view) {
        setFilterState(view.filter_state as FilterState)
        setSortState(view.sort_state as SortState)
      }
    } else {
      // Reset to defaults when "All" is selected
      setFilterState(createEmptyFilterState())
      setSortState(createEmptySortState())
    }
  }, [selectedViewId, views])

  // Sync views when savedViews prop changes
  useEffect(() => {
    setViews(savedViews)
  }, [savedViews])

  const canEditActive = ['owner', 'admin', 'leader'].includes(currentUserRole)
  const canEditFields = ['owner', 'admin', 'leader'].includes(currentUserRole)

  // Apply filters and sorts to members
  const filteredAndSortedMembers = useMemo(() => {
    const filtered = applyFilters(members, filterState)
    return applySorts(filtered, sortState)
  }, [members, filterState, sortState])

  const activeFilterCount = countActiveFilters(filterState)
  const activeSortCount = countActiveSorts(sortState)

  // Permission checks
  const canEditRole = useCallback((member: Member) => {
    if (member.member_type === 'offline') return false
    if (member.id === currentUserId) return false
    if (member.role === 'owner') return false
    if (currentUserRole !== 'owner' && currentUserRole !== 'admin') return false

    const currentLevel = roleHierarchy[currentUserRole as Role] || 0
    const memberLevel = roleHierarchy[member.role as Role] || 0
    return currentLevel > memberLevel
  }, [currentUserId, currentUserRole])

  const canEditActiveStatus = useCallback((member: Member) => {
    if (member.id === currentUserId) return false
    if (member.role === 'owner') return false
    if (!canEditActive) return false

    const currentLevel = roleHierarchy[currentUserRole as Role] || 0
    const memberLevel = roleHierarchy[member.role as Role] || 0
    return currentLevel > memberLevel
  }, [currentUserId, currentUserRole, canEditActive])

  const canEditDeparture = useCallback((member: Member) => {
    if (member.id === currentUserId) return false
    if (member.role === 'owner') return false
    if (!canEditFields) return false

    const currentLevel = roleHierarchy[currentUserRole as Role] || 0
    const memberLevel = roleHierarchy[member.role as Role] || 0
    return currentLevel > memberLevel
  }, [currentUserId, currentUserRole, canEditFields])

  // Handlers
  const handleRoleChange = useCallback(async (memberId: string, newRole: AssignableRole) => {
    setUpdatingId(memberId)
    try {
      const result = await updateMemberRole(memberId, newRole)
      if (result.error) {
        console.error(result.error)
      }
    } finally {
      setUpdatingId(null)
    }
  }, [])

  const handleActiveChange = useCallback(async (memberId: string, active: boolean) => {
    setUpdatingActiveId(memberId)
    try {
      const result = await updateMemberActive(memberId, active)
      if (result.error) {
        console.error(result.error)
      }
    } finally {
      setUpdatingActiveId(null)
    }
  }, [])

  const handleDepartureChange = useCallback(async (
    memberId: string,
    dateOfDeparture: string | null,
    reasonForDeparture: string | null
  ) => {
    setUpdatingDepartureId(memberId)
    try {
      const result = await updateMemberDeparture(memberId, dateOfDeparture, reasonForDeparture)
      if (result.error) {
        console.error(result.error)
      }
    } finally {
      setUpdatingDepartureId(null)
    }
  }, [])

  const handleBaptismChange = useCallback(async (
    memberId: string,
    baptism: boolean,
    baptismDate: string | null
  ) => {
    setUpdatingBaptismId(memberId)
    try {
      const result = await updateMemberBaptism(memberId, baptism, baptismDate)
      if (result.error) {
        console.error(result.error)
      }
    } finally {
      setUpdatingBaptismId(null)
    }
  }, [])

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
  }, [selectedViewId, views, filterState, sortState])

  return (
    <div className="space-y-4">
      {/* Filter and Sort toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div className="grid grid-cols-3 sm:flex sm:items-center gap-2 w-full sm:w-auto">
          <PeopleSortBuilder sortState={sortState} onChange={setSortState} />
          <PeopleFilterBuilder filterState={filterState} onChange={setFilterState} />
          <ViewSelector
            viewType="people"
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
            canManageViews={canManageViews}
            hasUnsavedChanges={hasUnsavedChanges}
            onSaveChanges={handleSaveViewChanges}
            isSavingChanges={isSavingChanges}
          />
        </div>
        {(activeFilterCount > 0 || activeSortCount > 0) && (
          <p className="text-sm text-muted-foreground">
            Showing {filteredAndSortedMembers.length} of {members.length} member{members.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Mobile: Card view */}
      {isMobile ? (
        <div className="space-y-3">
          {filteredAndSortedMembers.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              currentUserId={currentUserId}
              canEditRole={canEditRole(member)}
              canEditActiveStatus={canEditActiveStatus(member)}
              canEditDeparture={canEditDeparture(member)}
              canEditFields={canEditFields}
              isUpdatingRole={updatingId === member.id}
              isUpdatingActive={updatingActiveId === member.id}
              isUpdatingDeparture={updatingDepartureId === member.id}
              isUpdatingBaptism={updatingBaptismId === member.id}
              onRoleChange={handleRoleChange}
              onActiveChange={handleActiveChange}
              onDepartureChange={handleDepartureChange}
              onBaptismChange={handleBaptismChange}
            />
          ))}
        </div>
      ) : (
        /* Desktop: Table view */
        <TooltipProvider>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Active</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    Email
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Cannot be changed</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Campus</TableHead>
                <TableHead>Ministry Roles</TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    Sex
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Can be changed in user&apos;s profile settings</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    Date of Birth
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Can be changed in user&apos;s profile settings</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TableHead>
                <TableHead>Age</TableHead>
                <TableHead className="w-[70px]">Baptized</TableHead>
                <TableHead>Baptism Date</TableHead>
                <TableHead>Departure Date</TableHead>
                <TableHead>Departure Reason</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedMembers.map((member) => (
                <MemberRow
                  key={member.id}
                  member={member}
                  currentUserId={currentUserId}
                  canEditRole={canEditRole(member)}
                  canEditActiveStatus={canEditActiveStatus(member)}
                  canEditDeparture={canEditDeparture(member)}
                  canEditFields={canEditFields}
                  isUpdatingRole={updatingId === member.id}
                  isUpdatingActive={updatingActiveId === member.id}
                  isUpdatingDeparture={updatingDepartureId === member.id}
                  isUpdatingBaptism={updatingBaptismId === member.id}
                  onRoleChange={handleRoleChange}
                  onActiveChange={handleActiveChange}
                  onDepartureChange={handleDepartureChange}
                  onBaptismChange={handleBaptismChange}
                />
              ))}
            </TableBody>
          </Table>
        </TooltipProvider>
      )}

      {/* Saved Views Dialogs */}
      <SaveViewDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        viewType="people"
        currentFilterState={filterState}
        currentSortState={sortState}
        editingView={editingView}
        onSuccess={handleViewSuccess}
      />

      <ConfirmDialog
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
})
