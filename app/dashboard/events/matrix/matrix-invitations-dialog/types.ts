import type { BulkInvitationScope } from '../../actions/invitations'

export type { BulkInvitationScope }

export interface Event {
  id: string
  title: string
  start_time: string
}

export interface Ministry {
  id: string
  name: string
  color: string
}

export interface Position {
  id: string
  title: string
  eventId: string
  ministry: Ministry | null
}

export interface PendingCounts {
  total: number
  byEvent: { event: Event; count: number }[]
  byMinistry: { ministry: Ministry; count: number }[]
  byPosition: { position: Position; count: number }[]
}

export interface MatrixInvitationsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventIds: string[]
  onSuccess: () => void
}

export interface ScopeSelectorProps {
  scope: BulkInvitationScope
  onScopeChange: (scope: BulkInvitationScope) => void
  pendingCounts: PendingCounts
  selectedEventIds: string[]
  selectedMinistryIds: string[]
  selectedPositionIds: string[]
  onToggleEvent: (eventId: string) => void
  onToggleMinistry: (ministryId: string) => void
  onTogglePosition: (positionId: string) => void
}
