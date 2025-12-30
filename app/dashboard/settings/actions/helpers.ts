import { z } from 'zod'

// Re-export auth utilities for use in other action files
export {
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireAdminPermission,
  requireManagePermission,
  requireRole,
} from '@/lib/utils/server-auth'

// ============================================================================
// CHURCH SETTINGS SCHEMA
// ============================================================================

export const updateChurchSchema = z.object({
  name: z.string().min(2, 'Church name must be at least 2 characters'),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  zipCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
})

export type UpdateChurchInput = z.infer<typeof updateChurchSchema>

// ============================================================================
// LOCATIONS SCHEMA
// ============================================================================

export const locationSchema = z.object({
  name: z.string().min(1, 'Location name is required'),
  address: z.string().optional(),
  notes: z.string().optional(),
})

export type LocationInput = z.infer<typeof locationSchema>

// ============================================================================
// CHURCH PREFERENCES SCHEMA
// ============================================================================

export const churchPreferencesSchema = z.object({
  timezone: z.string().min(1, 'Timezone is required'),
  firstDayOfWeek: z.number().int().min(0).max(1),
  defaultEventVisibility: z.enum(['members', 'volunteers', 'leaders']).default('members'),
})

export type ChurchPreferencesInput = z.infer<typeof churchPreferencesSchema>
