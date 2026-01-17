'use client'

import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import type { Event, EventDetail, AgendaItem, Position, Assignment } from '../types'

// Dynamic imports for dialogs (only loaded when opened)
const EventDialog = dynamic(() => import('../dialogs').then(mod => ({ default: mod.EventDialog })), { ssr: false })
const PositionPicker = dynamic(() => import('../[id]/PositionPicker').then(mod => ({ default: mod.PositionPicker })), { ssr: false })
const VolunteerPicker = dynamic(() => import('../[id]/VolunteerPicker').then(mod => ({ default: mod.VolunteerPicker })), { ssr: false })
const AgendaItemDialog = dynamic(() => import('../[id]/agenda-item-dialog').then(mod => ({ default: mod.AgendaItemDialog })), { ssr: false })
const AgendaItemPicker = dynamic(() => import('../[id]/agenda-item-picker').then(mod => ({ default: mod.AgendaItemPicker })), { ssr: false })
const SongPicker = dynamic(() => import('../[id]/SongPicker').then(mod => ({ default: mod.SongPicker })), { ssr: false })
const TemplatePicker = dynamic(() => import('../templates/TemplatePicker').then(mod => ({ default: mod.TemplatePicker })), { ssr: false })
const SendInvitationsDialog = dynamic(() => import('../[id]/SendInvitationsDialog').then(mod => ({ default: mod.SendInvitationsDialog })), { ssr: false })
const LeaderPicker = dynamic(() => import('../[id]/LeaderPicker').then(mod => ({ default: mod.LeaderPicker })), { ssr: false })
const SongEditor = dynamic(() => import('../[id]/song-editor').then(mod => ({ default: mod.SongEditor })), { ssr: false })

interface EventDialogsProps {
  selectedEvent: EventDetail | null
  // Time format preference
  timeFormat?: '12h' | '24h'
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
  timeFormat = '24h',
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
  const t = useTranslations('events.dialog')
  const tCommon = useTranslations('common.buttons')

  return (
    <>
      {/* Event Dialog */}
      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        event={editingEvent}
        onSuccess={onDialogSuccess}
        timeFormat={timeFormat}
      />

      {/* Delete Event Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => !open && closeDeleteDialog()}
        title={t('deleteTitle')}
        description={t('deleteConfirmation', { name: deletingEvent?.title ?? '' })}
        confirmLabel={tCommon('delete')}
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
            existingPositions={selectedEvent.event_positions?.map((p) => ({
              ministry_id: p.ministry?.id || '',
              role_id: p.role?.id || null,
            })) || []}
            onSuccess={onPositionPickerSuccess}
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
        title={t('removeAgendaItemTitle')}
        description={t('removeAgendaItemConfirmation', { name: deletingAgendaItem?.title ?? '' })}
        confirmLabel={tCommon('remove')}
        destructive
        isLoading={isDeletingAgendaItem}
        onConfirm={onDeleteAgendaItem}
      />

      {/* Delete Position Dialog */}
      <ConfirmDialog
        open={deletePositionDialogOpen}
        onOpenChange={(open) => !open && closeDeletePositionDialog()}
        title={t('removePositionTitle')}
        description={t('removePositionConfirmation', { name: deletingPosition?.title ?? '' })}
        confirmLabel={tCommon('remove')}
        destructive
        isLoading={isDeletingPosition}
        onConfirm={onDeletePosition}
      />

      {/* Unassign Dialog */}
      <ConfirmDialog
        open={unassignDialogOpen}
        onOpenChange={(open) => !open && closeUnassignDialog()}
        title={t('removeAssignmentTitle')}
        description={t('removeAssignmentConfirmation', {
          person: `${unassigningAssignment?.assignment.profile.first_name ?? ''} ${unassigningAssignment?.assignment.profile.last_name ?? ''}`.trim(),
          position: unassigningAssignment?.positionTitle ?? ''
        })}
        confirmLabel={tCommon('remove')}
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
