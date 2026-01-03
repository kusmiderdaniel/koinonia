import { z } from 'zod'
import { eventTypeSchema, eventVisibilitySchema } from './event'

// Schema for creating/updating event templates
export const templateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  eventType: eventTypeSchema,
  locationId: z.string().uuid().optional().nullable(),
  responsiblePersonId: z.string().uuid().optional().nullable(),
  defaultStartTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  defaultDurationMinutes: z.number().int().positive().default(120),
  visibility: eventVisibilitySchema.default('members'),
  campusId: z.string().uuid().nullable().optional(),
})

export type TemplateInput = z.infer<typeof templateSchema>
