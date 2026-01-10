'use client'

import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { RoleDialog } from '../components'
import type { useMinistryDialogs } from '../hooks'

const MinistryDialog = dynamic(
  () => import('../MinistryDialog').then((mod) => ({ default: mod.MinistryDialog })),
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
  const t = useTranslations('ministries')

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
        title={t('dialog.deleteTitle')}
        description={t('dialog.deleteConfirmation', { name: dialogs.deletingMinistry?.name ?? '' })}
        confirmLabel={t('actions.delete')}
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
        title={t('dialog.deleteRoleTitle')}
        description={t('dialog.deleteRoleConfirmation', { name: dialogs.deletingRole?.name ?? '' })}
        confirmLabel={t('actions.delete')}
        destructive
        isLoading={dialogs.isDeletingRole}
        onConfirm={onDeleteRole}
      />

      {/* Remove Member Dialog */}
      <ConfirmDialog
        open={dialogs.removeMemberDialogOpen}
        onOpenChange={(open) => !open && dialogs.closeRemoveMemberDialog()}
        title={t('dialog.removeMemberTitle')}
        description={t('dialog.removeMemberConfirmation', {
          name: `${dialogs.removingMember?.profile.first_name ?? ''} ${dialogs.removingMember?.profile.last_name ?? ''}`.trim()
        })}
        confirmLabel={t('actions.remove')}
        destructive
        isLoading={dialogs.isRemovingMember}
        onConfirm={onRemoveMember}
      />
    </>
  )
}
