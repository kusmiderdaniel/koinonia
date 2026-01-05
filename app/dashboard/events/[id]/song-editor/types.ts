export interface Member {
  id: string
  first_name: string
  last_name: string
  email: string | null
}

export interface UnavailabilityInfo {
  profile_id: string
  reason: string | null
}

export interface SongEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agendaItemId: string
  songTitle: string
  currentKey: string | null
  currentLeaderId: string | null
  currentLeaderName: string | null
  currentDescription: string | null
  ministryId: string | null
  eventDate: string
  onSuccess: () => void
  onDataChange?: () => void
  onReplaceSong: () => void
}

export const MUSICAL_KEYS = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bbm', 'Bm',
] as const

export type MusicalKey = typeof MUSICAL_KEYS[number]
