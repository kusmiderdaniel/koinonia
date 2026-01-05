'use client'

import { useState, useCallback } from 'react'
import { useDialogState, useConfirmDialog, usePickerDialog } from '@/lib/hooks'
import { removeEventPosition, unassignVolunteer } from '../../actions'
import type { Position, Assignment, PositionDialogsState } from './types'

export function usePositionDialogs(): PositionDialogsState {
  const positionDialog = useDialogState<Position>()
  const deletePositionDialog = useConfirmDialog<Position>()
  const volunteerPicker = usePickerDialog<Position>()
  const unassignDialog = useConfirmDialog<{ assignment: Assignment; positionTitle: string }>()

  const [positionPickerOpen, setPositionPickerOpen] = useState(false)
  const [volunteerPickerPositionId, setVolunteerPickerPositionId] = useState<string | null>(null)

  // Delete position handler
  const handleDeletePosition = useCallback(
    async (onSuccess: () => void) => {
      if (!deletePositionDialog.item) return { error: 'No position to delete' }

      deletePositionDialog.setLoading(true)
      const result = await removeEventPosition(deletePositionDialog.item.id)

      if (!result.error) {
        deletePositionDialog.close()
        onSuccess()
      }
      deletePositionDialog.setLoading(false)
      return result
    },
    [deletePositionDialog]
  )

  // Unassign handler
  const handleUnassign = useCallback(
    async (onSuccess: () => void) => {
      if (!unassignDialog.item) return { error: 'No assignment to remove' }

      unassignDialog.setLoading(true)
      const result = await unassignVolunteer(unassignDialog.item.assignment.id)

      if (!result.error) {
        unassignDialog.close()
        onSuccess()
      }
      unassignDialog.setLoading(false)
      return result
    },
    [unassignDialog]
  )

  // Open unassign dialog with composed data
  const openUnassignDialog = useCallback((assignment: Assignment, positionTitle: string) => {
    unassignDialog.open({ assignment, positionTitle })
  }, [unassignDialog])

  // Open volunteer picker for a specific position (used by matrix view)
  const openVolunteerPickerForPosition = useCallback((positionId: string) => {
    setVolunteerPickerPositionId(positionId)
    volunteerPicker.setOpen(true)
  }, [volunteerPicker])

  // Close volunteer picker and reset state
  const closeVolunteerPicker = useCallback(() => {
    volunteerPicker.close()
    setVolunteerPickerPositionId(null)
  }, [volunteerPicker])

  return {
    // Position picker
    positionPickerOpen,
    setPositionPickerOpen,

    // Position dialog
    positionDialogOpen: positionDialog.isOpen,
    editingPosition: positionDialog.item,
    setPositionDialogOpen: positionDialog.setOpen,
    openEditPositionDialog: positionDialog.open,
    closePositionDialog: positionDialog.close,

    // Delete position dialog
    deletePositionDialogOpen: deletePositionDialog.isOpen,
    deletingPosition: deletePositionDialog.item,
    isDeletingPosition: deletePositionDialog.isLoading,
    openDeletePositionDialog: deletePositionDialog.open,
    closeDeletePositionDialog: deletePositionDialog.close,
    handleDeletePosition,

    // Volunteer picker
    volunteerPickerOpen: volunteerPicker.isOpen,
    volunteerPickerPositionId,
    assigningPosition: volunteerPicker.item,
    setVolunteerPickerOpen: volunteerPicker.setOpen,
    openVolunteerPicker: volunteerPicker.open,
    openVolunteerPickerForPosition,
    closeVolunteerPicker,

    // Unassign dialog
    unassignDialogOpen: unassignDialog.isOpen,
    unassigningAssignment: unassignDialog.item,
    isUnassigning: unassignDialog.isLoading,
    openUnassignDialog,
    closeUnassignDialog: unassignDialog.close,
    handleUnassign,
  }
}
