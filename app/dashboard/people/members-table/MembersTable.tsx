'use client'

import { useState, memo, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
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
import { useColumnConfig } from './useColumnConfig'
import { MembersTableHeader } from './MembersTableHeader'
import { ColumnSelector } from './ColumnSelector'
import { ExportDialog } from './ExportDialog'
import { type PeopleColumnKey } from './columns'
import type { MembersTableProps } from './types'
import type { ColumnConfig } from '@/types/saved-views'

export const MembersTable = memo(function MembersTable({
  members,
  currentUserId,
  currentUserRole,
  savedViews,
  canManageViews,
  allCampuses,
  customFields,
}: MembersTableProps) {
  const t = useTranslations('people')
  const isMobile = useIsMobile()
  const [filterState, setFilterState] = useState<FilterState>(createEmptyFilterState)
  const [sortState, setSortState] = useState<SortState>(createDefaultPeopleSortState)
  const [visibleColumns, setVisibleColumns] = useState<PeopleColumnKey[] | null>(null)

  // Get initial columnsConfig from default saved view
  const defaultView = useMemo(() => savedViews.find((v) => v.is_default), [savedViews])

  // Column configuration hook for ordering, resizing, and visibility
  const {
    orderedColumns,
    columnWidths,
    columnsConfig,
    setColumnsConfig,
    isColumnVisible,
    resizeColumn,
    reorderColumns,
    resetToDefault,
    hasChanges: hasColumnConfigChanges,
    // Freeze props
    freezeColumnKey,
    setFreezeColumnKey,
    frozenColumnOffsets,
  } = useColumnConfig({
    customFields,
    initialColumnsConfig: defaultView?.columns_config as ColumnConfig[] | null ?? null,
    initialVisibleColumns: defaultView?.visible_columns ?? null,
    initialFreezeColumnKey: defaultView?.freeze_column_key ?? null,
  })

  // Member update handlers with optimistic updates
  const {
    members: optimisticMembers,
    updatingId,
    updatingActiveId,
    updatingDepartureId,
    updatingBaptismId,
    updatingCampusesId,
    updatingProfileId,
    updatingCustomFieldKey,
    deletingMember,
    isDeleting,
    handleRoleChange,
    handleActiveChange,
    handleDepartureChange,
    handleBaptismChange,
    handleCampusesChange,
    handleProfileChange,
    handleCustomFieldChange,
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
    columnsConfig,
    freezeColumnKey,
    hasColumnConfigChanges,
    setFilterState,
    setSortState,
    setVisibleColumns,
    setColumnsConfig,
    setFreezeColumnKey,
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

  // DnD sensors with distance activation to distinguish clicks from drags
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Handle column reorder via drag-and-drop
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      reorderColumns(String(active.id), String(over.id))
    }
  }

  const activeFilterCount = countActiveFilters(filterState)
  const activeSortCount = countActiveSorts(sortState)

  return (
    <div className="flex-1 flex flex-col space-y-4 min-h-0">
      {/* Filter and Sort toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div className="grid grid-cols-5 sm:flex sm:items-center gap-2 w-full sm:w-auto">
          <PeopleSortBuilder sortState={sortState} onChange={setSortState} customFields={customFields} />
          <PeopleFilterBuilder filterState={filterState} onChange={setFilterState} customFields={customFields} />
          <ColumnSelector
            visibleColumns={visibleColumns}
            onChange={setVisibleColumns}
            customFields={customFields}
            orderedColumns={orderedColumns}
            onReorderColumns={reorderColumns}
            onResetToDefault={resetToDefault}
            freezeColumnKey={freezeColumnKey}
            onFreezeColumnChange={setFreezeColumnKey}
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
        <div className="flex items-center gap-4">
          {(activeFilterCount > 0 || activeSortCount > 0) && (
            <p className="text-sm text-muted-foreground">
              {t('showingMembers', { filtered: filteredAndSortedMembers.length, total: optimisticMembers.length })}
            </p>
          )}
          <ExportDialog
            members={filteredAndSortedMembers}
            customFields={customFields}
          />
        </div>
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
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="flex-1 border border-black dark:border-white rounded-lg overflow-auto">
              <Table>
                <MembersTableHeader
                  visibleColumns={visibleColumns}
                  customFields={customFields}
                  orderedColumns={orderedColumns}
                  columnWidths={columnWidths}
                  onResizeColumn={resizeColumn}
                  freezeColumnKey={freezeColumnKey}
                  frozenColumnOffsets={frozenColumnOffsets}
                />
              <TableBody>
                {filteredAndSortedMembers.map((member, index) => (
                  <MemberRow
                    key={member.id}
                    member={member}
                    index={index}
                    currentUserId={currentUserId}
                    visibleColumns={visibleColumns}
                    customFields={customFields}
                    orderedColumns={orderedColumns}
                    columnWidths={columnWidths}
                    freezeColumnKey={freezeColumnKey}
                    frozenColumnOffsets={frozenColumnOffsets}
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
                    updatingCustomFieldKey={updatingCustomFieldKey}
                    allCampuses={allCampuses}
                    onRoleChange={handleRoleChange}
                    onActiveChange={handleActiveChange}
                    onDepartureChange={handleDepartureChange}
                    onBaptismChange={handleBaptismChange}
                    onCampusesChange={handleCampusesChange}
                    onProfileChange={handleProfileChange}
                    onCustomFieldChange={handleCustomFieldChange}
                    onDeleteOffline={openDeleteDialog}
                  />
                ))}
              </TableBody>
              </Table>
            </div>
          </DndContext>
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
        currentColumnsConfig={columnsConfig}
        currentFreezeColumnKey={freezeColumnKey}
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
