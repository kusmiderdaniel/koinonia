import { useCallback, useState } from 'react'
import type { QueryClient } from '@tanstack/react-query'
import type { useEventList } from './useEventList'
import type { useEventDetail } from './useEventDetail'
import type { useEventDialogs } from './event-dialogs'
import type { Event, AgendaItem } from '../types'

interface UseEventHandlersOptions {
  eventList: ReturnType<typeof useEventList>
  eventDetail: ReturnType<typeof useEventDetail>
  dialogs: ReturnType<typeof useEventDialogs>
  queryClient?: QueryClient
}

export function useEventHandlers({
  eventList,
  eventDetail,
  dialogs,
  queryClient,
}: UseEventHandlersOptions) {
  // Task dialog state
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [taskRefreshKey, setTaskRefreshKey] = useState(0)

  // Select event handler
  const handleSelectEvent = useCallback(
    async (event: Event) => {
      await eventDetail.loadEventDetail(event.id)
    },
    [eventDetail]
  )

  // Dialog success handler
  const handleDialogSuccess = useCallback(() => {
    dialogs.closeDialog()
    eventList.refreshEvents()
    if (eventDetail.selectedEvent) {
      eventDetail.loadEventDetail(eventDetail.selectedEvent.id)
    }
  }, [dialogs, eventList, eventDetail])

  // Delete event handler
  const handleDeleteEvent = useCallback(async () => {
    const result = await dialogs.handleDeleteEvent(eventDetail.selectedEvent, () => {
      if (eventDetail.selectedEvent?.id === dialogs.deletingEvent?.id) {
        eventDetail.closeEventDetail()
      }
      eventList.refreshEvents()
    })
    if (result.error) {
      eventList.setError(result.error)
    }
  }, [dialogs, eventDetail, eventList])

  // Agenda item handlers
  const handleAgendaDialogSuccess = useCallback(() => {
    dialogs.closeAgendaItemDialog()
    if (eventDetail.selectedEvent) {
      eventDetail.loadEventDetail(eventDetail.selectedEvent.id)
    }
  }, [dialogs, eventDetail])

  const handleDeleteAgendaItem = useCallback(async () => {
    const result = await dialogs.handleDeleteAgendaItem(() => {
      if (eventDetail.selectedEvent) {
        eventDetail.loadEventDetail(eventDetail.selectedEvent.id)
      }
    })
    if (result.error) {
      eventList.setError(result.error)
    }
  }, [dialogs, eventDetail, eventList])

  const handleEditAgendaItem = useCallback(
    (item: AgendaItem) => {
      dialogs.openEditAgendaItemDialog(item)
    },
    [dialogs]
  )

  const handleSongPlaceholderClick = useCallback(
    (item: AgendaItem) => {
      dialogs.openSongPicker(item)
    },
    [dialogs]
  )

  // Agenda field change handlers
  const handleAgendaKeyChange = useCallback(
    async (itemId: string, key: string | null) => {
      const result = await eventDetail.handleAgendaItemKeyChange(itemId, key)
      if (result.error) {
        eventList.setError(result.error)
      }
    },
    [eventDetail, eventList]
  )

  const handleAgendaLeaderChange = useCallback(
    async (itemId: string, leaderId: string | null) => {
      const result = await eventDetail.handleAgendaItemLeaderChange(itemId, leaderId)
      if (result.error) {
        eventList.setError(result.error)
      }
    },
    [eventDetail, eventList]
  )

  const handleAgendaDurationChange = useCallback(
    async (itemId: string, durationSeconds: number) => {
      const result = await eventDetail.handleAgendaItemDurationChange(itemId, durationSeconds)
      if (result.error) {
        eventList.setError(result.error)
      }
    },
    [eventDetail, eventList]
  )

  const handleAgendaDescriptionChange = useCallback(
    async (itemId: string, description: string | null) => {
      const result = await eventDetail.handleAgendaItemDescriptionChange(itemId, description)
      if (result.error) {
        eventList.setError(result.error)
      }
    },
    [eventDetail, eventList]
  )

  const handleAgendaArrangementChange = useCallback(
    async (itemId: string, arrangementId: string | null) => {
      const result = await eventDetail.handleAgendaItemArrangementChange(itemId, arrangementId)
      if (result.error) {
        eventList.setError(result.error)
      }
    },
    [eventDetail, eventList]
  )

  // Position handlers
  const handleDeletePosition = useCallback(async () => {
    const result = await dialogs.handleDeletePosition(() => {
      if (eventDetail.selectedEvent) {
        eventDetail.loadEventDetail(eventDetail.selectedEvent.id)
      }
    })
    if (result.error) {
      eventList.setError(result.error)
    }
  }, [dialogs, eventDetail, eventList])

  // Volunteer handlers
  const handleVolunteerPickerSuccess = useCallback(() => {
    dialogs.closeVolunteerPicker()
    // Reload the selected event if viewing event details
    if (eventDetail.selectedEvent) {
      eventDetail.loadEventDetail(eventDetail.selectedEvent.id)
    }
    // Also invalidate matrix data so it refreshes
    queryClient?.invalidateQueries({ queryKey: ['matrix-data'] })
  }, [dialogs, eventDetail, queryClient])

  const handleUnassign = useCallback(async () => {
    const result = await dialogs.handleUnassign(() => {
      if (eventDetail.selectedEvent) {
        eventDetail.loadEventDetail(eventDetail.selectedEvent.id)
      }
    })
    if (result.error) {
      eventList.setError(result.error)
    }
  }, [dialogs, eventDetail, eventList])

  // Task handlers
  const handleAddTask = useCallback(() => {
    setTaskDialogOpen(true)
  }, [])

  const handleTaskDialogClose = useCallback((success?: boolean) => {
    setTaskDialogOpen(false)
    if (success) {
      setTaskRefreshKey((prev) => prev + 1)
    }
  }, [])

  // Picker success handlers that reload event detail
  const handleAgendaPickerSuccess = useCallback(() => {
    dialogs.setAgendaPickerOpen(false)
    if (eventDetail.selectedEvent) {
      eventDetail.loadEventDetail(eventDetail.selectedEvent.id)
    }
  }, [dialogs, eventDetail])

  const handleSongPickerSuccess = useCallback(() => {
    dialogs.closeSongPicker()
    // Reload the selected event if viewing event details
    if (eventDetail.selectedEvent) {
      eventDetail.loadEventDetail(eventDetail.selectedEvent.id)
    }
    // Also invalidate matrix data so it refreshes
    queryClient?.invalidateQueries({ queryKey: ['matrix-data'] })
  }, [dialogs, eventDetail, queryClient])

  const handlePositionPickerSuccess = useCallback(() => {
    dialogs.setPositionPickerOpen(false)
    if (eventDetail.selectedEvent) {
      eventDetail.loadEventDetail(eventDetail.selectedEvent.id)
    }
  }, [dialogs, eventDetail])

  const handleSendInvitationsSuccess = useCallback(() => {
    if (eventDetail.selectedEvent) {
      eventDetail.loadEventDetail(eventDetail.selectedEvent.id)
    }
  }, [eventDetail])

  const handleLeaderPickerSuccess = useCallback(() => {
    dialogs.closeLeaderPicker()
    // Reload the selected event if viewing event details
    if (eventDetail.selectedEvent) {
      eventDetail.loadEventDetail(eventDetail.selectedEvent.id)
    }
    // Also invalidate matrix data so it refreshes
    queryClient?.invalidateQueries({ queryKey: ['matrix-data'] })
  }, [dialogs, eventDetail, queryClient])

  const handleSongEditorSuccess = useCallback(() => {
    dialogs.closeSongEditor()
    // Reload the selected event if viewing event details
    if (eventDetail.selectedEvent) {
      eventDetail.loadEventDetail(eventDetail.selectedEvent.id)
    }
    // Also invalidate matrix data so it refreshes
    queryClient?.invalidateQueries({ queryKey: ['matrix-data'] })
  }, [dialogs, eventDetail, queryClient])

  const handleSongEditorDataChange = useCallback(() => {
    // Just refresh the matrix data without closing the dialog
    queryClient?.invalidateQueries({ queryKey: ['matrix-data'] })
  }, [queryClient])

  const handleSongEditorReplaceSong = useCallback((eventId: string, agendaItemId: string) => {
    dialogs.closeSongEditor()
    // Open song picker to replace this song
    dialogs.openSongPickerForEvent(eventId, agendaItemId)
  }, [dialogs])

  return {
    // Task dialog state
    taskDialogOpen,
    taskRefreshKey,

    // Event handlers
    handleSelectEvent,
    handleDialogSuccess,
    handleDeleteEvent,

    // Agenda handlers
    handleAgendaDialogSuccess,
    handleDeleteAgendaItem,
    handleEditAgendaItem,
    handleSongPlaceholderClick,
    handleAgendaKeyChange,
    handleAgendaLeaderChange,
    handleAgendaDurationChange,
    handleAgendaDescriptionChange,
    handleAgendaArrangementChange,

    // Position handlers
    handleDeletePosition,

    // Volunteer handlers
    handleVolunteerPickerSuccess,
    handleUnassign,

    // Task handlers
    handleAddTask,
    handleTaskDialogClose,

    // Picker success handlers
    handleAgendaPickerSuccess,
    handleSongPickerSuccess,
    handlePositionPickerSuccess,
    handleSendInvitationsSuccess,
    handleLeaderPickerSuccess,
    handleSongEditorSuccess,
    handleSongEditorDataChange,
    handleSongEditorReplaceSong,
  }
}
