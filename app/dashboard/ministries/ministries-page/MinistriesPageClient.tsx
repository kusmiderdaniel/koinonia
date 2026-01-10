'use client'

import { useState, useEffect, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Users } from 'lucide-react'
import { MobileBackHeader } from '@/components/MobileBackHeader'
import { EmptyState } from '@/components/EmptyState'
import { useIsMobile } from '@/lib/hooks'
import { MinistryDetailPanel, MinistriesListView } from '../components'
import { useMinistryList, useMinistryDetail, useMinistryDialogs } from '../hooks'
import { useMinistriesPageHandlers } from './useMinistriesPageHandlers'
import { MinistriesDialogs } from './MinistriesDialogs'
import type { MinistriesPageClientProps } from './types'

export function MinistriesPageClient({ initialData }: MinistriesPageClientProps) {
  const t = useTranslations('ministries')
  const isMobile = useIsMobile()
  const [searchQuery, setSearchQuery] = useState('')

  // Use custom hooks for state management
  const list = useMinistryList(initialData)
  const detail = useMinistryDetail()
  const dialogs = useMinistryDialogs()

  // Get handler functions
  const handlers = useMinistriesPageHandlers({ list, detail, dialogs })

  // Filter ministries based on search query
  const filteredMinistries = useMemo(() => {
    if (!searchQuery.trim()) return list.ministries
    const query = searchQuery.toLowerCase()
    return list.ministries.filter(
      (ministry) =>
        ministry.name.toLowerCase().includes(query) ||
        ministry.leader?.first_name?.toLowerCase().includes(query) ||
        ministry.leader?.last_name?.toLowerCase().includes(query)
    )
  }, [list.ministries, searchQuery])

  // Load ministry details when selection changes
  useEffect(() => {
    if (list.selectedMinistryId) {
      detail.loadMinistryDetails(list.selectedMinistryId)
    }
  }, [list.selectedMinistryId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Destructure commonly used values
  const {
    selectedMinistryId,
    selectedMinistry,
    error,
    canManage,
    canManageDetail,
  } = list
  const { roles, members, availableMembers, allMinistries, isLoadingDetail } =
    detail

  // Mobile: Show detail view with back button
  if (isMobile && selectedMinistryId && selectedMinistry) {
    return (
      <div className="flex flex-col h-[calc(100vh-3.5rem)] p-4">
        <MobileBackHeader
          title={selectedMinistry.name}
          onBack={handlers.handleClearSelection}
        />

        {error && (
          <Alert variant="destructive" className="mb-4 shrink-0">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex-1 min-h-0 overflow-auto">
          <MinistryDetailPanel
            ministry={selectedMinistry}
            roles={roles}
            members={members}
            availableMembers={availableMembers}
            allMinistries={allMinistries}
            isLoading={isLoadingDetail}
            canManage={canManageDetail}
            isAddingMember={dialogs.isAddingMember}
            onEditMinistry={handlers.handleEdit}
            onAddRole={() => dialogs.openRoleDialog()}
            onEditRole={(role) => dialogs.openRoleDialog(role)}
            onDeleteRole={(role) => dialogs.openDeleteRoleDialog(role)}
            onAddMember={handlers.handleAddMember}
            onUpdateMemberRoles={handlers.handleUpdateMemberRoles}
            onRemoveMember={(member) => dialogs.openRemoveMemberDialog(member)}
          />
        </div>

        <MinistriesDialogs
          dialogs={dialogs}
          onDialogClose={handlers.handleDialogClose}
          onDelete={handlers.handleDelete}
          onSaveRole={handlers.handleSaveRole}
          onDeleteRole={handlers.handleDeleteRole}
          onRemoveMember={handlers.handleRemoveMember}
        />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] md:h-screen overflow-hidden">
      <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
        <div className="mb-4 shrink-0">
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4 shrink-0">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
          {/* Ministry List */}
          <MinistriesListView
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            ministries={list.ministries}
            filteredMinistries={filteredMinistries}
            selectedMinistryId={selectedMinistryId}
            onSelectMinistry={(ministry) => list.setSelectedMinistryId(ministry.id)}
            onAddClick={dialogs.openCreateDialog}
            canManage={canManage}
            className="w-full md:w-80 md:flex-shrink-0 h-full"
          />

          {/* Ministry Detail - Right Side (Desktop only) */}
          {!isMobile && (
            <div className="flex-1 min-w-0 h-full">
              {selectedMinistry ? (
                <MinistryDetailPanel
                  ministry={selectedMinistry}
                  roles={roles}
                  members={members}
                  availableMembers={availableMembers}
                  allMinistries={allMinistries}
                  isLoading={isLoadingDetail}
                  canManage={canManageDetail}
                  isAddingMember={dialogs.isAddingMember}
                  onEditMinistry={handlers.handleEdit}
                  onAddRole={() => dialogs.openRoleDialog()}
                  onEditRole={(role) => dialogs.openRoleDialog(role)}
                  onDeleteRole={(role) => dialogs.openDeleteRoleDialog(role)}
                  onAddMember={handlers.handleAddMember}
                  onUpdateMemberRoles={handlers.handleUpdateMemberRoles}
                  onRemoveMember={(member) => dialogs.openRemoveMemberDialog(member)}
                />
              ) : (
                <Card className="h-full flex items-center justify-center border border-black dark:border-zinc-700">
                  <EmptyState
                    icon={Users}
                    title={t('selectMinistry')}
                    description={t('selectMinistryDescription')}
                    size="sm"
                  />
                </Card>
              )}
            </div>
          )}
        </div>

        <MinistriesDialogs
          dialogs={dialogs}
          onDialogClose={handlers.handleDialogClose}
          onDelete={handlers.handleDelete}
          onSaveRole={handlers.handleSaveRole}
          onDeleteRole={handlers.handleDeleteRole}
          onRemoveMember={handlers.handleRemoveMember}
        />
      </div>
    </div>
  )
}
