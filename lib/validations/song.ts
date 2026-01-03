import { z } from 'zod'

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
