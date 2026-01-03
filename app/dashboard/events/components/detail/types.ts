import type { useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import type { EventDetail, AgendaItem, Position, Assignment, Member } from '../../types'

// Types for task-related data
export interface TaskMember {
  id: string
  first_name: string
  last_name: string
  email: string | null
}

export interface TaskMinistry {
  id: string
  name: string
  color: string
  campus_id?: string | null
}

export interface TaskCampus {
  id: string
  name: string
  color: string
}

export interface EventDetailPanelProps {
  selectedEvent: EventDetail
  sortedAgendaItems: AgendaItem[]
  totalDuration: number
  positionsByMinistry: Record<string, { ministry: Position['ministry']; positions: Position[] }>
  detailTab: string
  setDetailTab: (tab: string) => void
  canManage: boolean
  canManageContent: boolean
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
  onAddTask: () => void
  taskRefreshKey?: number
  // Task-related data for editing tasks
  taskMembers?: TaskMember[]
  taskMinistries?: TaskMinistry[]
  taskCampuses?: TaskCampus[]
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
}

export interface AgendaTabProps {
  selectedEvent: EventDetail
  sortedAgendaItems: AgendaItem[]
  totalDuration: number
  canManageContent: boolean
  sensors: ReturnType<typeof useSensors>
  formatDuration: (seconds: number) => string
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
}

export interface PositionsTabProps {
  positionsByMinistry: Record<string, { ministry: Position['ministry']; positions: Position[] }>
  canManageContent: boolean
  pendingInvitationsCount: number
  multiAssignedProfiles: Map<string, string[]>
  onAddPosition: () => void
  onEditPosition: (position: Position) => void
  onDeletePosition: (position: Position) => void
  onAssignVolunteer: (position: Position) => void
  onUnassign: (assignment: Assignment, positionTitle: string) => void
  onSendInvitations: () => void
}

export type { EventDetail, AgendaItem, Position, Assignment }
