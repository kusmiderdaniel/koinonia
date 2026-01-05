'use client'

import { useState } from 'react'
import { useEventCrudDialogs } from './useEventCrudDialogs'
import { usePositionDialogs } from './usePositionDialogs'
import { useAgendaDialogs } from './useAgendaDialogs'

export function useEventDialogs() {
  // Compose domain-specific dialog hooks
  const eventCrud = useEventCrudDialogs()
  const positions = usePositionDialogs()
  const agenda = useAgendaDialogs()

  // Misc dialogs (simple boolean state)
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false)
  const [sendInvitationsDialogOpen, setSendInvitationsDialogOpen] = useState(false)

  return {
    // Event CRUD dialogs
    ...eventCrud,

    // Position dialogs
    ...positions,

    // Agenda dialogs
    ...agenda,

    // Template picker
    templatePickerOpen,
    setTemplatePickerOpen,

    // Send invitations dialog
    sendInvitationsDialogOpen,
    setSendInvitationsDialogOpen,
  }
}
