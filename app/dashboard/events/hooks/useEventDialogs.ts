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
  volunteerPickerPositionId: string | null
  assigningPosition: Position | null
  setVolunteerPickerOpen: (open: boolean) => void
  openVolunteerPicker: (position: Position) => void
  openVolunteerPickerForPosition: (positionId: string) => void
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
  songPickerEventId: string | null
  songPickerAgendaItemId: string | null
  replacingAgendaItem: AgendaItem | null
  setSongPickerOpen: (open: boolean) => void
  openSongPicker: (item: AgendaItem) => void
  openSongPickerForEvent: (eventId: string, agendaItemId: string | null) => void
  closeSongPicker: () => void

  // Template picker
  templatePickerOpen: boolean
  setTemplatePickerOpen: (open: boolean) => void

  // Send invitations dialog
  sendInvitationsDialogOpen: boolean
  setSendInvitationsDialogOpen: (open: boolean) => void

  // Leader picker
  leaderPickerOpen: boolean
  leaderPickerAgendaItemId: string | null
  leaderPickerMinistryId: string | null
  leaderPickerCurrentLeaderId: string | null
  leaderPickerEventDate: string | null
  setLeaderPickerOpen: (open: boolean) => void
  openLeaderPickerForAgendaItem: (agendaItemId: string, ministryId: string, currentLeaderId: string | null, eventDate: string) => void
  closeLeaderPicker: () => void

  // Song editor
  songEditorOpen: boolean
  songEditorData: {
    agendaItemId: string
    songTitle: string
    currentKey: string | null
    currentLeaderId: string | null
    currentLeaderName: string | null
    currentDescription: string | null
    ministryId: string | null
    eventId: string
    eventDate: string
  } | null
  setSongEditorOpen: (open: boolean) => void
  openSongEditor: (data: {
    agendaItemId: string
    songTitle: string
    currentKey: string | null
    currentLeaderId: string | null
    currentLeaderName: string | null
    currentDescription: string | null
    ministryId: string | null
    eventId: string
    eventDate: string
  }) => void
  closeSongEditor: () => void
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

  // Song picker can operate on a specific event (for matrix view)
  const [songPickerEventId, setSongPickerEventId] = useState<string | null>(null)
  const [songPickerAgendaItemId, setSongPickerAgendaItemId] = useState<string | null>(null)

  // Volunteer picker can operate on a specific position (for matrix view)
  const [volunteerPickerPositionId, setVolunteerPickerPositionId] = useState<string | null>(null)

  // Leader picker state (for matrix view)
  const [leaderPickerOpen, setLeaderPickerOpen] = useState(false)
  const [leaderPickerAgendaItemId, setLeaderPickerAgendaItemId] = useState<string | null>(null)
  const [leaderPickerMinistryId, setLeaderPickerMinistryId] = useState<string | null>(null)
  const [leaderPickerCurrentLeaderId, setLeaderPickerCurrentLeaderId] = useState<string | null>(null)
  const [leaderPickerEventDate, setLeaderPickerEventDate] = useState<string | null>(null)

  // Song editor state (for matrix view)
  const [songEditorOpen, setSongEditorOpen] = useState(false)
  const [songEditorData, setSongEditorData] = useState<{
    agendaItemId: string
    songTitle: string
    currentKey: string | null
    currentLeaderId: string | null
    currentLeaderName: string | null
    currentDescription: string | null
    ministryId: string | null
    eventId: string
    eventDate: string
  } | null>(null)

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

  // Open song picker for a specific event (used by matrix view)
  const openSongPickerForEvent = useCallback((eventId: string, agendaItemId: string | null) => {
    setSongPickerEventId(eventId)
    setSongPickerAgendaItemId(agendaItemId)
    songPicker.setOpen(true)
  }, [songPicker])

  // Custom close for song picker to clear event-specific state
  const closeSongPickerWithReset = useCallback(() => {
    songPicker.close()
    setSongPickerEventId(null)
    setSongPickerAgendaItemId(null)
  }, [songPicker])

  // Open volunteer picker for a specific position (used by matrix view)
  const openVolunteerPickerForPosition = useCallback((positionId: string) => {
    setVolunteerPickerPositionId(positionId)
    volunteerPicker.setOpen(true)
  }, [volunteerPicker])

  // Custom close for volunteer picker to clear position-specific state
  const closeVolunteerPickerWithReset = useCallback(() => {
    volunteerPicker.close()
    setVolunteerPickerPositionId(null)
  }, [volunteerPicker])

  // Open leader picker for a specific agenda item (used by matrix view)
  const openLeaderPickerForAgendaItem = useCallback((agendaItemId: string, ministryId: string, currentLeaderId: string | null, eventDate: string) => {
    setLeaderPickerAgendaItemId(agendaItemId)
    setLeaderPickerMinistryId(ministryId)
    setLeaderPickerCurrentLeaderId(currentLeaderId)
    setLeaderPickerEventDate(eventDate)
    setLeaderPickerOpen(true)
  }, [])

  // Custom close for leader picker to clear state
  const closeLeaderPickerWithReset = useCallback(() => {
    setLeaderPickerOpen(false)
    setLeaderPickerAgendaItemId(null)
    setLeaderPickerMinistryId(null)
    setLeaderPickerCurrentLeaderId(null)
    setLeaderPickerEventDate(null)
  }, [])

  // Open song editor (used by matrix view)
  const openSongEditor = useCallback((data: {
    agendaItemId: string
    songTitle: string
    currentKey: string | null
    currentLeaderId: string | null
    currentLeaderName: string | null
    currentDescription: string | null
    ministryId: string | null
    eventId: string
    eventDate: string
  }) => {
    setSongEditorData(data)
    setSongEditorOpen(true)
  }, [])

  // Close song editor and clear state
  const closeSongEditorWithReset = useCallback(() => {
    setSongEditorOpen(false)
    setSongEditorData(null)
  }, [])

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
    volunteerPickerPositionId,
    assigningPosition: volunteerPicker.item,
    setVolunteerPickerOpen: volunteerPicker.setOpen,
    openVolunteerPicker: volunteerPicker.open,
    openVolunteerPickerForPosition,
    closeVolunteerPicker: closeVolunteerPickerWithReset,

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
    songPickerEventId,
    songPickerAgendaItemId,
    replacingAgendaItem: songPicker.item,
    setSongPickerOpen: songPicker.setOpen,
    openSongPicker: songPicker.open,
    openSongPickerForEvent,
    closeSongPicker: closeSongPickerWithReset,

    // Template picker
    templatePickerOpen,
    setTemplatePickerOpen,

    // Send invitations dialog
    sendInvitationsDialogOpen,
    setSendInvitationsDialogOpen,

    // Leader picker
    leaderPickerOpen,
    leaderPickerAgendaItemId,
    leaderPickerMinistryId,
    leaderPickerCurrentLeaderId,
    leaderPickerEventDate,
    setLeaderPickerOpen,
    openLeaderPickerForAgendaItem,
    closeLeaderPicker: closeLeaderPickerWithReset,

    // Song editor
    songEditorOpen,
    songEditorData,
    setSongEditorOpen,
    openSongEditor,
    closeSongEditor: closeSongEditorWithReset,
  }
}
