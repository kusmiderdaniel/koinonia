'use client'

import { useState, memo, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Table, TableBody } from '@/components/ui/table'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useIsMobile } from '@/lib/hooks'
import { PeopleFilterBuilder } from '../filter-builder'
import { FilterState, createEmptyFilterState, countActiveFilters } from '../filter-types'
import { applyFilters } from '../filter-logic'
import { PeopleSortBuilder } from '../sort-builder'
import { SortState, createDefaultPeopleSortState, countActiveSorts } from '../sort-types'
import { applySorts } from '../sort-logic'
import { MemberRow, MemberCard } from '../components'
import { ViewSelector, SaveViewDialog } from '@/components/saved-views'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useOptimisticMembers } from './useOptimisticMembers'
import { useSavedViewsManager } from './useSavedViewsManager'
import { useMemberPermissions } from './useMemberPermissions'
import { MembersTableHeader } from './MembersTableHeader'
import { ColumnSelector } from './ColumnSelector'
import { type PeopleColumnKey } from './columns'
import type { MembersTableProps } from './types'

export const MembersTable = memo(function MembersTable({
  members,
  currentUserId,
  currentUserRole,
  savedViews,
  canManageViews,
  allCampuses,
}: MembersTableProps) {
  const t = useTranslations('people')
  const isMobile = useIsMobile()
  const [filterState, setFilterState] = useState<FilterState>(createEmptyFilterState)
  const [sortState, setSortState] = useState<SortState>(createDefaultPeopleSortState)
  const [visibleColumns, setVisibleColumns] = useState<PeopleColumnKey[] | null>(null)

  // Member update handlers with optimistic updates
  const {
    members: optimisticMembers,
    updatingId,
    updatingActiveId,
    updatingDepartureId,
    updatingBaptismId,
    updatingCampusesId,
    updatingProfileId,
    deletingMember,
    isDeleting,
    handleRoleChange,
    handleActiveChange,
    handleDepartureChange,
    handleBaptismChange,
    handleCampusesChange,
    handleProfileChange,
    openDeleteDialog,
    closeDeleteDialog,
    handleDeleteMember,
  } = useOptimisticMembers(members, allCampuses)

  // Saved views management
  const viewsManager = useSavedViewsManager({
    savedViews,
    filterState,
    sortState,
    visibleColumns,
    setFilterState,
    setSortState,
    setVisibleColumns,
  })

  // Permission checks
  const {
    canEditFields,
    canEditRole,
    canEditActiveStatus,
    canEditDeparture,
    canDeleteOffline,
  } = useMemberPermissions({ currentUserId, currentUserRole })

  // Apply filters and sorts to members (using optimistic data)
  const filteredAndSortedMembers = useMemo(() => {
    const filtered = applyFilters(optimisticMembers, filterState)
    return applySorts(filtered, sortState)
  }, [optimisticMembers, filterState, sortState])

  const activeFilterCount = countActiveFilters(filterState)
  const activeSortCount = countActiveSorts(sortState)

  return (
    <div className="flex-1 flex flex-col space-y-4 min-h-0">
      {/* Filter and Sort toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div className="grid grid-cols-4 sm:flex sm:items-center gap-2 w-full sm:w-auto">
          <PeopleSortBuilder sortState={sortState} onChange={setSortState} />
          <PeopleFilterBuilder filterState={filterState} onChange={setFilterState} />
          <ColumnSelector
            visibleColumns={visibleColumns}
            onChange={setVisibleColumns}
          />
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
            {t('showingMembers', { filtered: filteredAndSortedMembers.length, total: optimisticMembers.length })}
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
              canDeleteOffline={canDeleteOffline}
              isUpdatingRole={updatingId === member.id}
              isUpdatingActive={updatingActiveId === member.id}
              isUpdatingDeparture={updatingDepartureId === member.id}
              isUpdatingBaptism={updatingBaptismId === member.id}
              isUpdatingCampuses={updatingCampusesId === member.id}
              isUpdatingProfile={updatingProfileId === member.id}
              allCampuses={allCampuses}
              onRoleChange={handleRoleChange}
              onActiveChange={handleActiveChange}
              onDepartureChange={handleDepartureChange}
              onBaptismChange={handleBaptismChange}
              onCampusesChange={handleCampusesChange}
              onProfileChange={handleProfileChange}
              onDeleteOffline={openDeleteDialog}
            />
          ))}
        </div>
      ) : (
        /* Desktop: Table view */
        <TooltipProvider>
          <div className="flex-1 border border-black dark:border-white rounded-lg overflow-auto">
            <Table>
              <MembersTableHeader visibleColumns={visibleColumns} />
              <TableBody>
                {filteredAndSortedMembers.map((member, index) => (
                  <MemberRow
                    key={member.id}
                    member={member}
                    index={index}
                    currentUserId={currentUserId}
                    visibleColumns={visibleColumns}
                    canEditRole={canEditRole(member)}
                    canEditActiveStatus={canEditActiveStatus(member)}
                    canEditDeparture={canEditDeparture(member)}
                    canEditFields={canEditFields}
                    canDeleteOffline={canDeleteOffline}
                    isUpdatingRole={updatingId === member.id}
                    isUpdatingActive={updatingActiveId === member.id}
                    isUpdatingDeparture={updatingDepartureId === member.id}
                    isUpdatingBaptism={updatingBaptismId === member.id}
                    isUpdatingCampuses={updatingCampusesId === member.id}
                    isUpdatingProfile={updatingProfileId === member.id}
                    allCampuses={allCampuses}
                    onRoleChange={handleRoleChange}
                    onActiveChange={handleActiveChange}
                    onDepartureChange={handleDepartureChange}
                    onBaptismChange={handleBaptismChange}
                    onCampusesChange={handleCampusesChange}
                    onProfileChange={handleProfileChange}
                    onDeleteOffline={openDeleteDialog}
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
        currentVisibleColumns={visibleColumns}
        editingView={viewsManager.editingView}
        onSuccess={viewsManager.handleViewSuccess}
      />

      <ConfirmDialog
        open={!!viewsManager.viewToDelete}
        onOpenChange={(open) => !open && viewsManager.setViewToDelete(null)}
        title={t('views.deleteTitle')}
        description={t('views.deleteConfirmation', { name: viewsManager.viewToDelete?.name ?? '' })}
        confirmLabel={t('actions.delete')}
        destructive
        onConfirm={viewsManager.handleDeleteViewConfirm}
        isLoading={viewsManager.isDeletingView}
      />

      {/* Delete Offline Member Dialog */}
      <ConfirmDialog
        open={!!deletingMember}
        onOpenChange={(open) => !open && closeDeleteDialog()}
        title={t('deleteOffline.title')}
        description={t('deleteOffline.description', {
          name: deletingMember ? `${deletingMember.first_name} ${deletingMember.last_name}` : ''
        })}
        confirmLabel={t('actions.delete')}
        destructive
        onConfirm={handleDeleteMember}
        isLoading={isDeleting}
      />
    </div>
  )
})
