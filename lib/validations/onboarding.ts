import { z } from 'zod'

export const createChurchSchema = z.object({
  name: z.string().min(2, 'Church name must be at least 2 characters'),
  subdomain: z.string()
    .min(3, 'Subdomain must be at least 3 characters')
    .max(30, 'Subdomain must be 30 characters or less')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens (no leading/trailing hyphens)'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  timezone: z.string().optional(),
  // Legal consent fields
  acceptDpa: z.literal(true, {
    error: 'You must accept the Data Processing Agreement',
  }),
  acceptAdminTerms: z.literal(true, {
    error: 'You must accept the Church Administrator Terms',
  }),
})

export const joinChurchSchema = z.object({
  joinCode: z.string()
    .length(6, 'Join code must be 6 characters')
    .regex(/^[A-Z0-9]+$/, 'Join code must be uppercase letters and numbers only')
    .transform((val) => val.toUpperCase()),
})

export const completeProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  skills: z.array(z.string()).optional(),
})

export type CreateChurchInput = z.infer<typeof createChurchSchema>
export type JoinChurchInput = z.infer<typeof joinChurchSchema>
export type CompleteProfileInput = z.infer<typeof completeProfileSchema>
