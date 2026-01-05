import { useCallback } from 'react'
import type { useMinistryList } from '../hooks'
import type { useMinistryDetail } from '../hooks'
import type { useMinistryDialogs } from '../hooks'
import type { Ministry } from '../types'

interface UseMinistriesPageHandlersOptions {
  list: ReturnType<typeof useMinistryList>
  detail: ReturnType<typeof useMinistryDetail>
  dialogs: ReturnType<typeof useMinistryDialogs>
}

export function useMinistriesPageHandlers({
  list,
  detail,
  dialogs,
}: UseMinistriesPageHandlersOptions) {
  const handleEdit = useCallback(
    (ministry: Ministry, e: React.MouseEvent) => {
      e.stopPropagation()
      dialogs.openEditDialog(ministry)
    },
    [dialogs]
  )

  const handleDeleteClick = useCallback(
    (ministry: Ministry, e: React.MouseEvent) => {
      e.stopPropagation()
      dialogs.openDeleteDialog(ministry)
    },
    [dialogs]
  )

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

  const handleDialogClose = useCallback(
    async (newMinistryId?: string) => {
      dialogs.closeDialog()
      await list.refreshMinistries()
      if (newMinistryId) {
        list.setSelectedMinistryId(newMinistryId)
      }
    },
    [dialogs, list]
  )

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
    const result = await detail.deleteRole(
      dialogs.deletingRole.id,
      list.selectedMinistryId
    )

    if (result.error) {
      list.setError(result.error)
    } else {
      dialogs.closeDeleteRoleDialog()
    }

    dialogs.setIsDeletingRole(false)
  }, [dialogs, list, detail])

  const handleAddMember = useCallback(
    async (memberId: string, roleIds: string[]) => {
      if (!list.selectedMinistryId) return

      dialogs.setIsAddingMember(true)
      list.setError(null)

      const result = await detail.addMember(
        list.selectedMinistryId,
        memberId,
        roleIds
      )

      if (result.error) {
        list.setError(result.error)
      }

      dialogs.setIsAddingMember(false)
    },
    [dialogs, list, detail]
  )

  const handleUpdateMemberRoles = useCallback(
    async (memberId: string, roleIds: string[]) => {
      if (!list.selectedMinistryId) return

      list.setError(null)
      const result = await detail.updateMemberRoles(
        memberId,
        roleIds,
        list.selectedMinistryId
      )

      if (result.error) {
        list.setError(result.error)
      }
    },
    [list, detail]
  )

  const handleRemoveMember = useCallback(async () => {
    if (!dialogs.removingMember || !list.selectedMinistryId) return

    dialogs.setIsRemovingMember(true)
    const result = await detail.removeMember(
      dialogs.removingMember.id,
      list.selectedMinistryId
    )

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

  return {
    handleEdit,
    handleDeleteClick,
    handleDelete,
    handleDialogClose,
    handleSaveRole,
    handleDeleteRole,
    handleAddMember,
    handleUpdateMemberRoles,
    handleRemoveMember,
    handleClearSelection,
  }
}
