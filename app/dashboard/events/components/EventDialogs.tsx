'use client'

import dynamic from 'next/dynamic'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import type { Event, EventDetail, AgendaItem, Position, Assignment } from '../types'

// Dynamic imports for dialogs (only loaded when opened)
const EventDialog = dynamic(() => import('../event-dialog').then(mod => ({ default: mod.EventDialog })), { ssr: false })
const PositionDialog = dynamic(() => import('../[id]/position-dialog').then(mod => ({ default: mod.PositionDialog })), { ssr: false })
const PositionPicker = dynamic(() => import('../[id]/position-picker').then(mod => ({ default: mod.PositionPicker })), { ssr: false })
const VolunteerPicker = dynamic(() => import('../[id]/volunteer-picker').then(mod => ({ default: mod.VolunteerPicker })), { ssr: false })
const AgendaItemDialog = dynamic(() => import('../[id]/agenda-item-dialog').then(mod => ({ default: mod.AgendaItemDialog })), { ssr: false })
const AgendaItemPicker = dynamic(() => import('../[id]/agenda-item-picker').then(mod => ({ default: mod.AgendaItemPicker })), { ssr: false })
const SongPicker = dynamic(() => import('../[id]/song-picker').then(mod => ({ default: mod.SongPicker })), { ssr: false })
const TemplatePicker = dynamic(() => import('../templates/TemplatePicker').then(mod => ({ default: mod.TemplatePicker })), { ssr: false })
const SendInvitationsDialog = dynamic(() => import('../[id]/send-invitations-dialog').then(mod => ({ default: mod.SendInvitationsDialog })), { ssr: false })

interface EventDialogsProps {
  selectedEvent: EventDetail | null
  // Event dialog
  dialogOpen: boolean
  setDialogOpen: (open: boolean) => void
  editingEvent: Event | null
  onDialogSuccess: () => void
  // Delete event dialog
  deleteDialogOpen: boolean
  closeDeleteDialog: () => void
  deletingEvent: Event | null
  isDeleting: boolean
  onDeleteEvent: () => void
  // Agenda picker
  agendaPickerOpen: boolean
  setAgendaPickerOpen: (open: boolean) => void
  onAgendaPickerSuccess: () => void
  // Agenda dialog
  agendaDialogOpen: boolean
  setAgendaDialogOpen: (open: boolean) => void
  editingAgendaItem: AgendaItem | null
  onAgendaDialogSuccess: () => void
  // Song picker
  songPickerOpen: boolean
  setSongPickerOpen: (open: boolean) => void
  closeSongPicker: () => void
  replacingAgendaItem: AgendaItem | null
  onSongPickerSuccess: () => void
  // Position picker
  positionPickerOpen: boolean
  setPositionPickerOpen: (open: boolean) => void
  onPositionPickerSuccess: () => void
  // Position dialog
  positionDialogOpen: boolean
  setPositionDialogOpen: (open: boolean) => void
  editingPosition: Position | null
  onPositionDialogSuccess: () => void
  // Volunteer picker
  volunteerPickerOpen: boolean
  setVolunteerPickerOpen: (open: boolean) => void
  assigningPosition: Position | null
  onVolunteerPickerSuccess: () => void
  // Delete agenda item dialog
  deleteAgendaDialogOpen: boolean
  closeDeleteAgendaItemDialog: () => void
  deletingAgendaItem: AgendaItem | null
  isDeletingAgendaItem: boolean
  onDeleteAgendaItem: () => void
  // Delete position dialog
  deletePositionDialogOpen: boolean
  closeDeletePositionDialog: () => void
  deletingPosition: Position | null
  isDeletingPosition: boolean
  onDeletePosition: () => void
  // Unassign dialog
  unassignDialogOpen: boolean
  closeUnassignDialog: () => void
  unassigningAssignment: { assignment: Assignment; positionTitle: string } | null
  isUnassigning: boolean
  onUnassign: () => void
  // Template picker
  templatePickerOpen: boolean
  setTemplatePickerOpen: (open: boolean) => void
  onGoToTemplates: () => void
  // Send invitations dialog
  sendInvitationsDialogOpen: boolean
  setSendInvitationsDialogOpen: (open: boolean) => void
  onSendInvitationsSuccess: () => void
}

export function EventDialogs({
  selectedEvent,
  dialogOpen,
  setDialogOpen,
  editingEvent,
  onDialogSuccess,
  deleteDialogOpen,
  closeDeleteDialog,
  deletingEvent,
  isDeleting,
  onDeleteEvent,
  agendaPickerOpen,
  setAgendaPickerOpen,
  onAgendaPickerSuccess,
  agendaDialogOpen,
  setAgendaDialogOpen,
  editingAgendaItem,
  onAgendaDialogSuccess,
  songPickerOpen,
  setSongPickerOpen,
  closeSongPicker,
  replacingAgendaItem,
  onSongPickerSuccess,
  positionPickerOpen,
  setPositionPickerOpen,
  onPositionPickerSuccess,
  positionDialogOpen,
  setPositionDialogOpen,
  editingPosition,
  onPositionDialogSuccess,
  volunteerPickerOpen,
  setVolunteerPickerOpen,
  assigningPosition,
  onVolunteerPickerSuccess,
  deleteAgendaDialogOpen,
  closeDeleteAgendaItemDialog,
  deletingAgendaItem,
  isDeletingAgendaItem,
  onDeleteAgendaItem,
  deletePositionDialogOpen,
  closeDeletePositionDialog,
  deletingPosition,
  isDeletingPosition,
  onDeletePosition,
  unassignDialogOpen,
  closeUnassignDialog,
  unassigningAssignment,
  isUnassigning,
  onUnassign,
  templatePickerOpen,
  setTemplatePickerOpen,
  onGoToTemplates,
  sendInvitationsDialogOpen,
  setSendInvitationsDialogOpen,
  onSendInvitationsSuccess,
}: EventDialogsProps) {
  return (
    <>
      {/* Event Dialog */}
      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        event={editingEvent}
        onSuccess={onDialogSuccess}
      />

      {/* Delete Event Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => !open && closeDeleteDialog()}
        title="Delete Event?"
        description={<>Are you sure you want to delete <strong>{deletingEvent?.title}</strong>? This will also remove all volunteer assignments. This action cannot be undone.</>}
        confirmLabel="Delete"
        destructive
        isLoading={isDeleting}
        onConfirm={onDeleteEvent}
      />

      {/* Agenda Dialogs */}
      {selectedEvent && (
        <>
          <AgendaItemPicker
            open={agendaPickerOpen}
            onOpenChange={setAgendaPickerOpen}
            eventId={selectedEvent.id}
            onSuccess={onAgendaPickerSuccess}
          />

          <AgendaItemDialog
            open={agendaDialogOpen}
            onOpenChange={setAgendaDialogOpen}
            eventId={selectedEvent.id}
            item={editingAgendaItem}
            onSuccess={onAgendaDialogSuccess}
          />

          <SongPicker
            open={songPickerOpen}
            onOpenChange={(open) => {
              setSongPickerOpen(open)
              if (!open) closeSongPicker()
            }}
            eventId={selectedEvent.id}
            onSuccess={onSongPickerSuccess}
            replaceAgendaItemId={replacingAgendaItem?.id}
          />

          <PositionPicker
            open={positionPickerOpen}
            onOpenChange={setPositionPickerOpen}
            eventId={selectedEvent.id}
            onSuccess={onPositionPickerSuccess}
          />

          <PositionDialog
            open={positionDialogOpen}
            onOpenChange={setPositionDialogOpen}
            eventId={selectedEvent.id}
            position={editingPosition}
            onSuccess={onPositionDialogSuccess}
          />
        </>
      )}

      {/* Volunteer Picker */}
      {assigningPosition && selectedEvent && (
        <VolunteerPicker
          open={volunteerPickerOpen}
          onOpenChange={setVolunteerPickerOpen}
          position={assigningPosition}
          onSuccess={onVolunteerPickerSuccess}
        />
      )}

      {/* Delete Agenda Item Dialog */}
      <ConfirmDialog
        open={deleteAgendaDialogOpen}
        onOpenChange={(open) => !open && closeDeleteAgendaItemDialog()}
        title="Remove Agenda Item?"
        description={<>Are you sure you want to remove <strong>{deletingAgendaItem?.title}</strong> from the agenda?</>}
        confirmLabel="Remove"
        destructive
        isLoading={isDeletingAgendaItem}
        onConfirm={onDeleteAgendaItem}
      />

      {/* Delete Position Dialog */}
      <ConfirmDialog
        open={deletePositionDialogOpen}
        onOpenChange={(open) => !open && closeDeletePositionDialog()}
        title="Remove Position?"
        description={<>Are you sure you want to remove <strong>{deletingPosition?.title}</strong>? This will also remove all volunteer assignments for this position.</>}
        confirmLabel="Remove"
        destructive
        isLoading={isDeletingPosition}
        onConfirm={onDeletePosition}
      />

      {/* Unassign Dialog */}
      <ConfirmDialog
        open={unassignDialogOpen}
        onOpenChange={(open) => !open && closeUnassignDialog()}
        title="Remove Assignment?"
        description={<>Are you sure you want to remove <strong>{unassigningAssignment?.assignment.profile.first_name} {unassigningAssignment?.assignment.profile.last_name}</strong> from <strong>{unassigningAssignment?.positionTitle}</strong>?</>}
        confirmLabel="Remove"
        destructive
        isLoading={isUnassigning}
        onConfirm={onUnassign}
      />

      {/* Template Picker */}
      <TemplatePicker
        open={templatePickerOpen}
        onOpenChange={setTemplatePickerOpen}
        onGoToTemplates={onGoToTemplates}
      />

      {/* Send Invitations Dialog */}
      {selectedEvent && (
        <SendInvitationsDialog
          open={sendInvitationsDialogOpen}
          onOpenChange={setSendInvitationsDialogOpen}
          eventId={selectedEvent.id}
          onSuccess={onSendInvitationsSuccess}
        />
      )}
    </>
  )
}
