export interface Ministry {
  id: string
  name: string
  color: string
}

export interface Preset {
  id: string
  title: string
  description: string | null
  duration_seconds: number
  ministry_id: string | null
  ministry: Ministry | null
}

export interface AgendaItemPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
  onSuccess: () => void
}

export interface CreateFormState {
  title: string
  ministryId: string
  durationMinutes: string
  durationSeconds: string
}
