'use client'

import { useState, useCallback } from 'react'
import { useDialogState, useConfirmDialog, usePickerDialog } from '@/lib/hooks'
import { removeAgendaItem } from '../../actions'
import type { AgendaItem, SongEditorData, AgendaDialogsState } from './types'

export function useAgendaDialogs(): AgendaDialogsState {
  const agendaDialog = useDialogState<AgendaItem>()
  const deleteAgendaDialog = useConfirmDialog<AgendaItem>()
  const songPicker = usePickerDialog<AgendaItem>()

  // Simple state for agenda picker
  const [agendaPickerOpen, setAgendaPickerOpen] = useState(false)

  // Song picker can operate on a specific event (for matrix view)
  const [songPickerEventId, setSongPickerEventId] = useState<string | null>(null)
  const [songPickerAgendaItemId, setSongPickerAgendaItemId] = useState<string | null>(null)

  // Leader picker state (for matrix view)
  const [leaderPickerOpen, setLeaderPickerOpen] = useState(false)
  const [leaderPickerAgendaItemId, setLeaderPickerAgendaItemId] = useState<string | null>(null)
  const [leaderPickerMinistryId, setLeaderPickerMinistryId] = useState<string | null>(null)
  const [leaderPickerCurrentLeaderId, setLeaderPickerCurrentLeaderId] = useState<string | null>(null)
  const [leaderPickerEventDate, setLeaderPickerEventDate] = useState<string | null>(null)

  // Song editor state (for matrix view)
  const [songEditorOpen, setSongEditorOpen] = useState(false)
  const [songEditorData, setSongEditorData] = useState<SongEditorData | null>(null)

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

  // Open song picker for a specific event (used by matrix view)
  const openSongPickerForEvent = useCallback((eventId: string, agendaItemId: string | null) => {
    setSongPickerEventId(eventId)
    setSongPickerAgendaItemId(agendaItemId)
    songPicker.setOpen(true)
  }, [songPicker])

  // Close song picker and reset state
  const closeSongPicker = useCallback(() => {
    songPicker.close()
    setSongPickerEventId(null)
    setSongPickerAgendaItemId(null)
  }, [songPicker])

  // Open leader picker for a specific agenda item (used by matrix view)
  const openLeaderPickerForAgendaItem = useCallback((
    agendaItemId: string,
    ministryId: string,
    currentLeaderId: string | null,
    eventDate: string
  ) => {
    setLeaderPickerAgendaItemId(agendaItemId)
    setLeaderPickerMinistryId(ministryId)
    setLeaderPickerCurrentLeaderId(currentLeaderId)
    setLeaderPickerEventDate(eventDate)
    setLeaderPickerOpen(true)
  }, [])

  // Close leader picker and reset state
  const closeLeaderPicker = useCallback(() => {
    setLeaderPickerOpen(false)
    setLeaderPickerAgendaItemId(null)
    setLeaderPickerMinistryId(null)
    setLeaderPickerCurrentLeaderId(null)
    setLeaderPickerEventDate(null)
  }, [])

  // Open song editor (used by matrix view)
  const openSongEditor = useCallback((data: SongEditorData) => {
    setSongEditorData(data)
    setSongEditorOpen(true)
  }, [])

  // Close song editor and reset state
  const closeSongEditor = useCallback(() => {
    setSongEditorOpen(false)
    setSongEditorData(null)
  }, [])

  return {
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
    closeSongPicker,

    // Leader picker
    leaderPickerOpen,
    leaderPickerAgendaItemId,
    leaderPickerMinistryId,
    leaderPickerCurrentLeaderId,
    leaderPickerEventDate,
    setLeaderPickerOpen,
    openLeaderPickerForAgendaItem,
    closeLeaderPicker,

    // Song editor
    songEditorOpen,
    songEditorData,
    setSongEditorOpen,
    openSongEditor,
    closeSongEditor,
  }
}
