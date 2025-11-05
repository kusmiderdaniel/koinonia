import { z } from 'zod';

/**
 * Validation schema for creating a new church
 */
export const createChurchSchema = z.object({
  name: z
    .string()
    .min(2, 'Church name must be at least 2 characters')
    .max(100, 'Church name must be less than 100 characters'),
  denomination: z
    .string()
    .min(2, 'Denomination must be at least 2 characters')
    .max(50, 'Denomination must be less than 50 characters')
    .optional(),
  address: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(2, 'State is required').max(2, 'Use 2-letter state code'),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format'),
    country: z.string().default('US'),
  }),
  contactInfo: z.object({
    email: z.string().email('Invalid email address'),
    phone: z
      .string()
      .regex(/^\+?1?\s*\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/, 'Invalid phone number format'),
    website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  }),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
});

export type CreateChurchFormData = z.infer<typeof createChurchSchema>;

/**
 * Validation schema for joining a church via code
 */
export const joinChurchSchema = z.object({
  inviteCode: z
    .string()
    .length(8, 'Invite code must be exactly 8 characters')
    .regex(/^[A-Z0-9]{8}$/, 'Invalid invite code format'),
});

export type JoinChurchFormData = z.infer<typeof joinChurchSchema>;

/**
 * Validation schema for updating church settings
 */
export const updateChurchSchema = createChurchSchema.partial();

export type UpdateChurchFormData = z.infer<typeof updateChurchSchema>;

/**
 * Validation schema for inviting members to a church
 */
export const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'leader', 'volunteer', 'member']),
  message: z
    .string()
    .max(200, 'Message must be less than 200 characters')
    .optional(),
});

export type InviteMemberFormData = z.infer<typeof inviteMemberSchema>;
