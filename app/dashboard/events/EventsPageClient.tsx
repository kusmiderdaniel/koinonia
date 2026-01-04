'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Plus,
  Calendar,
  List,
  CalendarDays,
  FileText,
  Grid3X3,
} from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import {
  CalendarViewSkeleton,
  TemplatesTabSkeleton,
  DetailPanelSkeleton,
} from '@/components/DynamicLoadingFallback'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
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

import { useEventList, useEventDetail, useEventDialogs, useEventHandlers } from './hooks'
import { EventsListViewWithDetail, EventDialogs } from './components'
import { TaskDialog } from '@/app/dashboard/tasks/task-dialog'
import { formatDuration } from '@/lib/utils/format'
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
  // Use custom hooks for state management
  const queryClient = useQueryClient()
  const eventList = useEventList(initialData)
  const eventDetail = useEventDetail()
  const dialogs = useEventDialogs()
  const handlers = useEventHandlers({ eventList, eventDetail, dialogs, queryClient })
  const searchParams = useSearchParams()
  const router = useRouter()
  const hasHandledUrlParam = useRef(false)

  // Toggle between upcoming and past events in list view
  const [listFilter, setListFilter] = useState<'upcoming' | 'past'>('upcoming')

  // Handle event query param from notification navigation (only once on mount)
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
  const {
    selectedEvent,
    sortedAgendaItems,
    totalDuration,
    positionsByMinistry,
    detailTab,
    setDetailTab,
  } = eventDetail
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

  return (
    <div className="h-[calc(100vh-56px)] md:h-screen flex flex-col p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Events</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) =>
              value && eventList.setViewMode(value as 'list' | 'calendar' | 'matrix' | 'templates')
            }
            className="!border !border-black dark:!border-white rounded-full p-1 gap-1"
          >
            <ToggleGroupItem
              value="list"
              aria-label="List view"
              className="!rounded-full data-[state=on]:!bg-brand data-[state=on]:!text-brand-foreground"
            >
              <List className="w-4 h-4" />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="calendar"
              aria-label="Calendar view"
              className="!rounded-full data-[state=on]:!bg-brand data-[state=on]:!text-brand-foreground"
            >
              <CalendarDays className="w-4 h-4" />
            </ToggleGroupItem>
            {canManageContent && (
              <ToggleGroupItem
                value="matrix"
                aria-label="Scheduling matrix"
                className="!rounded-full data-[state=on]:!bg-brand data-[state=on]:!text-brand-foreground"
              >
                <Grid3X3 className="w-4 h-4" />
              </ToggleGroupItem>
            )}
            {canManageContent && (
              <ToggleGroupItem
                value="templates"
                aria-label="Templates"
                className="!rounded-full data-[state=on]:!bg-brand data-[state=on]:!text-brand-foreground"
              >
                <FileText className="w-4 h-4" />
              </ToggleGroupItem>
            )}
          </ToggleGroup>
          {canManage && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="rounded-full !border !border-black dark:!border-white hidden md:flex"
                onClick={() => dialogs.setTemplatePickerOpen(true)}
              >
                <FileText className="w-4 h-4 mr-2" />
                From Template
              </Button>
              <Button
                variant="outline"
                className="rounded-full !border !border-black dark:!border-white"
                onClick={() => dialogs.openCreateDialog()}
              >
                <Plus className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Add</span>
              </Button>
            </div>
          )}
        </div>
      </div>

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
                selectedEvent ? (
                  <EventDetailPanel
                    selectedEvent={selectedEvent}
                    sortedAgendaItems={sortedAgendaItems}
                    totalDuration={totalDuration}
                    positionsByMinistry={positionsByMinistry}
                    detailTab={detailTab}
                    setDetailTab={setDetailTab}
                    canManage={canManage}
                    canManageContent={canManageContent}
                    canDelete={canDelete}
                    sensors={sensors}
                    formatDuration={formatDuration}
                    onClose={eventDetail.closeEventDetail}
                    onEdit={() => dialogs.openEditDialog(selectedEvent)}
                    onDelete={() => dialogs.openDeleteDialog(selectedEvent)}
                    onDragEnd={eventDetail.handleDragEnd}
                    onAddAgendaItem={() => dialogs.setAgendaPickerOpen(true)}
                    onAddSong={() => {
                      dialogs.closeSongPicker()
                      dialogs.setSongPickerOpen(true)
                    }}
                    onEditAgendaItem={handlers.handleEditAgendaItem}
                    onDeleteAgendaItem={(item) => dialogs.openDeleteAgendaItemDialog(item)}
                    onAgendaKeyChange={handlers.handleAgendaKeyChange}
                    onAgendaLeaderChange={handlers.handleAgendaLeaderChange}
                    onAgendaDurationChange={handlers.handleAgendaDurationChange}
                    onAgendaDescriptionChange={handlers.handleAgendaDescriptionChange}
                    onSongPlaceholderClick={handlers.handleSongPlaceholderClick}
                    onAddPosition={() => dialogs.setPositionPickerOpen(true)}
                    onEditPosition={(position) => dialogs.openEditPositionDialog(position)}
                    onDeletePosition={(position) => dialogs.openDeletePositionDialog(position)}
                    onAssignVolunteer={(position) => dialogs.openVolunteerPicker(position)}
                    onUnassign={(assignment, positionTitle) =>
                      dialogs.openUnassignDialog(assignment, positionTitle)
                    }
                    onSendInvitations={() => dialogs.setSendInvitationsDialogOpen(true)}
                    onAddTask={handlers.handleAddTask}
                    taskRefreshKey={handlers.taskRefreshKey}
                    taskMembers={initialData.churchMembers}
                    taskMinistries={initialData.ministries}
                    taskCampuses={initialData.campuses}
                    weekStartsOn={firstDayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6}
                  />
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
            detailContent={
              <EventDetailPanel
                selectedEvent={selectedEvent!}
                sortedAgendaItems={sortedAgendaItems}
                totalDuration={totalDuration}
                positionsByMinistry={positionsByMinistry}
                detailTab={detailTab}
                setDetailTab={setDetailTab}
                canManage={canManage}
                canManageContent={canManageContent}
                canDelete={canDelete}
                sensors={sensors}
                formatDuration={formatDuration}
                onClose={eventDetail.closeEventDetail}
                onEdit={() => dialogs.openEditDialog(selectedEvent!)}
                onDelete={() => dialogs.openDeleteDialog(selectedEvent!)}
                onDragEnd={eventDetail.handleDragEnd}
                onAddAgendaItem={() => dialogs.setAgendaPickerOpen(true)}
                onAddSong={() => {
                  dialogs.closeSongPicker()
                  dialogs.setSongPickerOpen(true)
                }}
                onEditAgendaItem={handlers.handleEditAgendaItem}
                onDeleteAgendaItem={(item) => dialogs.openDeleteAgendaItemDialog(item)}
                onAgendaKeyChange={handlers.handleAgendaKeyChange}
                onAgendaLeaderChange={handlers.handleAgendaLeaderChange}
                onAgendaDurationChange={handlers.handleAgendaDurationChange}
                onAgendaDescriptionChange={handlers.handleAgendaDescriptionChange}
                onSongPlaceholderClick={handlers.handleSongPlaceholderClick}
                onAddPosition={() => dialogs.setPositionPickerOpen(true)}
                onEditPosition={(position) => dialogs.openEditPositionDialog(position)}
                onDeletePosition={(position) => dialogs.openDeletePositionDialog(position)}
                onAssignVolunteer={(position) => dialogs.openVolunteerPicker(position)}
                onUnassign={(assignment, positionTitle) =>
                  dialogs.openUnassignDialog(assignment, positionTitle)
                }
                onSendInvitations={() => dialogs.setSendInvitationsDialogOpen(true)}
                onAddTask={handlers.handleAddTask}
                taskRefreshKey={handlers.taskRefreshKey}
                taskMembers={initialData.churchMembers}
                taskMinistries={initialData.ministries}
                taskCampuses={initialData.campuses}
                weekStartsOn={firstDayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6}
              />
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
  )
}
