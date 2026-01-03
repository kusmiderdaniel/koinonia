import { z } from 'zod'

// Schema for creating/updating ministries
export const ministrySchema = z.object({
  name: z.string().min(2, 'Ministry name must be at least 2 characters'),
  description: z.string().optional(),
  color: z.string().default('#3B82F6'),
  leaderId: z.string().uuid().nullable(),
  campusId: z.string().uuid().nullable().optional(),
})

export type MinistryInput = z.infer<typeof ministrySchema>

// Schema for ministry roles
export const roleSchema = z.object({
  name: z.string().min(1, 'Role name is required'),
  description: z.string().optional(),
})

export type RoleInput = z.infer<typeof roleSchema>

// Schema for adding members to a ministry
export const ministryMemberSchema = z.object({
  profileId: z.string().uuid(),
  roleIds: z.array(z.string().uuid()).optional(),
})

export type MinistryMemberInput = z.infer<typeof ministryMemberSchema>
