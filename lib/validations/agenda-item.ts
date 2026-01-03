import { z } from 'zod'

// Schema for agenda items in events
export const agendaItemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  durationSeconds: z.number().int().positive().default(300),
  leaderId: z.string().uuid().optional().nullable(),
  ministryId: z.string().uuid(),
  sortOrder: z.number().int().default(0),
})

export type AgendaItemInput = z.infer<typeof agendaItemSchema>

// Schema for template agenda items
export const templateAgendaItemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  durationSeconds: z.number().int().positive().default(300),
  isSongPlaceholder: z.boolean().default(false),
  ministryId: z.string().uuid().optional().nullable(),
})

export type TemplateAgendaItemInput = z.infer<typeof templateAgendaItemSchema>
