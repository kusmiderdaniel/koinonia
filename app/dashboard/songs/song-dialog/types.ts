export interface Tag {
  id: string
  name: string
  color: string
}

export interface Song {
  id: string
  title: string
  artist: string | null
  default_key: string | null
  duration_seconds: number | null
  tags?: Tag[]
}

export interface SongDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  song: Song | null
  onSuccess: () => void
}

export const MAJOR_KEYS = [
  'C',
  'D',
  'E',
  'F',
  'G',
  'A',
  'B',
  'C#',
  'Db',
  'D#',
  'Eb',
  'F#',
  'Gb',
  'G#',
  'Ab',
  'A#',
  'Bb',
]

export const MINOR_KEYS = [
  'Am',
  'Bm',
  'Cm',
  'Dm',
  'Em',
  'Fm',
  'Gm',
  'C#m',
  'Ebm',
  'F#m',
  'G#m',
  'Bbm',
]
