'use client'

import { useCallback, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Plus,
  Calendar,
  List,
  CalendarDays,
  FileText,
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
const CalendarView = dynamic(() => import('./calendar-view').then(mod => ({ default: mod.CalendarView })), {
  loading: () => <CalendarViewSkeleton />,
  ssr: false,
})

const TemplatesTab = dynamic(() => import('./templates/TemplatesTab').then(mod => ({ default: mod.TemplatesTab })), {
  loading: () => <TemplatesTabSkeleton />,
  ssr: false,
})

const EventDetailPanel = dynamic(() => import('./components/EventDetailPanel').then(mod => ({ default: mod.EventDetailPanel })), {
  loading: () => <DetailPanelSkeleton />,
  ssr: false,
})

import { useEventList, useEventDetail, useEventDialogs } from './hooks'
import { EventsListViewWithDetail, EventDialogs } from './components'
import { formatDuration } from '@/lib/utils/format'
import type { Event, AgendaItem, Member } from './types'

export interface EventsInitialData {
  events: Event[]
  churchMembers: Member[]
  role: string
  firstDayOfWeek: number
}

interface EventsPageClientProps {
  initialData: EventsInitialData
}

export function EventsPageClient({ initialData }: EventsPageClientProps) {
  // Use custom hooks for state management - pass initial data
  const eventList = useEventList(initialData)
  const eventDetail = useEventDetail()
  const dialogs = useEventDialogs()
  const searchParams = useSearchParams()

  // Toggle between upcoming and past events in list view
  const [listFilter, setListFilter] = useState<'upcoming' | 'past'>('upcoming')

  // Handle event query param from notification navigation
  useEffect(() => {
    const eventId = searchParams.get('event')
    if (eventId && !eventDetail.selectedEvent) {
      eventDetail.loadEventDetail(eventId)
    }
  }, [searchParams, eventDetail])

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Event handlers that bridge hooks - memoized to prevent unnecessary re-renders
  const handleSelectEvent = useCallback(async (event: Event) => {
    await eventDetail.loadEventDetail(event.id)
  }, [eventDetail])

  const handleDialogSuccess = useCallback(() => {
    dialogs.closeDialog()
    eventList.refreshEvents()
    if (eventDetail.selectedEvent) {
      eventDetail.loadEventDetail(eventDetail.selectedEvent.id)
    }
  }, [dialogs, eventList, eventDetail])

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

  const handlePositionDialogSuccess = useCallback(() => {
    dialogs.closePositionDialog()
    if (eventDetail.selectedEvent) {
      eventDetail.loadEventDetail(eventDetail.selectedEvent.id)
    }
  }, [dialogs, eventDetail])

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

  const handleVolunteerPickerSuccess = useCallback(() => {
    dialogs.closeVolunteerPicker()
    if (eventDetail.selectedEvent) {
      eventDetail.loadEventDetail(eventDetail.selectedEvent.id)
    }
  }, [dialogs, eventDetail])

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

  const handleSongPlaceholderClick = useCallback((item: AgendaItem) => {
    dialogs.openSongPicker(item)
  }, [dialogs])

  const handleEditAgendaItem = useCallback((item: AgendaItem) => {
    dialogs.openEditAgendaItemDialog(item)
  }, [dialogs])

  const handleAgendaKeyChange = useCallback(async (itemId: string, key: string | null) => {
    const result = await eventDetail.handleAgendaItemKeyChange(itemId, key)
    if (result.error) {
      eventList.setError(result.error)
    }
  }, [eventDetail, eventList])

  const handleAgendaLeaderChange = useCallback(async (itemId: string, leaderId: string | null) => {
    const result = await eventDetail.handleAgendaItemLeaderChange(itemId, leaderId)
    if (result.error) {
      eventList.setError(result.error)
    }
  }, [eventDetail, eventList])

  const handleAgendaDurationChange = useCallback(async (itemId: string, durationSeconds: number) => {
    const result = await eventDetail.handleAgendaItemDurationChange(itemId, durationSeconds)
    if (result.error) {
      eventList.setError(result.error)
    }
  }, [eventDetail, eventList])

  const handleAgendaDescriptionChange = useCallback(async (itemId: string, description: string | null) => {
    const result = await eventDetail.handleAgendaItemDescriptionChange(itemId, description)
    if (result.error) {
      eventList.setError(result.error)
    }
  }, [eventDetail, eventList])

  // Destructure commonly used values
  const { selectedEvent, sortedAgendaItems, totalDuration, positionsByMinistry, detailTab, setDetailTab } = eventDetail
  const { events, error, searchQuery, viewMode, upcomingEvents, pastEvents, canManage, canDelete, firstDayOfWeek } = eventList

  return (
    <div className="h-full p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Events</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => value && eventList.setViewMode(value as 'list' | 'calendar' | 'templates')}
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
            <ToggleGroupItem
              value="templates"
              aria-label="Templates"
              className="!rounded-full data-[state=on]:!bg-brand data-[state=on]:!text-brand-foreground"
            >
              <FileText className="w-4 h-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          {canManage && (
            <div className="flex items-center gap-2">
              <Button variant="outline" className="rounded-full !border !border-black dark:!border-white hidden md:flex" onClick={() => dialogs.setTemplatePickerOpen(true)}>
                <FileText className="w-4 h-4 mr-2" />
                From Template
              </Button>
              <Button variant="outline" className="rounded-full !border !border-black dark:!border-white" onClick={() => dialogs.openCreateDialog()}>
                <Plus className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Add</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {viewMode === 'templates' ? (
        <ErrorBoundary>
          <TemplatesTab />
        </ErrorBoundary>
      ) : viewMode === 'calendar' ? (
        <ErrorBoundary>
        <CalendarView
          events={events}
          firstDayOfWeek={firstDayOfWeek}
          onEventSelect={handleSelectEvent}
          leftPanelContent={selectedEvent ? (
            <EventDetailPanel
              selectedEvent={selectedEvent}
              sortedAgendaItems={sortedAgendaItems}
              totalDuration={totalDuration}
              positionsByMinistry={positionsByMinistry}
              detailTab={detailTab}
              setDetailTab={setDetailTab}
              canManage={canManage}
              canDelete={canDelete}
              sensors={sensors}
              formatDuration={formatDuration}
              onClose={eventDetail.closeEventDetail}
              onEdit={() => dialogs.openEditDialog(selectedEvent)}
              onDelete={() => dialogs.openDeleteDialog(selectedEvent)}
              onDragEnd={eventDetail.handleDragEnd}
              onAddAgendaItem={() => dialogs.setAgendaPickerOpen(true)}
              onAddSong={() => { dialogs.closeSongPicker(); dialogs.setSongPickerOpen(true) }}
              onEditAgendaItem={handleEditAgendaItem}
              onDeleteAgendaItem={(item) => dialogs.openDeleteAgendaItemDialog(item)}
              onAgendaKeyChange={handleAgendaKeyChange}
              onAgendaLeaderChange={handleAgendaLeaderChange}
              onAgendaDurationChange={handleAgendaDurationChange}
              onAgendaDescriptionChange={handleAgendaDescriptionChange}
              onSongPlaceholderClick={handleSongPlaceholderClick}
              onAddPosition={() => dialogs.setPositionPickerOpen(true)}
              onEditPosition={(position) => dialogs.openEditPositionDialog(position)}
              onDeletePosition={(position) => dialogs.openDeletePositionDialog(position)}
              onAssignVolunteer={(position) => dialogs.openVolunteerPicker(position)}
              onUnassign={(assignment, positionTitle) => dialogs.openUnassignDialog(assignment, positionTitle)}
              onSendInvitations={() => dialogs.setSendInvitationsDialogOpen(true)}
            />
          ) : undefined}
        />
        </ErrorBoundary>
      ) : (
        // List view
        <EventsListViewWithDetail
          searchQuery={searchQuery}
          onSearchChange={eventList.setSearchQuery}
          listFilter={listFilter}
          onListFilterChange={setListFilter}
          upcomingEvents={upcomingEvents}
          pastEvents={pastEvents}
          selectedEvent={selectedEvent}
          onSelectEvent={handleSelectEvent}
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
              canDelete={canDelete}
              sensors={sensors}
              formatDuration={formatDuration}
              onClose={eventDetail.closeEventDetail}
              onEdit={() => dialogs.openEditDialog(selectedEvent!)}
              onDelete={() => dialogs.openDeleteDialog(selectedEvent!)}
              onDragEnd={eventDetail.handleDragEnd}
              onAddAgendaItem={() => dialogs.setAgendaPickerOpen(true)}
              onAddSong={() => { dialogs.closeSongPicker(); dialogs.setSongPickerOpen(true) }}
              onEditAgendaItem={handleEditAgendaItem}
              onDeleteAgendaItem={(item) => dialogs.openDeleteAgendaItemDialog(item)}
              onAgendaKeyChange={handleAgendaKeyChange}
              onAgendaLeaderChange={handleAgendaLeaderChange}
              onAgendaDurationChange={handleAgendaDurationChange}
              onAgendaDescriptionChange={handleAgendaDescriptionChange}
              onSongPlaceholderClick={handleSongPlaceholderClick}
              onAddPosition={() => dialogs.setPositionPickerOpen(true)}
              onEditPosition={(position) => dialogs.openEditPositionDialog(position)}
              onDeletePosition={(position) => dialogs.openDeletePositionDialog(position)}
              onAssignVolunteer={(position) => dialogs.openVolunteerPicker(position)}
              onUnassign={(assignment, positionTitle) => dialogs.openUnassignDialog(assignment, positionTitle)}
              onSendInvitations={() => dialogs.setSendInvitationsDialogOpen(true)}
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

      {/* Dialogs */}
      <EventDialogs
        selectedEvent={selectedEvent}
        dialogOpen={dialogs.dialogOpen}
        setDialogOpen={dialogs.setDialogOpen}
        editingEvent={dialogs.editingEvent}
        onDialogSuccess={handleDialogSuccess}
        deleteDialogOpen={dialogs.deleteDialogOpen}
        closeDeleteDialog={dialogs.closeDeleteDialog}
        deletingEvent={dialogs.deletingEvent}
        isDeleting={dialogs.isDeleting}
        onDeleteEvent={handleDeleteEvent}
        agendaPickerOpen={dialogs.agendaPickerOpen}
        setAgendaPickerOpen={dialogs.setAgendaPickerOpen}
        onAgendaPickerSuccess={() => {
          dialogs.setAgendaPickerOpen(false)
          if (selectedEvent) eventDetail.loadEventDetail(selectedEvent.id)
        }}
        agendaDialogOpen={dialogs.agendaDialogOpen}
        setAgendaDialogOpen={dialogs.setAgendaDialogOpen}
        editingAgendaItem={dialogs.editingAgendaItem}
        onAgendaDialogSuccess={handleAgendaDialogSuccess}
        songPickerOpen={dialogs.songPickerOpen}
        setSongPickerOpen={dialogs.setSongPickerOpen}
        closeSongPicker={dialogs.closeSongPicker}
        replacingAgendaItem={dialogs.replacingAgendaItem}
        onSongPickerSuccess={() => {
          dialogs.closeSongPicker()
          if (selectedEvent) eventDetail.loadEventDetail(selectedEvent.id)
        }}
        positionPickerOpen={dialogs.positionPickerOpen}
        setPositionPickerOpen={dialogs.setPositionPickerOpen}
        onPositionPickerSuccess={() => {
          dialogs.setPositionPickerOpen(false)
          if (selectedEvent) eventDetail.loadEventDetail(selectedEvent.id)
        }}
        positionDialogOpen={dialogs.positionDialogOpen}
        setPositionDialogOpen={dialogs.setPositionDialogOpen}
        editingPosition={dialogs.editingPosition}
        onPositionDialogSuccess={handlePositionDialogSuccess}
        volunteerPickerOpen={dialogs.volunteerPickerOpen}
        setVolunteerPickerOpen={dialogs.setVolunteerPickerOpen}
        assigningPosition={dialogs.assigningPosition}
        onVolunteerPickerSuccess={handleVolunteerPickerSuccess}
        deleteAgendaDialogOpen={dialogs.deleteAgendaDialogOpen}
        closeDeleteAgendaItemDialog={dialogs.closeDeleteAgendaItemDialog}
        deletingAgendaItem={dialogs.deletingAgendaItem}
        isDeletingAgendaItem={dialogs.isDeletingAgendaItem}
        onDeleteAgendaItem={handleDeleteAgendaItem}
        deletePositionDialogOpen={dialogs.deletePositionDialogOpen}
        closeDeletePositionDialog={dialogs.closeDeletePositionDialog}
        deletingPosition={dialogs.deletingPosition}
        isDeletingPosition={dialogs.isDeletingPosition}
        onDeletePosition={handleDeletePosition}
        unassignDialogOpen={dialogs.unassignDialogOpen}
        closeUnassignDialog={dialogs.closeUnassignDialog}
        unassigningAssignment={dialogs.unassigningAssignment}
        isUnassigning={dialogs.isUnassigning}
        onUnassign={handleUnassign}
        templatePickerOpen={dialogs.templatePickerOpen}
        setTemplatePickerOpen={dialogs.setTemplatePickerOpen}
        onGoToTemplates={() => eventList.setViewMode('templates')}
        sendInvitationsDialogOpen={dialogs.sendInvitationsDialogOpen}
        setSendInvitationsDialogOpen={dialogs.setSendInvitationsDialogOpen}
        onSendInvitationsSuccess={() => {
          if (selectedEvent) eventDetail.loadEventDetail(selectedEvent.id)
        }}
      />
    </div>
  )
}
