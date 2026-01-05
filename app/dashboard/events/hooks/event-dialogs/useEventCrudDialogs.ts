'use client'

import { useCallback } from 'react'
import { useDialogState, useConfirmDialog } from '@/lib/hooks'
import { deleteEvent } from '../../actions'
import type { Event, EventDetail, EventCrudDialogsState } from './types'

export function useEventCrudDialogs(): EventCrudDialogsState {
  const eventDialog = useDialogState<Event>()
  const deleteEventDialog = useConfirmDialog<Event>()

  const handleDeleteEvent = useCallback(
    async (selectedEvent: EventDetail | null, onSuccess: () => void) => {
      if (!deleteEventDialog.item) return { error: 'No event to delete' }

      deleteEventDialog.setLoading(true)
      const result = await deleteEvent(deleteEventDialog.item.id)

      if (!result.error) {
        deleteEventDialog.close()
        onSuccess()
      }
      deleteEventDialog.setLoading(false)
      return result
    },
    [deleteEventDialog]
  )

  return {
    // Event dialog
    dialogOpen: eventDialog.isOpen,
    editingEvent: eventDialog.item,
    setDialogOpen: eventDialog.setOpen,
    openCreateDialog: () => eventDialog.open(),
    openEditDialog: eventDialog.open,
    closeDialog: eventDialog.close,

    // Delete event dialog
    deleteDialogOpen: deleteEventDialog.isOpen,
    deletingEvent: deleteEventDialog.item,
    isDeleting: deleteEventDialog.isLoading,
    openDeleteDialog: deleteEventDialog.open,
    closeDeleteDialog: deleteEventDialog.close,
    handleDeleteEvent,
  }
}
