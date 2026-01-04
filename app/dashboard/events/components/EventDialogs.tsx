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
const LeaderPicker = dynamic(() => import('../[id]/leader-picker').then(mod => ({ default: mod.LeaderPicker })), { ssr: false })
const SongEditor = dynamic(() => import('../[id]/song-editor').then(mod => ({ default: mod.SongEditor })), { ssr: false })

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
  songPickerEventId: string | null
  songPickerAgendaItemId: string | null
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
  volunteerPickerPositionId: string | null
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
  // Leader picker
  leaderPickerOpen: boolean
  leaderPickerAgendaItemId: string | null
  leaderPickerMinistryId: string | null
  leaderPickerCurrentLeaderId: string | null
  leaderPickerEventDate: string | null
  setLeaderPickerOpen: (open: boolean) => void
  closeLeaderPicker: () => void
  onLeaderPickerSuccess: () => void
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
  closeSongEditor: () => void
  onSongEditorSuccess: () => void
  onSongEditorDataChange?: () => void
  onSongEditorReplaceSong: (eventId: string, agendaItemId: string) => void
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
  songPickerEventId,
  songPickerAgendaItemId,
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
  volunteerPickerPositionId,
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
  leaderPickerOpen,
  leaderPickerAgendaItemId,
  leaderPickerMinistryId,
  leaderPickerCurrentLeaderId,
  leaderPickerEventDate,
  setLeaderPickerOpen,
  closeLeaderPicker,
  onLeaderPickerSuccess,
  songEditorOpen,
  songEditorData,
  setSongEditorOpen,
  closeSongEditor,
  onSongEditorSuccess,
  onSongEditorDataChange,
  onSongEditorReplaceSong,
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

      {/* Song Picker - can operate on selectedEvent or a specific event from matrix */}
      {(selectedEvent || songPickerEventId) && (
        <SongPicker
          open={songPickerOpen}
          onOpenChange={(open) => {
            setSongPickerOpen(open)
            if (!open) closeSongPicker()
          }}
          eventId={songPickerEventId || selectedEvent!.id}
          onSuccess={onSongPickerSuccess}
          replaceAgendaItemId={songPickerAgendaItemId || replacingAgendaItem?.id}
        />
      )}

      {/* Volunteer Picker - works with full position object or just position ID from matrix */}
      {(assigningPosition || volunteerPickerPositionId) && (
        <VolunteerPicker
          open={volunteerPickerOpen}
          onOpenChange={setVolunteerPickerOpen}
          position={assigningPosition || {
            id: volunteerPickerPositionId!,
            title: 'Position',
            quantity_needed: 1,
            role: null,
            event_assignments: [],
          }}
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

      {/* Leader Picker - for assigning leaders to agenda items */}
      {leaderPickerAgendaItemId && leaderPickerMinistryId && leaderPickerEventDate && (
        <LeaderPicker
          open={leaderPickerOpen}
          onOpenChange={(open) => {
            setLeaderPickerOpen(open)
            if (!open) closeLeaderPicker()
          }}
          agendaItemId={leaderPickerAgendaItemId}
          ministryId={leaderPickerMinistryId}
          currentLeaderId={leaderPickerCurrentLeaderId}
          eventDate={leaderPickerEventDate}
          onSuccess={onLeaderPickerSuccess}
        />
      )}

      {/* Song Editor - for editing song key and leader in matrix */}
      {songEditorData && (
        <SongEditor
          open={songEditorOpen}
          onOpenChange={(open) => {
            setSongEditorOpen(open)
            if (!open) closeSongEditor()
          }}
          agendaItemId={songEditorData.agendaItemId}
          songTitle={songEditorData.songTitle}
          currentKey={songEditorData.currentKey}
          currentLeaderId={songEditorData.currentLeaderId}
          currentLeaderName={songEditorData.currentLeaderName}
          currentDescription={songEditorData.currentDescription}
          ministryId={songEditorData.ministryId}
          eventDate={songEditorData.eventDate}
          onSuccess={onSongEditorSuccess}
          onDataChange={onSongEditorDataChange}
          onReplaceSong={() => onSongEditorReplaceSong(songEditorData.eventId, songEditorData.agendaItemId)}
        />
      )}
    </>
  )
}
