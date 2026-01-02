'use client'

import { useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, Users, Pencil, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { MobileBackHeader } from '@/components/MobileBackHeader'
import { CampusBadge } from '@/components/CampusBadge'
import { useIsMobile } from '@/lib/hooks'
import { MinistryDetailPanel, RoleDialog } from './components'
import { useMinistryList, useMinistryDetail, useMinistryDialogs } from './hooks'
import type { Ministry } from './types'

// Dynamic import for dialog (only loaded when opened)
const MinistryDialog = dynamic(() => import('./ministry-dialog').then(mod => ({ default: mod.MinistryDialog })), { ssr: false })

export interface MinistriesInitialData {
  ministries: Ministry[]
  role: string
}

interface MinistriesPageClientProps {
  initialData: MinistriesInitialData
}

export function MinistriesPageClient({ initialData }: MinistriesPageClientProps) {
  const isMobile = useIsMobile()

  // Use custom hooks for state management - pass initial data
  // Hook checks viewport directly to avoid auto-selecting on mobile
  const list = useMinistryList(initialData)
  const detail = useMinistryDetail()
  const dialogs = useMinistryDialogs()

  // Load ministry details when selection changes
  useEffect(() => {
    if (list.selectedMinistryId) {
      detail.loadMinistryDetails(list.selectedMinistryId)
    }
  }, [list.selectedMinistryId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Handler bridges - memoized to prevent unnecessary re-renders
  const handleEdit = useCallback((ministry: Ministry, e: React.MouseEvent) => {
    e.stopPropagation()
    dialogs.openEditDialog(ministry)
  }, [dialogs])

  const handleDeleteClick = useCallback((ministry: Ministry, e: React.MouseEvent) => {
    e.stopPropagation()
    dialogs.openDeleteDialog(ministry)
  }, [dialogs])

  const handleDelete = useCallback(async () => {
    const result = await dialogs.handleDeleteMinistry(
      list.selectedMinistryId,
      list.ministries,
      (newId) => list.setSelectedMinistryId(newId)
    )
    if (result.error) {
      list.setError(result.error)
    } else {
      await list.refreshMinistries()
    }
  }, [dialogs, list])

  const handleDialogClose = useCallback(async () => {
    dialogs.closeDialog()
    await list.refreshMinistries()
  }, [dialogs, list])

  const handleSaveRole = useCallback(async () => {
    if (!dialogs.roleName.trim() || !list.selectedMinistryId) return

    dialogs.setIsSavingRole(true)
    list.setError(null)

    const result = await detail.saveRole(
      list.selectedMinistryId,
      dialogs.editingRole,
      dialogs.roleName,
      dialogs.roleDescription
    )

    if (result.error) {
      list.setError(result.error)
    } else {
      dialogs.closeRoleDialog()
    }

    dialogs.setIsSavingRole(false)
  }, [dialogs, list, detail])

  const handleDeleteRole = useCallback(async () => {
    if (!dialogs.deletingRole || !list.selectedMinistryId) return

    dialogs.setIsDeletingRole(true)
    const result = await detail.deleteRole(dialogs.deletingRole.id, list.selectedMinistryId)

    if (result.error) {
      list.setError(result.error)
    } else {
      dialogs.closeDeleteRoleDialog()
    }

    dialogs.setIsDeletingRole(false)
  }, [dialogs, list, detail])

  const handleAddMember = useCallback(async (memberId: string, roleIds: string[]) => {
    if (!list.selectedMinistryId) return

    dialogs.setIsAddingMember(true)
    list.setError(null)

    const result = await detail.addMember(list.selectedMinistryId, memberId, roleIds)

    if (result.error) {
      list.setError(result.error)
    }

    dialogs.setIsAddingMember(false)
  }, [dialogs, list, detail])

  const handleUpdateMemberRoles = useCallback(async (memberId: string, roleIds: string[]) => {
    if (!list.selectedMinistryId) return

    list.setError(null)
    const result = await detail.updateMemberRoles(memberId, roleIds, list.selectedMinistryId)

    if (result.error) {
      list.setError(result.error)
    }
  }, [list, detail])

  const handleRemoveMember = useCallback(async () => {
    if (!dialogs.removingMember || !list.selectedMinistryId) return

    dialogs.setIsRemovingMember(true)
    const result = await detail.removeMember(dialogs.removingMember.id, list.selectedMinistryId)

    if (result.error) {
      list.setError(result.error)
    } else {
      dialogs.closeRemoveMemberDialog()
    }

    dialogs.setIsRemovingMember(false)
  }, [dialogs, list, detail])

  const handleClearSelection = useCallback(() => {
    list.setSelectedMinistryId(null)
  }, [list])

  // Destructure commonly used values
  const { ministries, selectedMinistryId, selectedMinistry, error, canManage, canManageDetail } = list
  const { roles, members, availableMembers, allMinistries, isLoadingDetail } = detail

  // Mobile: Show detail view with back button
  if (isMobile && selectedMinistryId && selectedMinistry) {
    return (
      <div className="p-4">
        <MobileBackHeader
          title={selectedMinistry.name}
          onBack={handleClearSelection}
        />

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <MinistryDetailPanel
          ministry={selectedMinistry}
          roles={roles}
          members={members}
          availableMembers={availableMembers}
          allMinistries={allMinistries}
          isLoading={isLoadingDetail}
          canManage={canManageDetail}
          isAddingMember={dialogs.isAddingMember}
          onEditMinistry={handleEdit}
          onAddRole={() => dialogs.openRoleDialog()}
          onEditRole={(role) => dialogs.openRoleDialog(role)}
          onDeleteRole={(role) => dialogs.openDeleteRoleDialog(role)}
          onAddMember={handleAddMember}
          onUpdateMemberRoles={handleUpdateMemberRoles}
          onRemoveMember={(member) => dialogs.openRemoveMemberDialog(member)}
        />

        {/* Dialogs */}
        <MinistryDialog
          open={dialogs.dialogOpen}
          onOpenChange={dialogs.setDialogOpen}
          ministry={dialogs.editingMinistry}
          onSuccess={handleDialogClose}
        />
        <ConfirmDialog
          open={dialogs.deleteDialogOpen}
          onOpenChange={(open) => !open && dialogs.closeDeleteDialog()}
          title="Delete Ministry?"
          description={<>Are you sure you want to delete <strong>{dialogs.deletingMinistry?.name}</strong>? This action cannot be undone.</>}
          confirmLabel="Delete"
          destructive
          isLoading={dialogs.isDeleting}
          onConfirm={handleDelete}
        />
        <RoleDialog
          open={dialogs.roleDialogOpen}
          onOpenChange={(open) => !open && dialogs.closeRoleDialog()}
          editingRole={dialogs.editingRole}
          roleName={dialogs.roleName}
          roleDescription={dialogs.roleDescription}
          isSaving={dialogs.isSavingRole}
          onRoleNameChange={dialogs.setRoleName}
          onRoleDescriptionChange={dialogs.setRoleDescription}
          onSave={handleSaveRole}
          onCancel={dialogs.closeRoleDialog}
        />
        <ConfirmDialog
          open={dialogs.deleteRoleDialogOpen}
          onOpenChange={(open) => !open && dialogs.closeDeleteRoleDialog()}
          title="Delete Role?"
          description={<>Are you sure you want to delete <strong>{dialogs.deletingRole?.name}</strong>? Members with this role will have their role unassigned.</>}
          confirmLabel="Delete"
          destructive
          isLoading={dialogs.isDeletingRole}
          onConfirm={handleDeleteRole}
        />
        <ConfirmDialog
          open={dialogs.removeMemberDialogOpen}
          onOpenChange={(open) => !open && dialogs.closeRemoveMemberDialog()}
          title="Remove Member?"
          description={<>Are you sure you want to remove <strong>{dialogs.removingMember?.profile.first_name} {dialogs.removingMember?.profile.last_name}</strong> from this ministry?</>}
          confirmLabel="Remove"
          destructive
          isLoading={dialogs.isRemovingMember}
          onConfirm={handleRemoveMember}
        />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Ministries</h1>
          <p className="text-muted-foreground">
            Manage your church's ministry teams
          </p>
        </div>
        {canManage && (
          <Button variant="ghost" className="rounded-full !border !border-gray-300 dark:!border-gray-600" onClick={dialogs.openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" />
            New Ministry
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {ministries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No ministries yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create ministry teams to organize your church's volunteers and activities.
            </p>
            {canManage && (
              <Button onClick={dialogs.openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Ministry
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col md:flex-row gap-6">
          {/* Ministry List */}
          <div className="w-full md:w-72 md:flex-shrink-0">
            <ScrollArea className="h-auto md:h-[calc(100vh-220px)]">
              <div className="space-y-2 md:pr-4">
                {ministries.map((ministry) => (
                  <div
                    key={ministry.id}
                    onClick={() => list.setSelectedMinistryId(ministry.id)}
                    className={`relative p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedMinistryId === ministry.id
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-muted/50'
                    }`}
                  >
                    <div
                      className="absolute top-0 left-0 w-1 h-full rounded-l-lg"
                      style={{ backgroundColor: ministry.color }}
                    />
                    <div className="pl-2">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: ministry.color }}
                        />
                        <span className="font-medium truncate">{ministry.name}</span>
                        {!ministry.is_active && (
                          <Badge variant="secondary" className="text-xs">Inactive</Badge>
                        )}
                        {ministry.campus && (
                          <CampusBadge name={ministry.campus.name} color={ministry.campus.color} size="sm" />
                        )}
                      </div>
                      {ministry.leader && (
                        <p className="text-xs text-muted-foreground pl-5">
                          {ministry.leader.first_name} {ministry.leader.last_name}
                        </p>
                      )}
                    </div>
                    {canManage && (
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => handleEdit(ministry, e)}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        {!ministry.is_system && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={(e) => handleDeleteClick(ministry, e)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Ministry Detail - Right Side (Desktop only) */}
          {!isMobile && (
            <div className="flex-1 min-w-0">
              <MinistryDetailPanel
                ministry={selectedMinistry}
                roles={roles}
                members={members}
                availableMembers={availableMembers}
                allMinistries={allMinistries}
                isLoading={isLoadingDetail}
                canManage={canManageDetail}
                isAddingMember={dialogs.isAddingMember}
                onEditMinistry={handleEdit}
                onAddRole={() => dialogs.openRoleDialog()}
                onEditRole={(role) => dialogs.openRoleDialog(role)}
                onDeleteRole={(role) => dialogs.openDeleteRoleDialog(role)}
                onAddMember={handleAddMember}
                onUpdateMemberRoles={handleUpdateMemberRoles}
                onRemoveMember={(member) => dialogs.openRemoveMemberDialog(member)}
              />
            </div>
          )}
        </div>
      )}

      {/* Ministry Dialog */}
      <MinistryDialog
        open={dialogs.dialogOpen}
        onOpenChange={dialogs.setDialogOpen}
        ministry={dialogs.editingMinistry}
        onSuccess={handleDialogClose}
      />

      {/* Delete Ministry Dialog */}
      <ConfirmDialog
        open={dialogs.deleteDialogOpen}
        onOpenChange={(open) => !open && dialogs.closeDeleteDialog()}
        title="Delete Ministry?"
        description={<>Are you sure you want to delete <strong>{dialogs.deletingMinistry?.name}</strong>? This action cannot be undone.</>}
        confirmLabel="Delete"
        destructive
        isLoading={dialogs.isDeleting}
        onConfirm={handleDelete}
      />

      {/* Role Dialog */}
      <RoleDialog
        open={dialogs.roleDialogOpen}
        onOpenChange={(open) => !open && dialogs.closeRoleDialog()}
        editingRole={dialogs.editingRole}
        roleName={dialogs.roleName}
        roleDescription={dialogs.roleDescription}
        isSaving={dialogs.isSavingRole}
        onRoleNameChange={dialogs.setRoleName}
        onRoleDescriptionChange={dialogs.setRoleDescription}
        onSave={handleSaveRole}
        onCancel={dialogs.closeRoleDialog}
      />

      {/* Delete Role Dialog */}
      <ConfirmDialog
        open={dialogs.deleteRoleDialogOpen}
        onOpenChange={(open) => !open && dialogs.closeDeleteRoleDialog()}
        title="Delete Role?"
        description={<>Are you sure you want to delete <strong>{dialogs.deletingRole?.name}</strong>? Members with this role will have their role unassigned.</>}
        confirmLabel="Delete"
        destructive
        isLoading={dialogs.isDeletingRole}
        onConfirm={handleDeleteRole}
      />

      {/* Remove Member Dialog */}
      <ConfirmDialog
        open={dialogs.removeMemberDialogOpen}
        onOpenChange={(open) => !open && dialogs.closeRemoveMemberDialog()}
        title="Remove Member?"
        description={<>Are you sure you want to remove <strong>{dialogs.removingMember?.profile.first_name} {dialogs.removingMember?.profile.last_name}</strong> from this ministry?</>}
        confirmLabel="Remove"
        destructive
        isLoading={dialogs.isRemovingMember}
        onConfirm={handleRemoveMember}
      />
    </div>
  )
}
