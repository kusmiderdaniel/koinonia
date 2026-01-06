'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar } from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import {
  CalendarViewSkeleton,
  TemplatesTabSkeleton,
  DetailPanelSkeleton,
} from '@/components/DynamicLoadingFallback'
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'

// Dynamic imports for heavy components
const CalendarView = dynamic(
  () => import('./calendar-view').then((mod) => ({ default: mod.CalendarView })),
  {
    loading: () => <CalendarViewSkeleton />,
    ssr: false,
  }
)

const TemplatesTab = dynamic(
  () => import('./templates/TemplatesTab').then((mod) => ({ default: mod.TemplatesTab })),
  {
    loading: () => <TemplatesTabSkeleton />,
    ssr: false,
  }
)

const EventDetailPanel = dynamic(
  () => import('./components/EventDetailPanel').then((mod) => ({ default: mod.EventDetailPanel })),
  {
    loading: () => <DetailPanelSkeleton />,
    ssr: false,
  }
)

const SchedulingMatrix = dynamic(
  () => import('./matrix/SchedulingMatrix').then((mod) => ({ default: mod.SchedulingMatrix })),
  {
    loading: () => <CalendarViewSkeleton />,
    ssr: false,
  }
)

import {
  useEventList,
  useEventDetail,
  useEventDialogs,
  useEventHandlers,
  useEventDetailPanelProps,
} from './hooks'
import { EventsListViewWithDetail, EventDialogs, EventsHeader } from './components'
import { TaskDialog } from '@/app/dashboard/tasks/task-dialog'
import { duplicateEvent } from './actions'
import { toast } from 'sonner'
import type { Event, Member } from './types'

export interface EventsInitialData {
  events: Event[]
  churchMembers: Member[]
  ministries: { id: string; name: string; color: string; campus_id: string | null }[]
  campuses: { id: string; name: string; color: string }[]
  role: string
  firstDayOfWeek: number
}

interface EventsPageClientProps {
  initialData: EventsInitialData
}

export function EventsPageClient({ initialData }: EventsPageClientProps) {
  const queryClient = useQueryClient()
  const eventList = useEventList(initialData)
  const eventDetail = useEventDetail()
  const dialogs = useEventDialogs()
  const handlers = useEventHandlers({ eventList, eventDetail, dialogs, queryClient })
  const searchParams = useSearchParams()
  const router = useRouter()
  const hasHandledUrlParam = useRef(false)

  const [listFilter, setListFilter] = useState<'upcoming' | 'past'>('upcoming')

  // Handle event query param from notification navigation
  useEffect(() => {
    const eventId = searchParams.get('event')
    if (eventId && !hasHandledUrlParam.current) {
      hasHandledUrlParam.current = true
      eventDetail.loadEventDetail(eventId)
      router.replace('/dashboard/events', { scroll: false })
    }
  }, [searchParams, eventDetail, router])

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Destructure commonly used values
  const { selectedEvent } = eventDetail
  const {
    events,
    error,
    searchQuery,
    viewMode,
    upcomingEvents,
    pastEvents,
    canManage,
    canManageContent,
    canDelete,
    firstDayOfWeek,
  } = eventList

  // Build EventDetailPanel props using shared hook
  const detailPanelProps = useEventDetailPanelProps({
    selectedEvent,
    sortedAgendaItems: eventDetail.sortedAgendaItems,
    totalDuration: eventDetail.totalDuration,
    positionsByMinistry: eventDetail.positionsByMinistry,
    detailTab: eventDetail.detailTab,
    setDetailTab: eventDetail.setDetailTab,
    closeEventDetail: eventDetail.closeEventDetail,
    handleDragEnd: eventDetail.handleDragEnd,
    canManage,
    canManageContent,
    canDelete,
    sensors,
    openEditDialog: dialogs.openEditDialog,
    openDeleteDialog: dialogs.openDeleteDialog,
    setAgendaPickerOpen: dialogs.setAgendaPickerOpen,
    setSongPickerOpen: dialogs.setSongPickerOpen,
    closeSongPicker: dialogs.closeSongPicker,
    openDeleteAgendaItemDialog: dialogs.openDeleteAgendaItemDialog,
    setPositionPickerOpen: dialogs.setPositionPickerOpen,
    openEditPositionDialog: dialogs.openEditPositionDialog,
    openDeletePositionDialog: dialogs.openDeletePositionDialog,
    openVolunteerPicker: dialogs.openVolunteerPicker,
    openUnassignDialog: dialogs.openUnassignDialog,
    setSendInvitationsDialogOpen: dialogs.setSendInvitationsDialogOpen,
    handleEditAgendaItem: handlers.handleEditAgendaItem,
    handleAgendaKeyChange: handlers.handleAgendaKeyChange,
    handleAgendaLeaderChange: handlers.handleAgendaLeaderChange,
    handleAgendaDurationChange: handlers.handleAgendaDurationChange,
    handleAgendaDescriptionChange: handlers.handleAgendaDescriptionChange,
    handleSongPlaceholderClick: handlers.handleSongPlaceholderClick,
    handleAddTask: handlers.handleAddTask,
    taskRefreshKey: handlers.taskRefreshKey,
    taskMembers: initialData.churchMembers,
    taskMinistries: initialData.ministries,
    taskCampuses: initialData.campuses,
    weekStartsOn: firstDayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6,
  })

  return (
    <div className="flex h-[calc(100vh-3.5rem)] md:h-screen overflow-hidden">
      <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
        <EventsHeader
        viewMode={viewMode}
        onViewModeChange={eventList.setViewMode}
        canManage={canManage}
        canManageContent={canManageContent}
        onOpenTemplatePicker={() => dialogs.setTemplatePickerOpen(true)}
        onOpenCreateDialog={() => dialogs.openCreateDialog()}
      />

      {error && (
        <Alert variant="destructive" className="mb-6 flex-shrink-0">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex-1 min-h-0">
        {viewMode === 'templates' ? (
          <ErrorBoundary>
            <TemplatesTab />
          </ErrorBoundary>
        ) : viewMode === 'matrix' ? (
          <ErrorBoundary>
            <SchedulingMatrix
              onEventSelect={(eventId) => handlers.handleSelectEvent({ id: eventId } as Event)}
              onOpenSongPicker={(eventId, agendaItemId) => {
                dialogs.openSongPickerForEvent(eventId, agendaItemId)
              }}
              onOpenVolunteerPicker={(eventId, positionId) => {
                dialogs.openVolunteerPickerForPosition(positionId)
              }}
              onOpenLeaderPicker={(agendaItemId, ministryId, currentLeaderId, eventDate) => {
                dialogs.openLeaderPickerForAgendaItem(agendaItemId, ministryId, currentLeaderId, eventDate)
              }}
              onOpenSongEditor={(data) => {
                dialogs.openSongEditor(data)
              }}
            />
          </ErrorBoundary>
        ) : viewMode === 'calendar' ? (
          <ErrorBoundary>
            <CalendarView
              events={events}
              firstDayOfWeek={firstDayOfWeek}
              onEventSelect={handlers.handleSelectEvent}
              leftPanelContent={
                detailPanelProps ? (
                  <EventDetailPanel {...detailPanelProps} />
                ) : undefined
              }
            />
          </ErrorBoundary>
        ) : (
          <EventsListViewWithDetail
            searchQuery={searchQuery}
            onSearchChange={eventList.setSearchQuery}
            listFilter={listFilter}
            onListFilterChange={setListFilter}
            upcomingEvents={upcomingEvents}
            pastEvents={pastEvents}
            selectedEvent={selectedEvent}
            onSelectEvent={handlers.handleSelectEvent}
            onClearSelection={eventDetail.closeEventDetail}
            canManage={canManage}
            onCreateEvent={() => dialogs.openCreateDialog()}
            onDuplicateEvent={async (event) => {
              const result = await duplicateEvent(event.id)
              if (result.error) {
                toast.error(result.error)
              } else {
                toast.success(`Event duplicated as "${event.title} (copy)"`)
                eventList.refreshEvents()
              }
            }}
            onEditEvent={(event) => dialogs.openEditDialog(event)}
            onDeleteEvent={(event) => dialogs.openDeleteDialog(event)}
            detailContent={
              detailPanelProps ? (
                <EventDetailPanel {...detailPanelProps} />
              ) : null
            }
            emptyDetailContent={
              <EmptyState
                icon={Calendar}
                title="Select an event to view details"
                size="lg"
              />
            }
          />
        )}
      </div>

      {/* Dialogs */}
      <EventDialogs
        selectedEvent={selectedEvent}
        dialogOpen={dialogs.dialogOpen}
        setDialogOpen={dialogs.setDialogOpen}
        editingEvent={dialogs.editingEvent}
        onDialogSuccess={handlers.handleDialogSuccess}
        deleteDialogOpen={dialogs.deleteDialogOpen}
        closeDeleteDialog={dialogs.closeDeleteDialog}
        deletingEvent={dialogs.deletingEvent}
        isDeleting={dialogs.isDeleting}
        onDeleteEvent={handlers.handleDeleteEvent}
        agendaPickerOpen={dialogs.agendaPickerOpen}
        setAgendaPickerOpen={dialogs.setAgendaPickerOpen}
        onAgendaPickerSuccess={handlers.handleAgendaPickerSuccess}
        agendaDialogOpen={dialogs.agendaDialogOpen}
        setAgendaDialogOpen={dialogs.setAgendaDialogOpen}
        editingAgendaItem={dialogs.editingAgendaItem}
        onAgendaDialogSuccess={handlers.handleAgendaDialogSuccess}
        songPickerOpen={dialogs.songPickerOpen}
        songPickerEventId={dialogs.songPickerEventId}
        songPickerAgendaItemId={dialogs.songPickerAgendaItemId}
        setSongPickerOpen={dialogs.setSongPickerOpen}
        closeSongPicker={dialogs.closeSongPicker}
        replacingAgendaItem={dialogs.replacingAgendaItem}
        onSongPickerSuccess={handlers.handleSongPickerSuccess}
        positionPickerOpen={dialogs.positionPickerOpen}
        setPositionPickerOpen={dialogs.setPositionPickerOpen}
        onPositionPickerSuccess={handlers.handlePositionPickerSuccess}
        positionDialogOpen={dialogs.positionDialogOpen}
        setPositionDialogOpen={dialogs.setPositionDialogOpen}
        editingPosition={dialogs.editingPosition}
        onPositionDialogSuccess={handlers.handlePositionDialogSuccess}
        volunteerPickerOpen={dialogs.volunteerPickerOpen}
        volunteerPickerPositionId={dialogs.volunteerPickerPositionId}
        setVolunteerPickerOpen={dialogs.setVolunteerPickerOpen}
        assigningPosition={dialogs.assigningPosition}
        onVolunteerPickerSuccess={handlers.handleVolunteerPickerSuccess}
        deleteAgendaDialogOpen={dialogs.deleteAgendaDialogOpen}
        closeDeleteAgendaItemDialog={dialogs.closeDeleteAgendaItemDialog}
        deletingAgendaItem={dialogs.deletingAgendaItem}
        isDeletingAgendaItem={dialogs.isDeletingAgendaItem}
        onDeleteAgendaItem={handlers.handleDeleteAgendaItem}
        deletePositionDialogOpen={dialogs.deletePositionDialogOpen}
        closeDeletePositionDialog={dialogs.closeDeletePositionDialog}
        deletingPosition={dialogs.deletingPosition}
        isDeletingPosition={dialogs.isDeletingPosition}
        onDeletePosition={handlers.handleDeletePosition}
        unassignDialogOpen={dialogs.unassignDialogOpen}
        closeUnassignDialog={dialogs.closeUnassignDialog}
        unassigningAssignment={dialogs.unassigningAssignment}
        isUnassigning={dialogs.isUnassigning}
        onUnassign={handlers.handleUnassign}
        templatePickerOpen={dialogs.templatePickerOpen}
        setTemplatePickerOpen={dialogs.setTemplatePickerOpen}
        onGoToTemplates={() => eventList.setViewMode('templates')}
        sendInvitationsDialogOpen={dialogs.sendInvitationsDialogOpen}
        setSendInvitationsDialogOpen={dialogs.setSendInvitationsDialogOpen}
        onSendInvitationsSuccess={handlers.handleSendInvitationsSuccess}
        leaderPickerOpen={dialogs.leaderPickerOpen}
        leaderPickerAgendaItemId={dialogs.leaderPickerAgendaItemId}
        leaderPickerMinistryId={dialogs.leaderPickerMinistryId}
        leaderPickerCurrentLeaderId={dialogs.leaderPickerCurrentLeaderId}
        leaderPickerEventDate={dialogs.leaderPickerEventDate}
        setLeaderPickerOpen={dialogs.setLeaderPickerOpen}
        closeLeaderPicker={dialogs.closeLeaderPicker}
        onLeaderPickerSuccess={handlers.handleLeaderPickerSuccess}
        songEditorOpen={dialogs.songEditorOpen}
        songEditorData={dialogs.songEditorData}
        setSongEditorOpen={dialogs.setSongEditorOpen}
        closeSongEditor={dialogs.closeSongEditor}
        onSongEditorSuccess={handlers.handleSongEditorSuccess}
        onSongEditorDataChange={handlers.handleSongEditorDataChange}
        onSongEditorReplaceSong={handlers.handleSongEditorReplaceSong}
      />

      {/* Task Dialog for adding tasks to events */}
      <TaskDialog
        open={handlers.taskDialogOpen}
        onClose={handlers.handleTaskDialogClose}
        task={null}
        ministries={initialData.ministries}
        campuses={
          selectedEvent?.campuses?.map((c) => ({
            id: c.id,
            name: c.name,
            color: c.color,
          })) || []
        }
        members={initialData.churchMembers.map((m) => ({
          id: m.id,
          first_name: m.first_name,
          last_name: m.last_name,
          email: m.email,
        }))}
        events={events.map((e) => ({
          id: e.id,
          title: e.title,
          start_time: e.start_time,
        }))}
        defaultEventId={selectedEvent?.id}
        defaultCampusId={selectedEvent?.campuses?.[0]?.id}
        weekStartsOn={firstDayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6}
      />
      </div>
    </div>
  )
}
