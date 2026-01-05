import { z } from 'zod'

export const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  sex: z.enum(['male', 'female']).optional().nullable(),
})

export type ProfileInput = z.infer<typeof profileSchema>

export interface ProfilePageState {
  error: string | null
  success: string | null
  isLoading: boolean
  isLoadingData: boolean
  email: string
  sex: string | undefined
  dateOfBirth: string
  firstDayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6
}

export interface PasswordChangeState {
  showPasswordForm: boolean
  currentPassword: string
  newPassword: string
  confirmPassword: string
  showCurrentPassword: boolean
  showNewPassword: boolean
  isChangingPassword: boolean
  passwordError: string | null
  passwordSuccess: string | null
}
