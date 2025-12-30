import { z } from 'zod'
import {
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireManagePermission,
} from '@/lib/utils/server-auth'

// ============ SCHEMAS ============

export const songSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  artist: z.string().optional(),
  defaultKey: z.string().optional(),
  durationSeconds: z.number().int().positive().optional(),
  tagIds: z.array(z.string().uuid()).optional(),
})

export type SongInput = z.infer<typeof songSchema>

export const tagSchema = z.object({
  name: z.string().min(1, 'Tag name is required'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
})

export type TagInput = z.infer<typeof tagSchema>

// Re-export auth utilities for use in other action files
export { getAuthenticatedUserWithProfile, isAuthError, requireManagePermission }
