'use client'

import { memo, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Pencil,
  Trash2,
  ListOrdered,
  UserPlus,
  User,
  Music,
  X,
  Plus,
  AlertTriangle,
  Send,
  Check,
  XCircle,
  Clock as ClockIcon,
} from 'lucide-react'
import {
  DndContext,
  closestCenter,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'

import { SortableAgendaItem } from './SortableAgendaItem'
import { EventTypeBadge } from '@/components/EventTypeBadge'
import { VisibilityBadge } from '@/components/VisibilityBadge'
import { formatEventDateTime } from '@/lib/utils/format'
import type { EventDetail, AgendaItem, Position, Assignment } from '../types'

interface EventDetailPanelProps {
  selectedEvent: EventDetail
  sortedAgendaItems: AgendaItem[]
  totalDuration: number
  positionsByMinistry: Record<string, { ministry: Position['ministry']; positions: Position[] }>
  detailTab: string
  setDetailTab: (tab: string) => void
  canManage: boolean // Can edit/delete event (admin/owner only)
  canManageContent: boolean // Can manage agenda, songs, positions (leader+)
  canDelete: boolean
  sensors: ReturnType<typeof useSensors>
  formatDuration: (seconds: number) => string
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onDragEnd: (event: DragEndEvent) => Promise<void>
  onAddAgendaItem: () => void
  onAddSong: () => void
  onEditAgendaItem: (item: AgendaItem) => void
  onDeleteAgendaItem: (item: AgendaItem) => void
  onAgendaKeyChange: (itemId: string, key: string | null) => Promise<void>
  onAgendaLeaderChange: (itemId: string, leaderId: string | null) => Promise<void>
  onAgendaDurationChange: (itemId: string, durationSeconds: number) => Promise<void>
  onAgendaDescriptionChange: (itemId: string, description: string | null) => Promise<void>
  onSongPlaceholderClick: (item: AgendaItem) => void
  onAddPosition: () => void
  onEditPosition: (position: Position) => void
  onDeletePosition: (position: Position) => void
  onAssignVolunteer: (position: Position) => void
  onUnassign: (assignment: Assignment, positionTitle: string) => void
  onSendInvitations: () => void
}

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
}: EventDetailPanelProps) {
  // Track volunteers assigned to multiple positions
  const multiAssignedProfiles = useMemo(() => {
    const profileAssignments = new Map<string, string[]>()

    // Collect all assignments across all positions
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

    // Filter to only profiles with multiple assignments
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

  // Helper function for status-based styling
  const getStatusStyles = (status: Assignment['status']) => {
    switch (status) {
      case 'accepted':
        return {
          bg: 'bg-green-50 dark:bg-green-950',
          border: 'border-green-200 dark:border-green-800',
          iconBg: 'bg-green-100 dark:bg-green-900',
          iconColor: 'text-green-600 dark:text-green-400',
          badgeClass: 'border-green-500 text-green-600 dark:text-green-400',
        }
      case 'declined':
        return {
          bg: 'bg-red-50 dark:bg-red-950',
          border: 'border-red-200 dark:border-red-800',
          iconBg: 'bg-red-100 dark:bg-red-900',
          iconColor: 'text-red-600 dark:text-red-400',
          badgeClass: 'border-red-500 text-red-600 dark:text-red-400',
        }
      case 'invited':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/30',
          border: 'border-amber-200 dark:border-amber-800',
          iconBg: 'bg-amber-100 dark:bg-amber-900',
          iconColor: 'text-amber-600 dark:text-amber-400',
          badgeClass: 'border-amber-500 text-amber-600 dark:text-amber-400',
        }
      case 'expired':
        return {
          bg: 'bg-gray-50 dark:bg-gray-950',
          border: 'border-gray-200 dark:border-gray-800',
          iconBg: 'bg-gray-100 dark:bg-gray-900',
          iconColor: 'text-gray-500 dark:text-gray-400',
          badgeClass: 'border-gray-400 text-gray-500 dark:text-gray-400',
        }
      default:
        return {
          bg: 'bg-blue-50 dark:bg-blue-950/30',
          border: 'border-blue-200 dark:border-blue-800',
          iconBg: 'bg-blue-100 dark:bg-blue-900',
          iconColor: 'text-blue-600 dark:text-blue-400',
          badgeClass: '',
        }
    }
  }

  return (
    <Card className="h-full flex flex-col overflow-hidden border border-black dark:border-zinc-700">
      {/* Event Header */}
      <div className="p-6 border-b">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <EventTypeBadge type={selectedEvent.event_type} className="py-1" />
              {selectedEvent.visibility && selectedEvent.visibility !== 'members' && (
                <VisibilityBadge visibility={selectedEvent.visibility} className="py-1" />
              )}
            </div>
            <h2 className="text-xl font-bold">{selectedEvent.title}</h2>
            {selectedEvent.description && (
              <p className="text-muted-foreground mt-1">{selectedEvent.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {canManage && (
              <>
                <Button variant="outline" size="icon" className="rounded-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950" onClick={onEdit}>
                  <Pencil className="w-4 h-4" />
                </Button>
                {canDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full text-red-600 hover:text-red-700"
                    onClick={onDelete}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </>
            )}
            <Button variant="ghost" size="icon" className="rounded-full" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Event Info */}
        <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {formatEventDateTime(selectedEvent.start_time, selectedEvent.end_time, selectedEvent.is_all_day).date}
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {formatEventDateTime(selectedEvent.start_time, selectedEvent.end_time, selectedEvent.is_all_day).time}
          </div>
          {selectedEvent.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {selectedEvent.location.name}
            </div>
          )}
          {selectedEvent.responsible_person && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              {selectedEvent.responsible_person.first_name} {selectedEvent.responsible_person.last_name}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={detailTab} onValueChange={setDetailTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 pt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="agenda" className="flex items-center gap-2 data-[state=active]:bg-brand data-[state=active]:text-brand-foreground">
              <ListOrdered className="w-4 h-4" />
              Agenda
            </TabsTrigger>
            <TabsTrigger value="positions" className="flex items-center gap-2 data-[state=active]:bg-brand data-[state=active]:text-brand-foreground">
              <Users className="w-4 h-4" />
              Positions
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="agenda" className="flex-1 overflow-y-auto p-6 pt-4 mt-0">
          <div className="flex items-center justify-between mb-4">
            {sortedAgendaItems.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {sortedAgendaItems.length} items • Total: {formatDuration(totalDuration)}
              </p>
            )}
            {canManageContent && (
              <div className="flex gap-2 ml-auto">
                <Button variant="outline-pill" size="sm" className="!border !border-gray-300 dark:!border-zinc-600" onClick={onAddAgendaItem}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="!rounded-full !border !border-purple-400 text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:!border-purple-600 dark:hover:bg-purple-950"
                  onClick={onAddSong}
                >
                  <Music className="w-4 h-4 mr-1" />
                  Add Song
                </Button>
              </div>
            )}
          </div>

          {sortedAgendaItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ListOrdered className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No agenda items yet</p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={sortedAgendaItems.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {sortedAgendaItems.map((item, index) => (
                    <SortableAgendaItem
                      key={item.id}
                      item={item}
                      index={index}
                      canManage={canManageContent}
                      formatDuration={formatDuration}
                      onEdit={onEditAgendaItem}
                      onDelete={onDeleteAgendaItem}
                      onKeyChange={onAgendaKeyChange}
                      onLeaderChange={onAgendaLeaderChange}
                      onDurationChange={onAgendaDurationChange}
                      onDescriptionChange={onAgendaDescriptionChange}
                      onSongPlaceholderClick={onSongPlaceholderClick}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </TabsContent>

        <TabsContent value="positions" className="flex-1 overflow-y-auto p-6 pt-4 mt-0">
          <div className="flex items-center justify-end mb-4">
            {canManageContent && (
              <div className="flex gap-2">
                {pendingInvitationsCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="!rounded-full !border !border-brand text-brand hover:bg-brand/10"
                    onClick={onSendInvitations}
                  >
                    <Send className="w-4 h-4 mr-1" />
                    Send Invitations ({pendingInvitationsCount})
                  </Button>
                )}
                <Button variant="outline-pill" size="sm" className="!border !border-gray-300 dark:!border-zinc-600" onClick={onAddPosition}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Position
                </Button>
              </div>
            )}
          </div>

          {Object.keys(positionsByMinistry).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No positions added yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.values(positionsByMinistry).map(({ ministry, positions }) => (
                <div key={ministry.id}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ministry.color }} />
                    <h3 className="font-medium text-sm">{ministry.name}</h3>
                  </div>
                  <div className="space-y-2 pl-5">
                    {positions.map((position) => {
                      const hasAssignment = position.event_assignments.length > 0
                      const assignment = hasAssignment ? position.event_assignments[0] : null

                      return (
                        <div key={position.id} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{position.title}</span>
                              {position.role && position.role.name !== position.title && (
                                <Badge variant="outline" className="text-xs rounded-full">
                                  {position.role.name}
                                </Badge>
                              )}
                            </div>
                            {canManageContent && (
                              <div className="flex gap-1">
                                {!hasAssignment && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-full h-7 text-xs !border !border-black dark:!border-zinc-700"
                                    onClick={() => onAssignVolunteer(position)}
                                  >
                                    <UserPlus className="w-3 h-3 mr-1" />
                                    Assign
                                  </Button>
                                )}
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEditPosition(position)}>
                                  <Pencil className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => onDeletePosition(position)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </div>

                          {assignment && (
                            (() => {
                              const isMultiAssigned = multiAssignedProfiles.has(assignment.profile.id)
                              const otherPositions = isMultiAssigned
                                ? multiAssignedProfiles.get(assignment.profile.id)?.filter(p => p !== position.title) || []
                                : []
                              const statusStyles = getStatusStyles(assignment.status)

                              // Status badge helper
                              const getStatusBadge = () => {
                                switch (assignment.status) {
                                  case 'accepted':
                                    return (
                                      <Badge variant="outline" className={`text-xs ${statusStyles.badgeClass}`}>
                                        <Check className="w-3 h-3 mr-1" />
                                        Accepted
                                      </Badge>
                                    )
                                  case 'declined':
                                    return (
                                      <Badge variant="outline" className={`text-xs ${statusStyles.badgeClass}`}>
                                        <XCircle className="w-3 h-3 mr-1" />
                                        Declined
                                      </Badge>
                                    )
                                  case 'invited':
                                    return (
                                      <Badge variant="outline" className={`text-xs ${statusStyles.badgeClass}`}>
                                        <Send className="w-3 h-3 mr-1" />
                                        Invited
                                      </Badge>
                                    )
                                  case 'expired':
                                    return (
                                      <Badge variant="outline" className={`text-xs ${statusStyles.badgeClass}`}>
                                        <ClockIcon className="w-3 h-3 mr-1" />
                                        Expired
                                      </Badge>
                                    )
                                  default:
                                    return null
                                }
                              }

                              return (
                                <div className={`mt-2 flex items-center justify-between py-2 px-3 rounded-lg ${statusStyles.bg} border ${statusStyles.border}`}>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${statusStyles.iconBg}`}>
                                        <User className={`w-3 h-3 ${statusStyles.iconColor}`} />
                                      </div>
                                      <span className="text-sm font-medium">
                                        {assignment.profile.first_name} {assignment.profile.last_name}
                                      </span>
                                      {getStatusBadge()}
                                      {isMultiAssigned && (
                                        <Badge variant="outline" className="text-xs border-amber-500 text-amber-600 dark:text-amber-400">
                                          <AlertTriangle className="w-3 h-3 mr-1" />
                                          Multiple roles
                                        </Badge>
                                      )}
                                    </div>
                                    {isMultiAssigned && otherPositions.length > 0 && (
                                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 ml-8">
                                        Also assigned to: {otherPositions.join(', ')}
                                      </p>
                                    )}
                                  </div>
                                  {canManageContent && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                                      onClick={() => onUnassign(assignment, position.title)}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  )}
                                </div>
                              )
                            })()
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  )
})
