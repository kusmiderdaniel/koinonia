'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signInSchema, signUpSchema, resetPasswordSchema } from '@/lib/validations/auth'
import type { SignInInput, SignUpInput, ResetPasswordInput } from '@/lib/validations/auth'

export async function signIn(data: SignInInput) {
  const supabase = await createClient()

  // Validate input
  const validatedData = signInSchema.parse(data)

  const { error } = await supabase.auth.signInWithPassword({
    email: validatedData.email,
    password: validatedData.password,
  })

  if (error) {
    return { error: error.message }
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
    return { error: error.message }
  }

  // Return success with message about email confirmation
  return {
    success: true,
    message: 'Check your email to confirm your account before signing in.'
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
    return { error: error.message }
  }

  return {
    success: true,
    message: 'Check your email for the password reset link.'
  }
}

export async function updatePassword(password: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({
    password: password,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true, message: 'Password updated successfully!' }
}
