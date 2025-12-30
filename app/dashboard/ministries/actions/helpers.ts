import { z } from 'zod'
import {
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireAdminPermission,
  requireManagePermission,
} from '@/lib/utils/server-auth'

// ============ SCHEMAS ============

export const ministrySchema = z.object({
  name: z.string().min(2, 'Ministry name must be at least 2 characters'),
  description: z.string().optional(),
  color: z.string().default('#3B82F6'),
  leaderId: z.string().uuid().nullable(),
})

export type MinistryInput = z.infer<typeof ministrySchema>

export const roleSchema = z.object({
  name: z.string().min(1, 'Role name is required'),
  description: z.string().optional(),
})

export type RoleInput = z.infer<typeof roleSchema>

// Re-export auth utilities for use in other action files
export { getAuthenticatedUserWithProfile, isAuthError, requireAdminPermission, requireManagePermission }
