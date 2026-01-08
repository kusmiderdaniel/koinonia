export interface Tag {
  id: string
  name: string
  color: string
}

export interface Arrangement {
  id: string
  name: string
  is_default: boolean
}

export interface Song {
  id: string
  title: string
  artist: string | null
  default_key: string | null
  duration_seconds: number | null
  tags: Tag[]
  arrangements?: Arrangement[]
}

export interface SongPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
  onSuccess: () => void
  replaceAgendaItemId?: string | null
}
