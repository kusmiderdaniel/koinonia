import type { Event, EventDetail, Position, Assignment, AgendaItem } from '../../types'

export type { Event, EventDetail, Position, Assignment, AgendaItem }

export interface SongEditorData {
  agendaItemId: string
  songTitle: string
  currentKey: string | null
  currentLeaderId: string | null
  currentLeaderName: string | null
  currentDescription: string | null
  ministryId: string | null
  eventId: string
  eventDate: string
}

// Event CRUD dialog state
export interface EventCrudDialogsState {
  dialogOpen: boolean
  editingEvent: Event | null
  setDialogOpen: (open: boolean) => void
  openCreateDialog: () => void
  openEditDialog: (event: Event) => void
  closeDialog: () => void
  deleteDialogOpen: boolean
  deletingEvent: Event | null
  isDeleting: boolean
  openDeleteDialog: (event: Event) => void
  closeDeleteDialog: () => void
  handleDeleteEvent: (selectedEvent: EventDetail | null, onSuccess: () => void) => Promise<{ error?: string }>
}

// Position dialogs state
export interface PositionDialogsState {
  positionPickerOpen: boolean
  setPositionPickerOpen: (open: boolean) => void
  deletePositionDialogOpen: boolean
  deletingPosition: Position | null
  isDeletingPosition: boolean
  openDeletePositionDialog: (position: Position) => void
  closeDeletePositionDialog: () => void
  handleDeletePosition: (onSuccess: () => void) => Promise<{ error?: string }>
  volunteerPickerOpen: boolean
  volunteerPickerPositionId: string | null
  assigningPosition: Position | null
  setVolunteerPickerOpen: (open: boolean) => void
  openVolunteerPicker: (position: Position) => void
  openVolunteerPickerForPosition: (positionId: string) => void
  closeVolunteerPicker: () => void
  unassignDialogOpen: boolean
  unassigningAssignment: { assignment: Assignment; positionTitle: string } | null
  isUnassigning: boolean
  openUnassignDialog: (assignment: Assignment, positionTitle: string) => void
  closeUnassignDialog: () => void
  handleUnassign: (onSuccess: () => void) => Promise<{ error?: string }>
}

// Agenda dialogs state
export interface AgendaDialogsState {
  agendaPickerOpen: boolean
  setAgendaPickerOpen: (open: boolean) => void
  agendaDialogOpen: boolean
  editingAgendaItem: AgendaItem | null
  setAgendaDialogOpen: (open: boolean) => void
  openEditAgendaItemDialog: (item: AgendaItem) => void
  closeAgendaItemDialog: () => void
  deleteAgendaDialogOpen: boolean
  deletingAgendaItem: AgendaItem | null
  isDeletingAgendaItem: boolean
  openDeleteAgendaItemDialog: (item: AgendaItem) => void
  closeDeleteAgendaItemDialog: () => void
  handleDeleteAgendaItem: (onSuccess: () => void) => Promise<{ error?: string }>
  songPickerOpen: boolean
  songPickerEventId: string | null
  songPickerAgendaItemId: string | null
  replacingAgendaItem: AgendaItem | null
  setSongPickerOpen: (open: boolean) => void
  openSongPicker: (item: AgendaItem) => void
  openSongPickerForEvent: (eventId: string, agendaItemId: string | null) => void
  closeSongPicker: () => void
  leaderPickerOpen: boolean
  leaderPickerAgendaItemId: string | null
  leaderPickerMinistryId: string | null
  leaderPickerCurrentLeaderId: string | null
  leaderPickerEventDate: string | null
  setLeaderPickerOpen: (open: boolean) => void
  openLeaderPickerForAgendaItem: (agendaItemId: string, ministryId: string, currentLeaderId: string | null, eventDate: string) => void
  closeLeaderPicker: () => void
  songEditorOpen: boolean
  songEditorData: SongEditorData | null
  setSongEditorOpen: (open: boolean) => void
  openSongEditor: (data: SongEditorData) => void
  closeSongEditor: () => void
}

// Misc dialogs state
export interface MiscDialogsState {
  templatePickerOpen: boolean
  setTemplatePickerOpen: (open: boolean) => void
  sendInvitationsDialogOpen: boolean
  setSendInvitationsDialogOpen: (open: boolean) => void
}
