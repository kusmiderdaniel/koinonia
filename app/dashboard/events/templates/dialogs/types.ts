export interface AgendaItem {
  id?: string
  title?: string
  description?: string | null
  duration_seconds?: number
  is_song_placeholder?: boolean
  ministry_id?: string | null
  ministry?: { id: string; name: string } | null
}

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

export interface TemplateAgendaItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templateId: string
  item: AgendaItem | null
  onSuccess: () => void
  ministries?: Ministry[]
  presets?: Preset[]
}

export interface DialogState {
  ministries: Ministry[]
  presets: Preset[]
  isLoading: boolean
  isAdding: boolean
  error: string | null
}
