'use client'

import dynamic from 'next/dynamic'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { RoleDialog } from '../components'
import type { useMinistryDialogs } from '../hooks'

const MinistryDialog = dynamic(
  () => import('../ministry-dialog').then((mod) => ({ default: mod.MinistryDialog })),
  { ssr: false }
)

interface MinistriesDialogsProps {
  dialogs: ReturnType<typeof useMinistryDialogs>
  onDialogClose: (newMinistryId?: string) => void
  onDelete: () => void
  onSaveRole: () => void
  onDeleteRole: () => void
  onRemoveMember: () => void
}

export function MinistriesDialogs({
  dialogs,
  onDialogClose,
  onDelete,
  onSaveRole,
  onDeleteRole,
  onRemoveMember,
}: MinistriesDialogsProps) {
  return (
    <>
      {/* Ministry Dialog */}
      <MinistryDialog
        open={dialogs.dialogOpen}
        onOpenChange={dialogs.setDialogOpen}
        ministry={dialogs.editingMinistry}
        onSuccess={onDialogClose}
      />

      {/* Delete Ministry Dialog */}
      <ConfirmDialog
        open={dialogs.deleteDialogOpen}
        onOpenChange={(open) => !open && dialogs.closeDeleteDialog()}
        title="Delete Ministry?"
        description={
          <>
            Are you sure you want to delete{' '}
            <strong>{dialogs.deletingMinistry?.name}</strong>? This action cannot
            be undone.
          </>
        }
        confirmLabel="Delete"
        destructive
        isLoading={dialogs.isDeleting}
        onConfirm={onDelete}
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
        onSave={onSaveRole}
        onCancel={dialogs.closeRoleDialog}
      />

      {/* Delete Role Dialog */}
      <ConfirmDialog
        open={dialogs.deleteRoleDialogOpen}
        onOpenChange={(open) => !open && dialogs.closeDeleteRoleDialog()}
        title="Delete Role?"
        description={
          <>
            Are you sure you want to delete{' '}
            <strong>{dialogs.deletingRole?.name}</strong>? Members with this role
            will have their role unassigned.
          </>
        }
        confirmLabel="Delete"
        destructive
        isLoading={dialogs.isDeletingRole}
        onConfirm={onDeleteRole}
      />

      {/* Remove Member Dialog */}
      <ConfirmDialog
        open={dialogs.removeMemberDialogOpen}
        onOpenChange={(open) => !open && dialogs.closeRemoveMemberDialog()}
        title="Remove Member?"
        description={
          <>
            Are you sure you want to remove{' '}
            <strong>
              {dialogs.removingMember?.profile.first_name}{' '}
              {dialogs.removingMember?.profile.last_name}
            </strong>{' '}
            from this ministry?
          </>
        }
        confirmLabel="Remove"
        destructive
        isLoading={dialogs.isRemovingMember}
        onConfirm={onRemoveMember}
      />
    </>
  )
}
