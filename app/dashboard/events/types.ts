// Shared types for the events module
// Import and re-export common types from lib/types
import type { Location, Person, PersonBrief, Member } from '@/lib/types'
export type { Location, Person, PersonBrief, Member }

export interface Ministry {
  id: string
  name: string
  color: string
}

export interface MinistryBrief {
  id: string
  name: string
}

export interface Role {
  id: string
  name: string
}

export interface Song {
  id: string
  title: string
  artist: string | null
  default_key: string | null
  duration_seconds: number | null
}

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
}

export interface EventDetail extends Event {
  event_agenda_items: AgendaItem[]
  event_positions: Position[]
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
