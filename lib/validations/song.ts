import { z } from 'zod'
import { SECTION_TYPES } from '@/app/dashboard/songs/types'

// Schema for creating/updating songs
export const songSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  artist: z.string().optional(),
  defaultKey: z.string().optional(),
  durationSeconds: z.number().int().positive().optional(),
  tagIds: z.array(z.string().uuid()).optional(),
})

export type SongInput = z.infer<typeof songSchema>

// Schema for song tags
export const tagSchema = z.object({
  name: z.string().min(1, 'Tag name is required'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
})

export type TagInput = z.infer<typeof tagSchema>

// Music key options
export const MUSIC_KEYS = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F',
  'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
  'Cm', 'C#m', 'Dbm', 'Dm', 'D#m', 'Ebm', 'Em', 'Fm',
  'F#m', 'Gbm', 'Gm', 'G#m', 'Abm', 'Am', 'A#m', 'Bbm', 'Bm',
] as const

export type MusicKey = typeof MUSIC_KEYS[number]

export const musicKeySchema = z.enum(MUSIC_KEYS).optional()

// Schema for song sections
export const songSectionSchema = z.object({
  sectionType: z.enum(SECTION_TYPES),
  sectionNumber: z.number().int().positive().default(1),
  label: z.string().optional().nullable(),
  lyrics: z.string().min(1, 'Lyrics are required'),
})

export type SongSectionInput = z.infer<typeof songSectionSchema>

// Schema for bulk importing sections
export const importSectionsSchema = z.array(songSectionSchema).min(1, 'At least one section is required')

export type ImportSectionsInput = z.infer<typeof importSectionsSchema>

// Schema for song arrangements
export const songArrangementSchema = z.object({
  name: z.string().min(1, 'Arrangement name is required'),
  sectionIds: z.array(z.string().uuid()).min(1, 'At least one section is required'),
  durationSeconds: z.number().int().positive().optional().nullable(),
})

export type SongArrangementInput = z.infer<typeof songArrangementSchema>
