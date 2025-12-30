import { z } from 'zod'
import {
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireManagePermission,
  requireAdminPermission,
} from '@/lib/utils/server-auth'

// ============ SCHEMAS ============

export const eventSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().optional(),
  eventType: z.enum(['service', 'rehearsal', 'meeting', 'special_event', 'other']),
  locationId: z.string().uuid().optional().nullable(),
  responsiblePersonId: z.string().uuid().optional().nullable(),
  startTime: z.string(),
  endTime: z.string(),
  isAllDay: z.boolean().default(false),
  status: z.enum(['draft', 'published', 'cancelled']).default('draft'),
  visibility: z.enum(['members', 'volunteers', 'leaders', 'hidden']).default('members'),
  invitedUsers: z.array(z.string().uuid()).optional(),
})

export type EventInput = z.infer<typeof eventSchema>

export const positionSchema = z.object({
  ministryId: z.string().uuid(),
  roleId: z.string().uuid().optional().nullable(),
  title: z.string().min(1),
  quantityNeeded: z.number().int().positive().default(1),
  notes: z.string().optional(),
})

export type PositionInput = z.infer<typeof positionSchema>

export const agendaItemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  durationSeconds: z.number().int().positive().default(300),
  leaderId: z.string().uuid().optional().nullable(),
  ministryId: z.string().uuid(),
  sortOrder: z.number().int().default(0),
})

export type AgendaItemInput = z.infer<typeof agendaItemSchema>

// ============ HELPER FUNCTIONS ============

export function canUserSeeEvent(
  userRole: string,
  eventVisibility: string,
  userId: string,
  invitedUserIds: string[]
): boolean {
  if (eventVisibility === 'hidden') {
    return invitedUserIds.includes(userId)
  }
  if (eventVisibility === 'leaders') {
    return ['leader', 'admin', 'owner'].includes(userRole)
  }
  if (eventVisibility === 'volunteers') {
    return ['volunteer', 'leader', 'admin', 'owner'].includes(userRole)
  }
  return true
}

// Re-export auth utilities for use in other action files
export { getAuthenticatedUserWithProfile, isAuthError, requireManagePermission, requireAdminPermission }
