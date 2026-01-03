import { z } from 'zod'

// Event type enum
export const eventTypeSchema = z.enum(['service', 'rehearsal', 'meeting', 'special_event', 'other'])
export type EventType = z.infer<typeof eventTypeSchema>

// Event status enum
export const eventStatusSchema = z.enum(['draft', 'published', 'cancelled'])
export type EventStatus = z.infer<typeof eventStatusSchema>

// Event visibility enum
export const eventVisibilitySchema = z.enum(['members', 'volunteers', 'leaders', 'hidden'])
export type EventVisibility = z.infer<typeof eventVisibilitySchema>

// Schema for creating/updating an event
export const eventSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().optional(),
  eventType: eventTypeSchema,
  locationId: z.string().uuid().optional().nullable(),
  responsiblePersonId: z.string().uuid().optional().nullable(),
  startTime: z.string(),
  endTime: z.string(),
  isAllDay: z.boolean().default(false),
  status: eventStatusSchema.default('draft'),
  visibility: eventVisibilitySchema.default('members'),
  invitedUsers: z.array(z.string().uuid()).optional(),
  campusIds: z.array(z.string().uuid()).optional(),
})

export type EventInput = z.infer<typeof eventSchema>

// Schema for event positions
export const positionSchema = z.object({
  ministryId: z.string().uuid(),
  roleId: z.string().uuid().optional().nullable(),
  title: z.string().min(1),
  quantityNeeded: z.number().int().positive().default(1),
  notes: z.string().optional(),
})

export type PositionInput = z.infer<typeof positionSchema>
