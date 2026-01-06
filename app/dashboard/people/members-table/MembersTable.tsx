'use client'

import { useState, memo, useMemo } from 'react'
import { Table, TableBody } from '@/components/ui/table'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useIsMobile } from '@/lib/hooks'
import { PeopleFilterBuilder } from '../filter-builder'
import { FilterState, createEmptyFilterState, countActiveFilters } from '../filter-types'
import { applyFilters } from '../filter-logic'
import { PeopleSortBuilder } from '../sort-builder'
import { SortState, createEmptySortState, countActiveSorts } from '../sort-types'
import { applySorts } from '../sort-logic'
import { MemberRow, MemberCard } from '../components'
import { ViewSelector, SaveViewDialog } from '@/components/saved-views'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useMembersTableState } from './useMembersTableState'
import { useSavedViewsManager } from './useSavedViewsManager'
import { useMemberPermissions } from './useMemberPermissions'
import { MembersTableHeader } from './MembersTableHeader'
import type { MembersTableProps } from './types'

export const MembersTable = memo(function MembersTable({
  members,
  currentUserId,
  currentUserRole,
  savedViews,
  canManageViews,
}: MembersTableProps) {
  const isMobile = useIsMobile()
  const [filterState, setFilterState] = useState<FilterState>(createEmptyFilterState)
  const [sortState, setSortState] = useState<SortState>(createEmptySortState)

  // Member update handlers
  const {
    updatingId,
    updatingActiveId,
    updatingDepartureId,
    updatingBaptismId,
    handleRoleChange,
    handleActiveChange,
    handleDepartureChange,
    handleBaptismChange,
  } = useMembersTableState()

  // Saved views management
  const viewsManager = useSavedViewsManager({
    savedViews,
    filterState,
    sortState,
    setFilterState,
    setSortState,
  })

  // Permission checks
  const {
    canEditFields,
    canEditRole,
    canEditActiveStatus,
    canEditDeparture,
  } = useMemberPermissions({ currentUserId, currentUserRole })

  // Apply filters and sorts to members
  const filteredAndSortedMembers = useMemo(() => {
    const filtered = applyFilters(members, filterState)
    return applySorts(filtered, sortState)
  }, [members, filterState, sortState])

  const activeFilterCount = countActiveFilters(filterState)
  const activeSortCount = countActiveSorts(sortState)

  return (
    <div className="flex-1 flex flex-col space-y-4 min-h-0">
      {/* Filter and Sort toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div className="grid grid-cols-3 sm:flex sm:items-center gap-2 w-full sm:w-auto">
          <PeopleSortBuilder sortState={sortState} onChange={setSortState} />
          <PeopleFilterBuilder filterState={filterState} onChange={setFilterState} />
          <ViewSelector
            viewType="people"
            views={viewsManager.views}
            selectedViewId={viewsManager.selectedViewId}
            onSelectView={viewsManager.setSelectedViewId}
            onCreateView={viewsManager.handleCreateView}
            onEditView={viewsManager.handleEditView}
            onDeleteView={viewsManager.setViewToDelete}
            onSetDefault={viewsManager.handleSetDefaultView}
            canManageViews={canManageViews}
            hasUnsavedChanges={viewsManager.hasUnsavedChanges}
            onSaveChanges={viewsManager.handleSaveViewChanges}
            isSavingChanges={viewsManager.isSavingChanges}
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
          <div className="flex-1 border border-black dark:border-white rounded-lg overflow-auto">
            <Table>
              <MembersTableHeader />
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
          </div>
        </TooltipProvider>
      )}

      {/* Saved Views Dialogs */}
      <SaveViewDialog
        open={viewsManager.showSaveDialog}
        onOpenChange={viewsManager.setShowSaveDialog}
        viewType="people"
        currentFilterState={filterState}
        currentSortState={sortState}
        editingView={viewsManager.editingView}
        onSuccess={viewsManager.handleViewSuccess}
      />

      <ConfirmDialog
        open={!!viewsManager.viewToDelete}
        onOpenChange={(open) => !open && viewsManager.setViewToDelete(null)}
        title="Delete View"
        description={`Are you sure you want to delete the view "${viewsManager.viewToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={viewsManager.handleDeleteViewConfirm}
        isLoading={viewsManager.isDeletingView}
      />
    </div>
  )
})
