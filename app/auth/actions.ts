'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { signInSchema, signUpSchema, resetPasswordSchema } from '@/lib/validations/auth'
import type { SignInInput, SignUpInput, ResetPasswordInput } from '@/lib/validations/auth'

/**
 * Map Supabase error messages to translation keys
 */
function mapAuthError(errorMessage: string): string {
  const errorMap: Record<string, string> = {
    'Invalid login credentials': 'invalidCredentials',
    'User already registered': 'userAlreadyRegistered',
    'Email not confirmed': 'emailNotConfirmed',
    'Password should be at least 6 characters': 'weakPassword',
    'User not found': 'accountNotFound',
  }

  // Check for exact match first
  if (errorMap[errorMessage]) {
    return errorMap[errorMessage]
  }

  // Check for partial matches
  const lowerMessage = errorMessage.toLowerCase()
  if (lowerMessage.includes('already registered') || lowerMessage.includes('already exists')) {
    return 'userAlreadyRegistered'
  }
  if (lowerMessage.includes('invalid') && (lowerMessage.includes('credentials') || lowerMessage.includes('password'))) {
    return 'invalidCredentials'
  }
  if (lowerMessage.includes('weak') || lowerMessage.includes('password')) {
    return 'weakPassword'
  }

  // Return generic error for unknown messages
  return 'generic'
}

export async function signIn(data: SignInInput) {
  const supabase = await createClient()

  // Validate input
  const validatedData = signInSchema.parse(data)

  const { error } = await supabase.auth.signInWithPassword({
    email: validatedData.email,
    password: validatedData.password,
  })

  if (error) {
    return { error: mapAuthError(error.message) }
  }

  redirect('/dashboard')
}

export async function signUp(data: SignUpInput) {
  const supabase = await createClient()

  // Validate input
  const validatedData = signUpSchema.parse(data)

  const { error } = await supabase.auth.signUp({
    email: validatedData.email,
    password: validatedData.password,
    options: {
      data: {
        first_name: validatedData.firstName,
        last_name: validatedData.lastName,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    return { error: mapAuthError(error.message) }
  }

  // Return success with message key for translation
  return {
    success: true,
    messageKey: 'accountCreated'
  }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth/signin')
}

export async function resetPassword(data: ResetPasswordInput) {
  const supabase = await createClient()

  // Validate input
  const validatedData = resetPasswordSchema.parse(data)

  const { error } = await supabase.auth.resetPasswordForEmail(validatedData.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/update-password`,
  })

  if (error) {
    return { error: mapAuthError(error.message) }
  }

  return {
    success: true,
    messageKey: 'passwordResetSent'
  }
}

export async function updatePassword(password: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({
    password: password,
  })

  if (error) {
    return { error: mapAuthError(error.message) }
  }

  return { success: true, messageKey: 'passwordUpdated' }
}

export async function signInWithGoogle() {
  const supabase = await createClient()
  const headersList = await headers()
  const origin = headersList.get('origin') || process.env.NEXT_PUBLIC_SITE_URL

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error) {
    return { error: 'googleSignInFailed' }
  }

  if (data.url) {
    redirect(data.url)
  }

  return { error: 'googleSignInFailed' }
}
