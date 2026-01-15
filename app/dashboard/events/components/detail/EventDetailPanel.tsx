'use client'

import { memo, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ListOrdered, Users, CheckSquare } from 'lucide-react'
import { useIsMobile } from '@/lib/hooks'
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
  timeFormat = '24h',
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
  onAgendaArrangementChange,
  onSongPlaceholderClick,
  onSongClick,
  onMoveAgendaItemUp,
  onMoveAgendaItemDown,
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
  initialTasks,
}: EventDetailPanelProps) {
  const t = useTranslations('events')
  const isMobile = useIsMobile()

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
    <Card className="h-full flex flex-col overflow-hidden border border-black dark:border-white !gap-0 !py-0">
      <EventHeader
        selectedEvent={selectedEvent}
        canManage={canManage}
        canDelete={canDelete}
        timeFormat={timeFormat}
        onClose={onClose}
        onEdit={onEdit}
        onDelete={onDelete}
      />

      <Tabs
        value={detailTab}
        onValueChange={setDetailTab}
        className="flex-1 flex flex-col min-h-0 overflow-hidden gap-0"
      >
        <div className={`border-b ${isMobile ? 'px-2 py-1' : 'px-6 py-3'}`}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger
              value="agenda"
              className={`flex items-center gap-1.5 data-[state=active]:bg-brand data-[state=active]:text-brand-foreground ${isMobile ? 'text-xs py-1.5' : 'gap-2'}`}
            >
              <ListOrdered className={isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
              {t('agenda.title')}
            </TabsTrigger>
            <TabsTrigger
              value="positions"
              className={`flex items-center gap-1.5 data-[state=active]:bg-brand data-[state=active]:text-brand-foreground ${isMobile ? 'text-xs py-1.5' : 'gap-2'}`}
            >
              <Users className={isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
              {t('positions.title')}
            </TabsTrigger>
            <TabsTrigger
              value="tasks"
              className={`flex items-center gap-1.5 data-[state=active]:bg-brand data-[state=active]:text-brand-foreground ${isMobile ? 'text-xs py-1.5' : 'gap-2'}`}
            >
              <CheckSquare className={isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
              {t('tasks.title')}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="agenda" className="flex flex-col min-h-0 overflow-hidden mt-0">
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
            onAgendaArrangementChange={onAgendaArrangementChange}
            onSongPlaceholderClick={onSongPlaceholderClick}
            onSongClick={onSongClick}
            onMoveAgendaItemUp={onMoveAgendaItemUp}
            onMoveAgendaItemDown={onMoveAgendaItemDown}
          />
        </TabsContent>

        <TabsContent value="positions" className="flex flex-col min-h-0 overflow-hidden mt-0">
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

        <TabsContent value="tasks" className="flex flex-col min-h-0 overflow-hidden mt-0">
          <EventTasksTab
            eventId={selectedEvent.id}
            canManage={canManageContent}
            onAddTask={onAddTask}
            refreshKey={taskRefreshKey}
            members={taskMembers}
            ministries={taskMinistries}
            campuses={taskCampuses}
            weekStartsOn={weekStartsOn}
            initialTasks={initialTasks}
          />
        </TabsContent>
      </Tabs>
    </Card>
  )
})
