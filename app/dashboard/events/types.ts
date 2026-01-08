// Events module types
// Import shared types
import type { Location, Person, PersonBrief, Member, MinistryBrief, RoleBrief, Campus, SongBrief } from '@/lib/types'
import type { Task } from '@/app/dashboard/tasks/types'

// Re-export shared types for convenience
export type { Location, Person, PersonBrief, Member }
export type { Task }

// Use shared types with domain-specific aliases
export type Ministry = MinistryBrief
export type Role = RoleBrief
export type Song = SongBrief
export type EventCampus = Campus

export type AssignmentStatus = 'invited' | 'accepted' | 'declined' | 'expired' | null

export interface Assignment {
  id: string
  profile: Person
  assigned_by_profile: PersonBrief | null
  status: AssignmentStatus
  invited_at: string | null
  responded_at: string | null
}

export interface Position {
  id: string
  title: string
  quantity_needed: number
  notes: string | null
  ministry: Ministry
  role: Role | null
  event_assignments: Assignment[]
}

export interface ArrangementBrief {
  id: string
  name: string
  is_default: boolean
}

export interface AgendaItem {
  id: string
  title: string
  description: string | null
  duration_seconds: number
  leader_id: string | null
  leader: PersonBrief | null
  ministry_id: string | null
  ministry: Ministry | null
  sort_order: number
  song_id: string | null
  song_key: string | null
  song: Song | null
  arrangement_id: string | null
  arrangement: ArrangementBrief | null
  is_song_placeholder: boolean
}

export interface EventInvitation {
  profile_id: string
  profile?: PersonBrief
}

export interface Event {
  id: string
  title: string
  description: string | null
  event_type: string
  location_id: string | null
  location: Location | null
  responsible_person_id: string | null
  responsible_person: Person | null
  start_time: string
  end_time: string
  is_all_day: boolean
  status: string
  visibility: string
  totalPositions: number
  filledPositions: number
  created_by_profile: PersonBrief | null
  event_invitations?: EventInvitation[]
  campuses?: EventCampus[]
}

export interface EventDetail extends Event {
  event_agenda_items: AgendaItem[]
  event_positions: Position[]
  tasks?: Task[]
}

// Component prop types
export interface SortableAgendaItemProps {
  item: AgendaItem
  index: number
  isSong: boolean
  canManage: boolean
  onEdit: (item: AgendaItem) => void
  onDelete: (item: AgendaItem) => void
  onSongClick?: (item: AgendaItem) => void
  onKeyChange: (itemId: string, key: string) => void
  onLeaderChange: (itemId: string, leaderId: string | null) => void
  onDurationChange: (itemId: string, seconds: number) => void
  onDescriptionChange: (itemId: string, description: string) => void
  availableKeys: readonly string[]
  members: Member[]
}
