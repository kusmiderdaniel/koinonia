// Shared types for invitation actions

export type MinistryData = { id: string; name: string; color: string }
export type ChurchData = { id: string; name: string; time_format: string | null }
export type EventData = {
  id: string
  title: string
  start_time: string
  end_time: string | null
  church_id: string
  church: ChurchData | ChurchData[]
}
export type PositionData = {
  id: string
  title: string
  ministry_id: string
  ministry: MinistryData | MinistryData[]
  event: EventData | EventData[]
}
export type AssignmentWithPosition = {
  id: string
  profile_id: string
  position: PositionData
}

export type InvitationScope = 'all' | 'ministry' | 'positions'

export interface SendInvitationsOptions {
  eventId: string
  scope: InvitationScope
  ministryId?: string
  positionIds?: string[]
}

export type BulkInvitationScope = 'all' | 'dates' | 'events' | 'ministries' | 'positions'

export interface SendBulkInvitationsOptions {
  eventIds: string[]
  scope: BulkInvitationScope
  selectedDates?: string[]
  selectedEventIds?: string[]
  selectedMinistryIds?: string[]
  selectedPositionIds?: string[]
}
