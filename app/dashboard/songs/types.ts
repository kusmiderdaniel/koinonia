// Songs module types
import type { Tag } from '@/lib/types'

// Re-export shared Tag type
export type { Tag }

// Section type constants
export const SECTION_TYPES = [
  'VERSE',
  'CHORUS',
  'PRE_CHORUS',
  'BRIDGE',
  'TAG',
  'INTRO',
  'OUTRO',
  'INTERLUDE',
  'ENDING',
] as const

export type SectionType = (typeof SECTION_TYPES)[number]

// Section type display labels
export const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  VERSE: 'Verse',
  CHORUS: 'Chorus',
  PRE_CHORUS: 'Pre-Chorus',
  BRIDGE: 'Bridge',
  TAG: 'Tag',
  INTRO: 'Intro',
  OUTRO: 'Outro',
  INTERLUDE: 'Interlude',
  ENDING: 'Ending',
}

// Section type colors (inspired by ProPresenter)
export const SECTION_TYPE_COLORS: Record<SectionType, string> = {
  VERSE: '#6366f1',      // Indigo/Purple
  CHORUS: '#ec4899',     // Pink/Magenta
  PRE_CHORUS: '#f472b6', // Light Pink
  BRIDGE: '#f59e0b',     // Amber/Orange
  TAG: '#6b7280',        // Gray
  INTRO: '#22c55e',      // Green
  OUTRO: '#14b8a6',      // Teal
  INTERLUDE: '#06b6d4',  // Cyan
  ENDING: '#4b5563',     // Dark Gray
}

export interface Attachment {
  id: string
  file_name: string
  file_path: string
  file_size: number
  created_at: string
}

export interface SongSection {
  id: string
  song_id: string
  section_type: SectionType
  section_number: number
  label: string | null
  lyrics: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface SongArrangement {
  id: string
  song_id: string
  name: string
  is_default: boolean
  duration_seconds: number | null
  created_by: string | null
  created_at: string
  updated_at: string
  sections?: ArrangementSection[]
}

export interface ArrangementSection {
  id: string
  arrangement_id: string
  section_id: string
  sort_order: number
  section?: SongSection
}

export interface Song {
  id: string
  title: string
  artist: string | null
  default_key: string | null
  duration_seconds: number | null
  created_at: string
  tags: Tag[]
  song_attachments?: Attachment[]
  song_sections?: SongSection[]
  song_arrangements?: SongArrangement[]
}
