import { z } from 'zod'
import { joinChurchSchema } from '@/lib/validations/onboarding'

export const formSchema = joinChurchSchema.extend({
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  sex: z.enum(['male', 'female']).optional(),
  campusId: z.string().optional(),
})

export type FormData = z.infer<typeof formSchema>

export interface CampusInfo {
  id: string
  name: string
  color: string
  is_default: boolean
}

export interface ChurchInfo {
  id: string
  name: string
}

export type Step = 'code' | 'campus'
