export interface Leader {
  id: string
  first_name: string
  last_name: string
}

export interface Ministry {
  id: string
  name: string
  color: string
}

export interface AgendaItem {
  id: string
  title: string
  description: string | null
  duration_seconds: number
  leader_id: string | null
  leader: Leader | null
  ministry_id: string | null
  ministry: Ministry | null
  sort_order: number
}

export interface Member {
  id: string
  first_name: string
  last_name: string
  email: string
}

export interface Preset {
  id: string
  title: string
  description: string | null
  duration_seconds: number
  ministry_id: string | null
  ministry: Ministry | null
}

export interface AgendaItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
  item: AgendaItem | null
  onSuccess: () => void
}

export interface AgendaItemFormState {
  title: string
  description: string
  durationMinutes: string
  durationSeconds: string
  ministryId: string
  leaderId: string
}
