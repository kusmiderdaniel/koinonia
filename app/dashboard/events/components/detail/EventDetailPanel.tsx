'use client'

import { memo, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ListOrdered, Users, CheckSquare } from 'lucide-react'
import { EventHeader } from './EventHeader'
import { AgendaTab } from './AgendaTab'
import { PositionsTab } from './PositionsTab'
import { EventTasksTab } from '../EventTasksTab'
import type { EventDetailPanelProps } from './types'

export const EventDetailPanel = memo(function EventDetailPanel({
  selectedEvent,
  sortedAgendaItems,
  totalDuration,
  positionsByMinistry,
  detailTab,
  setDetailTab,
  canManage,
  canManageContent,
  canDelete,
  sensors,
  formatDuration,
  onClose,
  onEdit,
  onDelete,
  onDragEnd,
  onAddAgendaItem,
  onAddSong,
  onEditAgendaItem,
  onDeleteAgendaItem,
  onAgendaKeyChange,
  onAgendaLeaderChange,
  onAgendaDurationChange,
  onAgendaDescriptionChange,
  onSongPlaceholderClick,
  onAddPosition,
  onEditPosition,
  onDeletePosition,
  onAssignVolunteer,
  onUnassign,
  onSendInvitations,
  onAddTask,
  taskRefreshKey,
  taskMembers = [],
  taskMinistries = [],
  taskCampuses = [],
  weekStartsOn = 0,
}: EventDetailPanelProps) {
  // Track volunteers assigned to multiple positions
  const multiAssignedProfiles = useMemo(() => {
    const profileAssignments = new Map<string, string[]>()

    Object.values(positionsByMinistry).forEach(({ positions }) => {
      positions.forEach((position) => {
        position.event_assignments.forEach((assignment) => {
          const profileId = assignment.profile.id
          const existingPositions = profileAssignments.get(profileId) || []
          existingPositions.push(position.title)
          profileAssignments.set(profileId, existingPositions)
        })
      })
    })

    const multiAssigned = new Map<string, string[]>()
    profileAssignments.forEach((positions, profileId) => {
      if (positions.length > 1) {
        multiAssigned.set(profileId, positions)
      }
    })

    return multiAssigned
  }, [positionsByMinistry])

  // Count assignments without invitations sent (status is null)
  const pendingInvitationsCount = useMemo(() => {
    let count = 0
    Object.values(positionsByMinistry).forEach(({ positions }) => {
      positions.forEach((position) => {
        position.event_assignments.forEach((assignment) => {
          if (assignment.status === null) {
            count++
          }
        })
      })
    })
    return count
  }, [positionsByMinistry])

  return (
    <Card className="h-full flex flex-col overflow-hidden border border-black dark:border-zinc-700 !gap-0 !py-0">
      <EventHeader
        selectedEvent={selectedEvent}
        canManage={canManage}
        canDelete={canDelete}
        onClose={onClose}
        onEdit={onEdit}
        onDelete={onDelete}
      />

      <Tabs
        value={detailTab}
        onValueChange={setDetailTab}
        className="flex-1 flex flex-col overflow-hidden gap-0"
      >
        <div className="px-6 py-3 border-b">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger
              value="agenda"
              className="flex items-center gap-2 data-[state=active]:bg-brand data-[state=active]:text-brand-foreground"
            >
              <ListOrdered className="w-4 h-4" />
              Agenda
            </TabsTrigger>
            <TabsTrigger
              value="positions"
              className="flex items-center gap-2 data-[state=active]:bg-brand data-[state=active]:text-brand-foreground"
            >
              <Users className="w-4 h-4" />
              Positions
            </TabsTrigger>
            <TabsTrigger
              value="tasks"
              className="flex items-center gap-2 data-[state=active]:bg-brand data-[state=active]:text-brand-foreground"
            >
              <CheckSquare className="w-4 h-4" />
              Tasks
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="agenda" className="mt-0">
          <AgendaTab
            selectedEvent={selectedEvent}
            sortedAgendaItems={sortedAgendaItems}
            totalDuration={totalDuration}
            canManageContent={canManageContent}
            sensors={sensors}
            formatDuration={formatDuration}
            onDragEnd={onDragEnd}
            onAddAgendaItem={onAddAgendaItem}
            onAddSong={onAddSong}
            onEditAgendaItem={onEditAgendaItem}
            onDeleteAgendaItem={onDeleteAgendaItem}
            onAgendaKeyChange={onAgendaKeyChange}
            onAgendaLeaderChange={onAgendaLeaderChange}
            onAgendaDurationChange={onAgendaDurationChange}
            onAgendaDescriptionChange={onAgendaDescriptionChange}
            onSongPlaceholderClick={onSongPlaceholderClick}
          />
        </TabsContent>

        <TabsContent value="positions" className="mt-0">
          <PositionsTab
            positionsByMinistry={positionsByMinistry}
            canManageContent={canManageContent}
            pendingInvitationsCount={pendingInvitationsCount}
            multiAssignedProfiles={multiAssignedProfiles}
            onAddPosition={onAddPosition}
            onEditPosition={onEditPosition}
            onDeletePosition={onDeletePosition}
            onAssignVolunteer={onAssignVolunteer}
            onUnassign={onUnassign}
            onSendInvitations={onSendInvitations}
          />
        </TabsContent>

        <TabsContent value="tasks" className="flex-1 overflow-y-auto px-6 pt-4 pb-6 mt-0">
          <EventTasksTab
            eventId={selectedEvent.id}
            canManage={canManageContent}
            onAddTask={onAddTask}
            refreshKey={taskRefreshKey}
            members={taskMembers}
            ministries={taskMinistries}
            campuses={taskCampuses}
            weekStartsOn={weekStartsOn}
          />
        </TabsContent>
      </Tabs>
    </Card>
  )
})
