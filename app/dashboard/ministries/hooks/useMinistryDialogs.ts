'use client'

import { useState, useCallback } from 'react'
import { useDialogState, useConfirmDialog } from '@/lib/hooks'
import { deleteMinistry } from '../actions'
import type { Ministry, Role, MinistryMember } from '../types'

interface UseMinistryDialogsReturn {
  // Ministry dialog
  dialogOpen: boolean
  editingMinistry: Ministry | null
  setDialogOpen: (open: boolean) => void
  openCreateDialog: () => void
  openEditDialog: (ministry: Ministry) => void
  closeDialog: () => void

  // Delete ministry dialog
  deleteDialogOpen: boolean
  deletingMinistry: Ministry | null
  isDeleting: boolean
  openDeleteDialog: (ministry: Ministry) => void
  closeDeleteDialog: () => void
  handleDeleteMinistry: (
    selectedMinistryId: string | null,
    ministries: Ministry[],
    onSuccess: (newSelectedId: string | null) => void
  ) => Promise<{ error?: string }>

  // Role dialog
  roleDialogOpen: boolean
  editingRole: Role | null
  roleName: string
  roleDescription: string
  isSavingRole: boolean
  setRoleName: (name: string) => void
  setRoleDescription: (description: string) => void
  setIsSavingRole: (saving: boolean) => void
  openRoleDialog: (role?: Role) => void
  closeRoleDialog: () => void

  // Delete role dialog
  deleteRoleDialogOpen: boolean
  deletingRole: Role | null
  isDeletingRole: boolean
  setIsDeletingRole: (deleting: boolean) => void
  openDeleteRoleDialog: (role: Role) => void
  closeDeleteRoleDialog: () => void

  // Add member state
  isAddingMember: boolean
  setIsAddingMember: (adding: boolean) => void

  // Remove member dialog
  removeMemberDialogOpen: boolean
  removingMember: MinistryMember | null
  isRemovingMember: boolean
  setIsRemovingMember: (removing: boolean) => void
  openRemoveMemberDialog: (member: MinistryMember) => void
  closeRemoveMemberDialog: () => void
}

export function useMinistryDialogs(): UseMinistryDialogsReturn {
  // Use generic dialog hooks
  const ministryDialog = useDialogState<Ministry>()
  const deleteMinistryDialog = useConfirmDialog<Ministry>()
  const roleDialog = useDialogState<Role>()
  const deleteRoleDialog = useConfirmDialog<Role>()
  const removeMemberDialog = useConfirmDialog<MinistryMember>()

  // Role form state (needs to be separate since it includes form fields)
  const [roleName, setRoleName] = useState('')
  const [roleDescription, setRoleDescription] = useState('')
  const [isSavingRole, setIsSavingRole] = useState(false)

  // Add member state
  const [isAddingMember, setIsAddingMember] = useState(false)

  // Custom role dialog handlers (need to manage form state)
  const openRoleDialog = useCallback((role?: Role) => {
    if (role) {
      roleDialog.open(role)
      setRoleName(role.name)
      setRoleDescription(role.description || '')
    } else {
      roleDialog.open()
      setRoleName('')
      setRoleDescription('')
    }
  }, [roleDialog])

  const closeRoleDialog = useCallback(() => {
    roleDialog.close()
    setRoleName('')
    setRoleDescription('')
  }, [roleDialog])

  // Delete ministry handler
  const handleDeleteMinistry = useCallback(
    async (
      selectedMinistryId: string | null,
      ministries: Ministry[],
      onSuccess: (newSelectedId: string | null) => void
    ) => {
      if (!deleteMinistryDialog.item) return { error: 'No ministry to delete' }

      deleteMinistryDialog.setLoading(true)
      const result = await deleteMinistry(deleteMinistryDialog.item.id)

      if (!result.error) {
        // If deleted ministry was selected, select another
        if (selectedMinistryId === deleteMinistryDialog.item.id) {
          const remaining = ministries.filter((m) => m.id !== deleteMinistryDialog.item!.id)
          onSuccess(remaining.length > 0 ? remaining[0].id : null)
        } else {
          onSuccess(selectedMinistryId)
        }
        deleteMinistryDialog.close()
      }

      deleteMinistryDialog.setLoading(false)
      return result
    },
    [deleteMinistryDialog]
  )

  return {
    // Ministry dialog - map to existing API
    dialogOpen: ministryDialog.isOpen,
    editingMinistry: ministryDialog.item,
    setDialogOpen: ministryDialog.setOpen,
    openCreateDialog: () => ministryDialog.open(),
    openEditDialog: ministryDialog.open,
    closeDialog: ministryDialog.close,

    // Delete ministry dialog
    deleteDialogOpen: deleteMinistryDialog.isOpen,
    deletingMinistry: deleteMinistryDialog.item,
    isDeleting: deleteMinistryDialog.isLoading,
    openDeleteDialog: deleteMinistryDialog.open,
    closeDeleteDialog: deleteMinistryDialog.close,
    handleDeleteMinistry,

    // Role dialog
    roleDialogOpen: roleDialog.isOpen,
    editingRole: roleDialog.item,
    roleName,
    roleDescription,
    isSavingRole,
    setRoleName,
    setRoleDescription,
    setIsSavingRole,
    openRoleDialog,
    closeRoleDialog,

    // Delete role dialog
    deleteRoleDialogOpen: deleteRoleDialog.isOpen,
    deletingRole: deleteRoleDialog.item,
    isDeletingRole: deleteRoleDialog.isLoading,
    setIsDeletingRole: deleteRoleDialog.setLoading,
    openDeleteRoleDialog: deleteRoleDialog.open,
    closeDeleteRoleDialog: deleteRoleDialog.close,

    // Add member state
    isAddingMember,
    setIsAddingMember,

    // Remove member dialog
    removeMemberDialogOpen: removeMemberDialog.isOpen,
    removingMember: removeMemberDialog.item,
    isRemovingMember: removeMemberDialog.isLoading,
    setIsRemovingMember: removeMemberDialog.setLoading,
    openRemoveMemberDialog: removeMemberDialog.open,
    closeRemoveMemberDialog: removeMemberDialog.close,
  }
}
