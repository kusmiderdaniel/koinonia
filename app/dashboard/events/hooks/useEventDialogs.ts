'use client'

import { useState, useCallback } from 'react'
import { useDialogState, useConfirmDialog, usePickerDialog } from '@/lib/hooks'
import {
  deleteEvent,
  removeEventPosition,
  unassignVolunteer,
  removeAgendaItem,
} from '../actions'
import type { Event, EventDetail, Position, Assignment, AgendaItem } from '../types'

interface UseEventDialogsReturn {
  // Event dialog
  dialogOpen: boolean
  editingEvent: Event | null
  setDialogOpen: (open: boolean) => void
  openCreateDialog: () => void
  openEditDialog: (event: Event) => void
  closeDialog: () => void

  // Delete event dialog
  deleteDialogOpen: boolean
  deletingEvent: Event | null
  isDeleting: boolean
  openDeleteDialog: (event: Event) => void
  closeDeleteDialog: () => void
  handleDeleteEvent: (
    selectedEvent: EventDetail | null,
    onSuccess: () => void
  ) => Promise<{ error?: string }>

  // Position picker
  positionPickerOpen: boolean
  setPositionPickerOpen: (open: boolean) => void

  // Position dialog
  positionDialogOpen: boolean
  editingPosition: Position | null
  setPositionDialogOpen: (open: boolean) => void
  openEditPositionDialog: (position: Position) => void
  closePositionDialog: () => void

  // Delete position dialog
  deletePositionDialogOpen: boolean
  deletingPosition: Position | null
  isDeletingPosition: boolean
  openDeletePositionDialog: (position: Position) => void
  closeDeletePositionDialog: () => void
  handleDeletePosition: (onSuccess: () => void) => Promise<{ error?: string }>

  // Volunteer picker
  volunteerPickerOpen: boolean
  assigningPosition: Position | null
  setVolunteerPickerOpen: (open: boolean) => void
  openVolunteerPicker: (position: Position) => void
  closeVolunteerPicker: () => void

  // Unassign dialog
  unassignDialogOpen: boolean
  unassigningAssignment: { assignment: Assignment; positionTitle: string } | null
  isUnassigning: boolean
  openUnassignDialog: (assignment: Assignment, positionTitle: string) => void
  closeUnassignDialog: () => void
  handleUnassign: (onSuccess: () => void) => Promise<{ error?: string }>

  // Agenda picker
  agendaPickerOpen: boolean
  setAgendaPickerOpen: (open: boolean) => void

  // Agenda item dialog
  agendaDialogOpen: boolean
  editingAgendaItem: AgendaItem | null
  setAgendaDialogOpen: (open: boolean) => void
  openEditAgendaItemDialog: (item: AgendaItem) => void
  closeAgendaItemDialog: () => void

  // Delete agenda dialog
  deleteAgendaDialogOpen: boolean
  deletingAgendaItem: AgendaItem | null
  isDeletingAgendaItem: boolean
  openDeleteAgendaItemDialog: (item: AgendaItem) => void
  closeDeleteAgendaItemDialog: () => void
  handleDeleteAgendaItem: (onSuccess: () => void) => Promise<{ error?: string }>

  // Song picker
  songPickerOpen: boolean
  replacingAgendaItem: AgendaItem | null
  setSongPickerOpen: (open: boolean) => void
  openSongPicker: (item: AgendaItem) => void
  closeSongPicker: () => void

  // Template picker
  templatePickerOpen: boolean
  setTemplatePickerOpen: (open: boolean) => void

  // Send invitations dialog
  sendInvitationsDialogOpen: boolean
  setSendInvitationsDialogOpen: (open: boolean) => void
}

export function useEventDialogs(): UseEventDialogsReturn {
  // Use generic dialog hooks
  const eventDialog = useDialogState<Event>()
  const deleteEventDialog = useConfirmDialog<Event>()
  const positionDialog = useDialogState<Position>()
  const deletePositionDialog = useConfirmDialog<Position>()
  const volunteerPicker = usePickerDialog<Position>()
  const unassignDialog = useConfirmDialog<{ assignment: Assignment; positionTitle: string }>()
  const agendaDialog = useDialogState<AgendaItem>()
  const deleteAgendaDialog = useConfirmDialog<AgendaItem>()
  const songPicker = usePickerDialog<AgendaItem>()

  // Simple boolean state for pickers without associated items
  const [positionPickerOpen, setPositionPickerOpen] = useState(false)
  const [agendaPickerOpen, setAgendaPickerOpen] = useState(false)
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false)
  const [sendInvitationsDialogOpen, setSendInvitationsDialogOpen] = useState(false)

  // Delete event handler
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

  // Delete agenda item handler
  const handleDeleteAgendaItem = useCallback(
    async (onSuccess: () => void) => {
      if (!deleteAgendaDialog.item) return { error: 'No agenda item to delete' }

      deleteAgendaDialog.setLoading(true)
      const result = await removeAgendaItem(deleteAgendaDialog.item.id)

      if (!result.error) {
        deleteAgendaDialog.close()
        onSuccess()
      }
      deleteAgendaDialog.setLoading(false)
      return result
    },
    [deleteAgendaDialog]
  )

  // Custom unassign dialog open (needs to compose assignment + title)
  const openUnassignDialog = useCallback((assignment: Assignment, positionTitle: string) => {
    unassignDialog.open({ assignment, positionTitle })
  }, [unassignDialog])

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
    assigningPosition: volunteerPicker.item,
    setVolunteerPickerOpen: volunteerPicker.setOpen,
    openVolunteerPicker: volunteerPicker.open,
    closeVolunteerPicker: volunteerPicker.close,

    // Unassign dialog
    unassignDialogOpen: unassignDialog.isOpen,
    unassigningAssignment: unassignDialog.item,
    isUnassigning: unassignDialog.isLoading,
    openUnassignDialog,
    closeUnassignDialog: unassignDialog.close,
    handleUnassign,

    // Agenda picker
    agendaPickerOpen,
    setAgendaPickerOpen,

    // Agenda item dialog
    agendaDialogOpen: agendaDialog.isOpen,
    editingAgendaItem: agendaDialog.item,
    setAgendaDialogOpen: agendaDialog.setOpen,
    openEditAgendaItemDialog: agendaDialog.open,
    closeAgendaItemDialog: agendaDialog.close,

    // Delete agenda dialog
    deleteAgendaDialogOpen: deleteAgendaDialog.isOpen,
    deletingAgendaItem: deleteAgendaDialog.item,
    isDeletingAgendaItem: deleteAgendaDialog.isLoading,
    openDeleteAgendaItemDialog: deleteAgendaDialog.open,
    closeDeleteAgendaItemDialog: deleteAgendaDialog.close,
    handleDeleteAgendaItem,

    // Song picker
    songPickerOpen: songPicker.isOpen,
    replacingAgendaItem: songPicker.item,
    setSongPickerOpen: songPicker.setOpen,
    openSongPicker: songPicker.open,
    closeSongPicker: songPicker.close,

    // Template picker
    templatePickerOpen,
    setTemplatePickerOpen,

    // Send invitations dialog
    sendInvitationsDialogOpen,
    setSendInvitationsDialogOpen,
  }
}
